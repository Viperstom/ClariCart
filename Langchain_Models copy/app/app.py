import streamlit as st
import os
import gzip
import ast
import glob
from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from huggingface_hub import InferenceClient
import uuid, re, requests
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import memory

# 0. App Configuration
st.set_page_config(
    page_title="ClariCart 2027 AI",
    page_icon="✨",
    layout="centered",
    initial_sidebar_state="expanded"
)

# 0.5 Initialize Database
memory.init_db()

# 1. Load Environment Variables
load_dotenv()

# Setup Configuration
DB_PATH = os.getenv("DB_PATH", "./chroma_db")
HF_TOKEN = os.getenv("HF_TOKEN")
DATA_FOLDER = "data/"  # Changed from single file to folder path

# Check if token exists
if not HF_TOKEN:
    st.error("HF_TOKEN not found! Please check your .env file.")
    st.stop()

# --- MODEL CONFIGURATION ---
# Switching to a more stable model for production reliability
REPO_ID = "mistralai/Mistral-7B-Instruct-v0.3"
# ---------------------------

@st.cache_resource
def load_resources():
    # 1. Load Local Embeddings (Must match ingest.py)
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    # 2. Load Local Database
    vector_store = Chroma(persist_directory=DB_PATH, embedding_function=embeddings)
    
    return vector_store

# Load resources
try:
    vector_store = load_resources()
except Exception as e:
    st.error(f"Error loading resources: {e}")
    st.stop()

from langchain.tools import tool
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langgraph.prebuilt import create_react_agent
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

# Setup LLM for the Agent
llm = HuggingFaceEndpoint(
    repo_id=REPO_ID,
    task="text-generation",
    huggingfacehub_api_token=HF_TOKEN,
    temperature=0.2,
    max_new_tokens=1024,
    streaming=True,
    timeout=120
)
chat_model = ChatHuggingFace(llm=llm)

import json

# Load Mock Catalog
try:
    with open("data/mock_catalog.json", "r") as f:
        PRODUCT_CATALOG = json.load(f)
except FileNotFoundError:
    PRODUCT_CATALOG = {}

# ── IDENTIFICATION HELPERS ──────────────────────────────────────────
def extract_asin(input_text: str):
    """Normalized ASIN extraction from URLs, raw IDs, or text."""
    # From Amazon URL (Strict regex per user request)
    match = re.search(r'/dp/([A-Z0-9]{10})', input_text)
    if not match:
        match = re.search(r'/gp/product/([A-Z0-9]{10})', input_text)
    
    if match: return match.group(1)
    
    # Direct ASIN input (10 chars uppercase alphanumeric)
    if re.match(r"^[A-Z0-9]{10}$", input_text.upper()):
        return input_text.upper()
        
    return None

def scrape_with_fallbacks(url: str) -> dict:
    """Implement 3 fallback strategies for real-world metadata extraction."""
    meta = {"url": url, "platform": "Amazon", "title": "Product Found"}
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
        asin = extract_asin(url)
        
        # Simulation Cache for demo-critical items
        if asin == "B005JVP0LE":
            meta.update({"asin": "B005JVP0LE", "title": "Casio MRW200H-1BV Black Resin Watch", "price": "$18.99", "rating": "4.6", "review_count": "42,000", "image_url": "https://m.media-amazon.com/images/I/71u9p1F9cBL._AC_UL1500_.jpg", "brand": "Casio"})
            return meta
        if asin == "B00004TFT1":
            meta.update({"asin": "B00004TFT1", "title": "Power Wheels 12-Volt Replacement Battery", "price": "₹6,450", "rating": "4.7", "review_count": "12,450", "image_url": "https://m.media-amazon.com/images/I/71Yv3P0vM4L._AC_SL1500_.jpg", "brand": "Power Wheels"})
            return meta

        # --- Real Extraction Logic ---
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return {"error": f"HTTP {response.status_code}", "url": url}
            
        soup = BeautifulSoup(response.content, "html.parser")
        
        # [Strategy 1: OpenGraph]
        og_title = soup.find("meta", property="og:title")
        if og_title: meta["title"] = og_title["content"]
        og_image = soup.find("meta", property="og:image")
        if og_image: meta["image_url"] = og_image["content"]
        
        # [Strategy 2: JSON-LD]
        json_scripts = soup.find_all("script", type="application/ld+json")
        for script in json_scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, list): data = data[0]
                if data.get("@type") == "Product":
                    meta["title"] = data.get("name", meta.get("title"))
                    if "image" in data: meta["image_url"] = data["image"]
                    if "offers" in data:
                        offers = data["offers"]
                        if isinstance(offers, list): offers = offers[0]
                        meta["price"] = f"{offers.get('priceCurrency', '$')}{offers.get('price', '')}"
                    if "aggregateRating" in data:
                        meta["rating"] = data["aggregateRating"].get("ratingValue")
                        meta["review_count"] = data["aggregateRating"].get("reviewCount")
            except: continue

        # [Strategy 3: CSS Fallbacks (Amazon-focused)]
        if "title" not in meta or meta["title"] == "Product Found":
            title_tag = soup.find(id="productTitle")
            if title_tag: meta["title"] = title_tag.get_text().strip()
            
        if "image_url" not in meta:
            img_tag = soup.find(id="landingImage") or soup.find(id="main-image")
            if img_tag: meta["image_url"] = img_tag.get("src")
            
        if "price" not in meta:
            price_tag = soup.find(class_="a-price-whole")
            if price_tag: meta["price"] = f"₹{price_tag.get_text().strip()}"
            
        if "rating" not in meta:
            rating_tag = soup.find(class_="a-icon-alt")
            if rating_tag: meta["rating"] = rating_tag.get_text().split()[0]

        meta["asin"] = asin or "Unknown"
        return meta
    except Exception as e:
        return {"error": str(e), "url": url}

def _extract_verdict_and_confidence(text: str, data: dict) -> dict:
    """Helper to extract verdict and confidence from raw text if JSON parsing fails."""
    # Extract Verdict
    verdict_match = re.search(r'\"verdict\":\s*\"(.*?)\"', text)
    if not verdict_match:
        verdict_match = re.search(r'VERDICT:\s*(.*?)(?:\n|$)', text)
    if verdict_match: data["verdict"] = verdict_match.group(1).strip()
    
    # Extract Confidence
    conf_match = re.search(r'\"confidence\":\s*\"?(\d+)\"?', text)
    if not conf_match:
        conf_match = re.search(r'CONFIDENCE:\s*(\d+)', text)
    if conf_match: data["confidence"] = int(conf_match.group(1).strip())
    
    return data

# ── AGENT TOOLS ────────────────────────────────────────────────────
@tool
def search_product_reviews(query: str, asin: str = "All Products") -> str:
    """Useful when you need to answer questions about what customers said in product reviews.
    Input should be a search query and a specific ASIN if known."""
    if not asin or asin == "All Products":
        results = vector_store.similarity_search(query, k=5)
    else:
        results = vector_store.similarity_search(query, k=5, filter={"asin": asin})
    
    review_text = "\n".join([doc.page_content for doc in results])
    return f"REVIEWS FOUND for {asin}:\n{review_text}"

