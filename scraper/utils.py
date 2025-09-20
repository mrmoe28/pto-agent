"""
Utility functions for the US50 Permit Scraper.
"""
import re
import random
import time
import requests
import requests_cache
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser
from bs4 import BeautifulSoup, Tag
from tenacity import retry, stop_after_attempt, wait_exponential
from typing import List, Dict, Optional, Tuple, Union
import tldextract
from .config import (
    DEFAULT_HEADERS, RATE_LIMIT_SECONDS, RATE_LIMIT_JITTER,
    REQUEST_TIMEOUT, RETRIES, ROBOTS_CACHE_TTL, US_STATES
)

# Initialize requests cache
requests_cache.install_cache('scraper_cache', expire_after=300)

# Rate limiting state
_last_request_time = {}
_robots_cache = {}


def add_jitter(base_delay: float) -> float:
    """Add random jitter to delay."""
    return base_delay + random.uniform(-RATE_LIMIT_JITTER, RATE_LIMIT_JITTER)


def rate_limit(domain: str):
    """Enforce rate limiting per domain."""
    now = time.time()
    if domain in _last_request_time:
        elapsed = now - _last_request_time[domain]
        required_delay = RATE_LIMIT_SECONDS
        if elapsed < required_delay:
            sleep_time = add_jitter(required_delay - elapsed)
            time.sleep(max(0, sleep_time))
    _last_request_time[domain] = time.time()


@retry(stop=stop_after_attempt(RETRIES), wait=wait_exponential(multiplier=1, min=4, max=60))
def get(url: str, **kwargs) -> requests.Response:
    """Make HTTP request with caching, retries, and rate limiting."""
    domain = urlparse(url).netloc
    rate_limit(domain)

    headers = DEFAULT_HEADERS.copy()
    headers.update(kwargs.pop('headers', {}))

    kwargs.setdefault('timeout', REQUEST_TIMEOUT)
    kwargs.setdefault('headers', headers)

    response = requests.get(url, **kwargs)
    response.raise_for_status()
    return response


def is_allowed(url: str) -> bool:
    """Check if URL is allowed by robots.txt."""
    domain = urlparse(url).netloc

    # Check cache first
    if domain in _robots_cache:
        robots_data = _robots_cache[domain]
        if time.time() - robots_data['timestamp'] < ROBOTS_CACHE_TTL:
            return robots_data['parser'].can_fetch(DEFAULT_HEADERS['User-Agent'], url)

    # Fetch and cache robots.txt
    try:
        robots_url = f"https://{domain}/robots.txt"
        rp = RobotFileParser()
        rp.set_url(robots_url)
        rp.read()

        _robots_cache[domain] = {
            'parser': rp,
            'timestamp': time.time()
        }

        return rp.can_fetch(DEFAULT_HEADERS['User-Agent'], url)
    except Exception:
        # If we can't fetch robots.txt, assume allowed
        return True


def absolute_url(base: str, href: str) -> str:
    """Convert relative URL to absolute."""
    return urljoin(base, href)


def clean_text(text: str) -> str:
    """Clean and normalize text content."""
    if not text:
        return ""

    # Remove extra whitespace and normalize
    text = re.sub(r'\s+', ' ', text.strip())

    # Remove common boilerplate patterns
    boilerplate_patterns = [
        r'Copyright.*?rights reserved\.?',
        r'Privacy Policy.*?Terms of Use',
        r'Skip to main content',
        r'Print this page',
        r'Share this page',
        r'Last updated:.*?\d{4}',
        r'Contact webmaster',
    ]

    for pattern in boilerplate_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    return text.strip()


def uniq(items: List) -> List:
    """Remove duplicates while preserving order."""
    seen = set()
    result = []
    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)
    return result


def strip_boilerplate(text: str) -> str:
    """Remove common boilerplate text."""
    return clean_text(text)


def find_contacts(text: str) -> Dict[str, List[str]]:
    """Extract phone numbers and email addresses from text."""
    contacts = {'phones': [], 'emails': []}

    # Phone number patterns
    phone_patterns = [
        r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
        r'\(\d{3}\)\s*\d{3}[-.]?\d{4}',
        r'\b\d{3}\s+\d{3}\s+\d{4}\b'
    ]

    for pattern in phone_patterns:
        phones = re.findall(pattern, text)
        contacts['phones'].extend(phones)

    # Email pattern
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails = re.findall(email_pattern, text)
    contacts['emails'].extend(emails)

    # Clean and deduplicate
    contacts['phones'] = uniq([re.sub(r'[^\d()]', '', p) for p in contacts['phones']])
    contacts['emails'] = uniq(contacts['emails'])

    return contacts


