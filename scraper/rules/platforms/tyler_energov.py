"""
Tyler EnerGov platform detection and parsing.
"""
import re
from bs4 import BeautifulSoup
from typing import List, Optional, Union
from ...models import Record, Download
from ...utils import clean_text, find_contacts, find_address_block, html_table_to_2d, guess_jurisdiction


def detect(url: str, html: str) -> bool:
    """Detect if page is using Tyler EnerGov platform."""
    indicators = [
        '/energov/',
        'EnerGov',
        'Tyler Technologies',
        'energov.aspx',
        'EnerGovProd',
        'Tyler EnerGov'
    ]

    url_lower = url.lower()
    html_lower = html.lower()

    for indicator in indicators:
        if indicator.lower() in url_lower or indicator.lower() in html_lower:
            return True

    return False


def parse(url: str, html: str, soup: BeautifulSoup) -> Optional[Record]:
    """Parse Tyler EnerGov page for permit information."""
    if not detect(url, html):
        return None

    # Extract jurisdiction info first
    state, county, city = guess_jurisdiction(html)

    record = Record(
        source_url=url,
        platform="tyler-energov",
        state=state or "Unknown",
        county=county,
        city=city,
        confidence=0.1
    )

    # Look for department/agency name
    dept_selectors = [
        '.site-header h1', '.agency-name', '.department-title',
        'h1', '.page-title', '.header-content'
    ]

    for selector in dept_selectors:
        elements = soup.select(selector)
        for element in elements:
            text = clean_text(element.get_text())
            if text and len(text) > 3:
                record.department_name = text
                record.confidence += 0.1
                break

    # Look for permit types and services
    service_elements = soup.find_all(['div', 'li', 'a'], text=re.compile(r'permit|license|inspection|plan review', re.I))
    services = []

    for element in service_elements[:5]:
        text = clean_text(element.get_text())
        if text and len(text) > 5:
            services.append(text)

    if services:
        record.processing_instructions = "Available services: " + ", ".join(services)
        record.confidence += 0.2

    # Look for fee schedules - Tyler EnerGov often has dedicated fee sections
    fee_links = soup.find_all('a', href=re.compile(r'fee|schedule|cost|valuation', re.I))
    fee_sections = soup.find_all(['div', 'section'], class_=re.compile(r'fee|cost', re.I))

    fee_info = []

    for link in fee_links[:3]:
        href = link.get('href')
        text = clean_text(link.get_text())
        if text:
            fee_info.append(f"Fee schedule: {text}")

    for section in fee_sections[:2]:
        text = clean_text(section.get_text())
        if text and len(text) > 20:
            fee_info.append(text[:200])

    # Look for fee tables
    fee_tables = soup.find_all('table')
    for table in fee_tables[:2]:
        # Check if table contains fee-related content
        table_text = clean_text(table.get_text())
        if any(keyword in table_text.lower() for keyword in ['fee', 'cost', '$', 'permit', 'plan review']):
            table_data = html_table_to_2d(table)
            if table_data and len(table_data) > 1:
                fee_info.append(f"Fee table: {len(table_data)} items listed")

    if fee_info:
        record.permit_fee = " | ".join(fee_info)
        record.confidence += 0.2

    # Look for downloadable forms and applications
    doc_patterns = [
        r'application.*?\.pdf',
        r'form.*?\.pdf',
        r'permit.*?\.pdf',
        r'checklist.*?\.pdf'
    ]

    applications = []

    # Find PDF links
    pdf_links = soup.find_all('a', href=re.compile(r'\.pdf$', re.I))
    for link in pdf_links:
        href = link.get('href')
        title = clean_text(link.get_text()) or link.get('title', '')

        if any(keyword in title.lower() for keyword in ['application', 'form', 'permit', 'checklist']):
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
        r'plan review.*?(\d+\s+(?:business\s+)?days?)',
        r'processing.*?(\d+\s+(?:business\s+)?days?)',
        r'turnaround.*?(\d+\s+(?:business\s+)?days?)',
        r'review period.*?(\d+\s+(?:business\s+)?days?)'
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