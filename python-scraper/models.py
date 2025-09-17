"""
Data models for permit office scraper
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class JurisdictionType(str, Enum):
    CITY = "city"
    COUNTY = "county"
    STATE = "state"
    SPECIAL_DISTRICT = "special_district"

class OfficeType(str, Enum):
    BUILDING = "building"
    PLANNING = "planning"
    ZONING = "zoning"
    COMBINED = "combined"
    OTHER = "other"

class DataSource(str, Enum):
    CRAWLED = "crawled"
    API = "api"
    MANUAL = "manual"

class CrawlFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class PermitOffice(BaseModel):
    """Model for permit office data"""
    
    # Basic identification
    id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Location information
    city: str
    county: str
    state: str
    jurisdiction_type: JurisdictionType
    
    # Office details
    department_name: str
    office_type: OfficeType
    
    # Contact information
    address: str
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    
    # Operating hours
    hours_monday: Optional[str] = None
    hours_tuesday: Optional[str] = None
    hours_wednesday: Optional[str] = None
    hours_thursday: Optional[str] = None
    hours_friday: Optional[str] = None
    hours_saturday: Optional[str] = None
    hours_sunday: Optional[str] = None
    
    # Services offered
    building_permits: bool = False
    electrical_permits: bool = False
    plumbing_permits: bool = False
    mechanical_permits: bool = False
    zoning_permits: bool = False
    planning_review: bool = False
    inspections: bool = False
    
    # Online services
    online_applications: bool = False
    online_payments: bool = False
    permit_tracking: bool = False
    online_portal_url: Optional[str] = None
    
    # Geographic data
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_area_bounds: Optional[Dict[str, Any]] = None
    
    # Metadata
    data_source: DataSource = DataSource.CRAWLED
    last_verified: Optional[datetime] = None
    crawl_frequency: CrawlFrequency = CrawlFrequency.WEEKLY
    active: bool = True
    
    # Scraping metadata
    source_url: Optional[str] = None
    scraped_at: Optional[datetime] = None
    confidence_score: Optional[float] = None  # 0-1 score for data quality

class ScrapingTarget(BaseModel):
    """Model for scraping target configuration"""
    name: str
    url: str
    type: str  # state, city, county
    state: str
    city: Optional[str] = None
    county: Optional[str] = None
    selectors: Dict[str, str] = Field(default_factory=dict)
    enabled: bool = True
    last_scraped: Optional[datetime] = None
    success_count: int = 0
    error_count: int = 0

class ScrapingResult(BaseModel):
    """Model for scraping operation results"""
    target: ScrapingTarget
    success: bool
    offices_found: int
    offices_processed: int
    errors: List[str] = Field(default_factory=list)
    duration_seconds: float
    scraped_at: datetime = Field(default_factory=datetime.now)

class GeocodingResult(BaseModel):
    """Model for geocoding results"""
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    formatted_address: Optional[str] = None
    city: Optional[str] = None
    county: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    confidence: Optional[float] = None
    source: str  # google, openstreetmap, etc.
