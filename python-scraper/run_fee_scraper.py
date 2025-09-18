#!/usr/bin/env python3
"""
Run the specialized government fee scraper to collect detailed pricing data
"""
import asyncio
import logging
import sys
import os
from datetime import datetime
from typing import List, Dict, Any

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from government_fee_scraper import GovernmentFeeScraper, FeeData
from database_service import DatabaseService
from models import PermitOffice

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('government_fee_scraper.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class FeeScraperRunner:
    """Runner for the government fee scraper"""
    
    def __init__(self):
        self.scraper = GovernmentFeeScraper()
        self.db_service = DatabaseService()
    
    async def run_fee_scraping(self):
        """Run fee scraping for all permit offices"""
        logger.info("Starting government fee scraping...")
        
        try:
            # Get all permit offices from database
            offices = await self.db_service.get_all_permit_offices()
            logger.info(f"Found {len(offices)} permit offices to process")
            
            # Process each office
            for i, office in enumerate(offices, 1):
                logger.info(f"Processing office {i}/{len(offices)}: {office.department_name}")
                
                try:
                    # Get the base URL for the office
                    base_url = office.website or f"https://{office.city.lower().replace(' ', '')}.gov"
                    
                    # Scrape fee data
                    fees = await self.scraper.scrape_government_fees(base_url, office.department_name)
                    
                    if fees:
                        # Update office with fee data
                        await self._update_office_with_fees(office, fees)
                        logger.info(f"Successfully processed {office.department_name} - found {len(fees)} fees")
                    else:
                        logger.warning(f"No fees found for {office.department_name}")
                    
                except Exception as e:
                    logger.error(f"Error processing {office.department_name}: {e}")
                    continue
                
                # Add delay between requests to be respectful
                await asyncio.sleep(3)
            
            logger.info("Fee scraping completed successfully!")
            
        except Exception as e:
            logger.error(f"Error in fee scraping: {e}")
            raise
    
    async def _update_office_with_fees(self, office: PermitOffice, fees: List[FeeData]):
        """Update office record with fee data"""
        try:
            # Convert fee data to the format expected by the database
            permit_fees = {}
            
            for fee in fees:
                if fee.permit_type not in permit_fees:
                    permit_fees[fee.permit_type] = {
                        'amount': fee.amount,
                        'description': fee.description,
                        'unit': fee.unit
                    }
                else:
                    # If we already have a fee for this type, keep the one with more context
                    if len(fee.description) > len(permit_fees[fee.permit_type]['description']):
                        permit_fees[fee.permit_type] = {
                            'amount': fee.amount,
                            'description': fee.description,
                            'unit': fee.unit
                        }
            
            # Prepare update data
            update_data = {
                'permitFees': permit_fees,
                'lastVerified': datetime.now(),
                'dataSource': 'government_fee_scraper'
            }
            
            # Update the office in database
            await self.db_service.update_permit_office(office.id, update_data)
            
            logger.info(f"Updated {office.department_name} with {len(permit_fees)} fee types")
            
        except Exception as e:
            logger.error(f"Error updating office {office.department_name}: {e}")
            raise
    
    async def run_specific_office(self, office_id: str):
        """Run fee scraping for a specific office"""
        logger.info(f"Starting fee scraping for office ID: {office_id}")
        
        try:
            # Get specific office
            office = await self.db_service.get_permit_office_by_id(office_id)
            if not office:
                logger.error(f"Office with ID {office_id} not found")
                return
            
            logger.info(f"Processing office: {office.department_name}")
            
            # Get the base URL for the office
            base_url = office.website or f"https://{office.city.lower().replace(' ', '')}.gov"
            
            # Scrape fee data
            fees = await self.scraper.scrape_government_fees(base_url, office.department_name)
            
            if fees:
                # Update office with fee data
                await self._update_office_with_fees(office, fees)
                logger.info(f"Successfully processed {office.department_name} - found {len(fees)} fees")
            else:
                logger.warning(f"No fees found for {office.department_name}")
            
        except Exception as e:
            logger.error(f"Error processing office {office_id}: {e}")
            raise

async def main():
    """Main function"""
    runner = FeeScraperRunner()
    
    # Check if specific office ID provided
    if len(sys.argv) > 1:
        office_id = sys.argv[1]
        await runner.run_specific_office(office_id)
    else:
        await runner.run_fee_scraping()

if __name__ == "__main__":
    asyncio.run(main())
