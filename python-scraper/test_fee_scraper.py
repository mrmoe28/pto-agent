#!/usr/bin/env python3
"""
Test script for the government fee scraper
"""
import asyncio
import logging
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from government_fee_scraper import GovernmentFeeScraper

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

async def test_fee_scraper():
    """Test the fee scraper with known government websites"""
    scraper = GovernmentFeeScraper()
    
    # Test URLs - these are known to have fee information
    test_cases = [
        {
            "name": "Fulton County Building & Development",
            "url": "https://www.fultoncountyga.gov/services/building-and-development"
        },
        {
            "name": "DeKalb County Planning & Sustainability", 
            "url": "https://www.dekalbcountyga.gov/planning-and-sustainability"
        },
        {
            "name": "Cobb County Community Development",
            "url": "https://www.cobbcounty.org/community-development"
        }
    ]
    
    print("🧪 Testing Government Fee Scraper")
    print("=" * 50)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{i}. Testing: {test_case['name']}")
        print(f"   URL: {test_case['url']}")
        
        try:
            fees = await scraper.scrape_government_fees(test_case['url'], test_case['name'])
            
            if fees:
                print(f"   ✅ Found {len(fees)} fees:")
                for j, fee in enumerate(fees[:5], 1):  # Show first 5 fees
                    print(f"      {j}. {fee.permit_type}: ${fee.amount}")
                    print(f"         Description: {fee.description[:80]}...")
                    print(f"         Source: {fee.source_url}")
            else:
                print("   ⚠️  No fees found")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        print("-" * 50)
    
    print("\n🏁 Test completed!")

if __name__ == "__main__":
    asyncio.run(test_fee_scraper())
