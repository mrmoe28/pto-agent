"""
Configuration management for government scraper
"""
import os
from typing import List, Optional
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

class Config(BaseModel):
    """Configuration for government scraper"""
    
    # Politeness settings
    concurrency: int = Field(default=int(os.getenv("CONCURRENCY", "8")), ge=1, le=20)
    rate_limit_per_sec: float = Field(default=float(os.getenv("RATE_LIMIT_PER_SEC", "1.0")), gt=0)
    delay_ms_min: int = Field(default=int(os.getenv("DELAY_MS_MIN", "250")), ge=0)
    delay_ms_max: int = Field(default=int(os.getenv("DELAY_MS_MAX", "1200")), ge=0)
    max_pages: int = Field(default=int(os.getenv("MAX_PAGES", "500")), gt=0)
    max_depth: int = Field(default=int(os.getenv("MAX_DEPTH", "6")), ge=0)
    respect_robots: bool = Field(default=os.getenv("RESPECT_ROBOTS", "true").lower() == "true")
    
    # User agents
    user_agents: List[str] = Field(default=[
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    ])
    
    # Start URLs
    start_urls: List[str] = Field(default_factory=list)
    
    # Output settings
    out_dir: str = Field(default=os.getenv("OUT_DIR", "./data"))
    format: List[str] = Field(default=["jsonl", "csv"])
    
    # State management
    sqlite_path: str = Field(default=os.getenv("SQLITE_PATH", "./data/state.sqlite"))
    
    # Downloads
    downloads_dir: str = Field(default=os.getenv("DOWNLOADS_DIR", "./data/downloads"))
    max_download_mb: int = Field(default=int(os.getenv("MAX_DOWNLOAD_MB", "25")), gt=0)
    
    # Timeouts
    request_timeout: int = Field(default=30, gt=0)
    connect_timeout: int = Field(default=10, gt=0)
    
    # Retry settings
    max_retries: int = Field(default=3, ge=0)
    retry_delay: float = Field(default=1.0, gt=0)
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
