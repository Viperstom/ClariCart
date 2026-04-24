"""
review_ingestion.py
────────────────────────────────────────────────────────────────────────────
Live Amazon review scraper with automatic Chroma DB ingestion.
Plugs directly into api.py — import and call ingest_product_reviews().

Flow:
  discover_products() identifies ASIN
      └─▶ ingest_product_reviews(asin, product_name)   ← NEW
              └─▶ scrape_amazon_reviews()               scrapes review pages
              └─▶ store_reviews_in_chroma()             embeds + persists
      └─▶ search_product_reviews()                      now finds real data
"""

import asyncio
import random
import re
from dataclasses import dataclass

from langchain_core.documents import Document
from playwright.async_api import async_playwright


# ── Data model ────────────────────────────────────────────────────────────────
@dataclass
class Review:
    asin:             str
    product_name:     str
    title:            str
    body:             str
    rating:           float
    verified:         bool
    helpful_votes:    int
    page_number:      int


# ── Amazon review scraper ─────────────────────────────────────────────────────
async def scrape_amazon_reviews(
    asin:        str,
    product_name: str = "",
    max_pages:   int  = 3,
    sort_by:     str  = "recent",   # "recent" | "helpful"
) -> list[Review]:
    """
    Scrapes Amazon review pages for a given ASIN using Playwright.
    Returns a list of Review objects ready for Chroma ingestion.

    Args:
        asin:         Amazon ASIN (e.g. "B0863FR3S9")
        product_name: Human-readable name for metadata tagging
        max_pages:    Number of review pages to scrape (1 page ≈ 10 reviews)
        sort_by:      "recent" for latest reviews, "helpful" for top-voted

    Returns:
        List[Review]
    """
    reviews: list[Review] = []
    base_url = (
        f"https://www.amazon.in/product-reviews/{asin}"
        f"?sortBy={sort_by}&reviewerType=all_reviews&pageNumber="
    )

    print(f"📖 Scraping reviews for ASIN {asin} ({product_name}) — {max_pages} page(s)...")

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
        )
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900},
            locale="en-IN",
            timezone_id="Asia/Kolkata",
        )
        await context.add_init_script(
            "Object.defineProperty(navigator, 'webdriver', { get: () => undefined });"
        )

        for page_num in range(1, max_pages + 1):
            if page_num == 1:
                # Try the canonical product page first
                url = f"https://www.amazon.in/dp/{asin}/"
            else:
                url = f"https://www.amazon.in/product-reviews/{asin}/?sortBy={sort_by}&reviewerType=all_reviews&pageNumber={page_num}"
            
            page = await context.new_page()

            try:
                # Human-like delay
                await asyncio.sleep(random.uniform(3.0, 5.0))
                await page.goto(url, wait_until="domcontentloaded", timeout=60000)

                # Selectors for either /product-reviews/ page or /dp/ product page
                review_selector = '[data-hook="review"]'
                try:
                    await page.wait_for_selector(review_selector, timeout=10000)
                except Exception:
                    if "dp/" in url:
                        # Fallback for product page footer
                        review_selector = '.a-section.review, #customer_review-list .review'
                        try:
                            await page.wait_for_selector(review_selector, timeout=5000)
                        except:
                            print(f"  ⚠️  Page {page_num}: No reviews found (even on product page).")
                            await page.close()
                            continue
                    else:
                        print(f"  ⚠️  Page {page_num}: Blocked or different layout.")
                        await page.close()
                        continue

                review_els = await page.query_selector_all(review_selector)
                print(f"  Page {page_num}: found {len(review_els)} reviews")

                for el in review_els:
                    try:
                        # ── Title ─────────────────────────────────────────
                        title_el = await el.query_selector('[data-hook="review-title"] span:not(.a-icon-alt)')
                        title    = (await title_el.inner_text()).strip() if title_el else "No title"

                        # ── Body ──────────────────────────────────────────
                        body_el  = await el.query_selector('[data-hook="review-body"] span')
                        body     = (await body_el.inner_text()).strip() if body_el else ""
                        if not body or len(body) < 10:
                            continue   # skip empty / one-word reviews

                        # ── Star rating ───────────────────────────────────
                        star_el  = await el.query_selector('[data-hook="review-star-rating"] span.a-icon-alt')
                        if not star_el:
                            star_el = await el.query_selector('i[data-hook="review-star-rating"] span')
                        star_txt = (await star_el.inner_text()) if star_el else "0"
                        try:
                            rating = float(star_txt.split()[0])
                        except (ValueError, IndexError):
                            rating = 0.0

                        # ── Verified purchase ─────────────────────────────
                        vp_el    = await el.query_selector('[data-hook="avp-badge"]')
                        verified = vp_el is not None

                        # ── Helpful votes ─────────────────────────────────
                        helpful_el   = await el.query_selector('[data-hook="helpful-vote-statement"]')
                        helpful_txt  = (await helpful_el.inner_text()) if helpful_el else "0"
                        helpful_match = re.search(r'(\d+)', helpful_txt.replace(',', ''))
                        helpful_votes = int(helpful_match.group(1)) if helpful_match else 0

                        reviews.append(Review(
                            asin=asin,
                            product_name=product_name,
                            title=title,
                            body=body,
                            rating=rating,
                            verified=verified,
                            helpful_votes=helpful_votes,
                            page_number=page_num,
                        ))

                    except Exception as e:
                        print(f"    ⚠️  Skipped one review: {e}")
                        continue

            except Exception as e:
                print(f"  ❌ Page {page_num} failed: {e}")

            finally:
                await page.close()

        await browser.close()

    print(f"✅ Scraped {len(reviews)} reviews for {product_name or asin}")
    return reviews


