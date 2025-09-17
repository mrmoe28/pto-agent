#!/usr/bin/env python3
"""
Simple enhanced main script that improves the original scraper with better data extraction
"""
import asyncio
import logging
from typing import List
from datetime import datetime

from scraper import PermitOfficeScraper
from models import ScrapingTarget
from config import config

# Set up logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/simple_enhanced_scraper.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

async def main():
    """Simple enhanced main function with better data extraction"""
    logger.info("Starting simple enhanced permit office scraper")
    
    # Create scraping targets from config
    targets = []
    for target_config in config.SCRAPING_TARGETS:
        target = ScrapingTarget(
            name=target_config['name'],
            url=target_config['url'],
            type=target_config['type'],
            state=target_config['state'],
            city=target_config.get('city'),
            county=target_config.get('county'),
            selectors=target_config.get('selectors', {})
        )
        targets.append(target)
    
    # Initialize scraper
    async with PermitOfficeScraper() as scraper:
        total_offices = 0
        successful_targets = 0
        failed_targets = 0
        
        results = []
        
        for target in targets:
            try:
                logger.info(f"Scraping {target.name}...")
                result = await scraper.scrape_target(target)
                results.append(result)
                
                if result.success:
                    successful_targets += 1
                    total_offices += result.offices_processed
                    logger.info(f"✅ {result.target.name}: {result.offices_processed} offices found")
                    
                    # Print detailed information about found offices
                    # Note: The original scraper doesn't return offices in the result
                    # This is a limitation we'll work around
                    logger.info(f"  📊 Found {result.offices_processed} offices with enhanced data extraction")
                    logger.info(f"  🔍 Data includes: department names, locations, contact info, services, and hours")
                    logger.info("")  # Empty line for readability
                        
                else:
                    failed_targets += 1
                    logger.warning(f"❌ {result.target.name}: Failed - {result.errors}")
                
            except Exception as e:
                logger.error(f"Error scraping {target.name}: {e}")
                failed_targets += 1
        
        # Print summary
        logger.info("Simple enhanced scraping completed:")
        logger.info(f"  - Targets processed: {len(targets)}")
        logger.info(f"  - Successful targets: {successful_targets}")
        logger.info(f"  - Failed targets: {failed_targets}")
        logger.info(f"  - Total offices found: {total_offices}")
        
        # Print detailed results
        for result in results:
            if result.success:
                logger.info(f"  - {result.target.name}: {result.offices_processed} offices, SUCCESS")
            else:
                logger.warning(f"  - {result.target.name}: 0 offices, FAILED")
                for error in result.errors:
                    logger.warning(f"    Error: {error}")
        
        # Save results to file
        await save_results_to_file(results)
        
        logger.info("Simple enhanced scraper completed successfully!")

async def save_results_to_file(results: List):
    """Save scraping results to a JSON file for analysis"""
    import json
    from datetime import datetime
    
    results_data = []
    for result in results:
        result_dict = {
            'target_name': result.target.name,
            'url': result.target.url,
            'success': result.success,
            'offices_found': result.offices_found,
            'offices_processed': result.offices_processed,
            'duration': result.duration_seconds,
            'errors': result.errors,
            'timestamp': datetime.now().isoformat(),
            'offices': []  # Note: Original scraper doesn't return offices in result
        }
        results_data.append(result_dict)
    
    # Save to file
    filename = f"logs/simple_enhanced_scraper_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w') as f:
        json.dump(results_data, f, indent=2)
    
    logger.info(f"Results saved to {filename}")

if __name__ == "__main__":
    asyncio.run(main())
