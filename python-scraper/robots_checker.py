"""
Robots.txt compliance checker for web scraping
"""
import urllib.robotparser
import asyncio
import aiohttp
from urllib.parse import urljoin, urlparse
import logging
from typing import Optional, Dict, Set
import time

logger = logging.getLogger(__name__)

class RobotsChecker:
    """Check robots.txt compliance for web scraping"""

    def __init__(self, user_agent: str = "*"):
        self.user_agent = user_agent
        self._cache: Dict[str, urllib.robotparser.RobotFileParser] = {}
        self._cache_timestamps: Dict[str, float] = {}
        self._cache_expiry = 3600  # 1 hour cache
        self._allowed_cache: Dict[str, bool] = {}

    async def is_crawling_allowed(self, url: str, user_agent: str = None) -> bool:
        """
        Check if crawling is allowed for the given URL

        Args:
            url: The URL to check
            user_agent: User agent string (defaults to instance user_agent)

        Returns:
            True if crawling is allowed, False otherwise
        """
        if user_agent is None:
            user_agent = self.user_agent

        try:
            # Parse the URL to get the base domain
            parsed_url = urlparse(url)
            base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
            robots_url = urljoin(base_url, '/robots.txt')

            # Check cache first
            cache_key = f"{robots_url}:{user_agent}"
            if cache_key in self._allowed_cache:
                return self._allowed_cache[cache_key]

            # Get robots.txt parser
            rp = await self._get_robots_parser(robots_url)
            if rp is None:
                # If we can't get robots.txt, be conservative and allow crawling
                logger.debug(f"Could not fetch robots.txt for {base_url}, allowing crawling")
                self._allowed_cache[cache_key] = True
                return True

            # Check if crawling is allowed
            allowed = rp.can_fetch(user_agent, url)

            # Cache the result
            self._allowed_cache[cache_key] = allowed

            if not allowed:
                logger.warning(f"Robots.txt disallows crawling {url} for user agent {user_agent}")
            else:
                logger.debug(f"Robots.txt allows crawling {url} for user agent {user_agent}")

            return allowed

        except Exception as e:
            logger.error(f"Error checking robots.txt for {url}: {e}")
            # Be conservative and allow crawling if there's an error
            return True

    async def get_crawl_delay(self, url: str, user_agent: str = None) -> Optional[float]:
        """
        Get the crawl delay specified in robots.txt

        Args:
            url: The URL to check
            user_agent: User agent string (defaults to instance user_agent)

        Returns:
            Crawl delay in seconds, or None if not specified
        """
        if user_agent is None:
            user_agent = self.user_agent

        try:
            # Parse the URL to get the base domain
            parsed_url = urlparse(url)
            base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
            robots_url = urljoin(base_url, '/robots.txt')

            # Get robots.txt parser
            rp = await self._get_robots_parser(robots_url)
            if rp is None:
                return None

            # Get crawl delay
            delay = rp.crawl_delay(user_agent)
            if delay is not None:
                logger.debug(f"Robots.txt specifies crawl delay of {delay}s for {base_url}")

            return delay

        except Exception as e:
            logger.error(f"Error getting crawl delay for {url}: {e}")
            return None

    async def _get_robots_parser(self, robots_url: str) -> Optional[urllib.robotparser.RobotFileParser]:
        """Get a robots.txt parser for the given robots.txt URL"""
        current_time = time.time()

        # Check cache
        if (robots_url in self._cache and
            robots_url in self._cache_timestamps and
            current_time - self._cache_timestamps[robots_url] < self._cache_expiry):
            return self._cache[robots_url]

        try:
            # Fetch robots.txt
            robots_content = await self._fetch_robots_txt(robots_url)
            if robots_content is None:
                return None

            # Create and configure parser
            rp = urllib.robotparser.RobotFileParser()
            rp.set_url(robots_url)

            # Parse the content
            robots_lines = robots_content.split('\n')
            for line in robots_lines:
                rp.read_line(line)

            # Cache the parser
            self._cache[robots_url] = rp
            self._cache_timestamps[robots_url] = current_time

            logger.debug(f"Successfully parsed robots.txt from {robots_url}")
            return rp

        except Exception as e:
            logger.error(f"Error parsing robots.txt from {robots_url}: {e}")
            return None

    async def _fetch_robots_txt(self, robots_url: str) -> Optional[str]:
        """Fetch robots.txt content"""
        try:
            timeout = aiohttp.ClientTimeout(total=10)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(robots_url) as response:
                    if response.status == 200:
                        content = await response.text()
                        logger.debug(f"Successfully fetched robots.txt from {robots_url}")
                        return content
                    elif response.status == 404:
                        logger.debug(f"No robots.txt found at {robots_url}")
                        return None
                    else:
                        logger.warning(f"Unexpected status {response.status} when fetching {robots_url}")
                        return None

        except asyncio.TimeoutError:
            logger.warning(f"Timeout fetching robots.txt from {robots_url}")
            return None
        except Exception as e:
            logger.warning(f"Error fetching robots.txt from {robots_url}: {e}")
            return None

    def clear_cache(self):
        """Clear the robots.txt cache"""
        self._cache.clear()
        self._cache_timestamps.clear()
        self._allowed_cache.clear()
        logger.debug("Robots.txt cache cleared")

    def get_disallowed_paths(self, base_url: str, user_agent: str = None) -> Set[str]:
        """
        Get the set of disallowed paths for a domain

        Args:
            base_url: Base URL of the domain
            user_agent: User agent string (defaults to instance user_agent)

        Returns:
            Set of disallowed path patterns
        """
        if user_agent is None:
            user_agent = self.user_agent

        disallowed_paths = set()

        try:
            robots_url = urljoin(base_url, '/robots.txt')

            # This is a synchronous method, so we need the parser to already be cached
            if robots_url in self._cache:
                rp = self._cache[robots_url]

                # Unfortunately, urllib.robotparser doesn't expose disallowed paths directly
                # We'd need to parse the robots.txt content manually for this
                logger.debug(f"Would need to manually parse robots.txt for disallowed paths")

        except Exception as e:
            logger.error(f"Error getting disallowed paths for {base_url}: {e}")

        return disallowed_paths


# Global instance for easy import
robots_checker = RobotsChecker()