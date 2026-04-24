import os
import json
import psycopg2
from psycopg2.extras import execute_values, Json
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

load_dotenv()

# Configuration
DB_NAME = os.getenv("DB_NAME", "claricart")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

# Initialize Embedding Model
model = SentenceTransformer("all-MiniLM-L6-v2")

def get_connection():
    """Returns a connection to the PostgreSQL database with a fast timeout."""
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT,
            connect_timeout=3 # 3 seconds timeout
        )
        return conn
    except Exception as e:
        # Silent fail for UI-bound calls
        return None

def init_db():
    """Initializes/Upgrades the database schema and pgvector extension."""
    conn = get_connection()
    if not conn: return
    
    try:
        with conn.cursor() as cur:
            # Enable pgvector
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            
            # Create/Upgrade table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS user_memory (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    query TEXT NOT NULL,
                    product_id TEXT,
                    embedding VECTOR(384),
                    metadata JSONB DEFAULT '{}',
                    memory_type TEXT DEFAULT 'query',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            
            # Check if columns exist (Migration)
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='user_memory';")
            existing_cols = [r[0] for r in cur.fetchall()]
            
            if 'metadata' not in existing_cols:
                cur.execute("ALTER TABLE user_memory ADD COLUMN metadata JSONB DEFAULT '{}';")
            if 'memory_type' not in existing_cols:
                cur.execute("ALTER TABLE user_memory ADD COLUMN memory_type TEXT DEFAULT 'query';")
                
            # Create HNSW index for faster vector search 
            cur.execute("CREATE INDEX IF NOT EXISTS user_memory_embedding_idx ON user_memory USING hnsw (embedding vector_l2_ops);")
            cur.execute("CREATE INDEX IF NOT EXISTS user_memory_user_type_idx ON user_memory (user_id, memory_type);")
            
        conn.commit()
        print("✅ Database upgraded successfully.")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
    finally:
        conn.close()

def store_memory(user_id, query, product_id=None, memory_type='query', metadata=None):
    """Stores a structured memory in the database."""
    conn = get_connection()
    if not conn: return
    
    if metadata is None: metadata = {}
    
    try:
        embedding = model.encode(query).tolist()
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO user_memory (user_id, query, product_id, embedding, memory_type, metadata)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (user_id, query, product_id, embedding, memory_type, Json(metadata)))
        conn.commit()
    except Exception as e:
        print(f"❌ Error storing memory: {e}")
    finally:
        conn.close()

def get_similar_memories(user_id, query, limit=3, threshold=0.5):
    """Retrieves smart, filtered memories using vector similarity and recency."""
    conn = get_connection()
    if not conn: return []
    
    try:
        query_embedding = model.encode(query).tolist()
        with conn.cursor() as cur:
            # Smart Retrieval: L2 distance < threshold + Recent prioritization
            cur.execute("""
                SELECT query, product_id, memory_type, metadata, created_at,
                       (embedding <-> %s) as distance
                FROM user_memory
                WHERE user_id = %s 
                  AND (embedding <-> %s) < %s
                ORDER BY distance ASC, created_at DESC
                LIMIT %s
            """, (query_embedding, user_id, query_embedding, threshold, limit))
            
            results = cur.fetchall()
            return [
                {
                    "query": r[0], 
                    "product_id": r[1], 
                    "type": r[2], 
                    "metadata": r[3], 
                    "time": r[4],
                    "score": 1 - r[5] # Invert L2 for a rough "similarity" score
                } for r in results
            ]
    except Exception as e:
        print(f"❌ Error retrieving similar memories: {e}")
        return []
    finally:
        conn.close()
