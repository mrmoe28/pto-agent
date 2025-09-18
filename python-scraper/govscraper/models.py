"""
Pydantic models for government scraper data
"""
from pydantic import BaseModel, HttpUrl, Field, validator
from typing import List, Optional
from datetime import datetime
import re

class Download(BaseModel):
    """Downloaded file information"""
    name: str
    href: HttpUrl
    file_path: Optional[str] = None
    bytes: Optional[int] = None
    content_hash: Optional[str] = None
    filetype: Optional[str] = None  # pdf/doc/docx/html

class GovRecord(BaseModel):
    """Government department record with extracted information"""
    jurisdiction_name: Optional[str] = None
    source_url: HttpUrl
    permit_fee: Optional[str] = None
    processing_instructions: Optional[str] = None
    turnaround_time: Optional[str] = None
    downloadable_applications: List[Download] = []
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    last_scraped_at: datetime = Field(default_factory=datetime.utcnow)
    notes: Optional[str] = None
    
    @validator('phone')
    def validate_phone(cls, v):
        if v is None:
            return v
        # Basic phone validation - keep original if not E.164
        phone_pattern = r'^\+?1?[2-9]\d{2}[2-9]\d{2}\d{4}$'
        if re.match(phone_pattern, v.replace('-', '').replace('(', '').replace(')', '').replace(' ', '')):
            return v
        return v  # Keep original format if not E.164
    
    @validator('email')
    def validate_email(cls, v):
        if v is None:
            return v
        email_pattern = r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
        if re.match(email_pattern, v):
            return v
        return None  # Invalid email
    
    @validator('permit_fee')
    def validate_permit_fee(cls, v):
        if v is None:
            return v
        # Check if it contains currency patterns
        currency_pattern = r'\$?\d{1,3}(?:[,\d]{0,3})*(?:\.\d{2})?'
        if re.search(currency_pattern, v):
            return v
        return v  # Keep even if no currency found
    
    @validator('turnaround_time')
    def validate_turnaround_time(cls, v):
        if v is None:
            return v
        # Check if it contains time patterns
        time_pattern = r'\b(\d{1,2}\s*(business|working)?\s*day[s]?|week[s]?|hour[s]?)\b'
        if re.search(time_pattern, v, re.IGNORECASE):
            return v
        return v  # Keep even if no time pattern found
    
    def has_valuable_data(self) -> bool:
        """Check if record contains valuable extracted data"""
        return any([
            self.permit_fee,
            self.processing_instructions,
            self.turnaround_time,
            self.downloadable_applications,
            self.phone,
            self.email,
            self.address
        ])
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            'jurisdiction_name': self.jurisdiction_name,
            'source_url': str(self.source_url),
            'permit_fee': self.permit_fee,
            'processing_instructions': self.processing_instructions,
            'turnaround_time': self.turnaround_time,
            'downloadable_applications': [
                {
                    'name': app.name,
                    'href': str(app.href),
                    'file_path': app.file_path,
                    'bytes': app.bytes,
                    'content_hash': app.content_hash,
                    'filetype': app.filetype
                } for app in self.downloadable_applications
            ],
            'phone': self.phone,
            'email': self.email,
            'address': self.address,
            'last_scraped_at': self.last_scraped_at.isoformat(),
            'notes': self.notes
        }
