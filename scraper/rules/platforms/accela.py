"""
Accela platform detection and parsing.
"""
import re
from bs4 import BeautifulSoup
from typing import List, Optional, Union
from ...models import Record, Download
from ...utils import clean_text, find_contacts, find_address_block, html_table_to_2d, guess_jurisdiction


def detect(url: str, html: str) -> bool:
    """Detect if page is using Accela platform."""
    indicators = [
        '/CitizenAccess/',
        'Accela',
        'meta name="generator" content="Accela"',
        'AccelaCitizenAccess',
        'CAP.aspx',
        'Accela Citizen Access'
    ]

    url_lower = url.lower()
    html_lower = html.lower()

    for indicator in indicators:
        if indicator.lower() in url_lower or indicator.lower() in html_lower:
            return True

    return False


def parse(url: str, html: str, soup: BeautifulSoup) -> Optional[Record]:
    """Parse Accela page for permit information."""
    if not detect(url, html):
        return None

    record = Record(
        source_url=url,
        platform="accela",
        state="Unknown",  # Will be updated by jurisdiction detection
        confidence=0.1  # Base confidence for platform detection
    )

    # Extract jurisdiction info
    state, county, city = guess_jurisdiction(html)
    record.state = state or "Unknown"
    record.county = county
    record.city = city

    # Look for department name
    dept_selectors = [
        'h1', '.page-title', '.department-name',
        '.agency-name', '.header-title'
    ]

    for selector in dept_selectors:
        elements = soup.select(selector)
        for element in elements:
            text = clean_text(element.get_text())
            if any(keyword in text.lower() for keyword in ['building', 'planning', 'permit', 'development']):
                record.department_name = text
                record.confidence += 0.1
                break

    # Look for permit modules/links
    permit_links = soup.find_all('a', href=re.compile(r'permit|building|planning', re.I))
    permit_modules = []

    for link in permit_links:
        link_text = clean_text(link.get_text())
        if link_text and len(link_text) > 3:
            permit_modules.append(link_text)

    if permit_modules:
        record.processing_instructions = "Available modules: " + ", ".join(permit_modules[:5])
        record.confidence += 0.2

    # Look for fee information
    fee_elements = soup.find_all(text=re.compile(r'fee|cost|charge|payment', re.I))
    fee_links = soup.find_all('a', href=re.compile(r'fee|schedule|cost', re.I))

    fee_info = []
    for element in fee_elements[:3]:  # Limit to avoid noise
        parent = element.parent
        if parent:
            text = clean_text(parent.get_text())
            if text and len(text) > 10:
                fee_info.append(text)

    if fee_links:
        for link in fee_links[:3]:
            fee_info.append(f"Fee schedule: {clean_text(link.get_text())}")

    if fee_info:
        record.permit_fee = " | ".join(fee_info)
        record.confidence += 0.2

    # Look for downloadable applications
    download_links = soup.find_all('a', href=re.compile(r'\.(pdf|doc|docx)$', re.I))
    applications = []

    for link in download_links:
        href = link.get('href')
        title = clean_text(link.get_text()) or link.get('title', '')

        if any(keyword in title.lower() for keyword in ['application', 'form', 'permit']):
            try:
                download = Download(title=title, url=href)
                applications.append(download)
            except:
                continue

    record.downloadable_applications = applications[:5]  # Limit to 5
    if applications:
        record.confidence += 0.2

    # Extract contact information
    contacts = find_contacts(html)
    if contacts['phones']:
        record.phone = contacts['phones'][0]
        record.confidence += 0.1

    if contacts['emails']:
        record.email = contacts['emails'][0]
        record.confidence += 0.1

    # Extract address
    address = find_address_block(soup)
    if address:
        record.address = address
        record.confidence += 0.1

    # Look for hours
    hours_pattern = re.compile(r'hours?:.*?(?:am|pm)', re.I | re.DOTALL)
    hours_match = hours_pattern.search(html)
    if hours_match:
        record.hours = clean_text(hours_match.group())
        record.confidence += 0.1

    # Look for processing time/turnaround
    time_patterns = [
        r'processing time:?\s*([^.]+)',
        r'turnaround:?\s*([^.]+)',
        r'business days:?\s*([^.]+)',
        r'within\s+(\d+\s+(?:business\s+)?days?)'
    ]

    for pattern in time_patterns:
        match = re.search(pattern, html, re.I)
        if match:
            record.turnaround_time = clean_text(match.group(1))
            record.confidence += 0.1
            break

    # Ensure minimum confidence
    record.confidence = min(record.confidence, 1.0)

    return record if record.confidence > 0.1 else None