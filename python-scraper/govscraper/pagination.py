"""
Pagination and link discovery for government websites
"""
import re
import logging
from typing import List, Set
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import tldextract

logger = logging.getLogger(__name__)

class LinkDiscoverer:
    """Discover pagination and internal links on government websites"""
    
    def __init__(self):
        # Keywords for government-specific pages
        self.gov_keywords = [
            "permit", "permitting", "planning", "building", "development",
            "applications", "forms", "fees", "turnaround", "processing",
            "submittal", "zoning", "inspection", "review", "approval"
        ]
        
        # Pagination patterns
        self.pagination_patterns = [
            r'\bnext\b', r'\bolder\b', r'\bnewer\b', r'\bmore\s+results\b',
            r'\bpage\s+\d+\b', r'\b\d+\s*of\s*\d+\b', r'\bcontinue\b',
            r'\bmore\b', r'\bshow\s+more\b', r'\bload\s+more\b'
        ]
        
        # Numeric pagination patterns
        self.numeric_patterns = [
            r'^\d+$',  # Just numbers
            r'^page\s*\d+$',  # "page 1", "page1"
            r'^\d+\s*-\s*\d+$',  # "1-10", "11-20"
        ]
    
    def discover_next_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Discover pagination links"""
        next_links = []
        
        try:
            # Look for rel="next" links
            rel_next = soup.find_all('a', rel='next')
            for link in rel_next:
                href = link.get('href')
                if href:
                    full_url = urljoin(base_url, href)
                    next_links.append(full_url)
            
            # Look for pagination links with common patterns
            pagination_links = soup.find_all('a', href=True)
            for link in pagination_links:
                href = link.get('href')
                text = link.get_text().strip().lower()
                
                if not href:
                    continue
                
                # Skip nofollow links
                if link.get('rel') == 'nofollow':
                    continue
                
                # Skip mailto and javascript links
                if href.startswith(('mailto:', 'javascript:', '#')):
                    continue
                
                # Check for pagination patterns
                if self._is_pagination_link(text, href):
                    full_url = urljoin(base_url, href)
                    next_links.append(full_url)
            
            # Look for numeric pagination
            numeric_links = self._find_numeric_pagination(soup, base_url)
            next_links.extend(numeric_links)
            
        except Exception as e:
            logger.warning(f"Error discovering pagination links: {e}")
        
        return list(set(next_links))  # Remove duplicates
    
    def discover_internal_links(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Discover internal links relevant to government services"""
        internal_links = []
        
        try:
            # Get base domain for filtering
            base_domain = tldextract.extract(base_url).registered_domain
            
            # Find all links
            links = soup.find_all('a', href=True)
            
            for link in links:
                href = link.get('href')
                text = link.get_text().strip().lower()
                
                if not href:
                    continue
                
                # Skip external links
                if href.startswith(('http://', 'https://')):
                    link_domain = tldextract.extract(href).registered_domain
                    if link_domain != base_domain:
                        continue
                elif href.startswith(('mailto:', 'javascript:', 'tel:', '#')):
                    continue
                
                # Resolve relative URLs
                full_url = urljoin(base_url, href)
                
                # Check if link is relevant to government services
                if self._is_relevant_link(text, href, full_url):
                    internal_links.append(full_url)
            
        except Exception as e:
            logger.warning(f"Error discovering internal links: {e}")
        
        return list(set(internal_links))  # Remove duplicates
    
    def _is_pagination_link(self, text: str, href: str) -> bool:
        """Check if link is a pagination link"""
        # Check text patterns
        for pattern in self.pagination_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        
        # Check href patterns
        href_lower = href.lower()
        if any(keyword in href_lower for keyword in ['page', 'next', 'prev', 'pagination']):
            return True
        
        return False
    
    def _find_numeric_pagination(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Find numeric pagination links"""
        numeric_links = []
        
        try:
            # Look for pagination containers
            pagination_containers = soup.find_all(['nav', 'div', 'ul'], 
                class_=re.compile(r'pagination|pager|page', re.I))
            
            for container in pagination_containers:
                links = container.find_all('a', href=True)
                for link in links:
                    text = link.get_text().strip()
                    href = link.get('href')
                    
                    if not text or not href:
                        continue
                    
                    # Check if text matches numeric patterns
                    for pattern in self.numeric_patterns:
                        if re.match(pattern, text, re.IGNORECASE):
                            full_url = urljoin(base_url, href)
                            numeric_links.append(full_url)
                            break
            
        except Exception as e:
            logger.warning(f"Error finding numeric pagination: {e}")
        
        return numeric_links
    
    def _is_relevant_link(self, text: str, href: str, full_url: str) -> bool:
        """Check if link is relevant to government services"""
        # Check text content
        text_lower = text.lower()
        if any(keyword in text_lower for keyword in self.gov_keywords):
            return True
        
        # Check URL path
        url_lower = full_url.lower()
        if any(keyword in url_lower for keyword in self.gov_keywords):
            return True
        
        # Check href
        href_lower = href.lower()
        if any(keyword in href_lower for keyword in self.gov_keywords):
            return True
        
        return False
    
    async def discover_sitemap_links(self, base_url: str, http_client) -> List[str]:
        """Discover links from sitemap.xml"""
        sitemap_links = []
        
        try:
            # Try common sitemap locations
            sitemap_urls = [
                f"{base_url}/sitemap.xml",
                f"{base_url}/sitemap_index.xml",
                f"{base_url}/sitemaps.xml"
            ]
            
            for sitemap_url in sitemap_urls:
                try:
                    response = await http_client.fetch(sitemap_url)
                    if response and response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'xml')
                        
                        # Find all <loc> tags
                        loc_tags = soup.find_all('loc')
                        for loc in loc_tags:
                            url = loc.get_text().strip()
                            if url and self._is_relevant_sitemap_url(url):
                                sitemap_links.append(url)
                        
                        logger.info(f"Found {len(sitemap_links)} relevant URLs in sitemap")
                        break
                        
                except Exception as e:
                    logger.debug(f"Error fetching sitemap {sitemap_url}: {e}")
                    continue
            
        except Exception as e:
            logger.warning(f"Error discovering sitemap links: {e}")
        
        return sitemap_links
    
    def _is_relevant_sitemap_url(self, url: str) -> bool:
        """Check if sitemap URL is relevant to government services"""
        url_lower = url.lower()
        return any(keyword in url_lower for keyword in self.gov_keywords)
