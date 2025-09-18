"""
Configuration for Permit Office Scraper
"""
import os
from typing import List, Dict, Any
from pydantic_settings import BaseSettings

class ScraperConfig(BaseSettings):
    """Configuration settings for the permit office scraper"""
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://neondb_owner:npg_CHW9DuN3bvTV@ep-long-wildflower-adf2shp3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require")
    
    # Google APIs
    GOOGLE_MAPS_API_KEY: str = os.getenv("GOOGLE_MAPS_API_KEY", "")
    GOOGLE_PLACES_API_KEY: str = os.getenv("GOOGLE_PLACES_API_KEY", "")
    
    # LocationIQ for additional geocoding
    LOCATIONIQ_ACCESS_TOKEN: str = os.getenv("LOCATIONIQ_ACCESS_TOKEN", "")
    
    # Scraping settings
    SCRAPING_DELAY: float = 1.0  # Delay between requests (seconds)
    MAX_RETRIES: int = 3
    TIMEOUT: int = 30
    USER_AGENT: str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    
    # Target states and counties
    TARGET_STATES: List[str] = ["GA", "FL", "NC", "SC", "TN", "AL"]
    TARGET_COUNTIES: Dict[str, List[str]] = {
        "GA": ["Fulton", "DeKalb", "Cobb", "Gwinnett", "Clayton", "Cherokee", "Forsyth", "Henry"],
        "FL": ["Miami-Dade", "Broward", "Palm Beach", "Hillsborough", "Orange", "Pinellas"],
        "NC": ["Mecklenburg", "Wake", "Guilford", "Forsyth", "Durham", "Cumberland"],
        "SC": ["Greenville", "Richland", "Charleston", "Spartanburg", "York"],
        "TN": ["Davidson", "Shelby", "Knox", "Hamilton", "Rutherford"],
        "AL": ["Jefferson", "Mobile", "Madison", "Montgomery", "Baldwin"]
    }
    
    # Permit office search patterns
    PERMIT_OFFICE_KEYWORDS: List[str] = [
        "building permits",
        "planning department",
        "zoning office",
        "permit office",
        "development services",
        "code enforcement",
        "inspection services",
        "construction permits"
    ]
    
    # Government website patterns
    GOVERNMENT_DOMAINS: List[str] = [
        ".gov",
        ".us",
        "cityof",
        "countyof",
        "co.",
        "municipal"
    ]
    
    # Scraping targets
    SCRAPING_TARGETS: List[Dict[str, Any]] = [
        {
            "name": "Georgia State Permits",
            "url": "https://www.georgia.gov/business/permits-licenses",
            "type": "state",
            "state": "GA",
            "selectors": {
                "office_name": "h3, .office-title, .department-name",
                "address": ".address, .location, .contact-info",
                "phone": ".phone, .contact-phone, [href^='tel:']",
                "email": ".email, .contact-email, [href^='mailto:']",
                "website": ".website, .external-link, [href*='http']"
            }
        },
        {
            "name": "Atlanta Building Permits",
            "url": "https://www.atlantaga.gov/government/departments/city-planning/bureau-of-buildings",
            "type": "city",
            "state": "GA",
            "city": "Atlanta",
            "county": "Fulton",
            "selectors": {
                "office_name": "h1, .page-title",
                "address": ".address, .location",
                "phone": ".phone, [href^='tel:']",
                "email": ".email, [href^='mailto:']",
                "hours": ".hours, .business-hours"
            }
        },
        {
            "name": "Fulton County Permits",
            "url": "https://www.fultoncountyga.gov/services/building-and-development",
            "type": "county",
            "state": "GA",
            "county": "Fulton",
            "selectors": {
                "office_name": "h1, h2, .page-title, .department-name",
                "address": ".address, .location, .contact-info",
                "phone": ".phone, .contact-phone, [href^='tel:']",
                "email": ".email, .contact-email, [href^='mailto:']",
                "website": ".website, .external-link, [href*='http']"
            }
        },
        {
            "name": "DeKalb County Permits",
            "url": "https://www.dekalbcountyga.gov/planning-and-sustainability",
            "type": "county",
            "state": "GA",
            "county": "DeKalb",
            "selectors": {
                "office_name": "h1, h2, .page-title, .department-name",
                "address": ".address, .location, .contact-info",
                "phone": ".phone, .contact-phone, [href^='tel:']",
                "email": ".email, .contact-email, [href^='mailto:']",
                "website": ".website, .external-link, [href*='http']"
            }
        }
    ]
    
    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 100  # requests per hour
    RATE_LIMIT_WINDOW: int = 3600   # 1 hour in seconds
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "scraper.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

# Global config instance
config = ScraperConfig()
