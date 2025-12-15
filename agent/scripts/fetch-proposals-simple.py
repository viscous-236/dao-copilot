#!/usr/bin/env python3
"""
Simplified: Fetch proposals from Snapshot WITHOUT generating embeddings.
Just get the raw data, then you can add embeddings later or manually.

Usage:
    pip3 install requests
    python3 scripts/fetch-proposals-simple.py
"""

import json
import requests
from pathlib import Path

SNAPSHOT_API = "https://hub.snapshot.org/graphql"

SPACES = {
    "uniswap": "uniswapgovernance.eth",
    "1inch": "1inch.eth"
}


def fetch_proposals(space: str, limit: int = 20) -> list:
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


def main():
    print("🔍 Fetching proposals from Snapshot...\n")
    
    output_file = Path(__file__).parent.parent / "data" / "snapshot-proposals-raw.json"
    all_proposals = {}
    
    for dao, space in SPACES.items():
        print(f"📊 Fetching {dao.upper()} proposals...")
        proposals = fetch_proposals(space, limit=20)
        
        if not proposals:
            print(f"   ⚠️  No proposals found")
            continue
        
        # Filter to closed proposals only
        closed = [p for p in proposals if p['state'] == 'closed' and len(p['body']) > 200]
        print(f"   Found {len(closed)} closed proposals with content")
        
        all_proposals[dao] = closed
    
    # Save raw data
    with open(output_file, 'w') as f:
        json.dump(all_proposals, f, indent=2)
    
    print(f"\n✅ Saved {sum(len(p) for p in all_proposals.values())} proposals to:")
    print(f"   {output_file}")
    
    print("\n📝 Sample proposals fetched:")
    for dao, proposals in all_proposals.items():
        print(f"\n{dao.upper()}:")
        for i, p in enumerate(proposals[:3], 1):
            title_preview = p['title'][:60] + "..." if len(p['title']) > 60 else p['title']
            print(f"   {i}. {title_preview}")
            print(f"      Votes: {p['votes']}, State: {p['state']}")
    
    print("\n📤 Next steps:")
    print("   1. Review data/snapshot-proposals-raw.json")
    print("   2. Use this data to manually add to vecstore.json")
    print("   3. Or use the embedding script once Python env is fixed")
    print("\n💡 For now, you have 16 documents which is good for demo!")
    print("   Adding more proposals will improve analysis quality over time.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nTry installing requests: pip3 install requests")
