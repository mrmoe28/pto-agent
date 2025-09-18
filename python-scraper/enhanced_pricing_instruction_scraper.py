"""
Enhanced scraper specifically for detailed pricing and permit submission instructions
Searches multiple pages per office to collect comprehensive data
"""
import asyncio
import aiohttp
from bs4 import BeautifulSoup
from playwright.async_api import async_playwright
from typing import List, Optional, Dict, Any, Tuple
import logging
import re
from urllib.parse import urljoin, urlparse
from datetime import datetime
import time
import json
from dataclasses import dataclass

from models import PermitOffice
from geocoding_service import GeocodingService
from enhanced_data_extractor import EnhancedDataExtractor
from config import config

logger = logging.getLogger(__name__)

@dataclass
class PricingInstructionData:
    """Data structure for detailed pricing and instruction information"""
    permit_fees: Dict[str, Any]
    detailed_instructions: Dict[str, Any]
    downloadable_applications: Dict[str, List[str]]
    processing_times: Dict[str, Any]
    required_documents: List[str]
    application_process: str
    fee_schedules: List[Dict[str, Any]]
    online_portals: List[str]
    contact_info: Dict[str, str]

class EnhancedPricingInstructionScraper:
    """Enhanced scraper for detailed pricing and instruction data"""
    
    def __init__(self):
        self.geocoding_service = GeocodingService()
        self.data_extractor = EnhancedDataExtractor()
        self.session = None
        self.playwright = None
        self.browser = None
        
        # Enhanced patterns for pricing and instruction extraction
        self.pricing_patterns = [
            r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)',  # $1,234.56
            r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*dollars?',  # 1234.56 dollars
            r'fee[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # fee: $123.45
            r'cost[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # cost: $123.45
            r'price[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # price: $123.45
            r'application\s*fee[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # application fee: $123.45
            r'permit\s*fee[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # permit fee: $123.45
            r'building\s*permit[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # building permit: $123.45
            r'electrical\s*permit[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # electrical permit: $123.45
            r'plumbing\s*permit[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # plumbing permit: $123.45
            r'mechanical\s*permit[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # mechanical permit: $123.45
            r'zoning\s*permit[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # zoning permit: $123.45
        ]
        
        # Instruction patterns
        self.instruction_patterns = [
            r'instructions?[:\s]*(.+?)(?:\n|$)',  # instructions: ...
            r'how\s+to\s+apply[:\s]*(.+?)(?:\n|$)',  # how to apply: ...
            r'application\s+process[:\s]*(.+?)(?:\n|$)',  # application process: ...
            r'requirements?[:\s]*(.+?)(?:\n|$)',  # requirements: ...
            r'procedures?[:\s]*(.+?)(?:\n|$)',  # procedures: ...
            r'guidelines?[:\s]*(.+?)(?:\n|$)',  # guidelines: ...
            r'steps?[:\s]*(.+?)(?:\n|$)',  # steps: ...
            r'checklist[:\s]*(.+?)(?:\n|$)',  # checklist: ...
        ]
        
        # Page types to search for each office
        self.page_types = [
            'fees', 'pricing', 'costs', 'permit-fees', 'fee-schedule',
            'instructions', 'how-to-apply', 'application-process', 'requirements',
            'forms', 'applications', 'downloads', 'documents',
            'online', 'portal', 'e-permits', 'electronic-permits',
            'contact', 'office-hours', 'location', 'address'
        ]
    
    async def scrape_enhanced_data(self, office: PermitOffice) -> PricingInstructionData:
        """Scrape enhanced pricing and instruction data for a specific office"""
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent=config.USER_AGENT,
                    viewport={'width': 1920, 'height': 1080}
                )
                page = await context.new_page()
                
                # Get the base URL from the office
                base_url = office.website or f"https://{office.city.lower().replace(' ', '')}.gov"
                
                # Search for multiple pages
                pricing_data = await self._search_pricing_pages(page, base_url, office)
                instruction_data = await self._search_instruction_pages(page, base_url, office)
                application_data = await self._search_application_pages(page, base_url, office)
                portal_data = await self._search_portal_pages(page, base_url, office)
                
                await browser.close()
                
                # Combine all data
                return PricingInstructionData(
                    permit_fees=pricing_data.get('permit_fees', {}),
                    detailed_instructions=instruction_data.get('instructions', {}),
                    downloadable_applications=application_data.get('applications', {}),
                    processing_times=pricing_data.get('processing_times', {}),
                    required_documents=instruction_data.get('required_documents', []),
                    application_process=instruction_data.get('application_process', ''),
                    fee_schedules=pricing_data.get('fee_schedules', []),
                    online_portals=portal_data.get('portals', []),
                    contact_info=portal_data.get('contact_info', {})
                )
                
        except Exception as e:
            logger.error(f"Error scraping enhanced data for {office.department_name}: {e}")
            return PricingInstructionData(
                permit_fees={},
                detailed_instructions={},
                downloadable_applications={},
                processing_times={},
                required_documents=[],
                application_process='',
                fee_schedules=[],
                online_portals=[],
                contact_info={}
            )
    
    async def _search_pricing_pages(self, page, base_url: str, office: PermitOffice) -> Dict[str, Any]:
        """Search for pricing and fee information"""
        pricing_data = {
            'permit_fees': {},
            'processing_times': {},
            'fee_schedules': []
        }
        
        # Search for pricing-related pages
        pricing_urls = await self._find_pricing_urls(page, base_url)
        
        for url in pricing_urls:
            try:
                await page.goto(url, wait_until='networkidle', timeout=30000)
                await asyncio.sleep(2)
                
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                
                # Extract fees
                fees = self._extract_detailed_fees(soup)
                pricing_data['permit_fees'].update(fees)
                
                # Extract processing times
                times = self._extract_processing_times(soup)
                pricing_data['processing_times'].update(times)
                
                # Extract fee schedules
                schedules = self._extract_fee_schedules(soup)
                pricing_data['fee_schedules'].extend(schedules)
                
            except Exception as e:
                logger.warning(f"Error scraping pricing page {url}: {e}")
                continue
        
        return pricing_data
    
    async def _search_instruction_pages(self, page, base_url: str, office: PermitOffice) -> Dict[str, Any]:
        """Search for instruction and requirement information"""
        instruction_data = {
            'instructions': {},
            'required_documents': [],
            'application_process': ''
        }
        
        # Search for instruction-related pages
        instruction_urls = await self._find_instruction_urls(page, base_url)
        
        for url in instruction_urls:
            try:
                await page.goto(url, wait_until='networkidle', timeout=30000)
                await asyncio.sleep(2)
                
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                
                # Extract instructions
                instructions = self._extract_detailed_instructions(soup)
                instruction_data['instructions'].update(instructions)
                
                # Extract required documents
                documents = self._extract_required_documents(soup)
                instruction_data['required_documents'].extend(documents)
                
                # Extract application process
                process = self._extract_application_process(soup)
                if process:
                    instruction_data['application_process'] = process
                
            except Exception as e:
                logger.warning(f"Error scraping instruction page {url}: {e}")
                continue
        
        return instruction_data
    
    async def _search_application_pages(self, page, base_url: str, office: PermitOffice) -> Dict[str, Any]:
        """Search for application forms and downloads"""
        application_data = {
            'applications': {}
        }
        
        # Search for application-related pages
        application_urls = await self._find_application_urls(page, base_url)
        
        for url in application_urls:
            try:
                await page.goto(url, wait_until='networkidle', timeout=30000)
                await asyncio.sleep(2)
                
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                
                # Extract downloadable applications
                applications = self._extract_downloadable_applications(soup, url)
                application_data['applications'].update(applications)
                
            except Exception as e:
                logger.warning(f"Error scraping application page {url}: {e}")
                continue
        
        return application_data
    
    async def _search_portal_pages(self, page, base_url: str, office: PermitOffice) -> Dict[str, Any]:
        """Search for online portals and contact information"""
        portal_data = {
            'portals': [],
            'contact_info': {}
        }
        
        # Search for portal-related pages
        portal_urls = await self._find_portal_urls(page, base_url)
        
        for url in portal_urls:
            try:
                await page.goto(url, wait_until='networkidle', timeout=30000)
                await asyncio.sleep(2)
                
                content = await page.content()
                soup = BeautifulSoup(content, 'html.parser')
                
                # Extract online portals
                portals = self._extract_online_portals(soup, url)
                portal_data['portals'].extend(portals)
                
                # Extract contact information
                contact = self._extract_contact_info(soup)
                portal_data['contact_info'].update(contact)
                
            except Exception as e:
                logger.warning(f"Error scraping portal page {url}: {e}")
                continue
        
        return portal_data
    
    async def _find_pricing_urls(self, page, base_url: str) -> List[str]:
        """Find URLs related to pricing and fees"""
        urls = []
        
        try:
            # Search for pricing-related links
            pricing_keywords = ['fee', 'pricing', 'cost', 'permit-fee', 'fee-schedule']
            
            for keyword in pricing_keywords:
                # Try different URL patterns
                patterns = [
                    f"{base_url}/{keyword}",
                    f"{base_url}/{keyword}s",
                    f"{base_url}/permit-{keyword}",
                    f"{base_url}/building-{keyword}",
                    f"{base_url}/application-{keyword}",
                ]
                
                for pattern in patterns:
                    try:
                        response = await page.goto(pattern, wait_until='networkidle', timeout=10000)
                        if response and response.status == 200:
                            urls.append(pattern)
                    except:
                        continue
                
                # Search for links on the main page
                try:
                    await page.goto(base_url, wait_until='networkidle', timeout=30000)
                    links = await page.query_selector_all(f"a[href*='{keyword}']")
                    for link in links:
                        href = await link.get_attribute('href')
                        if href:
                            full_url = urljoin(base_url, href)
                            urls.append(full_url)
                except:
                    continue
        
        except Exception as e:
            logger.warning(f"Error finding pricing URLs: {e}")
        
        return list(set(urls))  # Remove duplicates
    
    async def _find_instruction_urls(self, page, base_url: str) -> List[str]:
        """Find URLs related to instructions and requirements"""
        urls = []
        
        try:
            instruction_keywords = ['instruction', 'how-to', 'application-process', 'requirement', 'guideline']
            
            for keyword in instruction_keywords:
                patterns = [
                    f"{base_url}/{keyword}",
                    f"{base_url}/{keyword}s",
                    f"{base_url}/permit-{keyword}",
                    f"{base_url}/building-{keyword}",
                ]
                
                for pattern in patterns:
                    try:
                        response = await page.goto(pattern, wait_until='networkidle', timeout=10000)
                        if response and response.status == 200:
                            urls.append(pattern)
                    except:
                        continue
                
                # Search for links on the main page
                try:
                    await page.goto(base_url, wait_until='networkidle', timeout=30000)
                    links = await page.query_selector_all(f"a[href*='{keyword}']")
                    for link in links:
                        href = await link.get_attribute('href')
                        if href:
                            full_url = urljoin(base_url, href)
                            urls.append(full_url)
                except:
                    continue
        
        except Exception as e:
            logger.warning(f"Error finding instruction URLs: {e}")
        
        return list(set(urls))
    
    async def _find_application_urls(self, page, base_url: str) -> List[str]:
        """Find URLs related to applications and forms"""
        urls = []
        
        try:
            application_keywords = ['form', 'application', 'download', 'document', 'permit-application']
            
            for keyword in application_keywords:
                patterns = [
                    f"{base_url}/{keyword}",
                    f"{base_url}/{keyword}s",
                    f"{base_url}/permit-{keyword}",
                    f"{base_url}/building-{keyword}",
                ]
                
                for pattern in patterns:
                    try:
                        response = await page.goto(pattern, wait_until='networkidle', timeout=10000)
                        if response and response.status == 200:
                            urls.append(pattern)
                    except:
                        continue
                
                # Search for links on the main page
                try:
                    await page.goto(base_url, wait_until='networkidle', timeout=30000)
                    links = await page.query_selector_all(f"a[href*='{keyword}']")
                    for link in links:
                        href = await link.get_attribute('href')
                        if href:
                            full_url = urljoin(base_url, href)
                            urls.append(full_url)
                except:
                    continue
        
        except Exception as e:
            logger.warning(f"Error finding application URLs: {e}")
        
        return list(set(urls))
    
    async def _find_portal_urls(self, page, base_url: str) -> List[str]:
        """Find URLs related to online portals and contact info"""
        urls = []
        
        try:
            portal_keywords = ['portal', 'online', 'e-permit', 'electronic', 'contact', 'office-hours']
            
            for keyword in portal_keywords:
                patterns = [
                    f"{base_url}/{keyword}",
                    f"{base_url}/{keyword}s",
                    f"{base_url}/permit-{keyword}",
                ]
                
                for pattern in patterns:
                    try:
                        response = await page.goto(pattern, wait_until='networkidle', timeout=10000)
                        if response and response.status == 200:
                            urls.append(pattern)
                    except:
                        continue
                
                # Search for links on the main page
                try:
                    await page.goto(base_url, wait_until='networkidle', timeout=30000)
                    links = await page.query_selector_all(f"a[href*='{keyword}']")
                    for link in links:
                        href = await link.get_attribute('href')
                        if href:
                            full_url = urljoin(base_url, href)
                            urls.append(full_url)
                except:
                    continue
        
        except Exception as e:
            logger.warning(f"Error finding portal URLs: {e}")
        
        return list(set(urls))
    
    def _extract_detailed_fees(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract detailed fee information from a page"""
        fees = {}
        text_content = soup.get_text().lower()
        
        # Look for fee tables
        tables = soup.find_all('table')
        for table in tables:
            table_fees = self._parse_fee_table(table)
            fees.update(table_fees)
        
        # Look for fee sections
        fee_sections = soup.find_all(['div', 'section'], class_=re.compile(r'fee|cost|price|pricing', re.I))
        for section in fee_sections:
            section_fees = self._extract_fees_from_text(section.get_text())
            fees.update(section_fees)
        
        # Extract from entire page text
        page_fees = self._extract_fees_from_text(text_content)
        fees.update(page_fees)
        
        return fees
    
    def _extract_processing_times(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract processing time information"""
        times = {}
        text_content = soup.get_text()
        
        # Look for processing time patterns
        for pattern in self.data_extractor.time_patterns:
            matches = re.finditer(pattern, text_content, re.IGNORECASE)
            for match in matches:
                min_time = int(match.group(1)) if match.group(1) else 0
                max_time = int(match.group(2)) if match.group(2) else min_time
                
                # Determine permit type from context
                context = text_content[max(0, match.start()-100):match.end()+100].lower()
                permit_type = self._determine_permit_type(context)
                
                times[permit_type] = {
                    'min': min_time,
                    'max': max_time,
                    'unit': 'days' if 'day' in match.group(0) else 'weeks' if 'week' in match.group(0) else 'hours',
                    'description': match.group(0).strip()
                }
        
        return times
    
    def _extract_detailed_instructions(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract detailed instruction information"""
        instructions = {}
        text_content = soup.get_text()
        
        # Look for instruction sections
        instruction_sections = soup.find_all(['div', 'section'], class_=re.compile(r'instruction|guideline|requirement|process', re.I))
        
        for section in instruction_sections:
            section_text = section.get_text()
            permit_type = self._determine_permit_type(section_text)
            
            if permit_type not in instructions:
                instructions[permit_type] = section_text.strip()
        
        # Extract from entire page
        for pattern in self.instruction_patterns:
            matches = re.finditer(pattern, text_content, re.IGNORECASE | re.DOTALL)
            for match in matches:
                instruction_text = match.group(1).strip()
                permit_type = self._determine_permit_type(instruction_text)
                
                if permit_type not in instructions:
                    instructions[permit_type] = instruction_text
        
        return instructions
    
    def _extract_required_documents(self, soup: BeautifulSoup) -> List[str]:
        """Extract required documents list"""
        documents = []
        
        # Look for document lists
        lists = soup.find_all(['ul', 'ol'])
        for list_elem in lists:
            list_text = list_elem.get_text().lower()
            if any(keyword in list_text for keyword in ['required', 'document', 'checklist', 'submission']):
                items = list_elem.find_all('li')
                for item in items:
                    doc_text = item.get_text().strip()
                    if doc_text and len(doc_text) > 5:
                        documents.append(doc_text)
        
        return documents
    
    def _extract_application_process(self, soup: BeautifulSoup) -> str:
        """Extract application process description"""
        text_content = soup.get_text()
        
        # Look for process sections
        process_keywords = ['application process', 'how to apply', 'steps', 'procedure']
        
        for keyword in process_keywords:
            pattern = rf'{keyword}[:\s]*(.+?)(?:\n\n|\n[A-Z]|$)'
            match = re.search(pattern, text_content, re.IGNORECASE | re.DOTALL)
            if match:
                return match.group(1).strip()
        
        return ''
    
    def _extract_downloadable_applications(self, soup: BeautifulSoup, base_url: str) -> Dict[str, List[str]]:
        """Extract downloadable application forms"""
        applications = {}
        
        # Look for PDF and document links
        links = soup.find_all('a', href=True)
        for link in links:
            href = link['href']
            text = link.get_text().strip().lower()
            
            if any(ext in href.lower() for ext in ['.pdf', '.doc', '.docx']):
                full_url = urljoin(base_url, href)
                
                # Determine permit type from link text or context
                permit_type = self._determine_permit_type(text)
                
                if permit_type not in applications:
                    applications[permit_type] = []
                
                applications[permit_type].append(full_url)
        
        return applications
    
    def _extract_online_portals(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Extract online portal URLs"""
        portals = []
        
        # Look for portal links
        links = soup.find_all('a', href=True)
        for link in links:
            href = link['href']
            text = link.get_text().strip().lower()
            
            if any(keyword in text for keyword in ['portal', 'online', 'e-permit', 'electronic', 'apply online']):
                full_url = urljoin(base_url, href)
                portals.append(full_url)
        
        return portals
    
    def _extract_contact_info(self, soup: BeautifulSoup) -> Dict[str, str]:
        """Extract contact information"""
        contact = {}
        
        # Extract phone numbers
        phone_pattern = r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        phone_matches = re.findall(phone_pattern, soup.get_text())
        if phone_matches:
            contact['phone'] = phone_matches[0]
        
        # Extract email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_matches = re.findall(email_pattern, soup.get_text())
        if email_matches:
            contact['email'] = email_matches[0]
        
        return contact
    
    def _extract_fees_from_text(self, text: str) -> Dict[str, Any]:
        """Extract fees from text content"""
        fees = {}
        
        for pattern in self.pricing_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                amount = float(match.group(1).replace(',', ''))
                
                # Get context around the match
                start = max(0, match.start() - 50)
                end = min(len(text), match.end() + 50)
                context = text[start:end].lower()
                
                # Determine permit type from context
                permit_type = self._determine_permit_type(context)
                
                if permit_type not in fees:
                    fees[permit_type] = {
                        'amount': amount,
                        'description': context.strip(),
                        'unit': 'permit'
                    }
        
        return fees
    
    def _parse_fee_table(self, table) -> Dict[str, Any]:
        """Parse fee information from a table"""
        fees = {}
        
        try:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    permit_type = cells[0].get_text().strip().lower()
                    fee_text = cells[1].get_text().strip()
                    
                    # Extract amount from fee text
                    amount_match = re.search(r'\$?(\d+(?:,\d{3})*(?:\.\d{2})?)', fee_text)
                    if amount_match:
                        amount = float(amount_match.group(1).replace(',', ''))
                        
                        # Map permit type
                        mapped_type = self._determine_permit_type(permit_type)
                        
                        fees[mapped_type] = {
                            'amount': amount,
                            'description': fee_text,
                            'unit': 'permit'
                        }
        except Exception as e:
            logger.warning(f"Error parsing fee table: {e}")
        
        return fees
    
    def _extract_fee_schedules(self, soup: BeautifulSoup) -> List[Dict[str, Any]]:
        """Extract fee schedule information"""
        schedules = []
        
        # Look for fee schedule tables
        tables = soup.find_all('table')
        for table in tables:
            table_text = table.get_text().lower()
            if any(keyword in table_text for keyword in ['fee', 'cost', 'price', 'schedule']):
                schedule = self._parse_fee_schedule_table(table)
                if schedule:
                    schedules.append(schedule)
        
        return schedules
    
    def _parse_fee_schedule_table(self, table) -> Dict[str, Any]:
        """Parse a fee schedule table"""
        schedule = {
            'title': 'Fee Schedule',
            'fees': []
        }
        
        try:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    fee_item = {
                        'description': cells[0].get_text().strip(),
                        'amount': cells[1].get_text().strip() if len(cells) > 1 else '',
                        'unit': cells[2].get_text().strip() if len(cells) > 2 else ''
                    }
                    schedule['fees'].append(fee_item)
        except Exception as e:
            logger.warning(f"Error parsing fee schedule table: {e}")
        
        return schedule
    
    def _determine_permit_type(self, text: str) -> str:
        """Determine permit type from text context"""
        text_lower = text.lower()
        
        for permit_type, keywords in self.data_extractor.permit_type_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                return permit_type
        
        return 'general'

# Example usage
async def main():
    """Example usage of the enhanced pricing instruction scraper"""
    scraper = EnhancedPricingInstructionScraper()
    
    # Example office
    office = PermitOffice(
        id="test-office",
        city="Atlanta",
        county="Fulton",
        state="GA",
        jurisdiction_type="county",
        department_name="Fulton County Building & Development",
        office_type="building",
        address="123 Main St, Atlanta, GA 30309",
        phone="(404) 555-0123",
        email="building@fultoncountyga.gov",
        website="https://www.fultoncountyga.gov/services/building-and-development"
    )
    
    # Scrape enhanced data
    enhanced_data = await scraper.scrape_enhanced_data(office)
    
    print("Enhanced Pricing and Instruction Data:")
    print(json.dumps(enhanced_data.__dict__, indent=2, default=str))

if __name__ == "__main__":
    asyncio.run(main())
