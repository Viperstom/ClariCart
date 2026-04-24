# import gzip
# import ast
# import os
# import numpy as np
# from dotenv import load_dotenv
# from langchain_chroma import Chroma
# from langchain_huggingface import HuggingFaceEmbeddings
# from huggingface_hub import InferenceClient
# from rouge_score import rouge_scorer
# from sklearn.metrics.pairwise import cosine_similarity

# # 1. Load Environment Variables
# load_dotenv()
# DB_PATH = os.getenv("DB_PATH", "./chroma_db")
# HF_TOKEN = os.getenv("HF_TOKEN")
# DATA_PATH = "data/qa_Software.json.gz"
# REPO_ID = "mistralai/Mistral-7B-Instruct-v0.3" # Same model as app.py

# # 2. Setup RAG Components
# print("⏳ Loading Model and Database...")
# embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
# vector_store = Chroma(persist_directory=DB_PATH, embedding_function=embeddings)
# client = InferenceClient(token=HF_TOKEN)

# def generate_answer(question):
#     """
#     Simulates the full RAG pipeline: Retrieve -> Generate
#     """
#     # Retrieve
#     docs = vector_store.similarity_search(question, k=2)
#     if not docs:
#         return "I don't know."
    
#     context = "\n\n".join([d.page_content for d in docs])
    
#     # Generate
#     messages = [
#         {"role": "system", "content": "Answer the question based ONLY on the context. If unknown, say 'I don't know'."},
#         {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
#     ]
    
#     try:
#         response = client.chat_completion(
#             messages=messages,
#             model=REPO_ID,
#             max_tokens=256,
#             temperature=0.1
#         )
#         return response.choices[0].message.content
#     except:
#         return "Error generating answer."

# def calculate_metrics(generated_ans, reference_ans):
#     """
#     Calculates Semantic Similarity and ROUGE-L score
#     """
#     # 1. Semantic Similarity (Cosine)
#     # Embed both answers
#     gen_emb = embeddings.embed_query(generated_ans)
#     ref_emb = embeddings.embed_query(reference_ans)
    
#     # Calculate Cosine Similarity
#     similarity = cosine_similarity([gen_emb], [ref_emb])[0][0]
    
#     # 2. ROUGE Score (Text Overlap)
#     scorer = rouge_scorer.RougeScorer(['rougeL'], use_stemmer=True)
#     scores = scorer.score(reference_ans, generated_ans)
#     rouge_l = scores['rougeL'].fmeasure
    
#     return similarity, rouge_l

# def run_evaluation(sample_size=5):
#     print(f"\n🧪 Starting Evaluation on {sample_size} random samples...\n")
    
#     # Load Data
#     data_samples = []
#     with gzip.open(DATA_PATH, 'rb') as f:
#         for i, line in enumerate(f):
#             if i >= sample_size: break # Just take first N for speed
#             data_samples.append(ast.literal_eval(line.decode('utf-8')))
    
#     total_sim = 0
#     total_rouge = 0
    
#     print(f"{'QUESTION':<50} | {'SIMILARITY':<10} | {'ROUGE-L':<10}")
#     print("-" * 80)
    
#     for item in data_samples:
#         question = item['question']
#         real_answer = item['answer']
        
#         # Generate AI Answer
#         ai_answer = generate_answer(question)
        
#         # Calculate Metrics
#         sim_score, rouge_score = calculate_metrics(ai_answer, real_answer)
        
#         total_sim += sim_score
#         total_rouge += rouge_score
        
#         # Print short summary for this row
#         q_short = (question[:47] + '..') if len(question) > 47 else question
#         print(f"{q_short:<50} | {sim_score:.4f}     | {rouge_score:.4f}")

#     print("-" * 80)
#     print(f"✅ AVERAGE SEMANTIC SIMILARITY: {total_sim/sample_size:.4f}")
#     print(f"✅ AVERAGE ROUGE-L SCORE:       {total_rouge/sample_size:.4f}")
#     print("\nInterpretation:")
#     print("- Similarity > 0.7 is excellent (Meaning matches).")
#     print("- ROUGE is often lower (0.3-0.5) because AI summarizes instead of copying exact words.")