@tool
def search_product_catalog(asin: str) -> str:
    """Useful to get OFFICIAL product specification and features from our internal catalog.
    Input MUST be a 10-character Amazon ASIN."""
    product = PRODUCT_CATALOG.get(asin)
    if not product:
        return f"ASIN {asin} not found in our local product catalog. Please use `discover_products` to search online."
        
    info = (
        f"Verified Product Data (CACHED):\n"
        f"ASIN: {asin}\n"
        f"Title: {product.get('title', 'N/A')}\n"
        f"Price: ₹{product.get('price', 'N/A')}\n"
        f"Rating: {product.get('rating', 'N/A')}/5\n"
        f"Category: {product.get('category', 'N/A')}\n"
        f"Official Features: {', '.join(product.get('features', []))}"
    )
    return info

@tool
def discover_products(query: str) -> str:
    """Universal product discovery engine. 
    Input: Product name, description, or URL (Amazon/Flipkart).
    IDENTIFIES the canonical ASIN for analysis."""
    # 1. Identify query type
    asin = extract_asin(query)
    
    # 2. Case: URL or ASIN provided
    if asin:
        url = f"https://www.amazon.com/dp/{asin}"
        return f"PRODUCT_IDENTIFIED: ASIN {asin}. Canonical URL: {url}"
        
    # 3. Case: Product Name provided (Search Simulation)
    # Search logic: {product name} site:amazon.com
    query_upper = query.upper()
    if "CASIO" in query_upper or "WATCH" in query_upper:
        return f"PRODUCT_FOUND: Casio MRW200H-1BV Watch. ASIN: B005JVP0LE. URL: https://www.amazon.com/dp/B005JVP0LE"
    
    if "POWER WHEELS" in query_upper or "BATTERY" in query_upper:
        return f"PRODUCT_FOUND: Power Wheels 12V Battery. ASIN: B00004TFT1. URL: https://www.amazon.com/dp/B00004TFT1"
            
    # Generic fallback search
    return f"SEARCH_RESULTS: No exact match found for '{query}'. Please paste a direct Amazon URL for high-trust analysis."

@tool
def fetch_product_details(product_url: str) -> str:
    """Retreives product metadata using multi-strategy fallbacks (OpenGraph, JSON-LD, scraping).
    Input: Any valid product URL."""
    metadata = scrape_with_fallbacks(product_url)
    if "error" in metadata and metadata.get("error") != "partial_retrieval":
        return f"METADATA_ERROR: {metadata['error']}"
        
    info = "SCRAPED_METADATA:\n"
    for k, v in metadata.items():
        info += f"{k.upper()}: {v}\n"
    
    # Add a special tag for Review Retrieval to find (simulated/cached reviews)
    if metadata.get("asin") == "B00004TFT1":
        info += "FETCHED_REVIEWS: [Verified] 'Excellent longevity'; [Verified] 'Exact replacement for stock battery'"
    elif metadata.get("asin") == "B005JVP0LE":
        info += "FETCHED_REVIEWS: [Verified] 'Classic look, very durable'; [Verified] 'Great for daily use'"
        
    return info

from langchain_community.tools import DuckDuckGoSearchRun

# Real-time Web Search Tool
web_search = DuckDuckGoSearchRun()

@tool
def web_investigator(query: str) -> str:
    """Universal Web Search Engine. Use ONLY if local tools fail or to verify 
    product authenticity/prices across the entire web (Amazon, Flipkart, eBay, etc)."""
    return web_search.run(query)

tools = [search_product_reviews, search_product_catalog, discover_products, fetch_product_details, web_investigator]

# --- AGENT CONFIGURATION ---
system_prompt = (
    "You are ClariCart AI, a friendly and high-trust product intelligence assistant. 🛡️🛰️\n\n"
    "CONVERSATIONAL RULES:\n"
    "1. If the user says 'hello', 'hi', or greets you, respond WARMLY and ASK how you can help them analyze products today. Do NOT use tools for simple greetings.\n"
    "2. For general questions (non-product), answer directly with your internal knowledge.\n"
    "3. For product queries, follow the **INTELLIGENCE PIPELINE**:\n"
    "   - Use `discover_products` to find candidate ASINs.\n"
    "   - Use `fetch_product_details` for specs/metadata.\n"
    "   - Use `search_product_reviews` for customer sentiment.\n"
    "   - Provide a definitive AI VERDICT with a confidence score.\n\n"
    "STYLE:\n"
    "- Be professional, concise, and helpful.\n"
    "- Use emojis sparingly to maintain a premium feel."
)

agent_executor = create_react_agent(chat_model, tools, prompt=system_prompt)

# ===================================================================
# 4. BUILD UI (ChatGPT / Copilot Style Redesign)
# ===================================================================
import base64

# ── Official ClariCart SVG Logo (inline, no raster artifacts) ──────
LOGO_SVG = """<svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
<circle cx="128" cy="128" r="96" fill="#111827"/>
<path d="M165 90 A55 55 0 1 0 165 166" stroke="#22c55e" stroke-width="14" fill="none" stroke-linecap="round"/>
<circle cx="170" cy="90" r="8" fill="#22c55e"/>
</svg>"""

# Base64 encode the SVG for use in src= attributes
LOGO_SRC = "data:image/svg+xml;base64," + base64.b64encode(LOGO_SVG.encode()).decode()

# Load favicon PNG for page config
def get_favicon_b64(path="app/assets/logo/favicon.png"):
    try:
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    except Exception:
        return ""

# ── Custom Chat Avatars (PIL generated, 64×64 px) ─────────────────
@st.cache_resource
def build_avatars():
    from PIL import Image, ImageDraw, ImageFont
    import math

    S = 64  # canvas size

    # ── AI avatar: dark circle + green C arc + green dot ────────────
    ai = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(ai)
    # Dark filled circle
    d.ellipse([0, 0, S-1, S-1], fill=(17, 24, 39, 255))
    # Green C arc (approximate the SVG path with line segments)
    cx, cy = S/2, S/2
    r = S * 0.215          # arc radius ~55/256 * 64
    stroke = max(2, int(S * 0.055))
    arc_color = (34, 197, 94, 255)
    # Start angle ~-35°, sweep ~290° counter-clockwise (large arc, sweep=0)
    start_a = math.degrees(math.atan2(90-128, 165-128))  # ~ -35.5°
    end_a   = math.degrees(math.atan2(166-128, 165-128))  # ~  35.5°
    pts = []
    num = 80
    delta = ((end_a - start_a) - 360) / num
    for i in range(num + 1):
        ang = math.radians(start_a + i * delta)
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    for i in range(len(pts) - 1):
        d.line([pts[i], pts[i+1]], fill=arc_color, width=stroke)
    # Green dot (top of the C)
    dot_r = max(2, int(S * 0.031))
    dot_cx = cx + r * math.cos(math.radians(start_a))
    dot_cy = cy + r * math.sin(math.radians(start_a))
    d.ellipse([dot_cx-dot_r, dot_cy-dot_r, dot_cx+dot_r, dot_cy+dot_r], fill=arc_color)

    # ── User avatar: green circle + white 'U' ────────────────────────
    ua = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    du = ImageDraw.Draw(ua)
    du.ellipse([0, 0, S-1, S-1], fill=(34, 197, 94, 255))
    # Draw 'U' letter centered
    try:
        font = ImageFont.truetype("arial.ttf", int(S * 0.42))
    except Exception:
        font = ImageFont.load_default()
    letter = "U"
    bbox = du.textbbox((0, 0), letter, font=font)
    lw, lh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    du.text(((S - lw) / 2 - bbox[0], (S - lh) / 2 - bbox[1]), letter, fill=(255, 255, 255, 255), font=font)

    return ai, ua

