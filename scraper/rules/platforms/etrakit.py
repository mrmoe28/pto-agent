"""
eTRAKiT platform detection and parsing.
"""
import re
from bs4 import BeautifulSoup
from typing import List, Optional, Union
from ...models import Record, Download
from ...utils import clean_text, find_contacts, find_address_block, html_table_to_2d, guess_jurisdiction


def detect(url: str, html: str) -> bool:
    """Detect if page is using eTRAKiT platform."""
    indicators = [
        '/etrakit/',
        'eTRAKiT',
        'etrakit',
        'BSA eTRAKiT',
        'Building Safety & Accessibility',
        'etrakit.aspx'
    ]

    url_lower = url.lower()
    html_lower = html.lower()

    for indicator in indicators:
        if indicator.lower() in url_lower or indicator.lower() in html_lower:
            return True

    return False


def parse(url: str, html: str, soup: BeautifulSoup) -> Optional[Record]:
    """Parse eTRAKiT page for permit information."""
    if not detect(url, html):
        return None

    # Extract jurisdiction info first
    state, county, city = guess_jurisdiction(html)

    record = Record(
        source_url=url,
        platform="etrakit",
        state=state or "Unknown",
        county=county,
        city=city,
        confidence=0.1
    )

    # Look for department/agency name
    dept_selectors = [
        '.agency-title', '.department-name', 'h1',
        '.page-header', '.site-title', '.header-text'
    ]

    for selector in dept_selectors:
        elements = soup.select(selector)
        for element in elements:
            text = clean_text(element.get_text())
            if text and any(keyword in text.lower() for keyword in ['building', 'planning', 'safety', 'code']):
                record.department_name = text
                record.confidence += 0.1
                break

    # Look for permit information and modules
    permit_sections = soup.find_all(['div', 'section'], class_=re.compile(r'permit|building', re.I))
    permit_info = []

    for section in permit_sections:
        text = clean_text(section.get_text())
        if text and len(text) > 20:
            permit_info.append(text[:200])  # Truncate for readability

    if permit_info:
        record.processing_instructions = " | ".join(permit_info[:3])
        record.confidence += 0.2

    # Look for documents and forms
    doc_links = soup.find_all('a', text=re.compile(r'document|form|permit|application', re.I))
    applications = []

    for link in doc_links:
        href = link.get('href')
        if href and any(ext in href.lower() for ext in ['.pdf', '.doc', '.docx']):
            title = clean_text(link.get_text())
            try:
                download = Download(title=title, url=href)
                applications.append(download)
            except:
                continue

    record.downloadable_applications = applications[:5]
    if applications:
        record.confidence += 0.2

    # Look for fee schedules
    fee_elements = soup.find_all(text=re.compile(r'fee schedule|fee structure|cost|charge', re.I))
    fee_tables = soup.find_all('table', class_=re.compile(r'fee|cost', re.I))

    fee_info = []

    # Extract text-based fee information
    for element in fee_elements[:3]:
        parent = element.parent
        if parent:
            text = clean_text(parent.get_text())
            if text and len(text) > 10:
                fee_info.append(text[:150])

    # Extract table-based fee information
    for table in fee_tables[:2]:
        table_data = html_table_to_2d(table)
        if table_data:
            # Summarize table content
            summary = f"Fee table with {len(table_data)} rows"
            if len(table_data[0]) > 1:
                summary += f", columns: {', '.join(table_data[0][:3])}"
            fee_info.append(summary)

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
    hours_selectors = [
        '.hours', '.office-hours', '.contact-hours',
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

    # Look for processing timeframes
    time_patterns = [
        r'processing.*?(\d+\s+(?:business\s+)?days?)',
        r'turnaround.*?(\d+\s+(?:business\s+)?days?)',
        r'review.*?(\d+\s+(?:business\s+)?days?)',
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