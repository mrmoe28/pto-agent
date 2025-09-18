"""
Async HTTP client with rate limiting, retries, and politeness features
"""
import asyncio
import random
import time
from typing import List, Optional
import httpx
from aiolimiter import AsyncLimiter
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import logging

logger = logging.getLogger(__name__)

class HTTPClient:
    """Async HTTP client with politeness features"""
    
    def __init__(self, config):
        self.config = config
        self.limiter = AsyncLimiter(config.rate_limit_per_sec, 1)
        self.user_agents = config.user_agents
        self.current_ua_index = 0
        
        # Create httpx client with HTTP/2 support
        self.client = httpx.AsyncClient(
            http2=True,
            follow_redirects=True,
            timeout=httpx.Timeout(
                connect=config.connect_timeout,
                read=config.request_timeout,
                write=config.request_timeout,
                pool=config.request_timeout
            ),
            headers={
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
        )
    
    def _get_user_agent(self) -> str:
        """Get next user agent in rotation"""
        ua = self.user_agents[self.current_ua_index]
        self.current_ua_index = (self.current_ua_index + 1) % len(self.user_agents)
        return ua
    
    async def _random_delay(self):
        """Apply random delay between requests"""
        delay_ms = random.randint(self.config.delay_ms_min, self.config.delay_ms_max)
        await asyncio.sleep(delay_ms / 1000.0)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=20),
        retry=retry_if_exception_type((httpx.HTTPStatusError, httpx.ConnectError, httpx.TimeoutException))
    )
    async def fetch(self, url: str) -> Optional[httpx.Response]:
        """Fetch URL with rate limiting and retries"""
        try:
            # Apply rate limiting
            async with self.limiter:
                # Random delay
                await self._random_delay()
                
                # Set user agent
                headers = {'User-Agent': self._get_user_agent()}
                
                # Make request
                response = await self.client.get(url, headers=headers)
                response.raise_for_status()
                
                logger.debug(f"Fetched {url} - Status: {response.status_code}")
                return response
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                logger.warning(f"Rate limited on {url}, waiting longer...")
                await asyncio.sleep(5)
                raise
            elif e.response.status_code >= 500:
                logger.warning(f"Server error {e.response.status_code} on {url}")
                raise
            else:
                logger.warning(f"HTTP error {e.response.status_code} on {url}")
                return None
        except (httpx.ConnectError, httpx.TimeoutException) as e:
            logger.warning(f"Connection/timeout error on {url}: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error fetching {url}: {e}")
            return None
    
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
