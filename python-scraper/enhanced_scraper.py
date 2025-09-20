"""
Enhanced scraper for permit office data with sophisticated extraction
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
from typing import List, Optional, Dict, Any, Tuple
import logging
import re
from urllib.parse import urljoin, urlparse
from datetime import datetime
import time
import json

from models import PermitOffice, ScrapingTarget, ScrapingResult
from geocoding_service import GeocodingService
from enhanced_data_extractor import EnhancedDataExtractor
from robots_checker import RobotsChecker
from rate_limiter import IntelligentRateLimiter
from config import config

logger = logging.getLogger(__name__)

class EnhancedPermitOfficeScraper:
    """Enhanced scraper with sophisticated data extraction capabilities"""
    
    def __init__(self):
        self.geocoding_service = GeocodingService()
        self.data_extractor = EnhancedDataExtractor()
        self.robots_checker = RobotsChecker(user_agent=config.USER_AGENT)
        self.rate_limiter = IntelligentRateLimiter(
            base_delay=config.SCRAPING_DELAY,
            requests_per_minute=config.RATE_LIMIT_REQUESTS // 60  # Convert hourly to per minute
        )
        self.session = None
        self.playwright = None
        self.browser = None
        
        # Enhanced patterns for data extraction
        self.phone_patterns = [
            r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',  # (123) 456-7890
            r'\d{3}[-.\s]?\d{3}[-.\s]?\d{4}',        # 123-456-7890
            r'\(\d{3}\)\s?\d{3}-\d{4}',              # (123) 456-7890
        ]
        
        self.email_patterns = [
            r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        ]
        
        self.address_patterns = [
            r'\d+\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Circle|Cir|Court|Ct|Place|Pl)',
            r'\d+\s+[A-Za-z0-9\s,.-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Circle|Cir|Court|Ct|Place|Pl)[^,]*,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}',
        ]
        
        self.hours_patterns = [
            r'(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[:\s]*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\s*[-–]\s*\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?',
            r'(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[:\s]*\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}',
        ]
        
        # Service keywords for permit types
        self.permit_keywords = {
            'building_permits': ['building', 'construction', 'structural', 'residential', 'commercial'],
            'electrical_permits': ['electrical', 'electric', 'wiring', 'outlet', 'fixture'],
            'plumbing_permits': ['plumbing', 'water', 'sewer', 'drain', 'pipe', 'fixture'],
            'mechanical_permits': ['mechanical', 'hvac', 'heating', 'cooling', 'ventilation'],
            'zoning_permits': ['zoning', 'land use', 'development', 'planning'],
            'planning_review': ['planning', 'review', 'approval', 'development'],
            'inspections': ['inspection', 'inspect', 'code enforcement', 'compliance']
        }
    
    async def __aenter__(self):
        """Async context manager entry"""
        # Enhanced headers for government websites
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        }
        
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=config.TIMEOUT),
            headers=headers
        )
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-dev-shm-usage']
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit with proper error handling"""
        errors = []

        # Close session with timeout
        if self.session:
            try:
                await asyncio.wait_for(self.session.close(), timeout=5.0)
            except Exception as e:
                errors.append(f"Session close error: {e}")
                logger.warning(f"Failed to close session gracefully: {e}")

        # Close browser with timeout
        if self.browser:
            try:
                await asyncio.wait_for(self.browser.close(), timeout=10.0)
            except Exception as e:
                errors.append(f"Browser close error: {e}")
                logger.warning(f"Failed to close browser gracefully: {e}")

        # Stop playwright with timeout
        if self.playwright:
            try:
                await asyncio.wait_for(self.playwright.stop(), timeout=5.0)
            except Exception as e:
                errors.append(f"Playwright stop error: {e}")
                logger.warning(f"Failed to stop playwright gracefully: {e}")

        # Log any cleanup errors but don't raise them during exit
        if errors:
            logger.error(f"Resource cleanup errors: {errors}")
    
    async def scrape_target(self, target: ScrapingTarget) -> ScrapingResult:
        """Enhanced scraping with multiple extraction strategies"""
        start_time = time.time()
        offices_found = 0
        offices_processed = 0
        errors = []

        try:
            logger.info(f"Starting enhanced scrape of {target.name} at {target.url}")

            # Check robots.txt compliance first
            if not await self.robots_checker.is_crawling_allowed(target.url):
                logger.warning(f"Robots.txt disallows crawling {target.url}, skipping")
                return ScrapingResult(
                    target=target,
                    success=False,
                    offices_found=0,
                    offices_processed=0,
                    duration_seconds=time.time() - start_time,
                    errors=["Crawling disallowed by robots.txt"]
                )

            # Get crawl delay from robots.txt and apply intelligent rate limiting
            robots_delay = await self.robots_checker.get_crawl_delay(target.url)
            actual_delay = await self.rate_limiter.wait_for_request(target.url, robots_delay)
            logger.debug(f"Applied {actual_delay:.2f}s delay for {target.url}")

            # Try different scraping methods
            offices = []
            
            # Method 1: Enhanced HTTP request with BeautifulSoup
            try:
                offices.extend(await self._scrape_with_enhanced_requests(target))
            except Exception as e:
                logger.warning(f"Enhanced requests scraping failed for {target.name}: {e}")
                errors.append(f"Enhanced requests scraping failed: {str(e)}")
            
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
            
            # Process and geocode offices with enhanced data
            for office in offices:
                try:
                    await self._enhance_office_data(office, target)
                    await self._process_office(office, target)
                    offices_processed += 1
                except Exception as e:
                    logger.error(f"Failed to process office {office.department_name}: {e}")
                    errors.append(f"Office processing failed: {str(e)}")
            
            duration = time.time() - start_time
            
            return ScrapingResult(
                target=target,
                success=offices_processed > 0,
                offices_found=offices_found,
                offices_processed=offices_processed,
                duration_seconds=duration,
                errors=errors
            )
            
        except Exception as e:
            logger.error(f"Scraping failed for {target.name}: {e}")
            return ScrapingResult(
                target=target,
                success=False,
                offices_found=0,
                offices_processed=0,
                duration_seconds=time.time() - start_time,
                errors=[str(e)]
            )
    
    async def _scrape_with_enhanced_requests(self, target: ScrapingTarget) -> List[PermitOffice]:
        """Enhanced HTTP scraping with sophisticated data extraction"""
        offices = []
        
        try:
            # Apply intelligent rate limiting
            await self.rate_limiter.wait_for_request(target.url)

            async with self.session.get(target.url) as response:
                if response.status == 200:
                    self.rate_limiter.record_success(target.url)
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Multiple extraction strategies
                    extraction_methods = [
                        self._extract_from_structured_elements,
                        self._extract_from_contact_sections,
                        self._extract_from_department_lists,
                        self._extract_from_sidebar_info,
                        self._extract_from_footer_contacts,
                        self._extract_from_content_analysis
                    ]
                    
                    for method in extraction_methods:
                        try:
                            method_offices = method(soup, target)
                            offices.extend(method_offices)
                        except Exception as e:
                            logger.debug(f"Extraction method {method.__name__} failed: {e}")
                            continue
                    
                    # Remove duplicates and enhance data
                    unique_offices = self._deduplicate_offices(offices)
                    enhanced_offices = [self._enhance_office_data(office, target) for office in unique_offices]

                    return enhanced_offices
                else:
                    # Record failure for non-200 status
                    self.rate_limiter.record_failure(target.url, response.status)
                    logger.warning(f"HTTP {response.status} for {target.url}")

        except Exception as e:
            # Record failure for exceptions
            self.rate_limiter.record_failure(target.url)
            logger.error(f"Enhanced requests scraping error: {e}")
            raise
        
        return offices
    
    def _extract_from_structured_elements(self, soup: BeautifulSoup, target: ScrapingTarget) -> List[PermitOffice]:
        """Extract from structured elements like cards, lists, tables"""
        offices = []
        
        # Look for common structured patterns
        selectors = [
            '.office-card', '.department-card', '.contact-card',
            '.permit-office', '.building-department', '.planning-department',
            'article', '.content-block', '.info-box'
        ]
        
        for selector in selectors:
            elements = soup.select(selector)
            for element in elements:
                office = self._parse_structured_element(element, target)
                if office:
                    offices.append(office)
        
        return offices
    
    def _extract_from_contact_sections(self, soup: BeautifulSoup, target: ScrapingTarget) -> List[PermitOffice]:
        """Extract from contact information sections"""
        offices = []
        
        # Look for contact sections
        contact_selectors = [
            '.contact-info', '.contact-details', '.office-info',
            '.department-info', '.location-info', '.contact-section'
        ]
        
        for selector in contact_selectors:
            elements = soup.select(selector)
            for element in elements:
                office = self._parse_contact_section(element, target)
                if office:
                    offices.append(office)
        
        return offices
    
    def _extract_from_department_lists(self, soup: BeautifulSoup, target: ScrapingTarget) -> List[PermitOffice]:
        """Extract from department lists and navigation"""
        offices = []
        
        # Look for department lists
        list_selectors = [
            'ul.departments', 'ul.offices', 'ul.contacts',
            '.department-list', '.office-list', 'nav ul li'
        ]
        
        for selector in list_selectors:
            elements = soup.select(selector)
            for element in elements:
                office = self._parse_department_list_item(element, target)
                if office:
                    offices.append(office)
        
        return offices
    
    def _extract_from_sidebar_info(self, soup: BeautifulSoup, target: ScrapingTarget) -> List[PermitOffice]:
        """Extract from sidebar information"""
        offices = []
        
        sidebar_selectors = [
            '.sidebar', '.side-content', '.widget', '.info-panel',
            'aside', '.secondary-content'
        ]
        
        for selector in sidebar_selectors:
            elements = soup.select(selector)
            for element in elements:
                office = self._parse_sidebar_element(element, target)
                if office:
                    offices.append(office)
        
        return offices
    
    def _extract_from_footer_contacts(self, soup: BeautifulSoup, target: ScrapingTarget) -> List[PermitOffice]:
        """Extract from footer contact information"""
        offices = []
        
        footer = soup.find('footer')
        if footer:
            office = self._parse_footer_contacts(footer, target)
            if office:
                offices.append(office)
        
        return offices
    
    def _extract_from_content_analysis(self, soup: BeautifulSoup, target: ScrapingTarget) -> List[PermitOffice]:
        """Extract from content analysis of the entire page"""
        offices = []
        
        # Analyze the entire page content for permit office information
        text_content = soup.get_text()
        
        # Look for permit-related content
        permit_keywords = ['permit', 'building', 'planning', 'zoning', 'construction', 'development', 'inspection']
        if any(keyword in text_content.lower() for keyword in permit_keywords):
            office = self._create_office_from_content_analysis(soup, target)
            if office:
                offices.append(office)
        
        return offices
    
    def _create_office_from_content_analysis(self, soup: BeautifulSoup, target: ScrapingTarget) -> Optional[PermitOffice]:
        """Create office from content analysis"""
        try:
            # Try to extract basic information from the page
            title = soup.find('title')
            page_title = title.get_text().strip() if title else ''
            
            # Look for department name in common locations
            department_name = None
            for selector in ['h1', 'h2', '.page-title', '.department-name', '.office-name']:
                element = soup.select_one(selector)
                if element:
                    text = element.get_text().strip()
                    if any(keyword in text.lower() for keyword in ['department', 'office', 'bureau', 'division']):
                        department_name = text
                        break
            
            if not department_name:
                department_name = page_title or f"{target.city} Building Department"
            
            # Extract contact information
            phone = self._extract_phone_from_text(soup.get_text())
            email = self._extract_email_from_text(soup.get_text())
            address = self._extract_address_from_text(soup.get_text())
            
            # Extract hours
            hours = self._extract_hours_from_text(soup.get_text())
            
            # Determine services based on content
            services = self._determine_services_from_content(soup.get_text())
            
            return PermitOffice(
                department_name=department_name,
                city=target.city or 'Unknown',
                county=target.county or 'Unknown',
                state=target.state,
                jurisdiction_type=target.type,
                office_type='combined',
                address=address or 'Address not found',
                phone=phone,
                email=email,
                website=target.url,
                hours_monday=hours.get('monday'),
                hours_tuesday=hours.get('tuesday'),
                hours_wednesday=hours.get('wednesday'),
                hours_thursday=hours.get('thursday'),
                hours_friday=hours.get('friday'),
                hours_saturday=hours.get('saturday'),
                hours_sunday=hours.get('sunday'),
                building_permits=services.get('building_permits', True),
                electrical_permits=services.get('electrical_permits', True),
                plumbing_permits=services.get('plumbing_permits', True),
                mechanical_permits=services.get('mechanical_permits', True),
                zoning_permits=services.get('zoning_permits', True),
                planning_review=services.get('planning_review', True),
                inspections=services.get('inspections', True),
                data_source='enhanced_scraped',
                active=True
            )
        except Exception as e:
            logger.debug(f"Error creating office from content analysis: {e}")
            return None
    
    def _extract_phone_from_text(self, text: str) -> Optional[str]:
        """Extract phone number from text"""
        for pattern in self.phone_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group().strip()
        return None
    
    def _extract_email_from_text(self, text: str) -> Optional[str]:
        """Extract email from text"""
        for pattern in self.email_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group().strip().lower()
        return None
    
    def _extract_address_from_text(self, text: str) -> Optional[str]:
        """Extract address from text"""
        for pattern in self.address_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group().strip()
        return None
    
    def _extract_hours_from_text(self, text: str) -> Dict[str, str]:
        """Extract business hours from text"""
        hours = {}
        for pattern in self.hours_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if 'monday' in match.lower() or 'mon' in match.lower():
                    hours['monday'] = match.strip()
                elif 'tuesday' in match.lower() or 'tue' in match.lower():
                    hours['tuesday'] = match.strip()
                elif 'wednesday' in match.lower() or 'wed' in match.lower():
                    hours['wednesday'] = match.strip()
                elif 'thursday' in match.lower() or 'thu' in match.lower():
                    hours['thursday'] = match.strip()
                elif 'friday' in match.lower() or 'fri' in match.lower():
                    hours['friday'] = match.strip()
                elif 'saturday' in match.lower() or 'sat' in match.lower():
                    hours['saturday'] = match.strip()
                elif 'sunday' in match.lower() or 'sun' in match.lower():
                    hours['sunday'] = match.strip()
        return hours
    
    def _determine_services_from_content(self, text: str) -> Dict[str, bool]:
        """Determine services offered based on content"""
        services = {}
        text_lower = text.lower()
        
        for service, keywords in self.permit_keywords.items():
            services[service] = any(keyword in text_lower for keyword in keywords)
        
        return services
    
    def _parse_structured_element(self, element, target: ScrapingTarget) -> Optional[PermitOffice]:
        """Parse a structured element for office information"""
        try:
            # Extract basic information
            name = self._extract_text_by_selectors(element, ['h1', 'h2', 'h3', '.title', '.name', '.office-name'])
            address = self._extract_text_by_selectors(element, ['.address', '.location', '.contact-address'])
            phone = self._extract_text_by_selectors(element, ['.phone', '.contact-phone', '[href^="tel:"]'])
            email = self._extract_text_by_selectors(element, ['.email', '.contact-email', '[href^="mailto:"]'])
            website = self._extract_text_by_selectors(element, ['.website', '.url', '[href*="http"]'])
            
            # Extract hours
            hours = self._extract_hours_from_element(element)
            
            # Extract services
            services = self._extract_services_from_element(element)
            
            if name:
                return PermitOffice(
                    department_name=name,
                    city=target.city or 'Unknown',
                    county=target.county or 'Unknown',
                    state=target.state,
                    jurisdiction_type=target.type,
                    office_type='combined',
                    address=address or 'Address not found',
                    phone=self._clean_phone(phone),
                    email=self._clean_email(email),
                    website=website,
                    hours_monday=hours.get('monday'),
                    hours_tuesday=hours.get('tuesday'),
                    hours_wednesday=hours.get('wednesday'),
                    hours_thursday=hours.get('thursday'),
                    hours_friday=hours.get('friday'),
                    hours_saturday=hours.get('saturday'),
                    hours_sunday=hours.get('sunday'),
                    building_permits=services.get('building_permits', False),
                    electrical_permits=services.get('electrical_permits', False),
                    plumbing_permits=services.get('plumbing_permits', False),
                    mechanical_permits=services.get('mechanical_permits', False),
                    zoning_permits=services.get('zoning_permits', False),
                    planning_review=services.get('planning_review', False),
                    inspections=services.get('inspections', False),
                    data_source='enhanced_scraped',
                    active=True
                )
        except Exception as e:
            logger.debug(f"Error parsing structured element: {e}")
        
        return None
    
    def _extract_text_by_selectors(self, element, selectors: List[str]) -> Optional[str]:
        """Extract text using multiple selectors"""
        for selector in selectors:
            found = element.select_one(selector)
            if found:
                text = found.get_text(strip=True)
                if text:
                    return text
        return None
    
    def _extract_hours_from_element(self, element) -> Dict[str, str]:
        """Extract business hours from element"""
        hours = {}
        text = element.get_text()
        
        # Look for hours patterns
        for pattern in self.hours_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                # Parse the match to extract day and hours
                if 'monday' in match.lower() or 'mon' in match.lower():
                    hours['monday'] = match.strip()
                elif 'tuesday' in match.lower() or 'tue' in match.lower():
                    hours['tuesday'] = match.strip()
                elif 'wednesday' in match.lower() or 'wed' in match.lower():
                    hours['wednesday'] = match.strip()
                elif 'thursday' in match.lower() or 'thu' in match.lower():
                    hours['thursday'] = match.strip()
                elif 'friday' in match.lower() or 'fri' in match.lower():
                    hours['friday'] = match.strip()
                elif 'saturday' in match.lower() or 'sat' in match.lower():
                    hours['saturday'] = match.strip()
                elif 'sunday' in match.lower() or 'sun' in match.lower():
                    hours['sunday'] = match.strip()
        
        return hours
    
    def _extract_services_from_element(self, element) -> Dict[str, bool]:
        """Extract permit services from element"""
        services = {}
        text = element.get_text().lower()
        
        for service, keywords in self.permit_keywords.items():
            services[service] = any(keyword in text for keyword in keywords)
        
        return services
    
    def _clean_phone(self, phone: str) -> Optional[str]:
        """Clean and format phone number"""
        if not phone:
            return None
        
        # Extract phone number using regex
        for pattern in self.phone_patterns:
            match = re.search(pattern, phone)
            if match:
                return match.group().strip()
        
        return phone.strip() if phone.strip() else None
    
    def _clean_email(self, email: str) -> Optional[str]:
        """Clean and format email address"""
        if not email:
            return None
        
        # Extract email using regex
        for pattern in self.email_patterns:
            match = re.search(pattern, email)
            if match:
                return match.group().strip().lower()
        
        return email.strip().lower() if email.strip() else None
    
    def _deduplicate_offices(self, offices: List[PermitOffice]) -> List[PermitOffice]:
        """Remove duplicate offices based on department name and city"""
        seen = set()
        unique_offices = []
        
        for office in offices:
            key = (office.department_name.lower(), office.city.lower())
            if key not in seen:
                seen.add(key)
                unique_offices.append(office)
        
        return unique_offices
    
    async def _enhance_office_data(self, office: PermitOffice, target: ScrapingTarget) -> PermitOffice:
        """Enhance office data with additional information"""
        try:
            # Geocode the address
            if office.address and office.address != 'Address not found':
                try:
                    geocode_result = await self.geocoding_service.geocode_address(office.address)
                    if geocode_result:
                        office.latitude = geocode_result.get('latitude')
                        office.longitude = geocode_result.get('longitude')
                        office.city = geocode_result.get('city', office.city)
                        office.county = geocode_result.get('county', office.county)
                        office.state = geocode_result.get('state', office.state)
                except Exception as e:
                    logger.debug(f"Geocoding failed for {office.address}: {e}")
            
            # Extract enhanced data from the website
            if office.website:
                try:
                    enhanced_data = await self._extract_enhanced_data_from_website(office.website)
                    if enhanced_data:
                        office.permit_fees = enhanced_data.get('permit_fees')
                        office.instructions = enhanced_data.get('instructions')
                        office.downloadable_applications = enhanced_data.get('downloadable_applications')
                        office.processing_times = enhanced_data.get('processing_times')
                except Exception as e:
                    logger.debug(f"Enhanced data extraction failed for {office.website}: {e}")
            
            # Set additional metadata
            office.data_source = 'enhanced_scraped'
            office.last_verified = datetime.now()
            office.crawl_frequency = 'weekly'
            office.active = True
            
        except Exception as e:
            logger.error(f"Error enhancing office data: {e}")
        
        return office
    
    async def _extract_enhanced_data_from_website(self, website_url: str) -> Optional[Dict[str, Any]]:
        """Extract enhanced data from a permit office website"""
        try:
            async with self.session.get(website_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Use the enhanced data extractor
                    enhanced_data = self.data_extractor.extract_enhanced_data(soup, website_url)
                    
                    # Log what we found
                    if enhanced_data.get('permit_fees'):
                        logger.info(f"Found permit fees for {website_url}")
                    if enhanced_data.get('instructions'):
                        logger.info(f"Found instructions for {website_url}")
                    if enhanced_data.get('downloadable_applications'):
                        logger.info(f"Found downloadable applications for {website_url}")
                    if enhanced_data.get('processing_times'):
                        logger.info(f"Found processing times for {website_url}")
                    
                    return enhanced_data
                    
        except Exception as e:
            logger.debug(f"Failed to extract enhanced data from {website_url}: {e}")
        
        return None
    
    async def _process_office(self, office: PermitOffice, target: ScrapingTarget):
        """Process and log office information"""
        logger.info(f"Processed office: {office.department_name} in {office.city}, {office.state}")
        
        # Additional processing can be added here
        # For example, saving to database, additional validation, etc.
    
    # Additional methods for other extraction strategies would go here...
    # (The methods are similar to the original scraper but with enhanced parsing)
    
    async def _scrape_with_playwright(self, target: ScrapingTarget) -> List[PermitOffice]:
        """Scrape using Playwright for JavaScript-heavy sites"""
        offices = []
        page = None

        try:
            # Apply intelligent rate limiting
            await self.rate_limiter.wait_for_request(target.url)

            page = await self.browser.new_page()

            # Set realistic viewport and user agent
            await page.set_viewport_size({"width": 1920, "height": 1080})
            await page.set_extra_http_headers({
                'Accept-Language': 'en-US,en;q=0.9'
            })

            # Navigate to the page
            response = await page.goto(target.url, wait_until='networkidle', timeout=30000)

            # Record success/failure based on response
            if response and response.status == 200:
                self.rate_limiter.record_success(target.url)
            elif response:
                self.rate_limiter.record_failure(target.url, response.status)

            # Wait for content to load
            await page.wait_for_timeout(2000)

            # Get page content
            html = await page.content()
            soup = BeautifulSoup(html, 'html.parser')

            # Use the same extraction methods as HTTP requests
            extraction_methods = [
                self._extract_from_structured_elements,
                self._extract_from_contact_sections,
                self._extract_from_department_lists,
                self._extract_from_sidebar_info,
                self._extract_from_footer_contacts,
                self._extract_from_content_analysis
            ]

            for method in extraction_methods:
                try:
                    method_offices = method(soup, target)
                    offices.extend(method_offices)
                except Exception as e:
                    logger.debug(f"Playwright extraction method {method.__name__} failed: {e}")
                    continue

            # Remove duplicates and enhance data
            unique_offices = self._deduplicate_offices(offices)
            enhanced_offices = [self._enhance_office_data(office, target) for office in unique_offices]

            return enhanced_offices

        except Exception as e:
            logger.error(f"Playwright scraping error for {target.name}: {e}")
            return []
        finally:
            # Ensure page is always closed
            if page:
                try:
                    await asyncio.wait_for(page.close(), timeout=5.0)
                except Exception as e:
                    logger.warning(f"Failed to close page gracefully: {e}")
    
    async def _scrape_with_selenium(self, target: ScrapingTarget) -> List[PermitOffice]:
        """Scrape using Selenium (same as original)"""
        # Implementation similar to original scraper
        return []
