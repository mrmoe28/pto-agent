"""
Salesforce Experience Cloud platform detection and parsing.
"""
import re
from bs4 import BeautifulSoup
from typing import List, Optional, Union
from ...models import Record, Download
from ...utils import clean_text, find_contacts, find_address_block, html_table_to_2d, guess_jurisdiction


def detect(url: str, html: str) -> bool:
    """Detect if page is using Salesforce Experience Cloud platform."""
    indicators = [
        '.force.com',
        'force.com/public',
        'Experience Cloud',
        'lightning',
        'salesforce',
        'sfdcApp',
        'lightning-container'
    ]

    url_lower = url.lower()
    html_lower = html.lower()

    for indicator in indicators:
        if indicator.lower() in url_lower or indicator.lower() in html_lower:
            return True

    return False


def parse(url: str, html: str, soup: BeautifulSoup) -> Optional[Record]:
    """Parse Salesforce Experience Cloud page for permit information."""
    if not detect(url, html):
        return None

    record = Record(
        source_url=url,
        platform="salesforce-exp",
        confidence=0.1
    )

    # Extract jurisdiction info
    state, county, city = guess_jurisdiction(html)
    record.state = state or "Unknown"
    record.county = county
    record.city = city

    # Look for department/agency name
    dept_selectors = [
        '.slds-page-header__title', '.community-header-title',
        'h1', '.page-title', '.site-title', '.header-title'
    ]

    for selector in dept_selectors:
        elements = soup.select(selector)
        for element in elements:
            text = clean_text(element.get_text())
            if text and len(text) > 3:
                record.department_name = text
                record.confidence += 0.1
                break

    # Salesforce Experience often has card-based layouts
    card_elements = soup.find_all(['div'], class_=re.compile(r'card|tile|component', re.I))
    services = []

    for card in card_elements:
        text = clean_text(card.get_text())
        if text and any(keyword in text.lower() for keyword in ['permit', 'application', 'license', 'inspection']):
            services.append(text[:100])  # Truncate for readability

    if services:
        record.processing_instructions = "Available services: " + " | ".join(services[:3])
        record.confidence += 0.2

    # Look for lightning components that might contain forms
    lightning_elements = soup.find_all(['div'], class_=re.compile(r'lightning|slds', re.I))
    form_info = []

    for element in lightning_elements:
        # Look for form-related content
        form_text = element.find_all(text=re.compile(r'form|application|submit|apply', re.I))
        for text in form_text[:3]:
            parent = text.parent
            if parent:
                parent_text = clean_text(parent.get_text())
                if parent_text and len(parent_text) > 15:
                    form_info.append(parent_text[:150])

    if form_info:
        if not record.processing_instructions:
            record.processing_instructions = " | ".join(form_info)
        record.confidence += 0.1

    # Look for fee information
    fee_elements = soup.find_all(text=re.compile(r'fee|cost|charge|\$\d+', re.I))
    fee_info = []

    for element in fee_elements[:3]:
        parent = element.parent
        if parent:
            text = clean_text(parent.get_text())
            if text and len(text) > 10 and any(char in text for char in ['$', 'fee', 'cost']):
                fee_info.append(text[:150])

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
        '.contact-hours', '.hours', '.office-info',
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