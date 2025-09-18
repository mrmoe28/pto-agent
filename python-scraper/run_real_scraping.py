#!/usr/bin/env python3
"""
Run the enhanced crawler on real permit office websites and save to database
"""
import asyncio
import logging
import json
from datetime import datetime
from enhanced_scraper import EnhancedPermitOfficeScraper
from models import ScrapingTarget
import asyncpg
from config import config

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def save_office_to_database(office_data: dict):
    """Save enhanced office data to database"""
    try:
        conn = await asyncpg.connect(config.DATABASE_URL)
        
        # Check if office already exists
        existing = await conn.fetchrow(
            "SELECT id FROM permit_offices WHERE department_name = $1 AND city = $2",
            office_data['department_name'], office_data['city']
        )
        
        if existing:
            # Update existing office with enhanced data
            await conn.execute("""
                UPDATE permit_offices 
                SET 
                    permit_fees = $1,
                    instructions = $2,
                    downloadable_applications = $3,
                    processing_times = $4,
                    updated_at = NOW(),
                    data_source = 'enhanced_scraped'
                WHERE id = $5
            """, 
                json.dumps(office_data.get('permit_fees', {})),
                json.dumps(office_data.get('instructions', {})),
                json.dumps(office_data.get('downloadable_applications', {})),
                json.dumps(office_data.get('processing_times', {})),
                existing['id']
            )
            logger.info(f"Updated existing office: {office_data['department_name']}")
        else:
            # Insert new office
            await conn.execute("""
                INSERT INTO permit_offices (
                    city, county, state, jurisdiction_type, department_name, office_type,
                    address, phone, email, website,
                    hours_monday, hours_tuesday, hours_wednesday, hours_thursday, 
                    hours_friday, hours_saturday, hours_sunday,
                    building_permits, electrical_permits, plumbing_permits, 
                    mechanical_permits, zoning_permits, planning_review, inspections,
                    permit_fees, instructions, downloadable_applications, processing_times,
                    data_source, active
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17,
                    $18, $19, $20, $21, $22, $23, $24,
                    $25, $26, $27, $28, $29, $30
                )
            """,
                office_data['city'], office_data['county'], office_data['state'],
                office_data['jurisdiction_type'], office_data['department_name'], 
                office_data['office_type'], office_data['address'], 
                office_data.get('phone'), office_data.get('email'), office_data.get('website'),
                office_data.get('hours_monday'), office_data.get('hours_tuesday'),
                office_data.get('hours_wednesday'), office_data.get('hours_thursday'),
                office_data.get('hours_friday'), office_data.get('hours_saturday'),
                office_data.get('hours_sunday'),
                office_data.get('building_permits', True), office_data.get('electrical_permits', True),
                office_data.get('plumbing_permits', True), office_data.get('mechanical_permits', True),
                office_data.get('zoning_permits', True), office_data.get('planning_review', True),
                office_data.get('inspections', True),
                json.dumps(office_data.get('permit_fees', {})),
                json.dumps(office_data.get('instructions', {})),
                json.dumps(office_data.get('downloadable_applications', {})),
                json.dumps(office_data.get('processing_times', {})),
                'enhanced_scraped', True
            )
            logger.info(f"Inserted new office: {office_data['department_name']}")
        
        await conn.close()
        
    except Exception as e:
        logger.error(f"Failed to save office to database: {e}")

async def run_real_scraping():
    """Run enhanced crawler on real permit office websites"""
    
    # Real permit office websites to scrape
    targets = [
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
        ),
        ScrapingTarget(
            name="DeKalb County Planning",
            url="https://www.dekalbcountyga.gov/planning-and-sustainability",
            type="county",
            state="GA",
            county="DeKalb"
        ),
        ScrapingTarget(
            name="Cobb County Building Department",
            url="https://www.cobbcounty.org/community-development/building-safety",
            type="county",
            state="GA",
            county="Cobb"
        )
    ]
    
    total_offices_saved = 0
    
    async with EnhancedPermitOfficeScraper() as scraper:
        for target in targets:
            logger.info(f"Scraping {target.name}...")
            
            try:
                result = await scraper.scrape_target(target)
                
                if result.success and result.offices_processed > 0:
                    logger.info(f"Successfully scraped {result.offices_processed} offices from {target.name}")
                    
                    # Save each office to database
                    for office in result.offices_found:
                        try:
                            # Convert office to dict for database
                            office_dict = {
                                'department_name': office.department_name,
                                'city': office.city,
                                'county': office.county,
                                'state': office.state,
                                'jurisdiction_type': office.jurisdiction_type,
                                'office_type': office.office_type,
                                'address': office.address,
                                'phone': office.phone,
                                'email': office.email,
                                'website': office.website,
                                'hours_monday': office.hours_monday,
                                'hours_tuesday': office.hours_tuesday,
                                'hours_wednesday': office.hours_wednesday,
                                'hours_thursday': office.hours_thursday,
                                'hours_friday': office.hours_friday,
                                'hours_saturday': office.hours_saturday,
                                'hours_sunday': office.hours_sunday,
                                'building_permits': office.building_permits,
                                'electrical_permits': office.electrical_permits,
                                'plumbing_permits': office.plumbing_permits,
                                'mechanical_permits': office.mechanical_permits,
                                'zoning_permits': office.zoning_permits,
                                'planning_review': office.planning_review,
                                'inspections': office.inspections,
                                'permit_fees': office.permit_fees,
                                'instructions': office.instructions,
                                'downloadable_applications': office.downloadable_applications,
                                'processing_times': office.processing_times
                            }
                            
                            await save_office_to_database(office_dict)
                            total_offices_saved += 1
                            
                        except Exception as e:
                            logger.error(f"Failed to save office {office.department_name}: {e}")
                else:
                    logger.warning(f"No offices found for {target.name}: {result.errors}")
                    
            except Exception as e:
                logger.error(f"Failed to scrape {target.name}: {e}")
    
    logger.info(f"Scraping completed! Total offices saved: {total_offices_saved}")

if __name__ == "__main__":
    print("Enhanced Permit Office Scraper - Real Data Extraction")
    print("=====================================================")
    
    asyncio.run(run_real_scraping())
