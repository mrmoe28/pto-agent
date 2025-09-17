"""
Enhanced configuration for permit office scraper with comprehensive selectors
"""
import os
from typing import List, Dict, Any
from pydantic import BaseSettings

class EnhancedScraperConfig(BaseSettings):
    """Enhanced configuration settings for the permit office scraper"""
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_CHW9DuN3bvTV@ep-long-wildflower-adf2shp3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require")
    
    # Google APIs
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "AIzaSyAr5knif73PEUZK4nQjGg0-2Bbw6-aIHbo")
    GOOGLE_PLACES_API_KEY: str = os.getenv("GOOGLE_PLACES_API_KEY", "AIzaSyAr5knif73PEUZK4nQjGg0-2Bbw6-aIHbo")
    
    # Scraping settings
    SCRAPING_DELAY: float = 1.0  # Delay between requests (seconds)
    MAX_RETRIES: int = 3
    TIMEOUT: int = 30
    USER_AGENT: str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    
    # Enhanced scraping targets with comprehensive selectors
    SCRAPING_TARGETS: List[Dict[str, Any]] = [
        {
            "name": "DeKalb County Planning & Sustainability",
            "url": "https://www.dekalbcountyga.gov/planning-and-sustainability",
            "type": "county",
            "state": "GA",
            "county": "DeKalb",
            "selectors": {
                "office_name": "h1, h2, h3, .page-title, .department-name, .office-title",
                "address": ".address, .location, .contact-address, .office-address, [itemprop='address']",
                "phone": ".phone, .contact-phone, .office-phone, [href^='tel:'], [itemprop='telephone']",
                "email": ".email, .contact-email, .office-email, [href^='mailto:'], [itemprop='email']",
                "website": ".website, .url, .external-link, [href*='http']",
                "hours": ".hours, .business-hours, .office-hours, .contact-hours"
            }
        },
        {
            "name": "Fulton County Building & Development",
            "url": "https://www.fultoncountyga.gov/services/building-and-development",
            "type": "county",
            "state": "GA",
            "county": "Fulton",
            "selectors": {
                "office_name": "h1, h2, h3, .page-title, .department-name, .office-title",
                "address": ".address, .location, .contact-address, .office-address, [itemprop='address']",
                "phone": ".phone, .contact-phone, .office-phone, [href^='tel:'], [itemprop='telephone']",
                "email": ".email, .contact-email, .office-email, [href^='mailto:'], [itemprop='email']",
                "website": ".website, .url, .external-link, [href*='http']",
                "hours": ".hours, .business-hours, .office-hours, .contact-hours"
            }
        },
        {
            "name": "Cobb County Community Development",
            "url": "https://www.cobbcounty.org/community-development",
            "type": "county",
            "state": "GA",
            "county": "Cobb",
            "selectors": {
                "office_name": "h1, h2, h3, .page-title, .department-name, .office-title",
                "address": ".address, .location, .contact-address, .office-address, [itemprop='address']",
                "phone": ".phone, .contact-phone, .office-phone, [href^='tel:'], [itemprop='telephone']",
                "email": ".email, .contact-email, .office-email, [href^='mailto:'], [itemprop='email']",
                "website": ".website, .url, .external-link, [href*='http']",
                "hours": ".hours, .business-hours, .office-hours, .contact-hours"
            }
        },
        {
            "name": "Gwinnett County Planning & Development",
            "url": "https://www.gwinnettcounty.com/web/gwinnett/departments/planninganddevelopment",
            "type": "county",
            "state": "GA",
            "county": "Gwinnett",
            "selectors": {
                "office_name": "h1, h2, h3, .page-title, .department-name, .office-title",
                "address": ".address, .location, .contact-address, .office-address, [itemprop='address']",
                "phone": ".phone, .contact-phone, .office-phone, [href^='tel:'], [itemprop='telephone']",
                "email": ".email, .contact-email, .office-email, [href^='mailto:'], [itemprop='email']",
                "website": ".website, .url, .external-link, [href*='http']",
                "hours": ".hours, .business-hours, .office-hours, .contact-hours"
            }
        },
        {
            "name": "Clayton County Planning & Zoning",
            "url": "https://www.claytoncountyga.gov/government/departments/planning-zoning",
            "type": "county",
            "state": "GA",
            "county": "Clayton",
            "selectors": {
                "office_name": "h1, h2, h3, .page-title, .department-name, .office-title",
                "address": ".address, .location, .contact-address, .office-address, [itemprop='address']",
                "phone": ".phone, .contact-phone, .office-phone, [href^='tel:'], [itemprop='telephone']",
                "email": ".email, .contact-email, .office-email, [href^='mailto:'], [itemprop='email']",
                "website": ".website, .url, .external-link, [href*='http']",
                "hours": ".hours, .business-hours, .office-hours, .contact-hours"
            }
        },
        {
            "name": "Cherokee County Planning & Zoning",
            "url": "https://www.cherokeega.com/planning-zoning/",
            "type": "county",
            "state": "GA",
            "county": "Cherokee",
            "selectors": {
                "office_name": "h1, h2, h3, .page-title, .department-name, .office-title",
                "address": ".address, .location, .contact-address, .office-address, [itemprop='address']",
                "phone": ".phone, .contact-phone, .office-phone, [href^='tel:'], [itemprop='telephone']",
                "email": ".email, .contact-email, .office-email, [href^='mailto:'], [itemprop='email']",
                "website": ".website, .url, .external-link, [href*='http']",
                "hours": ".hours, .business-hours, .office-hours, .contact-hours"
            }
        },
        {
            "name": "Forsyth County Planning & Community Development",
            "url": "https://www.forsythco.com/departments/planning-community-development",
            "type": "county",
            "state": "GA",
            "county": "Forsyth",
            "selectors": {
                "office_name": "h1, h2, h3, .page-title, .department-name, .office-title",
                "address": ".address, .location, .contact-address, .office-address, [itemprop='address']",
                "phone": ".phone, .contact-phone, .office-phone, [href^='tel:'], [itemprop='telephone']",
                "email": ".email, .contact-email, .office-email, [href^='mailto:'], [itemprop='email']",
                "website": ".website, .url, .external-link, [href*='http']",
                "hours": ".hours, .business-hours, .office-hours, .contact-hours"
            }
        },
        {
            "name": "Henry County Planning & Zoning",
            "url": "https://www.henrycountyga.org/departments/planning-zoning",
            "type": "county",
            "state": "GA",
            "county": "Henry",
            "selectors": {
                "office_name": "h1, h2, h3, .page-title, .department-name, .office-title",
                "address": ".address, .location, .contact-address, .office-address, [itemprop='address']",
                "phone": ".phone, .contact-phone, .office-phone, [href^='tel:'], [itemprop='telephone']",
                "email": ".email, .contact-email, .office-email, [href^='mailto:'], [itemprop='email']",
                "website": ".website, .url, .external-link, [href*='http']",
                "hours": ".hours, .business-hours, .office-hours, .contact-hours"
            }
        }
    ]
    
    # Enhanced permit office search patterns
    PERMIT_OFFICE_KEYWORDS: List[str] = [
        "building permits", "construction permits", "planning department",
        "zoning office", "permit office", "development services",
        "code enforcement", "inspection services", "construction permits",
        "building department", "planning and zoning", "community development",
        "development review", "permit applications", "building inspections"
    ]
    
    # Government website patterns
    GOVERNMENT_DOMAINS: List[str] = [
        ".gov", ".us", "cityof", "countyof", "co.", "municipal",
        "county", "city", "town", "village", "township"
    ]
    
    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 100  # requests per hour
    RATE_LIMIT_WINDOW: int = 3600   # 1 hour in seconds
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "enhanced_scraper.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Global config instance
config = EnhancedScraperConfig()

