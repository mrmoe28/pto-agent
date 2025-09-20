"""
FastTrack platform detection and parsing.
Orange County FL and similar proprietary permit systems.
"""
import re
from bs4 import BeautifulSoup
from typing import List, Optional, Union
from ...models import Record, Download
from ...utils import clean_text, find_contacts, find_address_block, html_table_to_2d, guess_jurisdiction


def detect(url: str, html: str) -> bool:
    """Detect if page is using FastTrack platform."""
    indicators = [
        'fasttrack.',
        '/onlineservices/',
        'FastTrack',
        'Online Services',
        'Building Permit Services',
        'County Building Department',
        'Permit Portal'
    ]

    url_lower = url.lower()
    html_lower = html.lower()

    for indicator in indicators:
        if indicator.lower() in url_lower or indicator.lower() in html_lower:
            return True

    return False


def parse(url: str, html: str, soup: BeautifulSoup) -> Optional[Record]:
    """Parse FastTrack page for permit information."""
    if not detect(url, html):
        return None

    # Extract jurisdiction info first
    state, county, city = guess_jurisdiction(html)

    record = Record(
        source_url=url,
        platform="fasttrack",
        state=state or "Unknown",
        county=county,
        city=city,
        confidence=0.1
    )

    # Look for department/agency name
    dept_selectors = [
        '.department-header', '.agency-title', 'h1', 'h2',
        '.page-title', '.header-text', '.site-title'
    ]

    for selector in dept_selectors:
        elements = soup.select(selector)
        for element in elements:
            text = clean_text(element.get_text())
            if text and any(keyword in text.lower() for keyword in ['building', 'planning', 'development', 'permit']):
                record.department_name = text
                record.confidence += 0.2
                break

    # Look for permit services and information
    service_sections = soup.find_all(['div', 'section', 'td'],
                                   class_=re.compile(r'service|permit|building|application', re.I))

    service_info = []
    for section in service_sections:
        text = clean_text(section.get_text())
        if text and len(text) > 15 and len(text) < 300:
            # Look for permit-related content
            if any(keyword in text.lower() for keyword in ['permit', 'license', 'inspection', 'application']):
                service_info.append(text[:200])  # Truncate for readability

    if service_info:
        record.processing_instructions = " | ".join(service_info[:3])
        record.confidence += 0.3

    # Look for documents and forms
    doc_links = soup.find_all('a', href=re.compile(r'\.(pdf|doc|docx)', re.I))
    applications = []

    for link in doc_links:
        href = link.get('href')
        title = clean_text(link.get_text())

        # Filter for permit-related documents
        if any(keyword in title.lower() for keyword in ['permit', 'application', 'form', 'checklist']):
            try:
                # Handle relative URLs
                if href.startswith('/'):
                    from urllib.parse import urljoin
                    href = urljoin(url, href)
                elif not href.startswith('http'):
                    continue

                download = Download(title=title, url=href)
                applications.append(download)
            except:
                continue

    record.downloadable_applications = applications[:5]
    if applications:
        record.confidence += 0.2

    # Look for fee information in tables and text
    fee_tables = soup.find_all('table', class_=re.compile(r'fee|cost|charge', re.I))
    fee_elements = soup.find_all(['div', 'p', 'li'],
                                text=re.compile(r'fee.*\$|cost.*\$|\$\d+', re.I))

    fee_info = []

    # Extract table-based fee information
    for table in fee_tables[:2]:
        table_data = html_table_to_2d(table)
        if table_data and len(table_data) > 1:
            # Look for fee-related headers
            headers = table_data[0] if table_data[0] else []
            if any('fee' in str(header).lower() or 'cost' in str(header).lower() for header in headers):
                summary = f"Fee schedule with {len(table_data)-1} permit types"
                fee_info.append(summary)

    # Extract text-based fee information
    for element in fee_elements[:3]:
        if isinstance(element, str):
            text = clean_text(element)
        else:
            text = clean_text(element.get_text()) if hasattr(element, 'get_text') else str(element)

        if text and len(text) > 10 and len(text) < 200:
            fee_info.append(text)

    if fee_info:
        record.permit_fee = " | ".join(fee_info[:3])
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
    hours_elements = soup.find_all(['div', 'p', 'span'],
                                  text=re.compile(r'hours?.*:.*[ap]m|[ap]m.*hours?|monday.*friday', re.I))

    for element in hours_elements:
        text = clean_text(element if isinstance(element, str) else element.get_text())
        if 'hour' in text.lower() and any(time in text.lower() for time in ['am', 'pm', ':']):
            record.hours = text[:100]  # Limit length
            record.confidence += 0.1
            break

    # Look for processing timeframes
    time_patterns = [
        r'processing.*?(\d+\s+(?:business\s+)?days?)',
        r'review.*?(\d+\s+(?:business\s+)?days?)',
        r'turnaround.*?(\d+\s+(?:business\s+)?days?)',
        r'approval.*?(\d+\s+(?:business\s+)?days?)'
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