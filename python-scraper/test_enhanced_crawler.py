#!/usr/bin/env python3
"""
Test script for the enhanced permit office crawler
Tests the new data extraction capabilities
"""
import asyncio
import logging
import json
from datetime import datetime
from enhanced_scraper import EnhancedPermitOfficeScraper
from models import ScrapingTarget

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_enhanced_crawler():
    """Test the enhanced crawler with sample permit office websites"""
    
    # Test targets - real permit office websites
    test_targets = [
        ScrapingTarget(
            name="Atlanta Building Department",
            url="https://www.atlantaga.gov/government/departments/city-planning/bureau-of-buildings",
            type="city",
            state="GA",
            city="Atlanta",
            county="Fulton"
        ),
        ScrapingTarget(
            name="Fulton County Building Department",
            url="https://www.fultoncountyga.gov/services/building-permits",
            type="county",
            state="GA",
            county="Fulton"
        ),
        ScrapingTarget(
            name="Gwinnett County Planning",
            url="https://www.gwinnettcounty.com/web/gwinnett/departments/planninganddevelopment",
            type="county",
            state="GA",
            county="Gwinnett"
        )
    ]
    
    results = []
    
    async with EnhancedPermitOfficeScraper() as scraper:
        for target in test_targets:
            logger.info(f"Testing enhanced crawler on {target.name}")
            
            try:
                result = await scraper.scrape_target(target)
                results.append(result)
                
                logger.info(f"Scraping result for {target.name}:")
                logger.info(f"  Success: {result.success}")
                logger.info(f"  Offices found: {result.offices_found}")
                logger.info(f"  Offices processed: {result.offices_processed}")
                logger.info(f"  Duration: {result.duration_seconds:.2f} seconds")
                
                if result.errors:
                    logger.warning(f"  Errors: {result.errors}")
                
            except Exception as e:
                logger.error(f"Failed to scrape {target.name}: {e}")
                results.append({
                    'target': target.name,
                    'success': False,
                    'error': str(e)
                })
    
    # Save results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"enhanced_crawler_test_results_{timestamp}.json"
    
    # Convert results to serializable format
    serializable_results = []
    for result in results:
        if hasattr(result, 'dict'):
            serializable_results.append(result.dict())
        else:
            serializable_results.append(result)
    
    with open(results_file, 'w') as f:
        json.dump(serializable_results, f, indent=2, default=str)
    
    logger.info(f"Test results saved to {results_file}")
    
    # Print summary
    total_targets = len(test_targets)
    successful_targets = sum(1 for r in results if hasattr(r, 'success') and r.success)
    total_offices = sum(r.offices_processed for r in results if hasattr(r, 'offices_processed'))
    
    logger.info(f"\n=== ENHANCED CRAWLER TEST SUMMARY ===")
    logger.info(f"Total targets tested: {total_targets}")
    logger.info(f"Successful scrapes: {successful_targets}")
    logger.info(f"Total offices processed: {total_offices}")
    logger.info(f"Success rate: {(successful_targets/total_targets)*100:.1f}%")

async def test_data_extractor():
    """Test the enhanced data extractor with sample HTML"""
    from enhanced_data_extractor import EnhancedDataExtractor
    from bs4 import BeautifulSoup
    
    # Sample HTML with permit information
    sample_html = """
    <html>
    <body>
        <div class="fee-schedule">
            <h2>Permit Fees</h2>
            <table>
                <tr><td>Building Permit</td><td>$150.00</td></tr>
                <tr><td>Electrical Permit</td><td>$75.00</td></tr>
                <tr><td>Plumbing Permit</td><td>$50.00</td></tr>
            </table>
        </div>
        
        <div class="processing-times">
            <h2>Processing Times</h2>
            <p>Building permits: 5-10 business days</p>
            <p>Electrical permits: 3-5 business days</p>
            <p>Plumbing permits: 2-3 business days</p>
        </div>
        
        <div class="instructions">
            <h2>How to Apply</h2>
            <ol>
                <li>Complete the application form</li>
                <li>Submit required documents</li>
                <li>Pay applicable fees</li>
                <li>Wait for approval</li>
            </ol>
        </div>
        
        <div class="downloads">
            <h2>Downloadable Forms</h2>
            <a href="/forms/building-permit-application.pdf">Building Permit Application</a>
            <a href="/forms/electrical-permit-application.pdf">Electrical Permit Application</a>
            <a href="/forms/plumbing-permit-application.pdf">Plumbing Permit Application</a>
        </div>
    </body>
    </html>
    """
    
    soup = BeautifulSoup(sample_html, 'html.parser')
    extractor = EnhancedDataExtractor()
    
    logger.info("Testing enhanced data extractor...")
    
    enhanced_data = extractor.extract_enhanced_data(soup, "https://example.com")
    
    logger.info("Extracted data:")
    logger.info(f"Permit fees: {json.dumps(enhanced_data.get('permit_fees', {}), indent=2)}")
    logger.info(f"Processing times: {json.dumps(enhanced_data.get('processing_times', {}), indent=2)}")
    logger.info(f"Instructions: {json.dumps(enhanced_data.get('instructions', {}), indent=2)}")
    logger.info(f"Downloadable applications: {json.dumps(enhanced_data.get('downloadable_applications', {}), indent=2)}")

if __name__ == "__main__":
    print("Enhanced Permit Office Crawler Test")
    print("===================================")
    
    # Test the data extractor first
    asyncio.run(test_data_extractor())
    
    print("\n" + "="*50 + "\n")
    
    # Test the full crawler
    asyncio.run(test_enhanced_crawler())
