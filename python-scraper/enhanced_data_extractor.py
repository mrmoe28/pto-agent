"""
Enhanced data extraction for permit office information
Extracts permit fees, instructions, downloadable applications, and processing times
"""
import re
import json
from typing import Dict, List, Optional, Any, Tuple
from bs4 import BeautifulSoup, Tag
from urllib.parse import urljoin, urlparse
import logging

logger = logging.getLogger(__name__)

class EnhancedDataExtractor:
    """Extract detailed permit office information from web pages"""
    
    def __init__(self):
        # Fee patterns
        self.fee_patterns = [
            r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)',  # $1,234.56
            r'(\d+(?:,\d{3})*(?:\.\d{2})?)\s*dollars?',  # 1234.56 dollars
            r'fee[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # fee: $123.45
            r'cost[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # cost: $123.45
            r'price[:\s]*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)',  # price: $123.45
        ]
        
        # Processing time patterns
        self.time_patterns = [
            r'(\d+)\s*(?:to|-)?\s*(\d+)?\s*(?:business\s*)?days?',  # 5-10 business days
            r'(\d+)\s*(?:to|-)?\s*(\d+)?\s*weeks?',  # 2-3 weeks
            r'(\d+)\s*(?:to|-)?\s*(\d+)?\s*months?',  # 1-2 months
            r'(\d+)\s*(?:to|-)?\s*(\d+)?\s*hours?',  # 24-48 hours
            r'processing[:\s]*(\d+)\s*(?:to|-)?\s*(\d+)?\s*(?:business\s*)?days?',  # processing: 5-10 days
            r'turnaround[:\s]*(\d+)\s*(?:to|-)?\s*(\d+)?\s*(?:business\s*)?days?',  # turnaround: 5-10 days
        ]
        
        # Application file patterns
        self.application_patterns = [
            r'\.pdf\b',  # .pdf files
            r'\.docx?\b',  # .doc/.docx files
            r'application\s*form',  # application form
            r'permit\s*application',  # permit application
            r'building\s*permit\s*application',  # building permit application
        ]
        
        # Instruction keywords
        self.instruction_keywords = [
            'instructions', 'guidelines', 'requirements', 'procedures',
            'how to apply', 'application process', 'steps', 'checklist',
            'required documents', 'submission requirements'
        ]
        
        # Permit type keywords for categorization
        self.permit_type_keywords = {
            'building': ['building', 'construction', 'structural', 'residential', 'commercial'],
            'electrical': ['electrical', 'electric', 'wiring', 'outlet', 'fixture'],
            'plumbing': ['plumbing', 'water', 'sewer', 'drain', 'pipe', 'fixture'],
            'mechanical': ['mechanical', 'hvac', 'heating', 'cooling', 'ventilation'],
            'zoning': ['zoning', 'land use', 'development', 'planning'],
            'general': ['permit', 'application', 'general']
        }
    
    def extract_enhanced_data(self, soup: BeautifulSoup, base_url: str) -> Dict[str, Any]:
        """Extract all enhanced data from a web page"""
        return {
            'permit_fees': self.extract_permit_fees(soup),
            'instructions': self.extract_instructions(soup),
            'downloadable_applications': self.extract_downloadable_applications(soup, base_url),
            'processing_times': self.extract_processing_times(soup)
        }
    
    def extract_permit_fees(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract permit fees from the page"""
        fees = {}
        text_content = soup.get_text().lower()
        
        # Look for fee tables and sections
        fee_sections = self._find_fee_sections(soup)
        
        for section in fee_sections:
            section_fees = self._parse_fee_section(section)
            fees.update(section_fees)
        
        # Also search the entire page for fee information
        page_fees = self._extract_fees_from_text(text_content)
        fees.update(page_fees)
        
        return fees
    
    def _find_fee_sections(self, soup: BeautifulSoup) -> List[Tag]:
        """Find sections that likely contain fee information"""
        sections = []
        
        # Look for common fee section selectors
        fee_selectors = [
            '.fee', '.fees', '.cost', '.costs', '.pricing', '.price',
            '.permit-fee', '.permit-fees', '.application-fee',
            'table', '.table', '.fee-table', '.pricing-table',
            '.schedule', '.fee-schedule', '.cost-schedule'
        ]
        
        for selector in fee_selectors:
            elements = soup.select(selector)
            for element in elements:
                if self._contains_fee_keywords(element.get_text()):
                    sections.append(element)
        
        return sections
    
    def _contains_fee_keywords(self, text: str) -> bool:
        """Check if text contains fee-related keywords"""
        fee_keywords = ['fee', 'cost', 'price', 'charge', 'dollar', '$']
        return any(keyword in text.lower() for keyword in fee_keywords)
    
    def _parse_fee_section(self, section: Tag) -> Dict[str, Any]:
        """Parse a fee section for specific permit types and amounts"""
        fees = {}
        text = section.get_text()
        
        # Look for permit types and their associated fees
        for permit_type, keywords in self.permit_type_keywords.items():
            for keyword in keywords:
                if keyword in text.lower():
                    # Find fees near this keyword
                    fee_amount = self._extract_fee_near_keyword(text, keyword)
                    if fee_amount:
                        if permit_type not in fees:
                            fees[permit_type] = []
                        fees[permit_type].append(fee_amount)
        
        return fees
    
    def _extract_fee_near_keyword(self, text: str, keyword: str) -> Optional[Dict[str, Any]]:
        """Extract fee information near a specific keyword"""
        # Find the position of the keyword
        keyword_pos = text.lower().find(keyword.lower())
        if keyword_pos == -1:
            return None
        
        # Look for fees in a window around the keyword
        window_start = max(0, keyword_pos - 100)
        window_end = min(len(text), keyword_pos + 100)
        window_text = text[window_start:window_end]
        
        # Extract fee amount
        for pattern in self.fee_patterns:
            match = re.search(pattern, window_text, re.IGNORECASE)
            if match:
                amount = float(match.group(1).replace(',', ''))
                return {
                    'amount': amount,
                    'description': f"{keyword.title()} permit fee",
                    'unit': 'USD'
                }
        
        return None
    
    def _extract_fees_from_text(self, text: str) -> Dict[str, Any]:
        """Extract fees from general text content"""
        fees = {}
        
        # Look for general fee information
        for pattern in self.fee_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                if 'general' not in fees:
                    fees['general'] = []
                
                for match in matches:
                    amount = float(match.replace(',', ''))
                    fees['general'].append({
                        'amount': amount,
                        'description': 'General permit fee',
                        'unit': 'USD'
                    })
        
        return fees
    
    def extract_instructions(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract instructions and guidelines from the page"""
        instructions = {}
        
        # Find instruction sections
        instruction_sections = self._find_instruction_sections(soup)
        
        for section in instruction_sections:
            section_instructions = self._parse_instruction_section(section)
            instructions.update(section_instructions)
        
        return instructions
    
    def _find_instruction_sections(self, soup: BeautifulSoup) -> List[Tag]:
        """Find sections containing instructions"""
        sections = []
        
        # Look for common instruction section selectors
        instruction_selectors = [
            '.instructions', '.guidelines', '.requirements', '.procedures',
            '.how-to', '.application-process', '.steps', '.checklist',
            '.required-documents', '.submission-requirements',
            'article', '.content', '.main-content'
        ]
        
        for selector in instruction_selectors:
            elements = soup.select(selector)
            for element in elements:
                if self._contains_instruction_keywords(element.get_text()):
                    sections.append(element)
        
        return sections
    
    def _contains_instruction_keywords(self, text: str) -> bool:
        """Check if text contains instruction-related keywords"""
        return any(keyword in text.lower() for keyword in self.instruction_keywords)
    
    def _parse_instruction_section(self, section: Tag) -> Dict[str, Any]:
        """Parse an instruction section for specific permit types"""
        instructions = {}
        text = section.get_text()
        
        # Extract general instructions
        if 'general' not in instructions:
            instructions['general'] = self._extract_general_instructions(text)
        
        # Extract permit-specific instructions
        for permit_type, keywords in self.permit_type_keywords.items():
            if permit_type != 'general':
                for keyword in keywords:
                    if keyword in text.lower():
                        permit_instructions = self._extract_instructions_for_permit_type(text, keyword)
                        if permit_instructions:
                            instructions[permit_type] = permit_instructions
        
        return instructions
    
    def _extract_general_instructions(self, text: str) -> str:
        """Extract general application instructions"""
        # Look for common instruction patterns
        instruction_patterns = [
            r'to apply[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)',
            r'application process[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)',
            r'requirements[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)',
            r'steps[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)',
        ]
        
        for pattern in instruction_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def _extract_instructions_for_permit_type(self, text: str, permit_type: str) -> str:
        """Extract instructions specific to a permit type"""
        # Look for instructions near the permit type keyword
        keyword_pos = text.lower().find(permit_type.lower())
        if keyword_pos == -1:
            return ""
        
        # Extract text around the keyword
        window_start = max(0, keyword_pos - 200)
        window_end = min(len(text), keyword_pos + 500)
        window_text = text[window_start:window_end]
        
        # Look for instruction patterns in the window
        instruction_patterns = [
            r'requirements[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)',
            r'process[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)',
            r'steps[:\s]*(.*?)(?:\n\n|\n[A-Z]|$)',
        ]
        
        for pattern in instruction_patterns:
            match = re.search(pattern, window_text, re.IGNORECASE | re.DOTALL)
            if match:
                return match.group(1).strip()
        
        return ""
    
    def extract_downloadable_applications(self, soup: BeautifulSoup, base_url: str) -> Dict[str, List[str]]:
        """Extract downloadable application forms"""
        applications = {}
        
        # Find all links
        links = soup.find_all('a', href=True)
        
        for link in links:
            href = link.get('href')
            link_text = link.get_text().lower()
            
            if not href:
                continue
            
            # Convert relative URLs to absolute
            if href.startswith('/'):
                href = urljoin(base_url, href)
            elif not href.startswith('http'):
                href = urljoin(base_url, href)
            
            # Check if it's a downloadable application
            if self._is_application_file(href, link_text):
                permit_type = self._categorize_application(link_text, href)
                if permit_type not in applications:
                    applications[permit_type] = []
                applications[permit_type].append(href)
        
        return applications
    
    def _is_application_file(self, url: str, link_text: str) -> bool:
        """Check if a link is likely an application file"""
        # Check file extension
        if any(url.lower().endswith(ext) for ext in ['.pdf', '.doc', '.docx']):
            return True
        
        # Check link text for application keywords
        application_keywords = [
            'application', 'form', 'permit', 'download', 'print',
            'building permit', 'electrical permit', 'plumbing permit'
        ]
        
        return any(keyword in link_text for keyword in application_keywords)
    
    def _categorize_application(self, link_text: str, url: str) -> str:
        """Categorize an application by permit type"""
        text_to_check = f"{link_text} {url}".lower()
        
        for permit_type, keywords in self.permit_type_keywords.items():
            if permit_type != 'general':
                if any(keyword in text_to_check for keyword in keywords):
                    return permit_type
        
        return 'general'
    
    def extract_processing_times(self, soup: BeautifulSoup) -> Dict[str, Any]:
        """Extract processing times from the page"""
        processing_times = {}
        text_content = soup.get_text()
        
        # Look for processing time sections
        time_sections = self._find_processing_time_sections(soup)
        
        for section in time_sections:
            section_times = self._parse_processing_time_section(section)
            processing_times.update(section_times)
        
        # Also search the entire page
        page_times = self._extract_processing_times_from_text(text_content)
        processing_times.update(page_times)
        
        return processing_times
    
    def _find_processing_time_sections(self, soup: BeautifulSoup) -> List[Tag]:
        """Find sections containing processing time information"""
        sections = []
        
        # Look for common processing time section selectors
        time_selectors = [
            '.processing-time', '.processing-times', '.turnaround',
            '.timeline', '.schedule', '.timeframe', '.duration',
            'table', '.table', '.time-table'
        ]
        
        for selector in time_selectors:
            elements = soup.select(selector)
            for element in elements:
                if self._contains_time_keywords(element.get_text()):
                    sections.append(element)
        
        return sections
    
    def _contains_time_keywords(self, text: str) -> bool:
        """Check if text contains time-related keywords"""
        time_keywords = ['day', 'week', 'month', 'hour', 'processing', 'turnaround', 'timeline']
        return any(keyword in text.lower() for keyword in time_keywords)
    
    def _parse_processing_time_section(self, section: Tag) -> Dict[str, Any]:
        """Parse a processing time section"""
        times = {}
        text = section.get_text()
        
        # Look for permit types and their processing times
        for permit_type, keywords in self.permit_type_keywords.items():
            for keyword in keywords:
                if keyword in text.lower():
                    time_info = self._extract_time_near_keyword(text, keyword)
                    if time_info:
                        times[permit_type] = time_info
        
        return times
    
    def _extract_time_near_keyword(self, text: str, keyword: str) -> Optional[Dict[str, Any]]:
        """Extract processing time near a specific keyword"""
        keyword_pos = text.lower().find(keyword.lower())
        if keyword_pos == -1:
            return None
        
        # Look for time information in a window around the keyword
        window_start = max(0, keyword_pos - 100)
        window_end = min(len(text), keyword_pos + 100)
        window_text = text[window_start:window_end]
        
        # Extract time information
        for pattern in self.time_patterns:
            match = re.search(pattern, window_text, re.IGNORECASE)
            if match:
                min_time = int(match.group(1))
                max_time = int(match.group(2)) if match.group(2) else min_time
                
                # Determine unit
                unit = 'days'
                if 'week' in match.group(0).lower():
                    unit = 'weeks'
                elif 'month' in match.group(0).lower():
                    unit = 'months'
                elif 'hour' in match.group(0).lower():
                    unit = 'hours'
                
                return {
                    'min': min_time,
                    'max': max_time,
                    'unit': unit,
                    'description': f"{keyword.title()} permit processing time"
                }
        
        return None
    
    def _extract_processing_times_from_text(self, text: str) -> Dict[str, Any]:
        """Extract processing times from general text content"""
        times = {}
        
        # Look for general processing time information
        for pattern in self.time_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                if 'general' not in times:
                    times['general'] = []
                
                for match in matches:
                    min_time = int(match[0])
                    max_time = int(match[1]) if match[1] else min_time
                    
                    # Determine unit
                    unit = 'days'
                    if 'week' in match[0].lower():
                        unit = 'weeks'
                    elif 'month' in match[0].lower():
                        unit = 'months'
                    elif 'hour' in match[0].lower():
                        unit = 'hours'
                    
                    times['general'].append({
                        'min': min_time,
                        'max': max_time,
                        'unit': unit,
                        'description': 'General permit processing time'
                    })
        
        return times
