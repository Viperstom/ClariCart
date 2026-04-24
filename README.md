# ClariCart

**ClariCart** is an advanced, AI-powered product discovery and review analysis system. It leverages multiple scraping strategies, robust language models, and web intelligence to gather, analyze, and present product metadata and customer sentiments (primarily from platforms like Amazon).

## Core Features

- **ClariBot (AI Assistant)**: A highly interactive, intelligent sidekick within the dashboard. Powered by LangChain, Groq, and Llama-3.3-70b-versatile, providing conversational interactions and real-time product data extraction.
- **Multi-Strategy Scraping Engine**:
  - Automatically fetches product details using n8n workflows.
  - Dynamically scrapes live product pages (e.g., Amazon) via Playwright using Chrome automation.
  - Parses JSON-LD structured data and uses Regex + CSS selector fallbacks.
  - Multi-engine search fallbacks (DuckDuckGo, Bing) for fetching rating and review counts.
- **RAG & Vector Retrieval on Reviews**: Uses `langchain-chroma`, HuggingFace embeddings (`all-MiniLM-L6-v2`), and Vector Stores to perform retrieval-augmented generation (RAG) on scraped customer reviews. Automatically builds pros & cons tables based on actual reviews.
- **Generative UI & Chat Integration**: The LangChain agent sends context-aware generative UI triggers to the dynamically rendered Next.js React frontend to actively display products.

## Project Structure

- `Langchain_Models copy/` - Contains the Python backend framework and database setup.
  - `api.py`: FastAPI server handling web endpoints, tool definitions (`search_product_reviews`, `discover_products`, `fetch_product_details`), agent-based chat APIs, and the LangGraph orchestrator.
  - `review_ingestion.py`: Backend script for saving product reviews natively into ChromaDB for vector retrieval.
  - `requirements.txt`: Python dependencies including FastAPI, LangChain, Playwright, and Uvicorn.
  - `data/` and `chroma_db/`: Vector database and local storage catalogs.
- `Langchain_Models copy/frontend/` - Contains the Next.js React frontend Web App for the interactive user dashboard.

## Tech Stack

- **Backend**: Python 3, FastAPI, LangChain, LangGraph, Playwright, BeautifulSoup4.
- **AI & LLM**: Groq (Llama-3.3-70b-versatile), HuggingFace Embeddings, Chroma Vector DB.
- **Frontend**: Next.js, React, TailwindCSS.

## Installation & Setup

### Backend
1. Navigate to the backend component:
   ```bash
   cd "Langchain_Models copy"
   ```
2. Create and configure your `.env` file with API keys (e.g., Groq, HuggingFace tokens).
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the FastAPI development server:
   ```bash
   uvicorn api:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend
1. Keep the python server running and open a new terminal.
2. Navigate to the frontend UI:
   ```bash
   cd "Langchain_Models copy/frontend"
   ```
3. Install Node.js dependencies:
   ```bash
   npm install
   ```
4. Start the frontend application:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` to interact with ClariCart.

## License

**Proprietary / All Rights Reserved.**

This project and its entire source code are completely proprietary. See the `LICENSE` file for full details. Unauthorized copying, distribution, or reproduction of any part of this repository is strictly prohibited.
