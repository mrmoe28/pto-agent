"""
Scheduler service for running the scraper automatically
"""
import asyncio
import schedule
import time
import logging
from datetime import datetime
from typing import List
import signal
import sys

from scraper import PermitOfficeScraper
from database_service import DatabaseService
from models import ScrapingTarget
from config import config

logger = logging.getLogger(__name__)

class ScrapingScheduler:
    """Scheduler for running scraping tasks"""
    
    def __init__(self):
        self.running = True
        self.setup_signal_handlers()
    
    def setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        def signal_handler(signum, frame):
            logger.info("Received shutdown signal, stopping scheduler...")
            self.running = False
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    async def run_scraping_job(self):
        """Run the main scraping job"""
        logger.info("Starting scheduled scraping job")
        start_time = datetime.now()
        
        try:
            # Create scraping targets
            targets = self._create_scraping_targets()
            
            # Run scraper
            async with PermitOfficeScraper() as scraper:
                results = await scraper.scrape_all_targets(targets)
            
            # Save results to database
            async with DatabaseService() as db:
                total_offices = 0
                for result in results:
                    if result.success and hasattr(result, 'offices'):
                        batch_results = await db.save_offices_batch(result.offices)
                        total_offices += batch_results['saved'] + batch_results['updated']
                        logger.info(f"Saved {batch_results['saved']} new offices, "
                                  f"updated {batch_results['updated']} offices")
            
            # Log completion
            duration = (datetime.now() - start_time).total_seconds()
            logger.info(f"Scraping job completed in {duration:.2f} seconds")
            logger.info(f"Total offices processed: {total_offices}")
            
        except Exception as e:
            logger.error(f"Scraping job failed: {e}")
    
    def _create_scraping_targets(self) -> List[ScrapingTarget]:
        """Create scraping targets from configuration"""
        targets = []
        
        for target_config in config.SCRAPING_TARGETS:
            if target_config.get('enabled', True):
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
        
        return targets
    
    def setup_schedule(self):
        """Setup the scraping schedule"""
        # Daily scraping at 2 AM
        schedule.every().day.at("02:00").do(
            lambda: asyncio.create_task(self.run_scraping_job())
        )
        
        # Weekly full scrape on Sundays at 3 AM
        schedule.every().sunday.at("03:00").do(
            lambda: asyncio.create_task(self.run_full_scrape())
        )
        
        # Cleanup old data every Monday at 4 AM
        schedule.every().monday.at("04:00").do(
            lambda: asyncio.create_task(self.run_cleanup())
        )
        
        logger.info("Scheduler configured:")
        logger.info("  - Daily scraping: 2:00 AM")
        logger.info("  - Weekly full scrape: Sunday 3:00 AM")
        logger.info("  - Data cleanup: Monday 4:00 AM")
    
    async def run_full_scrape(self):
        """Run a full scrape of all targets"""
        logger.info("Starting full scraping job")
        
        # This could include additional targets or different scraping strategies
        await self.run_scraping_job()
    
    async def run_cleanup(self):
        """Run data cleanup tasks"""
        logger.info("Starting cleanup job")
        
        try:
            async with DatabaseService() as db:
                # Cleanup old inactive offices
                await db.cleanup_old_data(days_old=30)
                
                # Get and log statistics
                stats = await db.get_scraping_stats()
                logger.info(f"Database stats: {stats}")
                
        except Exception as e:
            logger.error(f"Cleanup job failed: {e}")
    
    def run(self):
        """Run the scheduler"""
        logger.info("Starting scraping scheduler")
        self.setup_schedule()
        
        while self.running:
            try:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
            except KeyboardInterrupt:
                logger.info("Scheduler stopped by user")
                break
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                time.sleep(60)  # Wait before retrying

def main():
    """Main function to run the scheduler"""
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, config.LOG_LEVEL),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('scheduler.log'),
            logging.StreamHandler()
        ]
    )
    
    # Create and run scheduler
    scheduler = ScrapingScheduler()
    scheduler.run()

if __name__ == "__main__":
    main()