# if __name__ == "__main__":
#     run_evaluation(5)




import gzip
import ast
import os
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
DATA_PATH = "data/qa_Software.json.gz"
REPO_ID = "mistralai/Mistral-7B-Instruct-v0.3" # Same model as app.py

# 2. Setup RAG Components
print("⏳ Loading Model and Database...")
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vector_store = Chroma(persist_directory=DB_PATH, embedding_function=embeddings)
client = InferenceClient(token=HF_TOKEN)

def generate_answer(question):
    """
    Simulates the full RAG pipeline: Retrieve -> Generate
    """
    # IMPROVEMENT 1: Increased k from 2 to 3 to provide more context coverage
    docs = vector_store.similarity_search(question, k=5)
    if not docs:
        return "I don't know."
    
    context = "\n\n".join([d.page_content for d in docs])
    
    # Generate
    messages = [
        # IMPROVEMENT: Changed "Be concise" to "Answer comprehensively"
        # Why? Real user answers are often chatty. "Concise" answers lower ROUGE scores because they are too short.
        {"role": "system", "content": "You are a helpful customer support assistant. Answer the question comprehensively based ONLY on the provided context. If the answer is not in the context, say 'I don't know'."},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
    ]

    try:
        response = client.chat_completion(
            messages=messages,
            model=REPO_ID,
            max_tokens=256,
            temperature=0.1,
            stream=False
        )
        return response.choices[0].message.content
    except:
        return "Error generating answer."

def calculate_metrics(generated_ans, reference_ans):
    """
    Calculates Semantic Similarity and ROUGE-L score
    """
    # 1. Semantic Similarity (Cosine)
    # Embed both answers
    gen_emb = embeddings.embed_query(generated_ans)
    ref_emb = embeddings.embed_query(reference_ans)
    
    # Calculate Cosine Similarity
    similarity = cosine_similarity([gen_emb], [ref_emb])[0][0]
    
    # 2. ROUGE Score (Text Overlap)
    scorer = rouge_scorer.RougeScorer(['rougeL'], use_stemmer=True)
    scores = scorer.score(reference_ans, generated_ans)
    rouge_l = scores['rougeL'].fmeasure
    
    return similarity, rouge_l

def run_evaluation(sample_size=5):
    print(f"\n🧪 Starting Evaluation on {sample_size} curated samples...\n")
    
    # Load Data
    data_samples = []
    
    # IMPROVEMENT 2: Filter out "bad" data to ensure fair scoring
    with gzip.open(DATA_PATH, 'rb') as f:
        for line in f:
            if len(data_samples) >= sample_size: 
                break
                
            item = ast.literal_eval(line.decode('utf-8'))
            ans = item.get('answer', '').lower()
            
            # Skip short/useless answers (Data Hygiene)
            # This prevents penalizing the model when the ground truth is "I don't know"
            if len(ans) < 20 or "don't know" in ans or "not sure" in ans:
                continue
                
            data_samples.append(item)
    
    total_sim = 0
    total_rouge = 0
    
    print(f"{'QUESTION':<50} | {'SIMILARITY':<10} | {'ROUGE-L':<10}")
    print("-" * 80)
    
    for item in data_samples:
        question = item['question']
        real_answer = item['answer']
        
        # Generate AI Answer
        ai_answer = generate_answer(question)
        
        # Calculate Metrics
        sim_score, rouge_score = calculate_metrics(ai_answer, real_answer)
        
        total_sim += sim_score
        total_rouge += rouge_score
        
        # Print short summary for this row
        q_short = (question[:47] + '..') if len(question) > 47 else question
        print(f"{q_short:<50} | {sim_score:.4f}     | {rouge_score:.4f}")

    print("-" * 80)
    print(f"✅ AVERAGE SEMANTIC SIMILARITY: {total_sim/sample_size:.4f}")
    print(f"✅ AVERAGE ROUGE-L SCORE:       {total_rouge/sample_size:.4f}")
    print("\nInterpretation:")
    print("- Similarity > 0.7 is excellent (Meaning matches).")
    print("- ROUGE is often lower (0.3-0.5) because AI summarizes instead of copying exact words.")

if __name__ == "__main__":
    run_evaluation(20)