"""
Specialized scraper for government permit fee information
Targets specific fee pages and pricing documents
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

logger = logging.getLogger(__name__)

@dataclass
class FeeData:
    """Data structure for fee information"""
    permit_type: str
    amount: float
    unit: str
    description: str
    source_url: str
    source_text: str

class GovernmentFeeScraper:
    """Specialized scraper for government permit fees"""
    
    def __init__(self):
        # Common government fee page patterns
        self.fee_page_patterns = [
            'fees', 'fee-schedule', 'fee-schedules', 'pricing', 'costs',
            'permit-fees', 'building-fees', 'application-fees',
            'fee-estimator', 'fee-calculator', 'permit-costs',
            'development-fees', 'planning-fees', 'zoning-fees',
            'electrical-fees', 'plumbing-fees', 'mechanical-fees'
        ]
        
        # Enhanced fee extraction patterns
        self.fee_patterns = [
            # Dollar amounts
            r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)',
            r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*dollars?',
            
            # Fee-specific patterns
            r'fee[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',
            r'cost[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',
            r'price[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',
            r'charge[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',
            
            # Permit-specific patterns
            r'building\s*permit[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',
            r'electrical\s*permit[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',
            r'plumbing\s*permit[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',
            r'mechanical\s*permit[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',
            r'zoning\s*permit[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',
            r'planning\s*permit[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',
            
            # Application fees
            r'application\s*fee[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',
            r'permit\s*application[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',
            
            # Inspection fees
            r'inspection\s*fee[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',
            r'plan\s*review[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',
            
            # Table patterns
            r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*per\s*(?:sq\.?\s*ft\.?|square\s*foot|sf)',
            r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*per\s*(?:dwelling\s*unit|unit)',
            r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*per\s*(?:project|permit)',
        ]
        
        # Permit type keywords for categorization
        self.permit_type_keywords = {
            'building': ['building', 'construction', 'structural', 'residential', 'commercial', 'new construction', 'addition', 'renovation'],
            'electrical': ['electrical', 'electric', 'wiring', 'outlet', 'fixture', 'panel', 'service', 'circuit'],
            'plumbing': ['plumbing', 'water', 'sewer', 'drain', 'pipe', 'fixture', 'water heater', 'toilet', 'sink'],
            'mechanical': ['mechanical', 'hvac', 'heating', 'cooling', 'ventilation', 'air conditioning', 'furnace', 'ductwork'],
            'zoning': ['zoning', 'land use', 'development', 'planning', 'variance', 'special use', 'conditional use'],
            'general': ['permit', 'application', 'general', 'miscellaneous', 'other']
        }
    
    async def scrape_government_fees(self, base_url: str, office_name: str) -> List[FeeData]:
        """Scrape fee information from government websites"""
        fees = []
        
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    viewport={'width': 1920, 'height': 1080}
                )
                page = await context.new_page()
                
                # Find fee-related pages
                fee_urls = await self._find_fee_pages(page, base_url)
                logger.info(f"Found {len(fee_urls)} fee-related pages for {office_name}")
                
                # Scrape each fee page
                for url in fee_urls:
                    try:
                        page_fees = await self._scrape_fee_page(page, url, office_name)
                        fees.extend(page_fees)
                        await asyncio.sleep(1)  # Be respectful
                    except Exception as e:
                        logger.warning(f"Error scraping fee page {url}: {e}")
                        continue
                
                await browser.close()
                
        except Exception as e:
            logger.error(f"Error scraping fees for {office_name}: {e}")
        
        return fees
    
    async def _find_fee_pages(self, page, base_url: str) -> List[str]:
        """Find fee-related pages on the government website"""
        fee_urls = []
        
        try:
            # First, try to find fee pages by common URL patterns
            for pattern in self.fee_page_patterns:
                test_urls = [
                    f"{base_url}/{pattern}",
                    f"{base_url}/{pattern}/",
                    f"{base_url}/permit-{pattern}",
                    f"{base_url}/building-{pattern}",
                    f"{base_url}/planning-{pattern}",
                    f"{base_url}/development-{pattern}",
                ]
                
                for test_url in test_urls:
                    try:
                        response = await page.goto(test_url, wait_until='networkidle', timeout=10000)
                        if response and response.status == 200:
                            fee_urls.append(test_url)
                            logger.info(f"Found fee page: {test_url}")
                    except:
                        continue
            
            # Also search for fee links on the main page
            try:
                await page.goto(base_url, wait_until='networkidle', timeout=30000)
                
                # Look for fee-related links
                fee_keywords = ['fee', 'cost', 'price', 'pricing', 'schedule']
                for keyword in fee_keywords:
                    links = await page.query_selector_all(f"a[href*='{keyword}']")
                    for link in links:
                        href = await link.get_attribute('href')
                        if href:
                            full_url = urljoin(base_url, href)
                            if full_url not in fee_urls:
                                fee_urls.append(full_url)
                                logger.info(f"Found fee link: {full_url}")
                
                # Look for PDF links that might contain fee schedules
                pdf_links = await page.query_selector_all("a[href$='.pdf']")
                for link in pdf_links:
                    href = await link.get_attribute('href')
                    text = await link.inner_text()
                    if href and any(keyword in text.lower() for keyword in ['fee', 'cost', 'price', 'schedule']):
                        full_url = urljoin(base_url, href)
                        if full_url not in fee_urls:
                            fee_urls.append(full_url)
                            logger.info(f"Found fee PDF: {full_url}")
                
            except Exception as e:
                logger.warning(f"Error searching for fee links on main page: {e}")
        
        except Exception as e:
            logger.error(f"Error finding fee pages: {e}")
        
        return list(set(fee_urls))  # Remove duplicates
    
    async def _scrape_fee_page(self, page, url: str, office_name: str) -> List[FeeData]:
        """Scrape fee information from a specific page"""
        fees = []
        
        try:
            await page.goto(url, wait_until='networkidle', timeout=30000)
            await asyncio.sleep(2)
            
            content = await page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Extract fees from tables
            table_fees = self._extract_fees_from_tables(soup, url)
            fees.extend(table_fees)
            
            # Extract fees from text
            text_fees = self._extract_fees_from_text(soup, url)
            fees.extend(text_fees)
            
            # Extract fees from lists
            list_fees = self._extract_fees_from_lists(soup, url)
            fees.extend(list_fees)
            
            logger.info(f"Extracted {len(fees)} fees from {url}")
            
        except Exception as e:
            logger.warning(f"Error scraping fee page {url}: {e}")
        
        return fees
    
    def _extract_fees_from_tables(self, soup: BeautifulSoup, source_url: str) -> List[FeeData]:
        """Extract fees from HTML tables"""
        fees = []
        
        tables = soup.find_all('table')
        for table in tables:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    # Look for fee information in the row
                    row_text = row.get_text()
                    
                    # Extract amounts from the row
                    for pattern in self.fee_patterns:
                        matches = re.finditer(pattern, row_text, re.IGNORECASE)
                        for match in matches:
                            try:
                                amount = float(match.group(1).replace(',', ''))
                                
                                # Determine permit type from context
                                permit_type = self._determine_permit_type(row_text)
                                
                                # Get description from the row
                                description = row_text.strip()
                                
                                fee = FeeData(
                                    permit_type=permit_type,
                                    amount=amount,
                                    unit='permit',
                                    description=description,
                                    source_url=source_url,
                                    source_text=row_text
                                )
                                fees.append(fee)
                                
                            except (ValueError, IndexError):
                                continue
        
        return fees
    
    def _extract_fees_from_text(self, soup: BeautifulSoup, source_url: str) -> List[FeeData]:
        """Extract fees from page text"""
        fees = []
        
        # Get all text content
        text_content = soup.get_text()
        
        # Look for fee patterns in the text
        for pattern in self.fee_patterns:
            matches = re.finditer(pattern, text_content, re.IGNORECASE)
            for match in matches:
                try:
                    amount = float(match.group(1).replace(',', ''))
                    
                    # Get context around the match
                    start = max(0, match.start() - 100)
                    end = min(len(text_content), match.end() + 100)
                    context = text_content[start:end]
                    
                    # Determine permit type from context
                    permit_type = self._determine_permit_type(context)
                    
                    # Only include if it's a reasonable fee amount (between $1 and $10,000)
                    if 1 <= amount <= 10000:
                        fee = FeeData(
                            permit_type=permit_type,
                            amount=amount,
                            unit='permit',
                            description=context.strip(),
                            source_url=source_url,
                            source_text=context
                        )
                        fees.append(fee)
                        
                except (ValueError, IndexError):
                    continue
        
        return fees
    
    def _extract_fees_from_lists(self, soup: BeautifulSoup, source_url: str) -> List[FeeData]:
        """Extract fees from HTML lists"""
        fees = []
        
        lists = soup.find_all(['ul', 'ol'])
        for list_elem in lists:
            items = list_elem.find_all('li')
            for item in items:
                item_text = item.get_text()
                
                # Look for fee information in the list item
                for pattern in self.fee_patterns:
                    matches = re.finditer(pattern, item_text, re.IGNORECASE)
                    for match in matches:
                        try:
                            amount = float(match.group(1).replace(',', ''))
                            
                            # Determine permit type from context
                            permit_type = self._determine_permit_type(item_text)
                            
                            # Only include if it's a reasonable fee amount
                            if 1 <= amount <= 10000:
                                fee = FeeData(
                                    permit_type=permit_type,
                                    amount=amount,
                                    unit='permit',
                                    description=item_text.strip(),
                                    source_url=source_url,
                                    source_text=item_text
                                )
                                fees.append(fee)
                                
                        except (ValueError, IndexError):
                            continue
        
        return fees
    
    def _determine_permit_type(self, text: str) -> str:
        """Determine permit type from text context"""
        text_lower = text.lower()
        
        for permit_type, keywords in self.permit_type_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                return permit_type
        
        return 'general'

# Example usage
async def main():
    """Example usage of the government fee scraper"""
    scraper = GovernmentFeeScraper()
    
    # Test with a few government websites
    test_urls = [
        ("Fulton County", "https://www.fultoncountyga.gov/services/building-and-development"),
        ("DeKalb County", "https://www.dekalbcountyga.gov/planning-and-sustainability"),
        ("Cobb County", "https://www.cobbcounty.org/community-development"),
    ]
    
    for office_name, url in test_urls:
        print(f"\nScraping fees for {office_name}...")
        fees = await scraper.scrape_government_fees(url, office_name)
        
        print(f"Found {len(fees)} fees:")
        for fee in fees[:5]:  # Show first 5 fees
            print(f"  {fee.permit_type}: ${fee.amount} - {fee.description[:100]}...")

if __name__ == "__main__":
    asyncio.run(main())