# ── Chroma ingestion ──────────────────────────────────────────────────────────
def store_reviews_in_chroma(reviews: list[Review], vector_store) -> int:
    """
    Converts Review objects into LangChain Documents and upserts into Chroma.
    Returns the number of reviews stored.

    Each document is formatted to maximise RAG retrieval quality:
      - Rich metadata for filtered search (asin, rating, verified, helpful)
      - Structured text body that embeds well semantically
    """
    if not reviews:
        return 0

    # De-duplicate: skip reviews whose body is already in the store
    existing_ids: set[str] = set()
    try:
        existing = vector_store.get(where={"asin": reviews[0].asin})
        existing_ids = set(existing.get("ids", []))
    except Exception:
        pass

    documents: list[Document]  = []
    ids:       list[str]        = []

    for r in reviews:
        # Stable ID based on content hash
        doc_id = f"{r.asin}_{abs(hash(r.body)) % 10_000_000:07d}"
        if doc_id in existing_ids:
            continue

        # Format that embeds and retrieves well
        text = (
            f"Product: {r.product_name}\n"
            f"Rating: {r.rating}/5 {'⭐ Verified Purchase' if r.verified else ''}\n"
            f"Review Title: {r.title}\n"
            f"Review: {r.body}"
        )

        documents.append(Document(
            page_content=text,
            metadata={
                "asin":          r.asin,
                "product_name":  r.product_name,
                "rating":        r.rating,
                "verified":      r.verified,
                "helpful_votes": r.helpful_votes,
                "page_number":   r.page_number,
                "source":        "amazon_live_scrape",
            },
        ))
        ids.append(doc_id)

    if documents:
        vector_store.add_documents(documents, ids=ids)
        print(f"💾 Stored {len(documents)} new reviews in Chroma (skipped {len(reviews) - len(documents)} duplicates)")
    else:
        print("ℹ️  All reviews already in Chroma — nothing new to store")

    return len(documents)


# ── Main entry point called from api.py ──────────────────────────────────────
async def ingest_product_reviews(
    asin:         str,
    product_name: str,
    vector_store,
    max_pages:    int = 3,
    force:        bool = False,
) -> dict:
    """
    Full pipeline: scrape Amazon reviews → deduplicate → store in Chroma.
    Call this from discover_products() right after a new ASIN is identified.

    Args:
        asin:         ASIN to scrape
        product_name: Human-readable product name (used in metadata + embeddings)
        vector_store: Your existing Chroma instance from api.py
        max_pages:    Review pages to scrape (3 ≈ 30 reviews, good for RAG)
        force:        If True, re-scrape even if reviews already exist

    Returns:
        {"scraped": N, "stored": M, "already_existed": bool}
    """
    # ── Guard: skip if already ingested (unless forced) ───────────────────
    if not force:
        try:
            existing = vector_store.similarity_search(
                product_name, k=1, filter={"asin": asin}
            )
            if existing:
                print(f"ℹ️  Reviews for {asin} already in Chroma — skipping ingestion")
                return {"scraped": 0, "stored": 0, "already_existed": True}
        except Exception:
            pass

    reviews = await scrape_amazon_reviews(asin, product_name, max_pages=max_pages)
    stored  = store_reviews_in_chroma(reviews, vector_store)

    return {
        "scraped":        len(reviews),
        "stored":         stored,
        "already_existed": False,
    }
