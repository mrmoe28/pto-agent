#!/usr/bin/env python3
"""
Comprehensive scraper that combines enhanced data collection and specialized fee scraping
"""
import asyncio
import logging
import sys
import os
from datetime import datetime
from typing import List, Dict, Any

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from enhanced_pricing_instruction_scraper import EnhancedPricingInstructionScraper
from government_fee_scraper import GovernmentFeeScraper
from database_service import DatabaseService
from models import PermitOffice

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('comprehensive_scraper.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class ComprehensiveScraperRunner:
    """Runner for comprehensive data and fee scraping"""
    
    def __init__(self):
        self.enhanced_scraper = EnhancedPricingInstructionScraper()
        self.fee_scraper = GovernmentFeeScraper()
        self.db_service = DatabaseService()
    
    async def run_comprehensive_scraping(self):
        """Run comprehensive scraping for all permit offices"""
        logger.info("Starting comprehensive permit office scraping...")
        
        try:
            # Get all permit offices from database
            offices = await self.db_service.get_all_permit_offices()
            logger.info(f"Found {len(offices)} permit offices to process")
            
            # Process each office
            for i, office in enumerate(offices, 1):
                logger.info(f"Processing office {i}/{len(offices)}: {office.department_name}")
                
                try:
                    # Step 1: Enhanced data scraping
                    logger.info(f"  Step 1: Enhanced data scraping for {office.department_name}")
                    enhanced_data = await self.enhanced_scraper.scrape_enhanced_data(office)
                    
                    # Step 2: Specialized fee scraping
                    logger.info(f"  Step 2: Fee scraping for {office.department_name}")
                    base_url = office.website or f"https://{office.city.lower().replace(' ', '')}.gov"
                    fees = await self.fee_scraper.scrape_government_fees(base_url, office.department_name)
                    
                    # Step 3: Combine and update data
                    await self._update_office_with_comprehensive_data(office, enhanced_data, fees)
                    
                    logger.info(f"Successfully processed {office.department_name}")
                    
                except Exception as e:
                    logger.error(f"Error processing {office.department_name}: {e}")
                    continue
                
                # Add delay between requests to be respectful
                await asyncio.sleep(5)
            
            logger.info("Comprehensive scraping completed successfully!")
            
        except Exception as e:
            logger.error(f"Error in comprehensive scraping: {e}")
            raise
    
    async def _update_office_with_comprehensive_data(self, office: PermitOffice, enhanced_data, fees):
        """Update office record with comprehensive data"""
        try:
            # Start with enhanced data
            update_data = {
                'instructions': enhanced_data.detailed_instructions,
                'downloadableApplications': enhanced_data.downloadable_applications,
                'processingTimes': enhanced_data.processing_times,
                'lastVerified': datetime.now(),
                'dataSource': 'comprehensive_scraper'
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
            
            # Add fee data from specialized fee scraper
            if fees:
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
                
                # Merge with existing permit fees from enhanced scraper
                if enhanced_data.permit_fees:
                    for permit_type, fee_data in enhanced_data.permit_fees.items():
                        if permit_type not in permit_fees:
                            permit_fees[permit_type] = fee_data
                
                update_data['permitFees'] = permit_fees
            
            # Update the office in database
            await self.db_service.update_permit_office(office.id, update_data)
            
            logger.info(f"Updated {office.department_name} with comprehensive data")
            
        except Exception as e:
            logger.error(f"Error updating office {office.department_name}: {e}")
            raise
    
    async def run_specific_office(self, office_id: str):
        """Run comprehensive scraping for a specific office"""
        logger.info(f"Starting comprehensive scraping for office ID: {office_id}")
        
        try:
            # Get specific office
            office = await self.db_service.get_permit_office_by_id(office_id)
            if not office:
                logger.error(f"Office with ID {office_id} not found")
                return
            
            logger.info(f"Processing office: {office.department_name}")
            
            # Step 1: Enhanced data scraping
            enhanced_data = await self.enhanced_scraper.scrape_enhanced_data(office)
            
            # Step 2: Specialized fee scraping
            base_url = office.website or f"https://{office.city.lower().replace(' ', '')}.gov"
            fees = await self.fee_scraper.scrape_government_fees(base_url, office.department_name)
            
            # Step 3: Combine and update data
            await self._update_office_with_comprehensive_data(office, enhanced_data, fees)
            
            logger.info(f"Successfully processed {office.department_name}")
            
        except Exception as e:
            logger.error(f"Error processing office {office_id}: {e}")
            raise

async def main():
    """Main function"""
    runner = ComprehensiveScraperRunner()
    
    # Check if specific office ID provided
    if len(sys.argv) > 1:
        office_id = sys.argv[1]
        await runner.run_specific_office(office_id)
    else:
        await runner.run_comprehensive_scraping()

if __name__ == "__main__":
    asyncio.run(main())
