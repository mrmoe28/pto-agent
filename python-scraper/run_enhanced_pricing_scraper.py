#!/usr/bin/env python3
"""
Run enhanced pricing and instruction scraper to collect detailed data
"""
import asyncio
import logging
import sys
import os
from datetime import datetime
from typing import List

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from enhanced_pricing_instruction_scraper import EnhancedPricingInstructionScraper
from database_service import DatabaseService
from models import PermitOffice

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('enhanced_pricing_scraper.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class EnhancedPricingScraperRunner:
    """Runner for the enhanced pricing and instruction scraper"""
    
    def __init__(self):
        self.scraper = EnhancedPricingInstructionScraper()
        self.db_service = DatabaseService()
    
    async def run_enhanced_scraping(self):
        """Run enhanced scraping for all permit offices"""
        logger.info("Starting enhanced pricing and instruction scraping...")
        
        try:
            # Get all permit offices from database
            offices = await self.db_service.get_all_permit_offices()
            logger.info(f"Found {len(offices)} permit offices to process")
            
            # Process each office
            for i, office in enumerate(offices, 1):
                logger.info(f"Processing office {i}/{len(offices)}: {office.department_name}")
                
                try:
                    # Scrape enhanced data
                    enhanced_data = await self.scraper.scrape_enhanced_data(office)
                    
                    # Update office with enhanced data
                    await self._update_office_with_enhanced_data(office, enhanced_data)
                    
                    logger.info(f"Successfully processed {office.department_name}")
                    
                except Exception as e:
                    logger.error(f"Error processing {office.department_name}: {e}")
                    continue
                
                # Add delay between requests
                await asyncio.sleep(2)
            
            logger.info("Enhanced scraping completed successfully!")
            
        except Exception as e:
            logger.error(f"Error in enhanced scraping: {e}")
            raise
    
    async def _update_office_with_enhanced_data(self, office: PermitOffice, enhanced_data):
        """Update office record with enhanced data"""
        try:
            # Prepare update data
            update_data = {
                'permitFees': enhanced_data.permit_fees,
                'instructions': enhanced_data.detailed_instructions,
                'downloadableApplications': enhanced_data.downloadable_applications,
                'processingTimes': enhanced_data.processing_times,
                'lastVerified': datetime.now(),
                'dataSource': 'enhanced_scraper'
            }
            
            # Add required documents to instructions if not already present
            if enhanced_data.required_documents:
                if 'instructions' not in update_data:
                    update_data['instructions'] = {}
                update_data['instructions']['requiredDocuments'] = enhanced_data.required_documents
            
            # Add application process to instructions if not already present
            if enhanced_data.application_process:
                if 'instructions' not in update_data:
                    update_data['instructions'] = {}
                update_data['instructions']['applicationProcess'] = enhanced_data.application_process
            
            # Update online portal URL if found
            if enhanced_data.online_portals:
                update_data['onlinePortalUrl'] = enhanced_data.online_portals[0]
            
            # Update contact information if found
            if enhanced_data.contact_info:
                if enhanced_data.contact_info.get('phone') and not office.phone:
                    update_data['phone'] = enhanced_data.contact_info['phone']
                if enhanced_data.contact_info.get('email') and not office.email:
                    update_data['email'] = enhanced_data.contact_info['email']
            
            # Update the office in database
            await self.db_service.update_permit_office(office.id, update_data)
            
            logger.info(f"Updated {office.department_name} with enhanced data")
            
        except Exception as e:
            logger.error(f"Error updating office {office.department_name}: {e}")
            raise
    
    async def run_specific_office(self, office_id: str):
        """Run enhanced scraping for a specific office"""
        logger.info(f"Starting enhanced scraping for office ID: {office_id}")
        
        try:
            # Get specific office
            office = await self.db_service.get_permit_office_by_id(office_id)
            if not office:
                logger.error(f"Office with ID {office_id} not found")
                return
            
            logger.info(f"Processing office: {office.department_name}")
            
            # Scrape enhanced data
            enhanced_data = await self.scraper.scrape_enhanced_data(office)
            
            # Update office with enhanced data
            await self._update_office_with_enhanced_data(office, enhanced_data)
            
            logger.info(f"Successfully processed {office.department_name}")
            
        except Exception as e:
            logger.error(f"Error processing office {office_id}: {e}")
            raise

async def main():
    """Main function"""
    runner = EnhancedPricingScraperRunner()
    
    # Check if specific office ID provided
    if len(sys.argv) > 1:
        office_id = sys.argv[1]
        await runner.run_specific_office(office_id)
    else:
        await runner.run_enhanced_scraping()

if __name__ == "__main__":
    asyncio.run(main())
