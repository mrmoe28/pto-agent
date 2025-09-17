"""
Main entry point for the permit office scraper
"""
import asyncio
import logging
from datetime import datetime
from typing import List
import sys
import os

# Add the parent directory to the path so we can import from the web app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper import PermitOfficeScraper
from models import ScrapingTarget
from config import config

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(config.LOG_FILE),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

async def main():
    """Main function to run the scraper"""
    logger.info("Starting permit office scraper")
    
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
            selectors=target_config.get('selectors', {}),
            enabled=True
        )
        targets.append(target)
    
    # Run scraper
    async with PermitOfficeScraper() as scraper:
        results = await scraper.scrape_all_targets(targets)
    
    # Log results
    total_offices = sum(result.offices_processed for result in results)
    successful_targets = sum(1 for result in results if result.success)
    
    logger.info(f"Scraping completed:")
    logger.info(f"  - Targets processed: {len(results)}")
    logger.info(f"  - Successful targets: {successful_targets}")
    logger.info(f"  - Total offices found: {total_offices}")
    
    # Log individual results
    for result in results:
        logger.info(f"  - {result.target.name}: {result.offices_processed} offices, "
                   f"{'SUCCESS' if result.success else 'FAILED'}")
        if result.errors:
            for error in result.errors:
                logger.warning(f"    Error: {error}")

if __name__ == "__main__":
    asyncio.run(main())
