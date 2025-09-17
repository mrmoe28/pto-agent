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
from config import config

logger = logging.getLogger(__name__)

class EnhancedPermitOfficeScraper:
    """Enhanced scraper with sophisticated data extraction capabilities"""
    
    def __init__(self):
        self.geocoding_service = GeocodingService()
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
        """Enhanced scraping with multiple extraction strategies"""
        start_time = time.time()
        offices_found = 0
        offices_processed = 0
        errors = []
        
        try:
            logger.info(f"Starting enhanced scrape of {target.name} at {target.url}")
            
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
            async with self.session.get(target.url) as response:
                if response.status == 200:
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
                    
        except Exception as e:
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
        if any(keyword in text_content.lower() for keyword in ['permit', 'building', 'planning', 'zoning']):
            office = self._create_office_from_content_analysis(soup, target)
            if office:
                offices.append(office)
        
        return offices
    
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
            
            # Set additional metadata
            office.data_source = 'enhanced_scraped'
            office.last_verified = datetime.now()
            office.crawl_frequency = 'weekly'
            office.active = True
            
        except Exception as e:
            logger.error(f"Error enhancing office data: {e}")
        
        return office
    
    async def _process_office(self, office: PermitOffice, target: ScrapingTarget):
        """Process and log office information"""
        logger.info(f"Processed office: {office.department_name} in {office.city}, {office.state}")
        
        # Additional processing can be added here
        # For example, saving to database, additional validation, etc.
    
    # Additional methods for other extraction strategies would go here...
    # (The methods are similar to the original scraper but with enhanced parsing)
    
    async def _scrape_with_playwright(self, target: ScrapingTarget) -> List[PermitOffice]:
        """Scrape using Playwright (same as original)"""
        # Implementation similar to original scraper
        return []
    
    async def _scrape_with_selenium(self, target: ScrapingTarget) -> List[PermitOffice]:
        """Scrape using Selenium (same as original)"""
        # Implementation similar to original scraper
        return []