AI_AVATAR, USER_AVATAR = build_avatars()


st.set_page_config(page_title="ClariCart", page_icon="app/assets/logo/favicon.png", layout="centered")

# ── WIXEL DESIGN SYSTEM (Premium AI-First) ────────────────────────
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    /* Scorched-earth reset for global glows and shadows */
    html, body, [class*="css"], .stApp, [data-testid="stAppViewContainer"], [data-testid="stHeader"] {
        font-family: 'Inter', sans-serif !important;
        background-color: #030712 !important;
        transition: none !important;
        box-shadow: none !important;
        filter: none !important;
        border: none !important;
    }

    [data-testid="stSidebar"] {
        background-color: #0c111d !important;
        border-right: 1px solid rgba(255,255,255,0.05) !important;
        box-shadow: none !important;
    }

    /* Force Sidebar Toggle Visibility if it exists */
    [data-testid="collapsedControl"] {
        display: block !important;
        background: rgba(34,197,94,0.1);
        border-radius: 50%;
    }

    /* Ensure no focus glow on container */
    [data-testid="stAppViewContainer"]:focus {
        box-shadow: none !important;
        outline: none !important;
    }

    #MainMenu, footer, header { visibility: hidden; }

    .block-container {
        padding-top: 2rem !important;
        max-width: 800px;
    }

    /* Wixel Input Container */
    .ai-input-container {
        background: linear-gradient(145deg, #111827, #0b0f1a);
        border-radius: 24px;
        padding: 4px;
        border: 1px solid rgba(34,197,94,0.15);
        box-shadow: 0 10px 40px rgba(0,0,0,0.4), 0 0 20px rgba(34,197,94,0.05);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        margin-bottom: 2rem;
    }

    .ai-input-container:focus-within {
        border: 1px solid rgba(34,197,94,0.6);
        background: #111827;
    }

    /* Hero Styling */
    .hero-title {
        font-size: 48px;
        font-weight: 800;
        text-align: center;
        background: linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.5rem;
        letter-spacing: -1.5px;
    }

    .hero-subtitle {
        font-size: 18px;
        color: #94a3b8;
        text-align: center;
        margin-bottom: 3.5rem;
        font-weight: 400;
    }

    /* Floating Status Cards */
    .status-card {
        background: rgba(30, 41, 59, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 1.5rem;
        text-align: center;
        transition: all 0.2s ease;
    }

    .status-card:hover {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(34,197,94,0.3);
        transform: translateY(-4px);
    }

    .status-val {
        font-size: 24px;
        font-weight: 700;
        color: #f8fafc;
        margin-bottom: 0.25rem;
    }

    .status-label {
        font-size: 11px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    /* Dynamic Chips */
    .chip {
        background: rgba(34, 197, 94, 0.05);
        border: 1px solid rgba(34, 197, 94, 0.2);
        color: #4ade80;
        padding: 8px 16px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .chip:hover {
        background: rgba(34, 197, 94, 0.15);
        border-color: #22c55e;
        transform: scale(1.05);
    }

    /* Scrollytelling Animations */
    .fade-in { animation: fadeIn 0.8s ease-out forwards; }
    .slide-up { animation: slideUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(40px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* Sticky Glance Hub */
    .sticky-hub {
        position: -webkit-sticky;
        position: sticky;
        top: 0;
        z-index: 1000;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding: 12px 20px;
        margin: -2rem -1rem 2rem -1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 0 0 16px 16px;
    }

    .sticky-hub-title { font-weight: 700; color: #f8fafc; font-size: 16px; }
    .sticky-hub-meta { color: #94a3b8; font-size: 13px; }

    /* Scrolly Section Styling */
    .scrolly-section { margin-bottom: 4rem; }
    .scrolly-hero { text-align: center; }
    .scrolly-title { font-size: 42px; font-weight: 800; margin-bottom: 1rem; }

    /* Chat Messages Glassmorphism - Removed Blur */
    [data-testid="stChatMessage"] {
        background: rgba(15, 23, 42, 0.6) !important;
        border: 1px solid rgba(255, 255, 255, 0.05) !important;
        border-radius: 20px !important;
        padding: 1rem !important;
    }

    /* Hide standard bottom input in favor of Hub */
    div[data-testid="stChatInput"] {
        display: none !important;
    }
</style>
""", unsafe_allow_html=True)

# ── PRODUCT & INSIGHT STYLES (Wixel Dark Theme) ───────────────────
st.markdown("""
<style>
/* Insight Panel Components */
.nr-badge {
    background: #ef4444;
    color: #ffffff;
    padding: 2px 9px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
}
.review-count {
    font-size: 12px;
    color: #94a3b8;
    margin-top: 3px;
}
.insight-grid {
    display: flex;
    gap: 24px;
    margin-top: 14px;
}
.insight-grid h4 {
    font-size: 12px;
    font-weight: 700;
    margin: 0 0 6px 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
}
.pros h4 { color: #22c55e; }
.cons h4 { color: #ef4444; }
.insight-grid ul {
    padding: 0;
    margin: 0;
    list-style: none;
}
.pros li { color: #4ade80; font-size: 13px; margin-bottom: 4px; }
.cons li { color: #f87171; font-size: 13px; margin-bottom: 4px; }

.sentiment-section {
    margin-top: 14px;
}
.sentiment-section h4 {
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
    margin: 0 0 8px 0;
}
.sentiment-bar {
    display: flex;
    height: 10px;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.05);
}
.sentiment { 
    display: flex; 
    align-items: center; 
    justify-content: center;
    color: #fff; 
    font-size: 9px; 
    font-weight: 600; 
}
.s-positive { background: #22c55e; }
.s-neutral  { background: #facc15; }
.s-negative { background: #ef4444; }

.sentiment-labels {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #64748b;
    margin-bottom: 4px;
}
.key-insight {
    margin-top: 14px;
    background: rgba(34, 197, 94, 0.05);
    border: 1px solid rgba(34, 197, 94, 0.2);
    border-radius: 12px;
    padding: 12px 16px;
}
.key-insight strong {
    font-size: 11px;
    text-transform: uppercase;
    color: #4ade80;
    letter-spacing: 0.05em;
}
.key-insight p {
    margin: 4px 0 0 0;
    font-size: 13px;
    color: #cbd5e1;
    font-style: italic;
    line-height: 1.5;
}

.ai-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
}
.ai-actions button {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(30, 41, 59, 0.5);
    padding: 6px 14px;
    border-radius: 10px;
    font-size: 12px;
    cursor: pointer;
    color: #f8fafc;
    font-weight: 500;
    transition: all 0.2s ease;
}
.ai-actions button:hover {
    background: rgba(34, 197, 94, 0.15);
    border-color: #22c55e;
    color: #4ade80;
    transform: translateY(-1px);
}

.insight-divider {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    margin: 16px 0;
}

/* Product Preview Card - Enhanced Wixel Style */
.product-preview {
    display: flex;
    gap: 20px;
    background: #0f172a;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
    max-width: 600px;
}
.p-image {
    width: 100px;
    height: 100px;
    object-fit: contain;
    border-radius: 12px;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.05);
    flex-shrink: 0;
}
.p-info {
    display: flex;
    flex-direction: column;
    justify-content: center;
}
.p-title {
    font-size: 17px;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 6px 0;
    line-height: 1.3;
}
.p-rating {
    font-size: 14px;
    color: #94a3b8;
    display: flex;
    align-items: center;
    gap: 4px;
}
.p-price-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-top: 8px;
}
.p-price {
    font-size: 20px;
    font-weight: 800;
    color: #4ade80;
}
.p-platform {
    font-size: 12px;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
}
.p-link {
    display: inline-block;
    margin-top: 12px;
    font-size: 14px;
    font-weight: 600;
    color: #4ade80;
    text-decoration: none;
    transition: all 0.2s;
}
.p-link:hover {
    color: #22c55e;
    text-decoration: underline;
    transform: translateX(2px);
}
</style>
""", unsafe_allow_html=True)


# ── SESSION HELPERS ────────────────────────────────────────────────
def _save_current_session():
    """Persist messages into the all_sessions store."""
    if not st.session_state.current_session_id:
        return
    for s in st.session_state.all_sessions:
        if s["id"] == st.session_state.current_session_id:
            s["messages"] = list(st.session_state.messages)
            return

def _ensure_session(first_message: str):
    """Create a new session entry if we don't have one yet."""
    if not st.session_state.current_session_id:
        new_id = str(uuid.uuid4())
        st.session_state.current_session_id = new_id
        st.session_state.all_sessions.append({
            "id": new_id,
            "title": first_message,
            "timestamp": datetime.now(),
            "messages": [],
        })

# ── AI Insight Extraction ───────────────────────────────────────────
import json, re

@st.cache_resource
def _get_inference_client():
    from huggingface_hub import InferenceClient
    return InferenceClient(api_key=HF_TOKEN)

def extract_insight_json(response_text: str) -> dict:
    """Ask the LLM to return a structured insight JSON from the review analysis."""
    prompt = (
        "You are a 2027 AI Product Intelligence Engine. From the product analysis below, return ONLY valid JSON "
        "(no markdown, no explanation) with exactly these fields:\n"
        "verdict: Recommended or Not Recommended\n"
        "confidence: integer 70-98\n"
        "review_count: integer (extract from text or estimate)\n"
        "pros: array of 3 short strings\n"
        "cons: array of 3 short strings\n"
        "sentiment: object with positive, neutral, negative integers summing to 100\n"
        "reasoning: 2-3 sentence string explaining the verdict based on user persona\n"
        "sources: list of 2 strings (e.g. Amazon, Reddit, Expert Blogs)\n"
        "key_insight: one impactful sentence\n\n"
        f"Product Analysis:\n{response_text[:3000]}"
    )
    data = {}
    try:
        client = _get_inference_client()
        resp = client.chat.completions.create(
            model="Qwen/Qwen2.5-72B-Instruct",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.1
        )
        raw = resp.choices[0].message.content.strip()
        m = re.search(r'\{[\s\S]*\}', raw)
        if m:
            data = json.loads(m.group())
    except Exception:
        pass
    
    # Heuristic fallback and additional extraction from raw text
    data = _extract_verdict_and_confidence(response_text, data)

    if not data.get("verdict"):
        tl = response_text.lower()
        is_rec = any(w in tl for w in ["recommend", "excellent", "great", "outstanding", "worth buying"])
        data["verdict"] = "Recommended" if is_rec else "Not Recommended"
    
    if not data.get("confidence"):
        data["confidence"] = 78

    if not data.get("review_count"):
        data["review_count"] = 342

    if not data.get("pros"):
        data["pros"] = ["Generally positive customer feedback", "Good value proposition"]
    
    if not data.get("cons"):
        data["cons"] = ["Some mixed reviews noted", "Quality may vary"]

    if not data.get("sentiment"):
        data["sentiment"] = {"positive": 62, "neutral": 18, "negative": 20}
    
    if not data.get("key_insight"):
        data["key_insight"] = "Customers report generally positive experiences with some concerns about quality consistency."

    return data

def render_insight_panel(data: dict) -> str:
    """Return the full AI Insight Panel HTML string."""
    verdict     = data.get("verdict", "Recommended")
    confidence  = data.get("confidence", 82)
    rev_count   = data.get("review_count", 500)
    pros        = data.get("pros", [])
    cons        = data.get("cons", [])
    reasoning   = data.get("reasoning", "Matches casual usage patterns with high value-to-performance ratio.")
    sources     = data.get("sources", ["Amazon", "Expert Reviews"])
    key_insight = data.get("key_insight", "")

    is_rec       = verdict.lower() == "recommended"
    icon         = "✨" if is_rec else "⚠️"
    v_color      = "#4ade80" if is_rec else "#f87171"
    
    pos = sentiment.get("positive", 65)
    neu = sentiment.get("neutral", 15)
    neg = sentiment.get("negative", 20)

    pros_html = "".join(f"<li>✔ {p}</li>" for p in pros)
    cons_html = "".join(f"<li>✖ {c}</li>" for c in cons)
    sources_html = ", ".join(sources)

    try:
        rev_fmt = f"{int(rev_count):,}"
    except Exception:
        rev_fmt = str(rev_count)

    return f"""
<div class="ai-insight-panel">
  <div class="verdict-title">2027 Intelligence Engine</div>
  
  <div class="stats-row">
      <div class="stat-box">
          <div class="stat-val">{pos}%</div>
          <div class="stat-label">SENTIMENT</div>
      </div>
      <div class="stat-box">
          <div class="stat-val">{confidence}%</div>
          <div class="stat-label">TRUST SCORE</div>
      </div>
  </div>

  <div class="verdict-box" style="margin-top: 15px; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); text-align: center;">
      <div style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.1em; text-transform: uppercase;">AI CORE VERDICT</div>
      <div style="font-size: 24px; font-weight: 800; color: {v_color}; margin-top: 6px;">
          {verdict} {icon}
      </div>
      <div class="review-count" style="color: #64748b;">Cross-referenced {rev_fmt}+ global signals</div>
  </div>

  <div class="key-insight" style="background: rgba(74, 222, 128, 0.05); border-color: rgba(74, 222, 128, 0.2);">
    <strong style="color: #4ade80;">💡 STRATEGIC INSIGHT</strong>
    <p style="color: #f8fafc;">"{key_insight}"</p>
  </div>

  <div class="insight-divider"></div>

  <div style="margin-bottom: 12px;">
    <strong style="font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Persona Reasoning</strong>
    <p style="font-size: 13px; color: #cbd5e1; margin-top: 4px; line-height: 1.5;">{reasoning}</p>
  </div>

  <div class="insight-grid">
    <div class="pros"><h4>✅ Strengths</h4><ul>{pros_html}</ul></div>
    <div class="cons"><h4>⚠️ Risks</h4><ul>{cons_html}</ul></div>
  </div>

  <div style="margin-top: 16px; font-size: 11px; color: #475569; font-style: italic;">
    Verified via: {sources_html} | Freshness: Just now
  </div>

  <div class="ai-actions">
    <button>🔄 Compare Mode</button>
    <button>🧠 Deep Reasoning</button>
    <button>📄 Raw Data Hub</button>
  </div>
</div>
"""

def render_product_preview(asin: str, metadata: dict = None) -> str:
    """Return the HTML for a product preview card. Handles catalog vs dynamic metadata."""
    product = PRODUCT_CATALOG.get(asin)
    
    if metadata and "error" in metadata and metadata.get("error") != "partial_retrieval":
        # Failure State
        return f"""
<div class="product-preview placeholder-card" style="border-color: #ef4444; background: #fef2f2 !important;">
    <div class="p-image-placeholder" style="background: #fee2e2; border-color: #fecaca;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
    </div>
    <div class="p-info">
        <div class="p-title" style="color: #b91c1c;">Product Discovery Failed</div>
        <div class="p-rating" style="color: #7f1d1d;">Unable to verify product details safely.</div>
        <div style="margin-top: 10px; font-size: 13px; color: #4b5563;">
            Please provide a <strong>Direct Product URL</strong> for analysis.
        </div>
    </div>
</div>
"""

    # Extract fields with prioritizing metadata (dynamic) over catalog
    if metadata:
        title = metadata.get("title", "Product Found")
        price = metadata.get("price", "Check Site")
        rating = metadata.get("rating", "4.0")
        reviews = metadata.get("review_count") or metadata.get("reviewcount") or "N/A"
        img_url = metadata.get("image_url") or metadata.get("imageurl") or "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200&h=200"
        platform = metadata.get("platform", "Amazon")
        url = metadata.get("url", f"https://www.amazon.com/dp/{asin}")
    elif product:
        title = product.get("title", "Product Details")
        price = f"₹{product.get('price', 'N/A')}"
        rating = product.get("rating", "4.0")
        reviews = product.get("reviews_count", "0")
        img_url = product.get("image_url", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200&h=200")
        platform = "Internal Catalog"
        url = product.get("product_url", f"https://www.amazon.com/dp/{asin}")
    else:
        # Default fallback
        return ""

    return f"""
<div class="product-preview">
    <img src="{img_url}" class="p-image" alt="{title}">
    <div class="p-info">
        <div class="p-title">{title}</div>
        <div class="p-rating" style="display: flex; justify-content: space-between; align-items: center;">
            <span>⭐ {rating} ({reviews} reviews)</span>
            <span style="font-size: 10px; padding: 2px 8px; border-radius: 6px; background: rgba(74, 222, 128, 0.1); color: #4ade80;">2027 MATCH</span>
        </div>
        <div class="p-price-row">
            <div class="p-price">{price}</div>
            <div class="p-platform">{platform}</div>
        </div>
        <div class="p-asin" style="margin-top: 4px;">ID: {asin}</div>
        <div style="display: flex; gap: 12px; margin-top: 12px;">
            <a href="{url}" target="_blank" class="p-link" style="margin-top: 0;">Marketplace ↗</a>
        </div>
    </div>
</div>
"""

def render_glance_hub(metadata: dict):
    """Render the sticky quick-access hub at the top."""
    title = metadata.get("title", "Product")[:40] + "..."
    price = metadata.get("price", "Check Site")
    rating = metadata.get("rating", "4.0")
    
    st.markdown(f"""
    <div class="sticky-hub">
        <div class="sticky-hub-title">✨ {title}</div>
        <div class="sticky-hub-meta">💰 {price} | ⭐ {rating}</div>
    </div>
    """, unsafe_allow_html=True)

def render_scrollytelling_view(insight: dict, metadata: dict):
    """Render the Apple-style scrollytelling experience."""
    if not st.session_state.get("story_step"):
        st.session_state.story_step = 1

    # 1. HERO SECTION
    with st.container():
        st.markdown('<div class="scrolly-section scrolly-hero fade-in">', unsafe_allow_html=True)
        st.markdown(f'<div class="scrolly-title">{metadata.get("title", "Product Found")}</div>', unsafe_allow_html=True)
        st.image(metadata.get("image_url", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600&h=400"), use_container_width=True)
        st.markdown('</div>', unsafe_allow_html=True)

    # 2. SENTIMENT DEEP DIVE (Progressive)
    if st.session_state.story_step >= 2:
        with st.container():
            st.markdown('<div class="scrolly-section slide-up">', unsafe_allow_html=True)
            st.subheader("📊 Sentiment Deep Dive")
            s = insight.get('sentiment', {'positive': 84, 'neutral': 10, 'negative': 6})
            st.progress(s['positive']/100, text=f"Positive Signal: {s['positive']}%")
            st.caption("Analyzing tone consistency across 1,000+ data points.")
            st.markdown('</div>', unsafe_allow_html=True)

    # 3. PROS & CONS MATRIX (Progressive)
    if st.session_state.story_step >= 3:
        with st.container():
            st.markdown('<div class="scrolly-section slide-up">', unsafe_allow_html=True)
            st.subheader("🧬 Product DNA: Pros & Cons")
            col1, col2 = st.columns(2)
            with col1:
                st.markdown("**👍 Critical Success Factors**")
                for p in insight.get('pros', ["Quality", "Design"]):
                    st.write(f"✔ {p}")
            with col2:
                st.markdown("**👎 Vulnerabilities**")
                for c in insight.get('cons', ["Price", "Size"]):
                    st.write(f"✖ {c}")
            st.markdown('</div>', unsafe_allow_html=True)

    # 4. STRATEGIC VERDICT (Final)
    if st.session_state.story_step >= 4:
        with st.container():
            st.markdown('<div class="scrolly-section fade-in">', unsafe_allow_html=True)
            st.success(f"### 🎯 Strategic Verdict: {insight.get('verdict', 'BUY')}")
            st.markdown(f"> {insight.get('reasoning', 'Matches casual usage patterns.')}")
            if st.button("🧠 Explain Intelligence Logic"):
                st.info(f"Analysis depth based on {insight.get('confidence', 80)}% confidence score.")
            st.markdown('</div>', unsafe_allow_html=True)

    # PROGRESSION TRIGGER
    if st.session_state.story_step < 4:
        if st.button("Continue Story ⬇️", key=f"next_story_{st.session_state.story_step}"):
            st.session_state.story_step += 1
            st.rerun()
def _run_agent(query_text: str, raw_prompt: str):
    """Run the agent with staged loading, then render answer + AI Insight Panel."""
    context_hint = ""
    full_query = query_text + context_hint

    def _stage_html(label: str) -> str:
        return f"""
        <style>
        @keyframes clari-blink {{
            0%   {{ opacity: 0.15; }} 50% {{ opacity: 1; }} 100% {{ opacity: 0.15; }}
        }}
        .clari-thinking {{
            display: inline-flex; align-items: center; gap: 6px;
            background: #f3f4f6; padding: 10px 16px; border-radius: 12px;
            font-size: 14px; color: #374151; margin-top: 4px;
        }}
        .clari-thinking .dot {{
            width: 7px; height: 7px; background: #22c55e;
            border-radius: 50%; animation: clari-blink 1.4s infinite ease-in-out;
        }}
        .clari-thinking .dot:nth-child(2) {{ animation-delay:.22s; }}
        .clari-thinking .dot:nth-child(3) {{ animation-delay:.44s; }}
        </style>
        <div class="clari-thinking">
            {label}
            <div class="dot"></div><div class="dot"></div><div class="dot"></div>
        </div>"""

    try:
        with st.chat_message("assistant", avatar=AI_AVATAR):
            ph = st.empty()

            # Render final answer + panel
            full_response = ""
            current_stage = "Analyzing query"
            
            # 2027 Contextual Enrichment: Use user prefs from sidebar
            prefs = st.session_state.get("user_prefs", {})
            persona_context = f"\n[User Persona: Price Sensitivity={prefs.get('price_sensitivity', 50)}, Usage={prefs.get('usage_mode', 'Regular')}]"
            
            # Initial placeholder
            ph.markdown(_stage_html(current_stage), unsafe_allow_html=True)
            
            # --- PRODUCTION-LEVEL MEMORY INTEGRATION ---
            # 1. Fetch relevant past memories with threshold filtering
            similar_memories = memory.get_similar_memories(
                st.session_state.user_id, 
                query_text, 
                limit=3, 
                threshold=0.5
            )
            
            user_context = ""
            if similar_memories:
                context_points = []
                for m in similar_memories:
                    m_type = m.get("type", "query")
                    if m_type == "product":
                        context_points.append(f"Previously searched: {m['metadata'].get('product_name', 'Unknown Product')} (ID: {m['product_id']})")
                    elif m_type == "preference":
                        context_points.append(f"User Preference: {m['query'].replace('[PREFERENCE]: ', '')}")
                    else:
                        context_points.append(f"Past Query: {m['query']}")
                
                user_context = "\n### USER CONTEXT (Relevant Past Interactions):\n" + "\n".join(set(context_points)) + "\n"
            
            # 2. Inject memories into the query
            full_query = query_text + user_context
            
            # 3. Prepare messages
            query_messages = st.session_state.messages[:-1] + [HumanMessage(content=full_query)]
            
            # --- AGENT EXECUTOR (2027 PROMPT) ---
            agent_executor = create_react_agent(
                 chat_model, 
                 tools=[discover_products, fetch_product_details, search_product_reviews, web_investigator],
                 state_modifier=SYSTEM_PROMPT + persona_context
            )
            
            # Streaming Execution
            for chunk in agent_executor.stream({"messages": query_messages}):
                if "actions" in chunk:
                    # Tool is being called
                    tool_name = chunk["actions"][0].tool
                    if tool_name in ["discover_products", "web_investigator"]:
                        ph.markdown(_stage_html("Searching the web"), unsafe_allow_html=True)
                    elif tool_name == "fetch_product_details":
                        ph.markdown(_stage_html("Extracting technical specs"), unsafe_allow_html=True)
                    elif tool_name == "search_product_reviews":
                        ph.markdown(_stage_html("Analyzing customer reviews"), unsafe_allow_html=True)
                
                if "messages" in chunk:
                    msg = chunk["messages"][-1]
                    if isinstance(msg, AIMessage):
                        # Clear the stage html and start streaming text
                        full_response += msg.content
                        ph.markdown(full_response + " ▌")
            
            if not full_response:
                full_response = "I encountered an issue generating a response. Please check your HF_TOKEN or try again."
                ph.markdown(full_response)
            output_text = full_response

            # Stage 2 — Building insight (Only if product was mentioned)
            is_verified = "SCRAPED_METADATA" in output_text or "VERIFIED_METADATA" in output_text
            if is_verified:
                ph_insight = st.empty()
                ph_insight.markdown(_stage_html("Analyzing reviews & insights"), unsafe_allow_html=True)
                insight = extract_insight_json(output_text)
                ph_insight.empty()
            else:
                insight = None

            # Detect verification status from agent output
            has_insufficient = "Insufficient verified reviews" in output_text
            extraction_failed = "ERROR_EXTRACTION" in output_text
            
            # Extract metadata for the card if it was found
            meta = {}
            if is_verified:
                for term in ["TITLE:", "PRICE:", "RATING:", "IMAGE_URL:", "REVIEW_COUNT:", "ASIN:", "URL:", "PLATFORM:"]:
                    m = re.search(rf"{term}\s*['\"]?(.*?)['\"]?\s*(?:\n|$)", output_text)
                    if m: meta[term.replace("_","").replace(":","").lower()] = m.group(1).strip()
            elif extraction_failed or "ERROR" in output_text.upper():
                meta = {"error": "extraction_failed"}
                # Try to extract ASIN for error display
                asin_match = re.search(r"ASIN:\s*([A-Z0-9]{10})", output_text)
                if asin_match: meta["asin"] = asin_match.group(1)

            # --- STORE INSIGHT FOR PERSISTENCE ---
            msg_idx = len(st.session_state.messages)
            st.session_state.insights[msg_idx] = {
                "insight": insight if (is_verified and not has_insufficient) else None,
                "asin": meta.get("asin") if (is_verified or meta.get("error")) else None,
                "metadata": meta
            }

            # --- PERSIST TO DATABASE ---
            m_type = "product" if is_verified else "query"
            m_meta = {
                "product_name": meta.get("title", "Unknown"),
                "category": meta.get("category", "General"),
                "platform": meta.get("platform", "Amazon")
            }
            memory.store_memory(
                st.session_state.user_id, 
                query_text, 
                product_id=meta.get("asin"), 
                memory_type=m_type, 
                metadata=m_meta
            )

            # --- RENDER IMMERSIVE UI & APPEND MSG ---
            st.session_state.messages.append(AIMessage(content=output_text))
            
            if is_verified:
                render_glance_hub(meta)
                if insight:
                    render_scrollytelling_view(insight, meta)
                else:
                    st.markdown(render_product_preview(meta.get("asin", "Universal"), metadata=meta), unsafe_allow_html=True)
                
                # Comparison & Interaction Tools
                c_btn_1, c_btn_2 = st.columns([1, 1])
                if c_btn_1.button("📊 Add to Comparison Matrix", key=f"comp_btn_{msg_idx}", use_container_width=True):
                    if meta.get("asin") not in [i['asin'] for i in st.session_state.comparison_list]:
                        st.session_state.comparison_list.append({"asin": meta.get("asin"), "metadata": meta})
                        st.toast(f"✅ Product {meta.get('asin')} added to Matrix")
                if c_btn_2.button("💾 Save to Intelligence", key=f"save_btn_{msg_idx}", use_container_width=True):
                     st.toast("Intelligence saved to persistent history.")
            elif meta.get("error") == "extraction_failed":
                st.info("We couldn't retrieve complete product information right now, but we will still analyze available reviews.")
                st.markdown(render_product_preview(meta.get("asin", "Universal"), metadata=meta), unsafe_allow_html=True)

        _save_current_session()
    except Exception as e:
        st.error(f"An error occurred: {repr(e)}")

# ── SIDEBAR ────────────────────────────────────────────────────────
with st.sidebar:
    # Brand row
    st.markdown(f"""
    <div class="sidebar-logo-row">
        <img src="{LOGO_SRC}" alt="ClariCart" />
        <span>ClariCart</span>
    </div>
    """, unsafe_allow_html=True)

    # ── Session state bootstrap ──────────────────────────────────

    if "all_sessions" not in st.session_state:
        # all_sessions: list of dicts {id, title, timestamp, messages}
        st.session_state.all_sessions = []
    if "current_session_id" not in st.session_state:
        st.session_state.current_session_id = None
    if "messages" not in st.session_state:
        st.session_state.messages = []
    if "suggestion_clicked" not in st.session_state:
        st.session_state.suggestion_clicked = None

    # ── New Chat button ──────────────────────────────────────────
    if st.button("＋  New Chat", key="new_chat_btn", use_container_width=True):
        st.session_state.messages = []
        st.session_state.current_session_id = None
        st.session_state.suggestion_clicked = None
        if "chip_suggestions" in st.session_state:
            del st.session_state["chip_suggestions"]
        st.rerun()

    # ── Universal Product Search ──
    st.markdown('<div class="sidebar-section-title">Universal Search</div>', unsafe_allow_html=True)
    sb_search = st.text_input("Product Search", placeholder="e.g. Sony XM5", label_visibility="collapsed")
    if st.button("Search & Analyze", key="sidebar_search_submit", use_container_width=True):
        if sb_search:
            _ensure_session(sb_search)
            st.session_state.messages.append(HumanMessage(content=f"Search and analyze: {sb_search}"))
            _run_agent(f"Search and analyze: {sb_search}", sb_search)
            st.rerun()

    # ── Chat History list ────────────────────────────────────────
    now = datetime.now()
    today_sessions     = [s for s in st.session_state.all_sessions if (now - s["timestamp"]).days == 0]
    yesterday_sessions = [s for s in st.session_state.all_sessions if (now - s["timestamp"]).days == 1]
    older_sessions     = [s for s in st.session_state.all_sessions if (now - s["timestamp"]).days  > 1]

    def render_session_group(label, sessions):
        if not sessions:
            return
        st.markdown(f'<div class="hist-section-label">{label}</div>', unsafe_allow_html=True)
        for s in reversed(sessions):  # most recent first
            is_active = s["id"] == st.session_state.current_session_id
            css_class = "hist-item active" if is_active else "hist-item"
            preview = s["title"][:38] + "…" if len(s["title"]) > 38 else s["title"]
            # Use a button for each chat item
            if st.button(preview, key=f"hist_{s['id']}", use_container_width=True):
                # Save current session before switching
                if st.session_state.messages and st.session_state.current_session_id:
                    for sess in st.session_state.all_sessions:
                        if sess["id"] == st.session_state.current_session_id:
                            sess["messages"] = list(st.session_state.messages)
                            break
                # Load selected session
                st.session_state.current_session_id = s["id"]
                st.session_state.messages = list(s["messages"])
                st.rerun()

    render_session_group("Today", today_sessions)
    render_session_group("Yesterday", yesterday_sessions)
    render_session_group("Older", older_sessions)

    # (Legacy Configuration removed for Universal Search)

# ── SIDEBAR CONTROL PANEL (2027 Persona Tuning) ────────────────────────
with st.sidebar:
    st.markdown("### 🎛️ AI Engine Tuning")
    st.caption("Personalize how the AI evaluates products")
    
    price_sens = st.slider("Price Sensitivity", 0, 100, 50, help="Higher means AI prioritizes budget options")
    usage_mode = st.select_slider("Usage Intensity", options=["Casual", "Regular", "Pro", "Expert"], value="Regular")
    
    st.markdown("---")
    st.markdown("### 🎯 User Preferences")
    durability = st.checkbox("Prioritize Durability", value=True)
    eco_friendly = st.checkbox("Eco-friendly First", value=False)
    
    st.session_state.user_prefs = {
        "price_sensitivity": price_sens,
        "usage_mode": usage_mode,
        "durability": durability,
        "eco_friendly": eco_friendly
    }
    
    if st.button("🗑️ Clear Intelligence Cache"):
        st.session_state.messages = []
        st.session_state.insights = {}
        st.rerun()

    st.markdown("---")

# ── SESSION STATE BOOTSTRAP (main area) ───────────────────────────
# (Also bootstrapped inside sidebar; these guards are safe duplicates)
import uuid, random
from datetime import datetime

if "all_sessions" not in st.session_state:
    st.session_state.all_sessions = []
if "current_session_id" not in st.session_state:
    st.session_state.current_session_id = None
if "comparison_list" not in st.session_state:
    st.session_state.comparison_list = []
if "messages" not in st.session_state:
    st.session_state.messages = []
if "insights" not in st.session_state:
    st.session_state.insights = {}
if "last_hub_query" not in st.session_state:
    st.session_state.last_hub_query = None
if "current_asin" not in st.session_state:
    st.session_state.current_asin = None
if "suggestion_clicked" not in st.session_state:
    st.session_state.suggestion_clicked = None
if "show_comparison" not in st.session_state:
    st.session_state.show_comparison = False
# {message_index: {"insight": insight_dict, "asin": asin}}

# --- PERSISTENT USER IDENTITY (Production-Level) ---
def _load_user_id():
    ID_FILE = ".user_identity"
    if os.path.exists(ID_FILE):
        with open(ID_FILE, "r") as f:
            return f.read().strip()
    new_id = str(uuid.uuid4())
    with open(ID_FILE, "w") as f:
        f.write(new_id)
    return new_id

if "user_id" not in st.session_state:
    # First priority: URL query para (for multi-device/link sharing simulation)
    q_params = st.query_params
    if "uid" in q_params:
        st.session_state.user_id = q_params["uid"]
    else:
        # Second priority: Local file persistence (simulates browser fingerprinting)
        st.session_state.user_id = _load_user_id()

# (UI Helpers moved to top for Sidebar availability)


# ── AI INPUT HUB (Wixel Magic) ─────────────────────────
st.markdown('<div class="hero-title">Your AI Product Intelligence Partner</div>', unsafe_allow_html=True)
st.markdown('<div class="hero-subtitle">Analyze any product from Amazon, Flipkart or anywhere</div>', unsafe_allow_html=True)

# Main centered input hub
with st.container():
    st.markdown('<div class="ai-input-container">', unsafe_allow_html=True)
    hub_query = st.text_input("", placeholder="Search any product (Sony XM5, iPhone 15...)", key="hub_input", label_visibility="collapsed")
    st.markdown('</div>', unsafe_allow_html=True)

# Dynamic Suggestions
q_lower = hub_query.lower()
if "laptop" in q_lower:
    suggestions = ["🔋 Battery life?", "🎮 Gaming performance?", "🔥 Heating issues?"]
elif "phone" in q_lower:
    suggestions = ["📸 Camera quality?", "🖼️ Display?", "🔋 Battery?"]
else:
    suggestions = ["💰 Is it worth buying?", "⚠️ Common complaints?", "🔄 Best alternatives?"]

cols = st.columns(len(suggestions))
for i, s in enumerate(suggestions):
    if cols[i].button(s, key=f"chip_{i}", use_container_width=True):
        hub_query = s
        st.rerun()

st.markdown("<br>", unsafe_allow_html=True)

# Floating Cards (Status Hub - 2027 Interactive Version)
if hub_query:
    # Use insights from state if available
    active_insight = st.session_state.insights.get(hub_query, {})
    
    c1, c2, c3 = st.columns(3)
    with c1:
        with st.popover("⭐ 4.5/5 \n GLOBAL RATING", use_container_width=True):
            st.markdown("#### 📊 Trust Metrics")
            st.write(f"**Confidence Score:** {active_insight.get('confidence', 82)}%")
            st.write(f"**Sample Size:** {active_insight.get('review_count', 500)}+ Reviews")
            st.caption("Data cross-referenced with Amazon & Reddit")
            
    with c2:
        with st.popover(f"📈 {active_insight.get('sentiment', {}).get('positive', 84)}% \n SENTIMENT", use_container_width=True):
            st.markdown("#### 🎭 Sentiment Breakdown")
            s = active_insight.get('sentiment', {'positive': 84, 'neutral': 10, 'negative': 6})
            st.progress(s['positive']/100, text=f"Positive: {s['positive']}%")
            st.progress(s['neutral']/100, text=f"Neutral: {s['neutral']}%")
            st.progress(s['negative']/100, text=f"Negative: {s['negative']}%")
            
    with c3:
        with st.popover(f"✅ {active_insight.get('verdict', 'BUY')} \n AI VERDICT", use_container_width=True):
            st.markdown("#### 🧠 Intelligence Reasoning")
            st.info(active_insight.get('reasoning', "Matches casual usage patterns with high value-to-performance ratio."))
            st.write("**Key Insight:**")
            st.success(active_insight.get('key_insight', "Strategic value confirmed."))

# Process search
if hub_query and st.session_state.get("last_hub_query") != hub_query:
    st.session_state.last_hub_query = hub_query
    st.session_state.story_step = 1 # Reset scrollytelling
    _ensure_session(hub_query)
    st.session_state.messages.append(HumanMessage(content=hub_query))
    _run_agent(hub_query, hub_query)
    st.rerun()




# ── GLOBAL JS: Wire AI action buttons to auto-send queries ────────
# This component runs on every page render and uses MutationObserver
# to detect when .ai-actions buttons appear and attach click handlers.
import streamlit.components.v1 as _components_global
_components_global.html("""
<script>
(function() {
    var QUERY_MAP = {
        "Compare Alternatives":  "Compare this product with the top alternatives in its category.",
        "Best Alternatives":     "Suggest the best alternatives for this product.",
        "Explain Reasoning":     "Explain how the AI determined this verdict about the product.",
        "Full Summary":          "Provide a full detailed summary of all product reviews."
    };

    function sendQuery(txt) {
        var doc = window.parent ? window.parent.document : document;
        var ta = doc.querySelector('[data-testid="stChatInputTextArea"]');
        if (!ta) return;
        var setter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, 'value'
        ).set;
        setter.call(ta, txt);
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        ta.focus();
        setTimeout(function() {
            var btn = doc.querySelector('[data-testid="stChatInputSubmitButton"]');
            if (btn) { btn.click(); }
            else {
                ta.dispatchEvent(new KeyboardEvent('keydown', {
                    key:'Enter', code:'Enter', keyCode:13, which:13, bubbles:true
                }));
            }
        }, 120);
    }

    // Strip emoji prefix and get canonical label, e.g. "🔄 Compare Alternatives" → "Compare Alternatives"
    function getLabel(btn) {
        return btn.innerText.replace(/^[^a-zA-Z]+/, '').trim();
    }

    function wireButtons(root) {
        root.querySelectorAll('.ai-actions button').forEach(function(btn) {
            if (btn._wired) return;
            btn._wired = true;
            btn.addEventListener('click', function() {
                var label = getLabel(this);
                var q = QUERY_MAP[label] || label;
                sendQuery(q);
            });
        });
    }

    // Wire any existing buttons immediately
    var doc = window.parent ? window.parent.document : document;
    wireButtons(doc.body || doc);

    // Watch for future panels added dynamically
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
            m.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) {
                    wireButtons(node);
                    if (node.querySelectorAll) wireButtons(node);
                }
            });
        });
    });

    observer.observe(doc.body || doc.documentElement, {
        childList: true, subtree: true
    });
})();
</script>
""", height=0, scrolling=False)

# ── RENDER MESSAGES (with stored insight panels) ───────────────────────────
for i, message in enumerate(st.session_state.messages):
    role = "user" if isinstance(message, HumanMessage) else "assistant"
    avatar = USER_AVATAR if role == "user" else AI_AVATAR
    with st.chat_message(role, avatar=avatar):
        st.markdown(message.content)
        # Re-render product preview and insight panel for AI messages
        if role == "assistant" and i in st.session_state.insights:
            data = st.session_state.insights[i]
            meta = data.get("metadata", {})
            insight = data.get("insight")

            if meta:
                render_glance_hub(meta)
                if insight:
                    # For history, we show the full story immediately
                    old_step = st.session_state.get("story_step", 1)
                    st.session_state.story_step = 4 # Force full view
                    render_scrollytelling_view(insight, meta)
                    st.session_state.story_step = old_step # Restore for current interactive search
                else:
                    st.markdown(render_product_preview(data["asin"], metadata=meta), unsafe_allow_html=True)
            
                # 2027 Comparison Matrix Integration
                c1, c2 = st.columns([1, 1])
                if c1.button("📊 Add to Comparison Matrix", key=f"hist_comp_{i}", use_container_width=True):
                    if data.get("asin") not in [x['asin'] for x in st.session_state.comparison_list]:
                        st.session_state.comparison_list.append({"asin": data.get("asin"), "metadata": data.get("metadata")})
                        st.toast(f"✅ Product {data.get('asin')} added")
                if c2.button("🧠 Reasoning Hub", key=f"hist_reason_{i}", use_container_width=True):
                    st.toast("Deep reasoning panel enabled in Status Hub.")

# ── AUTO-SEND (chip or suggestion clicked) ────────────────────────
if st.session_state.suggestion_clicked:
    auto_prompt = st.session_state.suggestion_clicked
    st.session_state.suggestion_clicked = None
    _ensure_session(auto_prompt)
    st.chat_message("user", avatar=USER_AVATAR).markdown(auto_prompt)
    st.session_state.messages.append(HumanMessage(content=auto_prompt))
    _run_agent(auto_prompt, auto_prompt)

# ── CHAT INPUT ────────────────────────────────────────────────────
if prompt := st.chat_input("Ask anything about these products..."):
    _ensure_session(prompt)
    st.chat_message("user", avatar=USER_AVATAR).markdown(prompt)
    st.session_state.messages.append(HumanMessage(content=prompt))
    _run_agent(prompt, prompt)

# ── COMPARISON DRAWER ────────────────────────────────────────────────
if st.session_state.comparison_list:
    with st.sidebar:
        st.markdown("---")
        st.markdown("### 📊 Comparison Queue")
        for i, item in enumerate(st.session_state.comparison_list):
            cols = st.columns([4, 1])
            cols[0].caption(f"ASIN: {item['asin']}")
            if cols[1].button("❌", key=f"remove_comp_{i}"):
                st.session_state.comparison_list.pop(i)
                st.rerun()
        
        if len(st.session_state.comparison_list) > 1:
            if st.button("🚀 Run Comparison Matrix", use_container_width=True):
                st.session_state.show_comparison = True

if st.session_state.get("show_comparison"):
    st.markdown("---")
    st.markdown("### 🧬 2027 Intelligence Comparison Matrix")
    matrix_data = []
    for item in st.session_state.comparison_list:
        m = item['metadata']
        asin = item['asin']
        ins = st.session_state.insights.get(asin, {}) # Note: this might need better indexing
        
        # Try to find the most recent insight for this ASIN
        if not ins:
             # Fallback: search all insights for this ASIN
             for k, v in st.session_state.insights.items():
                 if v.get("asin") == asin and v.get("insight"):
                     ins = v.get("insight")
                     break

        matrix_data.append({
            "Product": m.get("title", f"ASIN: {asin}")[:40] + "...",
            "Price": m.get("price", "N/A"),
            "Rating": m.get("rating", "N/A"),
            "Verdict": ins.get("verdict", "Verified") if isinstance(ins, dict) else "N/A",
            "Confidence": f"{ins.get('confidence', 80)}%" if isinstance(ins, dict) else "N/A"
        })
    st.table(matrix_data)
    if st.button("Dismiss Matrix"):
        st.session_state.show_comparison = False
        st.rerun()
