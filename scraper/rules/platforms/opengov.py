"""
OpenGov platform detection and parsing.
"""
import re
from bs4 import BeautifulSoup
from typing import List, Optional, Union
from ...models import Record, Download
from ...utils import clean_text, find_contacts, find_address_block, html_table_to_2d, guess_jurisdiction


def detect(url: str, html: str) -> bool:
    """Detect if page is using OpenGov platform."""
    indicators = [
        'opengov.com',
        'app.opengov.com',
        'forms.opengov.com',
        'OpenGov',
        'opengov-forms',
        'data-opengov'
    ]

    url_lower = url.lower()
    html_lower = html.lower()

    for indicator in indicators:
        if indicator.lower() in url_lower or indicator.lower() in html_lower:
            return True

    return False


def parse(url: str, html: str, soup: BeautifulSoup) -> Optional[Record]:
    """Parse OpenGov page for permit information."""
    if not detect(url, html):
        return None

    record = Record(
        source_url=url,
        platform="opengov",
        confidence=0.1
    )

    # Extract jurisdiction info
    state, county, city = guess_jurisdiction(html)
    record.state = state or "Unknown"
    record.county = county
    record.city = city

    # Look for department/agency name
    dept_selectors = [
        '.organization-name', '.agency-name', 'h1',
        '.header-title', '.site-title', '.department-title'
    ]

    for selector in dept_selectors:
        elements = soup.select(selector)
        for element in elements:
            text = clean_text(element.get_text())
            if text and len(text) > 3:
                record.department_name = text
                record.confidence += 0.1
                break

    # OpenGov often has public forms - look for form listings
    form_elements = soup.find_all(['div', 'li'], class_=re.compile(r'form|service|permit', re.I))
    forms = []

    for element in form_elements:
        text = clean_text(element.get_text())
        if text and any(keyword in text.lower() for keyword in ['permit', 'application', 'license', 'inspection']):
            forms.append(text)

    if forms:
        record.processing_instructions = "Available forms: " + ", ".join(forms[:5])
        record.confidence += 0.2

    # Look for fee information - OpenGov often shows fees inline with forms
    fee_elements = soup.find_all(['span', 'div'], text=re.compile(r'\$\d+', re.I))
    fee_text = soup.find_all(text=re.compile(r'fee.*?\$|cost.*?\$', re.I))

    fee_info = []

    for element in fee_elements[:3]:
        parent = element.parent if hasattr(element, 'parent') else element
        text = clean_text(parent.get_text() if hasattr(parent, 'get_text') else str(parent))
        if text and len(text) > 10:
            fee_info.append(text)

    for text in fee_text[:3]:
        parent = text.parent
        if parent:
            parent_text = clean_text(parent.get_text())
            if parent_text and len(parent_text) > 10:
                fee_info.append(parent_text[:100])

    if fee_info:
        record.permit_fee = " | ".join(fee_info)
        record.confidence += 0.2

    # Look for downloadable documents
    doc_links = soup.find_all('a', href=re.compile(r'\.(pdf|doc|docx)$', re.I))
    applications = []

    for link in doc_links:
        href = link.get('href')
        title = clean_text(link.get_text()) or link.get('title', '')

        if title and any(keyword in title.lower() for keyword in ['application', 'form', 'permit', 'guide']):
            try:
                download = Download(title=title, url=href)
                applications.append(download)
            except:
                continue

    record.downloadable_applications = applications[:5]
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

    # Look for office hours
    hours_selectors = [
        '.hours', '.office-hours', '.contact-info',
        '.business-hours', '.operating-hours'
    ]

    for selector in hours_selectors:
        elements = soup.select(selector)
        for element in elements:
            text = clean_text(element.get_text())
            if 'hour' in text.lower() and any(time in text.lower() for time in ['am', 'pm', ':']):
                record.hours = text
                record.confidence += 0.1
                break

    # Look for processing times
    time_patterns = [
        r'processing.*?(\d+\s+(?:business\s+)?days?)',
        r'review.*?(\d+\s+(?:business\s+)?days?)',
        r'turnaround.*?(\d+\s+(?:business\s+)?days?)',
        r'within.*?(\d+\s+(?:business\s+)?days?)'
    ]

    for pattern in time_patterns:
        match = re.search(pattern, html, re.I)
        if match:
            record.turnaround_time = clean_text(match.group())
            record.confidence += 0.1
            break

    # Ensure confidence is capped
    record.confidence = min(record.confidence, 1.0)

    return record if record.confidence > 0.1 else None