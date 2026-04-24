import sys
import os
from datetime import datetime

# Add the app directory to path so we can import user_memory
sys.path.append(os.path.join(os.getcwd(), 'app'))

try:
    import user_memory
    print("✅ Module 'user_memory' imported successfully.")
except ImportError as e:
    print(f"❌ Error importing 'user_memory': {e}")
    sys.exit(1)

def test_production_memory():
    print("\n--- 🧪 Testing Production-Level Memory Flow ---")
    
    # 1. Upgrade/Init DB
    print("Step 1: Upgrading/Initializing Database...")
    user_memory.init_db()
    
    # 2. Store structured memories
    user_id = "prod_test_user_456"
    
    print(f"Step 2: Storing 'product' memory...")
    user_memory.store_memory(
        user_id, 
        "Looking for Sony XM5 headphones reviews", 
        product_id="B09C63G6F1", 
        memory_type="product", 
        metadata={"product_name": "Sony XM5", "category": "Electronics"}
    )
    
    print(f"Step 3: Storing 'preference' memory...")
    user_memory.store_memory(
        user_id, 
        "[PREFERENCE]: User is budget-conscious.", 
        memory_type="preference", 
        metadata={"category": "financial"}
    )
    
    # 4. Retrieve with threshold
    search_query = "Is there a cheaper alternative?"
    print(f"Step 4: Retrieving memories for '{search_query}' (Threshold < 0.5)...")
    memories = user_memory.get_similar_memories(user_id, search_query, limit=3, threshold=0.5)
    
    if memories:
        print(f"✅ Found {len(memories)} relevant memories:")
        for m in memories:
            print(f"  - [{m['type']}] {m['query']}")
            print(f"    Metadata: {m['metadata']}")
            print(f"    Sim Score: {m['score']:.4f}")
    else:
        print("❓ No similar memories found within threshold. This is normal if the query is very different.")

    # 5. Retrieve with loose threshold to ensure data exists
    print(f"\nStep 5: Retrieving with loose threshold (1.0)...")
    memories = user_memory.get_similar_memories(user_id, search_query, limit=3, threshold=1.0)
    for m in memories:
        print(f"  - [{m['type']}] {m['query']} (Score: {m['score']:.4f})")

if __name__ == "__main__":
    test_production_memory()
