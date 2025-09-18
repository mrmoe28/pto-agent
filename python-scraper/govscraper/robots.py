"""
Robots.txt handling for government scraper
"""
import asyncio
import logging
from typing import Dict, Optional, Set
from urllib.parse import urlparse, urljoin
import httpx
from dataclasses import dataclass
import re

logger = logging.getLogger(__name__)

@dataclass
class RobotsInfo:
    """Robots.txt information for a host"""
    allowed_paths: Set[str]
    disallowed_paths: Set[str]
    crawl_delay: float
    sitemaps: Set[str]

class RobotsChecker:
    """Check robots.txt compliance"""
    
    def __init__(self, respect_robots: bool = True):
        self.respect_robots = respect_robots
        self.robots_cache: Dict[str, RobotsInfo] = {}
        self.client = httpx.AsyncClient(timeout=10.0)
    
    async def _fetch_robots_txt(self, host: str) -> Optional[RobotsInfo]:
        """Fetch and parse robots.txt for a host"""
        try:
            robots_url = f"https://{host}/robots.txt"
            response = await self.client.get(robots_url)
            
            if response.status_code != 200:
                logger.debug(f"No robots.txt found for {host}")
                return None
            
            return self._parse_robots_txt(response.text, host)
            
        except Exception as e:
            logger.debug(f"Error fetching robots.txt for {host}: {e}")
            return None
    
    def _parse_robots_txt(self, content: str, host: str) -> RobotsInfo:
        """Parse robots.txt content"""
        allowed_paths = set()
        disallowed_paths = set()
        crawl_delay = 1.0
        sitemaps = set()
        
        current_user_agent = None
        lines = content.lower().split('\n')
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            if line.startswith('user-agent:'):
                current_user_agent = line.split(':', 1)[1].strip()
            elif line.startswith('allow:') and current_user_agent in ['*', 'claude', 'bot']:
                path = line.split(':', 1)[1].strip()
                allowed_paths.add(path)
            elif line.startswith('disallow:') and current_user_agent in ['*', 'claude', 'bot']:
                path = line.split(':', 1)[1].strip()
                disallowed_paths.add(path)
            elif line.startswith('crawl-delay:') and current_user_agent in ['*', 'claude', 'bot']:
                try:
                    crawl_delay = float(line.split(':', 1)[1].strip())
                except ValueError:
                    pass
            elif line.startswith('sitemap:'):
                sitemap_url = line.split(':', 1)[1].strip()
                sitemaps.add(sitemap_url)
        
        return RobotsInfo(
            allowed_paths=allowed_paths,
            disallowed_paths=disallowed_paths,
            crawl_delay=crawl_delay,
            sitemaps=sitemaps
        )
    
    async def allowed(self, url: str) -> bool:
        """Check if URL is allowed by robots.txt"""
        if not self.respect_robots:
            return True
        
        try:
            parsed = urlparse(url)
            host = parsed.netloc.lower()
            
            # Get robots info for this host
            if host not in self.robots_cache:
                robots_info = await self._fetch_robots_txt(host)
                if robots_info is None:
                    # No robots.txt or error - assume allowed
                    self.robots_cache[host] = RobotsInfo(
                        allowed_paths=set(),
                        disallowed_paths=set(),
                        crawl_delay=1.0,
                        sitemaps=set()
                    )
                else:
                    self.robots_cache[host] = robots_info
            
            robots_info = self.robots_cache[host]
            path = parsed.path
            
            # Check disallowed paths
            for disallowed in robots_info.disallowed_paths:
                if disallowed == '/':
                    return False  # Disallow all
                if path.startswith(disallowed):
                    return False
            
            # Check allowed paths (if any specific allows exist)
            if robots_info.allowed_paths:
                for allowed in robots_info.allowed_paths:
                    if path.startswith(allowed):
                        return True
                return False  # No specific allow matches
            
            return True  # No restrictions
            
        except Exception as e:
            logger.warning(f"Error checking robots.txt for {url}: {e}")
            return True  # Assume allowed on error
    
    def crawl_delay(self, host: str) -> float:
        """Get crawl delay for host"""
        if host in self.robots_cache:
            return self.robots_cache[host].crawl_delay
        return 1.0
    
    def get_sitemaps(self, host: str) -> Set[str]:
        """Get sitemap URLs for host"""
        if host in self.robots_cache:
            return self.robots_cache[host].sitemaps
        return set()
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