def find_address_block(soup: BeautifulSoup) -> Optional[str]:
    """Find address information in the HTML."""
    address_patterns = [
        r'\d+\s+[\w\s]+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct)',
        r'P\.?O\.?\s+Box\s+\d+',
        r'\d+\s+[\w\s]+\n[\w\s]+,\s*[A-Z]{2}\s+\d{5}'
    ]

    # Look for address in common containers
    address_selectors = [
        'address', '.address', '#address',
        '.contact-info', '.contact-address',
        '.footer-address', '.location-info'
    ]

    for selector in address_selectors:
        elements = soup.select(selector)
        for element in elements:
            text = clean_text(element.get_text())
            for pattern in address_patterns:
                if re.search(pattern, text, re.IGNORECASE):
                    return text

    return None


def looks_js_heavy(html: str) -> bool:
    """Determine if page requires JavaScript rendering."""
    if len(html) < 5000:  # Very small page likely needs JS
        return True

    soup = BeautifulSoup(html, 'html.parser')

    # Count meaningful content vs scripts
    scripts = len(soup.find_all('script'))
    content_tags = len(soup.find_all(['p', 'div', 'section', 'article', 'main']))

    if scripts > content_tags * 2:  # More scripts than content
        return True

    # Check for common SPA indicators
    spa_indicators = [
        'ng-app', 'data-reactroot', 'vue-app',
        'ember-application', 'angular'
    ]

    html_lower = html.lower()
    for indicator in spa_indicators:
        if indicator in html_lower:
            return True

    return False


def guess_jurisdiction(text: str, seed_meta: Optional[Dict] = None) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Guess state, county, and city from text content.
    Returns (state, county, city).
    """
    if seed_meta:
        return seed_meta.get('state'), seed_meta.get('county'), seed_meta.get('city')

    state = None
    county = None
    city = None

    # Extract state from US_STATES list
    for state_info in US_STATES:
        state_name = state_info.get('name', '')
        state_abbr = state_info.get('abbr', '')

        if state_abbr and re.search(rf'\b{re.escape(state_abbr)}\b', text, re.IGNORECASE):
            state = state_abbr
            break
        elif state_name and re.search(rf'\b{re.escape(state_name)}\b', text, re.IGNORECASE):
            state = state_abbr
            break

    # Look for county patterns
    county_pattern = r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+County'
    county_match = re.search(county_pattern, text)
    if county_match:
        county = county_match.group(1)

    # Look for city patterns (this is more heuristic)
    city_patterns = [
        r'City\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+City',
    ]

    for pattern in city_patterns:
        city_match = re.search(pattern, text)
        if city_match:
            city = city_match.group(1)
            break

    return state, county, city


def html_table_to_2d(table: Tag) -> List[List[str]]:
    """Convert HTML table to 2D array of strings."""
    if not table:
        return []

    rows = []
    for tr in table.find_all('tr'):
        row = []
        for td in tr.find_all(['td', 'th']):
            cell_text = clean_text(td.get_text())
            row.append(cell_text)
        if row:  # Only add non-empty rows
            rows.append(row)

    return rows


def extract_domain(url: str) -> str:
    """Extract domain from URL."""
    return urlparse(url).netloc


def is_same_domain(url1: str, url2: str) -> bool:
    """Check if two URLs are from the same domain."""
    return extract_domain(url1) == extract_domain(url2)


def is_media_file(url: str) -> bool:
    """Check if URL points to a media file."""
    media_extensions = {
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp',
        '.mp4', '.avi', '.mov', '.wmv', '.flv',
        '.mp3', '.wav', '.ogg', '.m4a',
        '.zip', '.rar', '.tar', '.gz'
    }

    parsed = urlparse(url.lower())
    path = parsed.path

    for ext in media_extensions:
        if path.endswith(ext):
            return True

    return False


def normalize_url(url: str) -> str:
    """Normalize URL for consistent comparison."""
    parsed = urlparse(url)
    # Remove fragment and trailing slash
    normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path.rstrip('/')}"
    if parsed.query:
        normalized += f"?{parsed.query}"
    return normalized