"""
Main scraper for permit office data
"""
import asyncio
import aiohttp
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException
from playwright.async_api import async_playwright
from typing import List, Optional, Dict, Any
import logging
import re
from urllib.parse import urljoin, urlparse
from datetime import datetime
import time

from models import PermitOffice, ScrapingTarget, ScrapingResult
from geocoding_service import GeocodingService
from config import config

logger = logging.getLogger(__name__)

class PermitOfficeScraper:
    """Main scraper class for permit office data"""
    
    def __init__(self):
        self.geocoding_service = GeocodingService()
        self.session = None
        self.playwright = None
        self.browser = None
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=config.TIMEOUT),
            headers={'User-Agent': config.USER_AGENT}
        )
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=True)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
    
    async def scrape_target(self, target: ScrapingTarget) -> ScrapingResult:
        """Scrape a single target for permit office data"""
        start_time = time.time()
        offices_found = 0
        offices_processed = 0
        errors = []
        
        try:
            logger.info(f"Starting scrape of {target.name} at {target.url}")
            
            # Try different scraping methods
            offices = []
            
            # Method 1: Simple HTTP request with BeautifulSoup
            try:
                offices.extend(await self._scrape_with_requests(target))
            except Exception as e:
                logger.warning(f"Requests scraping failed for {target.name}: {e}")
                errors.append(f"Requests scraping failed: {str(e)}")
            
            # Method 2: Playwright for JavaScript-heavy sites
            if not offices:
                try:
                    offices.extend(await self._scrape_with_playwright(target))
                except Exception as e:
                    logger.warning(f"Playwright scraping failed for {target.name}: {e}")
                    errors.append(f"Playwright scraping failed: {str(e)}")
            
            # Method 3: Selenium as fallback
            if not offices:
                try:
                    offices.extend(await self._scrape_with_selenium(target))
                except Exception as e:
                    logger.warning(f"Selenium scraping failed for {target.name}: {e}")
                    errors.append(f"Selenium scraping failed: {str(e)}")
            
            offices_found = len(offices)
            
            # Process and geocode offices
            for office in offices:
                try:
                    await self._process_office(office, target)
                    offices_processed += 1
                except Exception as e:
                    logger.error(f"Failed to process office {office.department_name}: {e}")
                    errors.append(f"Office processing failed: {str(e)}")
            
            # Rate limiting
            await asyncio.sleep(config.SCRAPING_DELAY)
            
        except Exception as e:
            logger.error(f"Scraping failed for {target.name}: {e}")
            errors.append(f"General scraping error: {str(e)}")
        
        duration = time.time() - start_time
        
        return ScrapingResult(
            target=target,
            success=offices_processed > 0,
            offices_found=offices_found,
            offices_processed=offices_processed,
            errors=errors,
            duration_seconds=duration
        )
    
    async def _scrape_with_requests(self, target: ScrapingTarget) -> List[PermitOffice]:
        """Scrape using aiohttp and BeautifulSoup"""
        offices = []
        
        async with self.session.get(target.url) as response:
            if response.status != 200:
                raise Exception(f"HTTP {response.status}")
            
            html = await response.text()
            soup = BeautifulSoup(html, 'html.parser')
            
            # Extract office data using selectors
            offices = self._extract_offices_from_soup(soup, target)
        
        return offices
    
    async def _scrape_with_playwright(self, target: ScrapingTarget) -> List[PermitOffice]:
        """Scrape using Playwright for JavaScript-heavy sites"""
        offices = []
        
        page = await self.browser.new_page()
        
        try:
            await page.goto(target.url, wait_until='networkidle')
            
            # Wait for content to load
            await page.wait_for_timeout(2000)
            
            # Get page content
            content = await page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Extract office data
            offices = self._extract_offices_from_soup(soup, target)
            
        finally:
            await page.close()
        
        return offices
    
    async def _scrape_with_selenium(self, target: ScrapingTarget) -> List[PermitOffice]:
        """Scrape using Selenium as fallback"""
        offices = []
        
        # Configure Chrome options
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument(f'--user-agent={config.USER_AGENT}')
        
        driver = webdriver.Chrome(options=chrome_options)
        
        try:
            driver.get(target.url)
            
            # Wait for page to load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Get page source
            html = driver.page_source
            soup = BeautifulSoup(html, 'html.parser')
            
            # Extract office data
            offices = self._extract_offices_from_soup(soup, target)
            
        finally:
            driver.quit()
        
        return offices
    
    def _extract_offices_from_soup(self, soup: BeautifulSoup, target: ScrapingTarget) -> List[PermitOffice]:
        """Extract permit office data from BeautifulSoup object"""
        offices = []
        
        # Look for office information using various patterns
        office_elements = self._find_office_elements(soup, target)
        
        for element in office_elements:
            try:
                office = self._parse_office_element(element, target)
                if office:
                    offices.append(office)
            except Exception as e:
                logger.warning(f"Failed to parse office element: {e}")
                continue
        
        return offices
    
    def _find_office_elements(self, soup: BeautifulSoup, target: ScrapingTarget) -> List[BeautifulSoup]:
        """Find elements that might contain office information"""
        elements = []
        
        # Common patterns for office information
        patterns = [
            # Department/office sections
            'div.department, div.office, div.contact-info',
            'section.department, section.office',
            'article.department, article.office',
            
            # Contact information blocks
            'div.contact, div.location, div.address',
            'section.contact, section.location',
            
            # Government-specific patterns
            'div.government-office, div.municipal-office',
            'section.government, section.municipal',
            
            # Generic content areas
            'div.content, div.main-content',
            'main, article, section'
        ]
        
        for pattern in patterns:
            elements.extend(soup.select(pattern))
        
        # If no specific patterns found, look for any div with contact info
        if not elements:
            elements = soup.find_all('div', string=re.compile(r'(phone|email|address|contact)', re.I))
        
        return elements
    
    def _parse_office_element(self, element: BeautifulSoup, target: ScrapingTarget) -> Optional[PermitOffice]:
        """Parse a single office element into PermitOffice object"""
        try:
            # Extract basic information
            department_name = self._extract_text_by_selectors(
                element, 
                target.selectors.get('office_name', 'h1, h2, h3, .title, .name')
            ) or "Unknown Department"
            
            address = self._extract_text_by_selectors(
                element,
                target.selectors.get('address', '.address, .location, .contact-info')
            ) or ""
            
            phone = self._extract_text_by_selectors(
                element,
                target.selectors.get('phone', '.phone, [href^="tel:"]')
            )
            
            email = self._extract_text_by_selectors(
                element,
                target.selectors.get('email', '.email, [href^="mailto:"]')
            )
            
            website = self._extract_href_by_selectors(
                element,
                target.selectors.get('website', '.website, .external-link, [href*="http"]')
            )
            
            # Extract hours information
            hours = self._extract_hours(element, target)
            
            # Determine office type based on content
            office_type = self._determine_office_type(element, department_name)
            
            # Determine services offered
            services = self._determine_services(element, department_name)
            
            # Create PermitOffice object
            office = PermitOffice(
                city=target.city or "Unknown",
                county=target.county or "Unknown",
                state=target.state,
                jurisdiction_type=target.type,
                department_name=department_name,
                office_type=office_type,
                address=address,
                phone=phone,
                email=email,
                website=website,
                **hours,
                **services,
                source_url=target.url,
                scraped_at=datetime.now(),
                confidence_score=self._calculate_confidence_score(element, department_name, address)
            )
            
            return office
            
        except Exception as e:
            logger.error(f"Failed to parse office element: {e}")
            return None
    
    def _extract_text_by_selectors(self, element: BeautifulSoup, selectors: str) -> Optional[str]:
        """Extract text using CSS selectors"""
        if not selectors:
            return None
        
        for selector in selectors.split(', '):
            found = element.select_one(selector.strip())
            if found:
                text = found.get_text(strip=True)
                if text:
                    return text
        
        return None
    
    def _extract_href_by_selectors(self, element: BeautifulSoup, selectors: str) -> Optional[str]:
        """Extract href attribute using CSS selectors"""
        if not selectors:
            return None
        
        for selector in selectors.split(', '):
            found = element.select_one(selector.strip())
            if found and found.get('href'):
                href = found['href']
                # Convert relative URLs to absolute
                if href.startswith('/'):
                    href = urljoin(element.base_url or '', href)
                return href
        
        return None
    
    def _extract_hours(self, element: BeautifulSoup, target: ScrapingTarget) -> Dict[str, Optional[str]]:
        """Extract business hours information"""
        hours = {
            'hours_monday': None,
            'hours_tuesday': None,
            'hours_wednesday': None,
            'hours_thursday': None,
            'hours_friday': None,
            'hours_saturday': None,
            'hours_sunday': None
        }
        
        # Look for hours information
        hours_text = self._extract_text_by_selectors(
            element,
            target.selectors.get('hours', '.hours, .business-hours, .office-hours')
        )
        
        if hours_text:
            # Simple parsing - can be improved
            hours_text = hours_text.lower()
            
            # Look for day-specific hours
            days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            for day in days:
                pattern = rf'{day}[:\s]*([^,\n]+)'
                match = re.search(pattern, hours_text)
                if match:
                    hours[f'hours_{day}'] = match.group(1).strip()
        
        return hours
    
    def _determine_office_type(self, element: BeautifulSoup, department_name: str) -> str:
        """Determine office type based on content"""
        text = (element.get_text() + ' ' + department_name).lower()
        
        if any(word in text for word in ['building', 'construction', 'permit']):
            return 'building'
        elif any(word in text for word in ['planning', 'development']):
            return 'planning'
        elif any(word in text for word in ['zoning', 'land use']):
            return 'zoning'
        else:
            return 'combined'
    
    def _determine_services(self, element: BeautifulSoup, department_name: str) -> Dict[str, bool]:
        """Determine services offered based on content"""
        text = (element.get_text() + ' ' + department_name).lower()
        
        services = {
            'building_permits': False,
            'electrical_permits': False,
            'plumbing_permits': False,
            'mechanical_permits': False,
            'zoning_permits': False,
            'planning_review': False,
            'inspections': False,
            'online_applications': False,
            'online_payments': False,
            'permit_tracking': False
        }
        
        # Check for specific services
        if any(word in text for word in ['building permit', 'construction permit']):
            services['building_permits'] = True
        
        if any(word in text for word in ['electrical permit', 'electrical']):
            services['electrical_permits'] = True
        
        if any(word in text for word in ['plumbing permit', 'plumbing']):
            services['plumbing_permits'] = True
        
        if any(word in text for word in ['mechanical permit', 'hvac', 'mechanical']):
            services['mechanical_permits'] = True
        
        if any(word in text for word in ['zoning permit', 'zoning']):
            services['zoning_permits'] = True
        
        if any(word in text for word in ['planning review', 'planning']):
            services['planning_review'] = True
        
        if any(word in text for word in ['inspection', 'inspect']):
            services['inspections'] = True
        
        if any(word in text for word in ['online application', 'apply online', 'digital']):
            services['online_applications'] = True
        
        if any(word in text for word in ['online payment', 'pay online', 'digital payment']):
            services['online_payments'] = True
        
        if any(word in text for word in ['track permit', 'permit status', 'tracking']):
            services['permit_tracking'] = True
        
        return services
    
    def _calculate_confidence_score(self, element: BeautifulSoup, department_name: str, address: str) -> float:
        """Calculate confidence score for scraped data"""
        score = 0.0
        
        # Base score
        if department_name and department_name != "Unknown Department":
            score += 0.3
        
        if address:
            score += 0.3
        
        # Check for contact information
        if element.find('a', href=re.compile(r'tel:')):
            score += 0.1
        
        if element.find('a', href=re.compile(r'mailto:')):
            score += 0.1
        
        if element.find('a', href=re.compile(r'http')):
            score += 0.1
        
        # Check for government indicators
        text = element.get_text().lower()
        if any(word in text for word in ['permit', 'building', 'planning', 'zoning']):
            score += 0.1
        
        return min(score, 1.0)
    
    async def _process_office(self, office: PermitOffice, target: ScrapingTarget):
        """Process a single office (geocoding, validation, etc.)"""
        # Geocode address if not already done
        if not office.latitude or not office.longitude:
            if office.address:
                geocoding_result = await self.geocoding_service.geocode_address(office.address)
                if geocoding_result:
                    office.latitude = geocoding_result.latitude
                    office.longitude = geocoding_result.longitude
                    office.city = geocoding_result.city or office.city
                    office.county = geocoding_result.county or office.county
                    office.state = geocoding_result.state or office.state
        
        # TODO: Save to database
        logger.info(f"Processed office: {office.department_name} in {office.city}, {office.state}")
    
    async def scrape_all_targets(self, targets: List[ScrapingTarget]) -> List[ScrapingResult]:
        """Scrape all targets concurrently"""
        results = []
        
        # Process targets in batches to avoid overwhelming servers
        batch_size = 3
        for i in range(0, len(targets), batch_size):
            batch = targets[i:i + batch_size]
            
            # Process batch concurrently
            tasks = [self.scrape_target(target) for target in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in batch_results:
                if isinstance(result, ScrapingResult):
                    results.append(result)
                elif isinstance(result, Exception):
                    logger.error(f"Scraping batch failed: {result}")
            
            # Rate limiting between batches
            await asyncio.sleep(2)
        
        return results
