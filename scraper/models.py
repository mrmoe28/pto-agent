"""
Data models for the US50 Permit Scraper.
"""
from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Literal
from datetime import datetime


class Download(BaseModel):
    """Represents a downloadable document/form."""
    title: Optional[str] = None
    url: HttpUrl


class Record(BaseModel):
    """Main permit office record containing all extracted data."""
    state: str
    county: Optional[str] = None
    city: Optional[str] = None
    department_name: Optional[str] = None
    platform: Optional[Literal[
        "accela", "etrakit", "tyler-energov", "cityview",
        "opengov", "civicplus", "salesforce-exp", "unknown"
    ]] = "unknown"
    permit_fee: Optional[str] = None
    processing_instructions: Optional[str] = None
    turnaround_time: Optional[str] = None
    downloadable_applications: List[Download] = []
    phone: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    hours: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    source_url: HttpUrl
    discovered_via: Optional[Literal["seed", "sitemap", "crawl"]] = None
    last_checked_at: Optional[str] = None

    def to_row(self) -> dict:
        """Convert to dict for CSV/JSON export."""
        data = self.model_dump()
        # Convert downloadable_applications to a more readable format
        if self.downloadable_applications:
            data['downloadable_applications'] = [
                f"{app.title}: {app.url}" if app.title else str(app.url)
                for app in self.downloadable_applications
            ]
        return data

    def set_timestamp(self):
        """Set the last_checked_at timestamp to current time."""
        self.last_checked_at = datetime.utcnow().isoformat()


class CrawlStats(BaseModel):
    """Statistics tracking for crawl sessions."""
    pages_fetched: int = 0
    robots_skipped: int = 0
    rendered_pages: int = 0
    pdfs_parsed: int = 0
    html_tables_normalized: int = 0
    platform_counts: dict = Field(default_factory=dict)
    errors: List[str] = Field(default_factory=list)
    start_time: Optional[str] = None
    end_time: Optional[str] = None

    def add_platform_detection(self, platform: str):
        """Increment count for detected platform."""
        if platform not in self.platform_counts:
            self.platform_counts[platform] = 0
        self.platform_counts[platform] += 1

    def add_error(self, error: str):
        """Add an error message to the log."""
        self.errors.append(f"{datetime.utcnow().isoformat()}: {error}")


class SeedMetadata(BaseModel):
    """Metadata about seed URLs for jurisdiction resolution."""
    url: HttpUrl
    state: Optional[str] = None
    county: Optional[str] = None
    city: Optional[str] = None
    department: Optional[str] = None
    confidence: float = 1.0