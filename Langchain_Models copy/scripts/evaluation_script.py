import gzip
import ast
import os
import glob
import numpy as np
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from huggingface_hub import InferenceClient
from rouge_score import rouge_scorer
from sklearn.metrics.pairwise import cosine_similarity

# 1. Load Environment Variables
load_dotenv()
DB_PATH = os.getenv("DB_PATH", "./chroma_db")
HF_TOKEN = os.getenv("HF_TOKEN")
DATA_FOLDER = "data/"
REPO_ID = "Qwen/Qwen2.5-72B-Instruct"  # Matches app.py

# 2. Setup RAG Components
print("⏳ Loading Model and Database...")
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vector_store = Chroma(persist_directory=DB_PATH, embedding_function=embeddings)
client = InferenceClient(token=HF_TOKEN)

def generate_answer(question, asin):
    """
    Simulates the RAG pipeline for a specific product.
    """
    # CRITICAL: We filter by the specific ASIN from the test sample.
    # This matches the "Product Selection" feature in your app.
    # If we didn't filter, we might get reviews for a different product.
    docs = vector_store.similarity_search(
        question, 
        k=5, 
        filter={"asin": asin}
    )
    
    if not docs:
        return "I don't know."
    
    # Format context with Product IDs (matches app.py logic)
    context = "\n\n".join([f"Product ({d.metadata.get('asin', 'Unknown')}): {d.page_content}" for d in docs])
    
    # Generate
    messages = [
        {"role": "system", "content": "You are a helpful Shopping Assistant. Answer the question based ONLY on the context provided. When recommending a product or referencing a review, YOU MUST CITE the Product ID (ASIN) associated with it. If you don't know, say 'I don't know'."},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
    ]
    
    try:
        response = client.chat_completion(
            messages=messages,
            model=REPO_ID,
            max_tokens=256,
            temperature=0.1
        )
        return response.choices[0].message.content
    except:
        return "Error generating answer."

def calculate_metrics(generated_ans, reference_ans):
    """
    Calculates Semantic Similarity and ROUGE-L score
    """
    # 1. Semantic Similarity (Cosine)
    gen_emb = embeddings.embed_query(generated_ans)
    ref_emb = embeddings.embed_query(reference_ans)
    similarity = cosine_similarity([gen_emb], [ref_emb])[0][0]
    
    # 2. ROUGE Score (Text Overlap)
    scorer = rouge_scorer.RougeScorer(['rougeL'], use_stemmer=True)
    scores = scorer.score(reference_ans, generated_ans)
    rouge_l = scores['rougeL'].fmeasure
    
    return similarity, rouge_l

def run_evaluation(sample_size=5):
    # Find data files
    files = glob.glob(os.path.join(DATA_FOLDER, "*.json.gz"))
    if not files:
        print("❌ No data files found in data/ folder.")
        return
    
    # --- INTERACTIVE SELECTION ---
    print("\n📂 Available Data Files:")
    for i, f in enumerate(files):
        print(f"[{i+1}] {os.path.basename(f)}")
    
    try:
        selection = input("\n👉 Enter the number of the file to evaluate (e.g., 1): ")
        choice = int(selection) - 1
        if 0 <= choice < len(files):
            target_file = files[choice]
        else:
            print("❌ Invalid number. Defaulting to the first file.")
            target_file = files[0]
    except ValueError:
        print("❌ Invalid input. Defaulting to the first file.")
        target_file = files[0]
    # -----------------------------

    print(f"\n🧪 Starting Evaluation on {sample_size} samples from: {os.path.basename(target_file)}\n")
    
    data_samples = []
    
    # Filter out "bad" data to ensure fair scoring
    with gzip.open(target_file, 'rb') as f:
        for line in f:
            if len(data_samples) >= sample_size: 
                break
                
            item = ast.literal_eval(line.decode('utf-8'))
            ans = item.get('answer', '').lower()
            asin = item.get('asin')
            
            # Skip short answers or missing ASINs
            if not asin or len(ans) < 20 or "don't know" in ans or "not sure" in ans:
                continue
                
            data_samples.append(item)
    
    total_sim = 0
    total_rouge = 0
    
    print(f"{'QUESTION':<50} | {'SIMILARITY':<10} | {'ROUGE-L':<10}")
    print("-" * 80)
    
    for item in data_samples:
        question = item['question']
        real_answer = item['answer']
        asin = item['asin']
        
        # Generate AI Answer passing the ASIN for filtering
        ai_answer = generate_answer(question, asin)
        
        # Calculate Metrics
        sim_score, rouge_score = calculate_metrics(ai_answer, real_answer)
        
        total_sim += sim_score
        total_rouge += rouge_score
        
        # Print short summary
        q_short = (question[:47] + '..') if len(question) > 47 else question
        print(f"{q_short:<50} | {sim_score:.4f}     | {rouge_score:.4f}")

    print("-" * 80)
    print(f"✅ AVERAGE SEMANTIC SIMILARITY: {total_sim/sample_size:.4f}")
    print(f"✅ AVERAGE ROUGE-L SCORE:       {total_rouge/sample_size:.4f}")

if __name__ == "__main__":
    run_evaluation(5)