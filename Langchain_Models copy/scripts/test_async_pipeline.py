
import asyncio
import os
import sys
from dotenv import load_dotenv

# Add parent directory to path to import api
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api import scrape_with_fallbacks, discover_products, fetch_product_details

async def test_scraper():
    print("--- Testing Scraper ---")
    url = "https://www.amazon.in/dp/B09V76DQ9M" # boAt BassHeads 100
    try:
        result = await scrape_with_fallbacks(url)
        print(f"Scraper Result: {result}")
    except Exception as e:
        print(f"Scraper Error: {e}")

async def test_tools():
    print("\n--- Testing Tools ---")
    try:
        # Test discover_products
        query = "Analyze boAt Rockerz 450"
        disc_result = await discover_products(query)
        print(f"Discover Result: {disc_result}")

        # Test fetch_product_details
        url = "https://www.amazon.in/dp/B09V76DQ9M"
        details_result = await fetch_product_details(url)
        print(f"Fetch Details Result: {details_result[:200]}...")
    except Exception as e:
        print(f"Tools Error: {e}")

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(test_scraper())
    asyncio.run(test_tools())
