"""
BeautifulSoup-based extractors for government-specific fields
"""
import re
import logging
from typing import List, Optional, Tuple, Dict, Any
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup, Tag
import phonenumbers
from phonenumbers import NumberParseException
import usaddress
from slugify import slugify

from .models import GovRecord, Download

logger = logging.getLogger(__name__)

class GovernmentExtractor:
    """Extract government-specific information from web pages"""
    
    def __init__(self):
        # Fee-related keywords
        self.fee_keywords = [
            "fee", "fees", "permit fee", "valuation", "plan review",
            "application fee", "schedule of fees", "fee schedule",
            "cost", "costs", "price", "pricing", "charge", "charges"
        ]
        
        # Processing instruction keywords
        self.instruction_keywords = [
            "how to apply", "application process", "submittal", "instructions",
            "steps", "permit process", "requirements", "checklist",
            "procedures", "guidelines", "submission", "apply"
        ]
        
        # Turnaround time keywords
        self.turnaround_keywords = [
            "processing time", "review time", "turnaround", "approval time",
            "review period", "processing period", "response time"
        ]
        
        # Currency patterns
        self.currency_patterns = [
            r'\$?\s*\d{1,3}(?:[,\d]{0,3})*(?:\.\d{2})?',  # $1,234.56
            r'\d{1,3}(?:[,\d]{0,3})*(?:\.\d{2})?\s*dollars?',  # 1234.56 dollars
        ]
        
        # Time patterns
        self.time_patterns = [
            r'\b(\d{1,2}\s*(business|working)?\s*day[s]?)\b',
            r'\b(\d{1,2}\s*week[s]?)\b',
            r'\b(\d{1,2}\s*hour[s]?)\b',
            r'\b(\d{1,2}\s*month[s]?)\b',
        ]
        
        # File extension patterns
        self.file_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx']
    
    def extract_record(self, soup: BeautifulSoup, url: str) -> GovRecord:
        """Extract all government information from a page"""
        try:
            # Extract jurisdiction name
            jurisdiction_name = self._extract_jurisdiction_name(soup, url)
            
            # Extract permit fees
            permit_fee = self._extract_permit_fees(soup)
            
            # Extract processing instructions
            processing_instructions = self._extract_processing_instructions(soup)
            
            # Extract turnaround time
            turnaround_time = self._extract_turnaround_time(soup)
            
            # Extract downloadable applications
            downloadable_applications = self._extract_downloadable_applications(soup, url)
            
            # Extract contact information
            phone, email, address = self._extract_contact_info(soup)
            
            # Create record
            record = GovRecord(
                jurisdiction_name=jurisdiction_name,
                source_url=url,
                permit_fee=permit_fee,
                processing_instructions=processing_instructions,
                turnaround_time=turnaround_time,
                downloadable_applications=downloadable_applications,
                phone=phone,
                email=email,
                address=address
            )
            
            return record
            
        except Exception as e:
            logger.error(f"Error extracting record from {url}: {e}")
            return GovRecord(source_url=url)
    
    def _extract_jurisdiction_name(self, soup: BeautifulSoup, url: str) -> Optional[str]:
        """Extract jurisdiction name from page"""
        try:
            # Try title tag first
            title = soup.find('title')
            if title:
                title_text = title.get_text().strip()
                if self._is_government_title(title_text):
                    return self._clean_jurisdiction_name(title_text)
            
            # Try h1 tags
            h1_tags = soup.find_all('h1')
            for h1 in h1_tags:
                h1_text = h1.get_text().strip()
                if self._is_government_title(h1_text):
                    return self._clean_jurisdiction_name(h1_text)
            
            # Try header/banner areas
            header_selectors = ['.header', '.banner', '.page-header', '.site-header']
            for selector in header_selectors:
                header = soup.select_one(selector)
                if header:
                    header_text = header.get_text().strip()
                    if self._is_government_title(header_text):
                        return self._clean_jurisdiction_name(header_text)
            
            # Fallback to domain-based name
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            if 'city' in domain:
                return f"City of {domain.split('.')[0].title()}"
            elif 'county' in domain:
                return f"County of {domain.split('.')[0].title()}"
            
            return None
            
        except Exception as e:
            logger.warning(f"Error extracting jurisdiction name: {e}")
            return None
    
    def _extract_permit_fees(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract permit fee information"""
        try:
            # Look for fee sections
            fee_sections = self._find_fee_sections(soup)
            
            if not fee_sections:
                return None
            
            # Extract fees from sections
            all_fees = []
            for section in fee_sections:
                fees = self._extract_fees_from_section(section)
                all_fees.extend(fees)
            
            if all_fees:
                # Combine and clean up fees
                combined_fees = '; '.join(all_fees)
                return self._clean_fee_text(combined_fees)
            
            return None
            
        except Exception as e:
            logger.warning(f"Error extracting permit fees: {e}")
            return None
    
    def _extract_processing_instructions(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract processing instructions"""
        try:
            # Look for instruction sections
            instruction_sections = self._find_instruction_sections(soup)
            
            if not instruction_sections:
                return None
            
            # Extract instructions from sections
            all_instructions = []
            for section in instruction_sections:
                instructions = self._extract_instructions_from_section(section)
                all_instructions.extend(instructions)
            
            if all_instructions:
                # Combine instructions
                combined_instructions = '\n\n'.join(all_instructions)
                return self._clean_instruction_text(combined_instructions)
            
            return None
            
        except Exception as e:
            logger.warning(f"Error extracting processing instructions: {e}")
            return None
    
    def _extract_turnaround_time(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract turnaround time information"""
        try:
            # Look for turnaround sections
            turnaround_sections = self._find_turnaround_sections(soup)
            
            if not turnaround_sections:
                return None
            
            # Extract turnaround times from sections
            all_times = []
            for section in turnaround_sections:
                times = self._extract_turnaround_from_section(section)
                all_times.extend(times)
            
            if all_times:
                # Return the most specific time found
                return self._select_best_turnaround_time(all_times)
            
            return None
            
        except Exception as e:
            logger.warning(f"Error extracting turnaround time: {e}")
            return None
    
    def _extract_downloadable_applications(self, soup: BeautifulSoup, base_url: str) -> List[Download]:
        """Extract downloadable application files"""
        try:
            downloads = []
            
            # Find all links
            links = soup.find_all('a', href=True)
            
            for link in links:
                href = link.get('href')
                text = link.get_text().strip()
                
                if not href:
                    continue
                
                # Check if it's a downloadable file
                if self._is_downloadable_file(href, text):
                    full_url = urljoin(base_url, href)
                    
                    # Extract file type
                    filetype = self._get_file_type(href)
                    
                    # Create download object
                    download = Download(
                        name=text or self._extract_filename_from_url(href),
                        href=full_url,
                        filetype=filetype
                    )
                    downloads.append(download)
            
            return downloads
            
        except Exception as e:
            logger.warning(f"Error extracting downloadable applications: {e}")
            return []
    
    def _extract_contact_info(self, soup: BeautifulSoup) -> Tuple[Optional[str], Optional[str], Optional[str]]:
        """Extract contact information (phone, email, address)"""
        try:
            phone = self._extract_phone(soup)
            email = self._extract_email(soup)
            address = self._extract_address(soup)
            
            return phone, email, address
            
        except Exception as e:
            logger.warning(f"Error extracting contact info: {e}")
            return None, None, None
    
    def _find_fee_sections(self, soup: BeautifulSoup) -> List[Tag]:
        """Find sections containing fee information"""
        sections = []
        
        # Look for sections with fee-related headings
        for keyword in self.fee_keywords:
            # Find headings containing keyword
            headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
            for heading in headings:
                if keyword in heading.get_text().lower():
                    # Get the section following this heading
                    section = self._get_section_after_heading(heading)
                    if section:
                        sections.append(section)
            
            # Look for elements with fee-related classes
            class_selectors = [f'.{keyword}', f'#{keyword}', f'[class*="{keyword}"]']
            for selector in class_selectors:
                elements = soup.select(selector)
                sections.extend(elements)
        
        # Look for tables that might contain fees
        tables = soup.find_all('table')
        for table in tables:
            if self._table_contains_fees(table):
                sections.append(table)
        
        return sections
    
    def _find_instruction_sections(self, soup: BeautifulSoup) -> List[Tag]:
        """Find sections containing instruction information"""
        sections = []
        
        # Look for sections with instruction-related headings
        for keyword in self.instruction_keywords:
            headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
            for heading in headings:
                if keyword in heading.get_text().lower():
                    section = self._get_section_after_heading(heading)
                    if section:
                        sections.append(section)
        
        return sections
    
    def _find_turnaround_sections(self, soup: BeautifulSoup) -> List[Tag]:
        """Find sections containing turnaround time information"""
        sections = []
        
        # Look for sections with turnaround-related headings
        for keyword in self.turnaround_keywords:
            headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
            for heading in headings:
                if keyword in heading.get_text().lower():
                    section = self._get_section_after_heading(heading)
                    if section:
                        sections.append(section)
        
        return sections
    
    def _get_section_after_heading(self, heading: Tag) -> Optional[Tag]:
        """Get the content section following a heading"""
        try:
            # Get the next sibling elements until next heading
            content_elements = []
            current = heading.next_sibling
            
            while current:
                if hasattr(current, 'name'):
                    if current.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                        break
                    content_elements.append(current)
                current = current.next_sibling
            
            if content_elements:
                # Create a container for the content
                container = soup.new_tag('div')
                for element in content_elements:
                    container.append(element)
                return container
            
            return None
            
        except Exception as e:
            logger.warning(f"Error getting section after heading: {e}")
            return None
    
    def _extract_fees_from_section(self, section: Tag) -> List[str]:
        """Extract fee information from a section"""
        fees = []
        
        try:
            # Look for currency patterns in text
            text = section.get_text()
            for pattern in self.currency_patterns:
                matches = re.findall(pattern, text)
                for match in matches:
                    # Get context around the match
                    context = self._get_context_around_match(text, match, 100)
                    if context and self._is_fee_context(context):
                        fees.append(context.strip())
            
            # Look for fee tables
            if section.name == 'table':
                table_fees = self._extract_fees_from_table(section)
                fees.extend(table_fees)
            
        except Exception as e:
            logger.warning(f"Error extracting fees from section: {e}")
        
        return fees
    
    def _extract_instructions_from_section(self, section: Tag) -> List[str]:
        """Extract instruction information from a section"""
        instructions = []
        
        try:
            # Get text content
            text = section.get_text()
            
            # Split into paragraphs and clean
            paragraphs = text.split('\n\n')
            for para in paragraphs:
                para = para.strip()
                if para and len(para) > 20:  # Skip very short paragraphs
                    instructions.append(para)
            
        except Exception as e:
            logger.warning(f"Error extracting instructions from section: {e}")
        
        return instructions
    
    def _extract_turnaround_from_section(self, section: Tag) -> List[str]:
        """Extract turnaround time from a section"""
        times = []
        
        try:
            text = section.get_text()
            
            # Look for time patterns
            for pattern in self.time_patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                for match in matches:
                    if isinstance(match, tuple):
                        match = match[0]  # Get the first group
                    times.append(match.strip())
            
        except Exception as e:
            logger.warning(f"Error extracting turnaround from section: {e}")
        
        return times
    
    def _extract_phone(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract phone number"""
        try:
            # Look for phone patterns in text
            text = soup.get_text()
            phone_pattern = r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
            matches = re.findall(phone_pattern, text)
            
            for match in matches:
                try:
                    # Try to parse as US number
                    parsed = phonenumbers.parse(match, "US")
                    if phonenumbers.is_valid_number(parsed):
                        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
                except NumberParseException:
                    continue
            
            # Return first match if no valid number found
            if matches:
                return matches[0]
            
            return None
            
        except Exception as e:
            logger.warning(f"Error extracting phone: {e}")
            return None
    
    def _extract_email(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract email address"""
        try:
            # Look for email patterns
            text = soup.get_text()
            email_pattern = r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}'
            matches = re.findall(email_pattern, text)
            
            # Filter out common non-relevant emails
            filtered_matches = []
            for match in matches:
                if not any(skip in match.lower() for skip in ['noreply', 'no-reply', 'donotreply']):
                    filtered_matches.append(match)
            
            return filtered_matches[0] if filtered_matches else None
            
        except Exception as e:
            logger.warning(f"Error extracting email: {e}")
            return None
    
    def _extract_address(self, soup: BeautifulSoup) -> Optional[str]:
        """Extract address information"""
        try:
            # Look for address patterns
            text = soup.get_text()
            
            # Try to find structured addresses
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if self._looks_like_address(line):
                    try:
                        # Try to parse with usaddress
                        parsed, _ = usaddress.tag(line)
                        if parsed:
                            return line
                    except:
                        continue
            
            return None
            
        except Exception as e:
            logger.warning(f"Error extracting address: {e}")
            return None
    
    # Helper methods
    def _is_government_title(self, text: str) -> bool:
        """Check if text looks like a government department title"""
        text_lower = text.lower()
        gov_indicators = ['planning', 'building', 'development', 'permits', 'zoning', 'city', 'county', 'department']
        return any(indicator in text_lower for indicator in gov_indicators)
    
    def _clean_jurisdiction_name(self, name: str) -> str:
        """Clean up jurisdiction name"""
        # Remove common suffixes
        suffixes = [' - official website', ' | official website', ' - home', ' | home']
        for suffix in suffixes:
            name = name.replace(suffix, '')
        
        return name.strip()
    
    def _table_contains_fees(self, table: Tag) -> bool:
        """Check if table contains fee information"""
        text = table.get_text().lower()
        return any(keyword in text for keyword in self.fee_keywords)
    
    def _extract_fees_from_table(self, table: Tag) -> List[str]:
        """Extract fees from a table"""
        fees = []
        
        try:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    row_text = ' '.join(cell.get_text().strip() for cell in cells)
                    if any(pattern in row_text for pattern in self.currency_patterns):
                        fees.append(row_text)
        except Exception as e:
            logger.warning(f"Error extracting fees from table: {e}")
        
        return fees
    
    def _get_context_around_match(self, text: str, match: str, context_size: int) -> str:
        """Get context around a match in text"""
        try:
            start = text.find(match)
            if start == -1:
                return ""
            
            context_start = max(0, start - context_size)
            context_end = min(len(text), start + len(match) + context_size)
            
            return text[context_start:context_end]
        except:
            return ""
    
    def _is_fee_context(self, context: str) -> bool:
        """Check if context is about fees"""
        context_lower = context.lower()
        fee_indicators = ['fee', 'cost', 'price', 'charge', 'permit', 'application']
        return any(indicator in context_lower for indicator in fee_indicators)
    
    def _is_downloadable_file(self, href: str, text: str) -> bool:
        """Check if link is a downloadable file"""
        href_lower = href.lower()
        text_lower = text.lower()
        
        # Check file extensions
        if any(ext in href_lower for ext in self.file_extensions):
            return True
        
        # Check text content
        download_indicators = ['application', 'form', 'permit', 'download', 'pdf', 'document']
        return any(indicator in text_lower for indicator in download_indicators)
    
    def _get_file_type(self, href: str) -> Optional[str]:
        """Get file type from URL"""
        href_lower = href.lower()
        for ext in self.file_extensions:
            if ext in href_lower:
                return ext[1:]  # Remove the dot
        return None
    
    def _extract_filename_from_url(self, href: str) -> str:
        """Extract filename from URL"""
        try:
            parsed = urlparse(href)
            filename = parsed.path.split('/')[-1]
            if filename:
                return filename
            return "document"
        except:
            return "document"
    
    def _looks_like_address(self, text: str) -> bool:
        """Check if text looks like an address"""
        # Basic address patterns
        address_patterns = [
            r'\d+\s+\w+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln)',
            r'\d+\s+\w+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln).*,\s*\w+.*,\s*\w{2}\s+\d{5}'
        ]
        
        for pattern in address_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        
        return False
    
    def _select_best_turnaround_time(self, times: List[str]) -> str:
        """Select the best/most specific turnaround time"""
        if not times:
            return ""
        
        # Prefer shorter, more specific times
        def time_priority(time_str):
            time_lower = time_str.lower()
            if 'hour' in time_lower:
                return 1
            elif 'day' in time_lower:
                return 2
            elif 'week' in time_lower:
                return 3
            elif 'month' in time_lower:
                return 4
            else:
                return 5
        
        return min(times, key=time_priority)
    
    def _clean_fee_text(self, text: str) -> str:
        """Clean up fee text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove common prefixes/suffixes
        text = re.sub(r'^(fee|cost|price):\s*', '', text, flags=re.IGNORECASE)
        return text.strip()
    
    def _clean_instruction_text(self, text: str) -> str:
        """Clean up instruction text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove common prefixes
        text = re.sub(r'^(instructions?|steps?|procedures?):\s*', '', text, flags=re.IGNORECASE)
        return text.strip()
