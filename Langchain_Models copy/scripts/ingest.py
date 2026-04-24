import gzip
import ast
import os
import shutil
import glob
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document

# Configuration
DATA_FOLDER = "data/"
DB_PATH = "./chroma_db"

def parse_gzip(path):
    with gzip.open(path, 'rb') as g:
        for l in g:
            yield ast.literal_eval(l.decode("utf-8"))

def create_vector_db():
    if os.path.exists(DB_PATH):
        print(f"🗑️ Clearing old database at {DB_PATH}...")
        shutil.rmtree(DB_PATH)

    docs = []
    
    # Loop through all .json.gz files in the data folder
    files = glob.glob(os.path.join(DATA_FOLDER, "*.json.gz"))
    
    for file_path in files:
        # Extract category name from filename (e.g., "qa_Software.json.gz" -> "Software")
        category_name = os.path.basename(file_path).replace("qa_", "").replace(".json.gz", "")
        print(f"Processing Category: {category_name}...")
        
        count = 0
        for entry in parse_gzip(file_path):
            if count >= 2000: break # Remove limit for full data
            
            combined_text = f"User Question: {entry.get('question', '')}\nCustomer Answer: {entry.get('answer', '')}"
            
            meta = {
                "asin": entry.get("asin", "unknown"),
                "category": category_name, # IMPORTANT: We save the category here
                "unixTime": entry.get("unixTime", 0)
            }
            
            docs.append(Document(page_content=combined_text, metadata=meta))
            count += 1

    print(f"Processed {len(docs)} documents total. Creating embeddings...")
    
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vector_store = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        persist_directory=DB_PATH
    )
    print(f"✅ Success! Database built.")

if __name__ == "__main__":
    create_vector_db()