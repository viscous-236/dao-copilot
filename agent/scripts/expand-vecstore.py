#!/usr/bin/env python3
"""
Add proposals from snapshot-proposals-raw.json to vecstore.json with embeddings.
Uses system Python to avoid venv issues.
"""

import json
import sys
from pathlib import Path

print("🔄 Importing sentence-transformers...")
try:
    from sentence_transformers import SentenceTransformer
    print("✅ Loaded sentence-transformers")
except ImportError as e:
    print(f"❌ Error: {e}")
    print("\n📦 Please install dependencies:")
    print("   pip3 install --user sentence-transformers torch")
    sys.exit(1)

def format_proposal_text(proposal: dict) -> str:
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


def main():
    base_dir = Path(__file__).parent.parent
    raw_proposals_path = base_dir / "data" / "snapshot-proposals-raw.json"
    vecstore_path = base_dir / "data" / "vecstore.json"
    
    # Load raw proposals
    print(f"📂 Loading proposals from {raw_proposals_path.name}...")
    with open(raw_proposals_path, 'r') as f:
        raw_data = json.load(f)
    
    # Load existing vecstore
    print(f"📂 Loading existing vecstore...")
    with open(vecstore_path, 'r') as f:
        vecstore = json.load(f)
    
    initial_count = len(vecstore)
    print(f"   Current vecstore: {initial_count} documents")
    
    # Load model
    print(f"\n🧠 Loading sentence-transformers model (all-MiniLM-L6-v2)...")
    print("   This may take a minute on first run...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("✅ Model loaded (384D embeddings)")
    
    # Process proposals
    added = 0
    for dao, proposals in raw_data.items():
        print(f"\n📊 Processing {dao.upper()} proposals...")
        
        # Get current count for this DAO
        existing_count = len([k for k in vecstore.keys() if dao in k and 'prop' in k])
        
        # Add up to 10 proposals per DAO
        for i, proposal in enumerate(proposals[:10], 1):
            doc_id = f"{dao}-prop-{existing_count + added + 1:03d}"
            
            # Skip if already exists
            if doc_id in vecstore:
                print(f"   ⚠️  {doc_id} exists, skipping...")
                continue
            
            # Format text
            text = format_proposal_text(proposal)
            
            # Skip very short proposals
            if len(text) < 200:
                print(f"   ⚠️  Proposal too short, skipping...")
                continue
            
            # Generate embedding
            print(f"   🧠 Embedding {doc_id}: {proposal['title'][:50]}...")
            embedding = model.encode(text).tolist()
            
            # Add to vecstore
            vecstore[doc_id] = {
                "text": text,
                "embedding": embedding,
                "dao": dao,
                "type": "proposal"
            }
            
            added += 1
            print(f"   ✅ Added {doc_id} ({len(embedding)}D)")
    
    # Save updated vecstore
    if added > 0:
        print(f"\n💾 Saving updated vecstore...")
        with open(vecstore_path, 'w') as f:
            json.dump(vecstore, f, indent=2)
        print(f"✅ Saved {len(vecstore)} documents")
    else:
        print(f"\n⚠️  No new documents added")
    
    # Summary
    print(f"\n📊 Final vecstore stats:")
    print(f"   Total documents: {len(vecstore)} (was {initial_count}, added {added})")
    
    for dao in raw_data.keys():
        count = len([k for k in vecstore.keys() if dao in k])
        print(f"   {dao.capitalize()}: {count} documents")
    
    print("\n🎉 Vecstore expansion complete!")
    print("\n📤 Next steps:")
    print("   1. Test locally: npm run dev")
    print("   2. Verify RAG works with expanded corpus")
    print("   3. Push to GitHub: git add data/vecstore.json && git commit -m 'Expand vecstore' && git push")
    print("   4. Render auto-deploys with enhanced knowledge base")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
