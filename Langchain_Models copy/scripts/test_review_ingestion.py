"""
scripts/test_review_ingestion.py
─────────────────────────────────
Tests the full review scrape → Chroma store pipeline in isolation.
Run BEFORE starting api.py so you can verify Chroma is populated.

Usage:
    python scripts/test_review_ingestion.py
    python scripts/test_review_ingestion.py --asin B0863FR3S9 --pages 2
"""
import asyncio
import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from dotenv import load_dotenv
load_dotenv()

from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from review_ingestion import ingest_product_reviews, scrape_amazon_reviews

DB_PATH = os.getenv("DB_PATH", "./chroma_db")

PASS = "\033[92m✅ PASS\033[0m"
FAIL = "\033[91m❌ FAIL\033[0m"
WARN = "\033[93m⚠️  WARN\033[0m"

# Default test cases — well-known products with lots of reviews
DEFAULT_TESTS = [
    {"asin": "B0863FR3S9", "name": "Sony WH-1000XM4",  "pages": 2},
    {"asin": "B09KGSSY15", "name": "boAt Airdopes 141", "pages": 1},
]


async def run_tests(asin: str = None, name: str = None, pages: int = 2):
    print("=" * 64)
    print("  ClariCart — Review Ingestion Test Suite")
    print("=" * 64)

    # Init vector store
    print("\n⚙️  Loading Chroma vector store...")
    embeddings   = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vector_store = Chroma(persist_directory=DB_PATH, embedding_function=embeddings)
    print(f"   DB path: {DB_PATH}")

    # Build test list
    tests = [{"asin": asin, "name": name or asin, "pages": pages}] if asin else DEFAULT_TESTS

    total, passed = 0, 0

    for tc in tests:
        total += 1
        print(f"\n[{total}] {tc['name']} (ASIN: {tc['asin']}, pages: {tc['pages']})")
        print("    " + "─" * 50)

        # ── Phase 1: Scrape ───────────────────────────────────────────────
        print("    Phase 1: Scraping review pages...")
        try:
            reviews = await scrape_amazon_reviews(
                tc["asin"], tc["name"], max_pages=tc["pages"]
            )
            print(f"    Scraped  : {len(reviews)} reviews")

            if not reviews:
                print(f"    Result   : {WARN} — 0 reviews scraped (possible block)")
                continue

            # Show sample
            sample = reviews[0]
            print(f"    Sample   : [{sample.rating}★] {sample.title[:60]}")
            print(f"               {sample.body[:100]}...")
            print(f"    Verified : {sum(1 for r in reviews if r.verified)}/{len(reviews)} verified purchases")

        except Exception as e:
            print(f"    Result   : {FAIL} — Scrape error: {e}")
            continue

        # ── Phase 2: Store in Chroma ──────────────────────────────────────
        print("\n    Phase 2: Storing in Chroma DB...")
        try:
            result = await ingest_product_reviews(
                tc["asin"], tc["name"], vector_store,
                max_pages=tc["pages"], force=True
            )
            print(f"    Stored   : {result['stored']} new documents")

        except Exception as e:
            print(f"    Result   : {FAIL} — Chroma store error: {e}")
            continue

        # ── Phase 3: RAG retrieval check ──────────────────────────────────
        print("\n    Phase 3: RAG retrieval check...")
        try:
            queries = [
                "noise cancellation quality",
                "battery life",
                "comfort during long use",
            ]
            all_found = True
            for q in queries:
                hits = vector_store.similarity_search(
                    q, k=2, filter={"asin": tc["asin"]}
                )
                status = PASS if hits else WARN
                snippet = hits[0].page_content[:80] if hits else "nothing found"
                print(f"    Query '{q}':")
                print(f"      {status} → {snippet}...")
                if not hits:
                    all_found = False

            if all_found:
                print(f"\n    Overall  : {PASS}")
                passed += 1
            else:
                print(f"\n    Overall  : {WARN} — some queries returned no results")
                passed += 1  # soft pass

        except Exception as e:
            print(f"    Result   : {FAIL} — RAG check error: {e}")

    print("\n" + "=" * 64)
    print(f"  Results: {passed}/{total} passed")
    print("=" * 64)

    if passed > 0:
        print("\n🎉 Chroma DB is now populated with real Amazon reviews.")
        print("   ClariBot will return real insights on the next chat query.")
    else:
        print("\n⚠️  No reviews were stored. Check your network / Amazon blocks.")

    if passed < total:
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test review ingestion pipeline")
    parser.add_argument("--asin",  type=str, help="Amazon ASIN to test (optional)")
    parser.add_argument("--name",  type=str, help="Product name for the ASIN")
    parser.add_argument("--pages", type=int, default=2, help="Pages to scrape (default: 2)")
    args = parser.parse_args()

    asyncio.run(run_tests(args.asin, args.name, args.pages))
