"""
CivicPlus platform detection and parsing.
"""
import re
from bs4 import BeautifulSoup
from typing import List, Optional, Union
from ...models import Record, Download
from ...utils import clean_text, find_contacts, find_address_block, html_table_to_2d, guess_jurisdiction


def detect(url: str, html: str) -> bool:
    """Detect if page is using CivicPlus platform."""
    indicators = [
        'CivicPlus',
        'civicplus',
        '/DocumentCenter/View/',
        'CivicWeb',
        'CMS by CivicPlus',
        'civicplus.com'
    ]

    url_lower = url.lower()
    html_lower = html.lower()

    for indicator in indicators:
        if indicator.lower() in url_lower or indicator.lower() in html_lower:
            return True

    return False


def parse(url: str, html: str, soup: BeautifulSoup) -> Optional[Record]:
    """Parse CivicPlus page for permit information."""
    if not detect(url, html):
        return None

    record = Record(
        source_url=url,
        platform="civicplus",
        confidence=0.1
    )

    # Extract jurisdiction info
    state, county, city = guess_jurisdiction(html)
    record.state = state or "Unknown"
    record.county = county
    record.city = city

    # Look for department/agency name
    dept_selectors = [
        '.page-title', '.department-title', 'h1',
        '.site-title', '.breadcrumb', '.header-title'
    ]

    for selector in dept_selectors:
        elements = soup.select(selector)
        for element in elements:
            text = clean_text(element.get_text())
            if text and any(keyword in text.lower() for keyword in ['building', 'planning', 'development', 'permit']):
                record.department_name = text
                record.confidence += 0.1
                break

    # CivicPlus often has document centers - look for permit-related documents
    doc_links = soup.find_all('a', href=re.compile(r'/DocumentCenter/|\.pdf$', re.I))
    applications = []

    for link in doc_links:
        href = link.get('href')
        title = clean_text(link.get_text()) or link.get('title', '')

        if title and any(keyword in title.lower() for keyword in ['application', 'form', 'permit', 'checklist', 'guide']):
            try:
                download = Download(title=title, url=href)
                applications.append(download)
            except:
                continue

    record.downloadable_applications = applications[:5]
    if applications:
        record.confidence += 0.2

    # Look for permit information in page content
    permit_content = soup.find_all(['div', 'section'], text=re.compile(r'permit|building|planning', re.I))
    permit_info = []

    for element in permit_content[:3]:
        parent = element.parent if hasattr(element, 'parent') else element
        if hasattr(parent, 'get_text'):
            text = clean_text(parent.get_text())
            if text and len(text) > 30:
                permit_info.append(text[:200])

    if permit_info:
        record.processing_instructions = " | ".join(permit_info)
        record.confidence += 0.2

    # Look for fee schedules - CivicPlus often has PDF fee schedules
    fee_links = soup.find_all('a', text=re.compile(r'fee|schedule|cost|pricing', re.I))
    fee_pdfs = soup.find_all('a', href=re.compile(r'fee.*\.pdf|schedule.*\.pdf', re.I))

    fee_info = []

    for link in fee_links[:3]:
        text = clean_text(link.get_text())
        if text:
            fee_info.append(f"Fee document: {text}")

    for link in fee_pdfs[:3]:
        href = link.get('href')
        title = clean_text(link.get_text()) or href.split('/')[-1]
        fee_info.append(f"PDF fee schedule: {title}")

    # Look for fee tables in content
    fee_tables = soup.find_all('table')
    for table in fee_tables[:2]:
        table_text = clean_text(table.get_text())
        if any(keyword in table_text.lower() for keyword in ['fee', 'cost', '$', 'permit']):
            table_data = html_table_to_2d(table)
            if table_data:
                fee_info.append(f"Fee table with {len(table_data)} items")

    if fee_info:
        record.permit_fee = " | ".join(fee_info)
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
    hours_patterns = [
        r'office hours?:?\s*([^.]+(?:am|pm)[^.]*)',
        r'hours of operation:?\s*([^.]+(?:am|pm)[^.]*)',
        r'business hours?:?\s*([^.]+(?:am|pm)[^.]*)'
    ]

    for pattern in hours_patterns:
        match = re.search(pattern, html, re.I)
        if match:
            record.hours = clean_text(match.group(1))
            record.confidence += 0.1
            break

    # Look for processing times
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