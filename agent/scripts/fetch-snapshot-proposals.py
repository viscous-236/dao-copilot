#!/usr/bin/env python3
"""
Fetch real proposals from Snapshot and add them to vecstore.json with embeddings.

Usage:
    pip3 install sentence-transformers torch requests
    python3 scripts/fetch-snapshot-proposals.py
"""

import json
import requests
from pathlib import Path
from typing import List, Dict

# Load sentence-transformers
try:
    from sentence_transformers import SentenceTransformer
    print("🧠 Loading sentence-transformers model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("✅ Model loaded (384D embeddings)")
except ImportError:
    print("❌ Please install: pip3 install sentence-transformers torch")
    exit(1)


SNAPSHOT_API = "https://hub.snapshot.org/graphql"

# DAO spaces to fetch from
SPACES = {
    "uniswap": "uniswapgovernance.eth",
    "1inch": "1inch.eth"
}


def fetch_proposals(space: str, limit: int = 10) -> List[Dict]:
    """Fetch proposals from Snapshot GraphQL API."""
    query = """
    query Proposals($space: String!, $first: Int!) {
      proposals(
        first: $first,
        where: { space: $space },
        orderBy: "created",
        orderDirection: desc
      ) {
        id
        title
        body
        choices
        start
        end
        state
        author
        scores
        scores_total
        votes
      }
    }
    """
    
    variables = {
        "space": space,
        "first": limit
    }
    
    response = requests.post(
        SNAPSHOT_API,
        json={"query": query, "variables": variables},
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code == 200:
        data = response.json()
        return data.get("data", {}).get("proposals", [])
    else:
        print(f"❌ Failed to fetch from {space}: {response.status_code}")
        return []


def format_proposal_text(proposal: Dict) -> str:
    """Format proposal data into text for embedding."""
    text = f"""# {proposal['title']}

## Proposal ID
{proposal['id']}

## Status
{proposal['state']}

## Author
{proposal['author']}

## Description
{proposal['body']}

## Voting Options
"""
    for i, choice in enumerate(proposal['choices'], 1):
        text += f"{i}. {choice}\n"
    
    if proposal.get('scores_total'):
        text += f"\n## Voting Results\n"
        text += f"Total votes: {proposal['votes']}\n"
        text += f"Total voting power: {proposal['scores_total']}\n"
    
    return text


def add_to_vecstore(doc_id: str, text: str, dao: str):
    """Add proposal to vecstore.json with embedding."""
    vecstore_path = Path(__file__).parent.parent / "data" / "vecstore.json"
    
    # Load existing
    with open(vecstore_path, 'r') as f:
        data = json.load(f)
    
    # Skip if exists
    if doc_id in data:
        print(f"   ⚠️  {doc_id} already exists, skipping...")
        return False
    
    # Generate embedding
    print(f"   🧠 Embedding {doc_id}...")
    embedding = model.encode(text).tolist()
    
    # Add to vecstore
    data[doc_id] = {
        "text": text,
        "embedding": embedding,
        "dao": dao,
        "type": "proposal"
    }
    
    # Save
    with open(vecstore_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"   ✅ Added {doc_id}")
    return True


def main():
    print("🔍 Fetching proposals from Snapshot...\n")
    
    total_added = 0
    
    for dao, space in SPACES.items():
        print(f"📊 Fetching {dao.upper()} proposals...")
        proposals = fetch_proposals(space, limit=15)
        
        if not proposals:
            print(f"   ⚠️  No proposals found for {dao}")
            continue
        
        print(f"   Found {len(proposals)} proposals")
        
        # Get current count for numbering
        vecstore_path = Path(__file__).parent.parent / "data" / "vecstore.json"
        with open(vecstore_path, 'r') as f:
            existing = json.load(f)
        
        existing_count = len([k for k in existing.keys() if dao in k and 'prop' in k])
        
        # Add proposals
        added_count = 0
        for i, proposal in enumerate(proposals, start=1):
            # Only add if state is closed (has results)
            if proposal['state'] != 'closed':
                continue
            
            doc_id = f"{dao}-prop-{existing_count + added_count + 1:03d}"
            text = format_proposal_text(proposal)
            
            # Skip very short proposals (likely spam/test)
            if len(text) < 200:
                continue
            
            if add_to_vecstore(doc_id, text, dao):
                added_count += 1
                total_added += 1
                
                # Limit to avoid too many at once
                if added_count >= 10:
                    break
        
        print(f"   ✅ Added {added_count} new {dao} proposals\n")
    
    print(f"\n🎉 Successfully added {total_added} proposals!")
    
    # Show new stats
    with open(vecstore_path, 'r') as f:
        data = json.load(f)
    
    print(f"\n📊 Updated vecstore stats:")
    print(f"   Total documents: {len(data)}")
    
    for dao in SPACES.keys():
        count = len([k for k in data.keys() if dao in k])
        print(f"   {dao.capitalize()}: {count} documents")
    
    print("\n📤 Next steps:")
    print("   1. Review data/vecstore.json")
    print("   2. Test locally: cd agent && npm run dev")
    print("   3. Test RAG: curl -X POST http://localhost:9000/search -H 'Content-Type: application/json' -d '{\"text\":\"treasury management\",\"top_k\":3}'")
    print("   4. Push to GitHub: git add . && git commit -m 'Add historical proposals' && git push")
    print("   5. Render auto-deploys with expanded knowledge base")


if __name__ == "__main__":
    main()
