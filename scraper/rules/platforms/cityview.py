"""
CityView platform detection and parsing.
"""
import re
from bs4 import BeautifulSoup
from typing import List, Optional, Union
from ...models import Record, Download
from ...utils import clean_text, find_contacts, find_address_block, html_table_to_2d, guess_jurisdiction


def detect(url: str, html: str) -> bool:
    """Detect if page is using CityView platform."""
    indicators = [
        'CityView',
        'cityview',
        'Cartegraph',
        'CityView portal',
        'cityview.aspx',
        'Cartegraph CityView'
    ]

    url_lower = url.lower()
    html_lower = html.lower()

    for indicator in indicators:
        if indicator.lower() in url_lower or indicator.lower() in html_lower:
            return True

    return False


def parse(url: str, html: str, soup: BeautifulSoup) -> Optional[Record]:
    """Parse CityView page for permit information."""
    if not detect(url, html):
        return None

    # Extract jurisdiction info first
    state, county, city = guess_jurisdiction(html)

    record = Record(
        source_url=url,
        platform="cityview",
        state=state or "Unknown",
        county=county,
        city=city,
        confidence=0.1
    )

    # Look for department/agency name
    dept_selectors = [
        '.header-title', '.site-title', 'h1',
        '.department-name', '.agency-name', '.page-header'
    ]

    for selector in dept_selectors:
        elements = soup.select(selector)
        for element in elements:
            text = clean_text(element.get_text())
            if text and len(text) > 3:
                record.department_name = text
                record.confidence += 0.1
                break

    # CityView often has tabbed interfaces
    tab_elements = soup.find_all(['div', 'li'], class_=re.compile(r'tab|nav', re.I))
    permit_tabs = []

    for tab in tab_elements:
        text = clean_text(tab.get_text())
        if text and any(keyword in text.lower() for keyword in ['permit', 'building', 'planning', 'inspection']):
            permit_tabs.append(text)

    if permit_tabs:
        record.processing_instructions = "Available sections: " + ", ".join(permit_tabs[:5])
        record.confidence += 0.2

    # Look for documents grid (common in CityView)
    doc_grids = soup.find_all(['div', 'table'], class_=re.compile(r'grid|document|file', re.I))
    documents = []

    for grid in doc_grids:
        links = grid.find_all('a', href=re.compile(r'\.(pdf|doc|docx)$', re.I))
        for link in links:
            href = link.get('href')
            title = clean_text(link.get_text()) or link.get('title', '')

            if title and any(keyword in title.lower() for keyword in ['application', 'form', 'permit']):
                try:
                    download = Download(title=title, url=href)
                    documents.append(download)
                except:
                    continue

    record.downloadable_applications = documents[:5]
    if documents:
        record.confidence += 0.2

    # Look for fee information
    fee_elements = soup.find_all(text=re.compile(r'fee|cost|charge|payment', re.I))
    fee_links = soup.find_all('a', text=re.compile(r'fee|schedule|cost', re.I))

    fee_info = []

    for element in fee_elements[:3]:
        parent = element.parent
        if parent:
            text = clean_text(parent.get_text())
            if text and len(text) > 15 and '$' in text:
                fee_info.append(text[:150])

    for link in fee_links[:3]:
        text = clean_text(link.get_text())
        if text:
            fee_info.append(f"Fee info: {text}")

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
    hours_elements = soup.find_all(['div', 'p'], text=re.compile(r'hours?.*?(?:am|pm)', re.I))
    for element in hours_elements:
        text = clean_text(element.get_text())
        if 'hour' in text.lower():
            record.hours = text
            record.confidence += 0.1
            break

    # Look for processing times
    time_patterns = [
        r'processing time.*?(\d+\s+(?:business\s+)?days?)',
        r'review.*?(\d+\s+(?:business\s+)?days?)',
        r'turnaround.*?(\d+\s+(?:business\s+)?days?)'
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