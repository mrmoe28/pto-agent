"""
Generic fallback parser for when no specific platform is detected.
"""
import re
from bs4 import BeautifulSoup
from typing import List, Optional
from ..models import Record, Download
from ..utils import clean_text, find_contacts, find_address_block, html_table_to_2d, guess_jurisdiction


def parse(url: str, html: str, soup: BeautifulSoup, seed_meta: Optional[dict] = None) -> Optional[Record]:
    """
    Generic heuristic parser for permit pages when no platform is detected.
    """
    record = Record(
        source_url=url,
        platform="unknown",
        confidence=0.0
    )

    # Extract jurisdiction info
    state, county, city = guess_jurisdiction(html, seed_meta)
    record.state = state or "Unknown"
    record.county = county
    record.city = city

    # Look for department name in headers
    dept_selectors = [
        'h1', 'h2', '.page-title', '.header-title',
        '.department-name', '.agency-name', '.site-title'
    ]

    for selector in dept_selectors:
        elements = soup.select(selector)
        for element in elements:
            text = clean_text(element.get_text())
            if text and any(keyword in text.lower() for keyword in ['building', 'planning', 'permit', 'development', 'code']):
                record.department_name = text
                record.confidence += 0.2
                break

    # Look for fee information using headings and patterns
    fee_patterns = [
        r'(fee|schedule|valuation|plan review).*?(?=\n|\.|;|$)',
        r'fee schedule:?\s*([^.]+)',
        r'permit fee:?\s*([^.]+)',
        r'cost:?\s*([^.]+)'
    ]

    fee_headings = soup.find_all(['h1', 'h2', 'h3', 'h4'], text=re.compile(r'fee|schedule|valuation|plan review', re.I))
    fee_info = []

    # Extract fee information from headings and following content
    for heading in fee_headings[:3]:
        next_sibling = heading.find_next_sibling()
        if next_sibling:
            text = clean_text(next_sibling.get_text())
            if text and len(text) > 10:
                fee_info.append(text[:200])

    # Look for fee patterns in text
    for pattern in fee_patterns:
        matches = re.findall(pattern, html, re.I)
        for match in matches[:3]:
            cleaned = clean_text(match)
            if cleaned and len(cleaned) > 5:
                fee_info.append(cleaned)

    # Look for fee tables
    tables = soup.find_all('table')
    for table in tables[:3]:
        table_text = clean_text(table.get_text())
        if any(keyword in table_text.lower() for keyword in ['fee', 'cost', '$', 'permit', 'plan review']):
            table_data = html_table_to_2d(table)
            if table_data and len(table_data) > 1:
                # Summarize table content
                headers = table_data[0] if table_data else []
                fee_info.append(f"Fee table: {', '.join(headers[:3])} ({len(table_data)} rows)")

    if fee_info:
        record.permit_fee = " | ".join(fee_info[:3])
        record.confidence += 0.2

    # Look for processing instructions
    process_patterns = [
        r'(how to apply|process|instructions|steps|requirements).*?(?=\n\n|\.|;|$)',
        r'application process:?\s*([^.]+)',
        r'how to apply:?\s*([^.]+)',
        r'permit process:?\s*([^.]+)'
    ]

    process_headings = soup.find_all(['h1', 'h2', 'h3', 'h4'], text=re.compile(r'how to apply|process|instructions|steps|requirements', re.I))
    process_info = []

    # Extract processing information from headings
    for heading in process_headings[:3]:
        next_content = heading.find_next(['p', 'div', 'ul', 'ol'])
        if next_content:
            text = clean_text(next_content.get_text())
            if text and len(text) > 15:
                process_info.append(text[:300])

    # Look for process patterns in text
    for pattern in process_patterns:
        matches = re.findall(pattern, html, re.I | re.DOTALL)
        for match in matches[:2]:
            cleaned = clean_text(match)
            if cleaned and len(cleaned) > 20:
                process_info.append(cleaned[:300])

    if process_info:
        record.processing_instructions = " | ".join(process_info[:2])
        record.confidence += 0.2

    # Look for turnaround time information
    time_patterns = [
        r'(turnaround|business days|processing time|timeline).*?(\d+\s+(?:business\s+)?days?)',
        r'review period:?\s*(\d+\s+(?:business\s+)?days?)',
        r'processing time:?\s*(\d+\s+(?:business\s+)?days?)',
        r'approval.*?(\d+\s+(?:business\s+)?days?)'
    ]

    for pattern in time_patterns:
        match = re.search(pattern, html, re.I)
        if match:
            record.turnaround_time = clean_text(match.group())
            record.confidence += 0.2
            break

    # Look for downloadable applications and forms
    download_patterns = [
        (r'application.*?\.pdf', 'application'),
        (r'form.*?\.pdf', 'form'),
        (r'permit.*?\.pdf', 'permit'),
        (r'checklist.*?\.pdf', 'checklist')
    ]

    applications = []

    # Find PDF links with relevant text
    pdf_links = soup.find_all('a', href=re.compile(r'\.pdf$', re.I))
    for link in pdf_links:
        href = link.get('href')
        title = clean_text(link.get_text()) or link.get('title', '')

        if title and any(keyword in title.lower() for keyword in ['application', 'form', 'permit', 'checklist']):
            try:
                download = Download(title=title, url=href)
                applications.append(download)
            except:
                continue

    # Find links with form/application text
    form_links = soup.find_all('a', text=re.compile(r'application|form', re.I))
    for link in form_links:
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

    # Extract contact information
    contacts = find_contacts(html)
    if contacts['phones']:
        record.phone = contacts['phones'][0]
        record.confidence += 0.2

    if contacts['emails']:
        record.email = contacts['emails'][0]
        record.confidence += 0.2

    # Extract address
    address = find_address_block(soup)
    if address:
        record.address = address
        record.confidence += 0.1

    # Look for office hours
    hours_patterns = [
        r'office hours?:?\s*([^.]+(?:am|pm)[^.]*)',
        r'hours of operation:?\s*([^.]+(?:am|pm)[^.]*)',
        r'business hours?:?\s*([^.]+(?:am|pm)[^.]*)',
        r'open:?\s*([^.]+(?:am|pm)[^.]*)'
    ]

    for pattern in hours_patterns:
        match = re.search(pattern, html, re.I)
        if match:
            record.hours = clean_text(match.group(1))
            record.confidence += 0.1
            break

    # Ensure minimum confidence threshold
    if record.confidence < 0.1:
        return None

    # Cap confidence at 1.0
    record.confidence = min(record.confidence, 1.0)

    return record