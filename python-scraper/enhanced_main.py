#!/usr/bin/env python3
"""
Enhanced main script for permit office scraper with sophisticated data extraction
"""
import asyncio
import logging
from typing import List
from datetime import datetime

from enhanced_scraper import EnhancedPermitOfficeScraper
from models import ScrapingTarget
from config import config

# Set up logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/enhanced_scraper.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

async def main():
    """Enhanced main function with sophisticated data extraction"""
    logger.info("Starting enhanced permit office scraper")
    
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
    
    # Initialize enhanced scraper
    async with EnhancedPermitOfficeScraper() as scraper:
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
                else:
                    failed_targets += 1
                    logger.warning(f"❌ {result.target.name}: Failed - {result.errors}")
                
            except Exception as e:
                logger.error(f"Error scraping {target.name}: {e}")
                failed_targets += 1
        
        # Print summary
        logger.info("Enhanced scraping completed:")
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
        
        logger.info("Enhanced scraper completed successfully!")

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
            'offices': []  # We'll need to add offices to the result model
        }
        results_data.append(result_dict)
    
    # Save to file
    filename = f"logs/enhanced_scraper_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(filename, 'w') as f:
        json.dump(results_data, f, indent=2)
    
    logger.info(f"Results saved to {filename}")

if __name__ == "__main__":
    asyncio.run(main())
