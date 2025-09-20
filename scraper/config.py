"""
Configuration settings for the US50 Permit Scraper.
"""
import json
import os
from pathlib import Path
from typing import Dict, List, Optional

# Base directory paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
SEEDS_DIR = DATA_DIR / "seeds" / "us"
EXPORTS_DIR = DATA_DIR / "exports"
RAW_DIR = DATA_DIR / "raw"
LOGS_DIR = DATA_DIR / "logs"

# HTTP Configuration
DEFAULT_HEADERS = {
    "User-Agent": "PTO-Agent-Scraper/1.0 (+contact: support@yourdomain.com)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

# Rate limiting and timing
RATE_LIMIT_SECONDS = 1.0
RATE_LIMIT_JITTER = 0.2  # ±200ms jitter
REQUEST_TIMEOUT = 25
RETRIES = 5

# Crawling behavior
MAX_DEPTH = 3
DOMAIN_CONCURRENCY = 2
ROBOTS_CACHE_TTL = 24 * 60 * 60  # 24 hours in seconds
MAX_PDF_SIZE_MB = 8

# Keywords for permit-related content discovery
PERMIT_KEYWORDS = [
    "permit", "building", "planning", "forms", "fees",
    "inspections", "apply", "applications", "documents",
    "construction", "zoning", "development"
]

# Platform detection priority order
PLATFORM_PRIORITY = [
    "accela", "etrakit", "tyler-energov", "cityview",
    "opengov", "civicplus", "salesforce-exp"
]


def load_us_states() -> List[Dict[str, str]]:
    """Load US states data."""
    states_file = SEEDS_DIR / "states.json"
    if states_file.exists():
        with open(states_file, 'r') as f:
            return json.load(f)
    return []


def load_start_seeds() -> List[str]:
    """Load start URLs from seeds file."""
    seeds_file = SEEDS_DIR / "start_urls.txt"
    if not seeds_file.exists():
        return []

    with open(seeds_file, 'r') as f:
        urls = []
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                urls.append(line)
        return urls


def load_platform_hints() -> Dict:
    """Load platform hints if available."""
    platforms_file = SEEDS_DIR / "platforms.json"
    if platforms_file.exists():
        with open(platforms_file, 'r') as f:
            return json.load(f)
    return {}


# Load configuration data
US_STATES = load_us_states()
START_SEEDS = load_start_seeds()
PLATFORM_HINTS = load_platform_hints()

# Create directories if they don't exist
for directory in [DATA_DIR, SEEDS_DIR, EXPORTS_DIR, RAW_DIR, LOGS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)