"""
Intelligent rate limiter for web scraping with randomization and backoff
"""
import asyncio
import random
import time
from typing import Dict, Optional
import logging
from collections import defaultdict, deque
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class IntelligentRateLimiter:
    """
    Rate limiter with domain-based tracking, randomization, and adaptive delays
    """

    def __init__(self,
                 base_delay: float = 1.0,
                 max_delay: float = 30.0,
                 randomization_factor: float = 0.5,
                 requests_per_minute: int = 30):
        """
        Initialize the rate limiter

        Args:
            base_delay: Base delay between requests in seconds
            max_delay: Maximum delay allowed
            randomization_factor: Factor for randomizing delays (0.0 to 1.0)
            requests_per_minute: Maximum requests per minute per domain
        """
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.randomization_factor = randomization_factor
        self.requests_per_minute = requests_per_minute

        # Track requests per domain
        self._domain_requests: Dict[str, deque] = defaultdict(lambda: deque(maxlen=requests_per_minute))
        self._last_request_time: Dict[str, float] = {}
        self._failure_counts: Dict[str, int] = defaultdict(int)
        self._backoff_until: Dict[str, float] = {}

    async def wait_for_request(self, url: str, respect_robots_delay: Optional[float] = None) -> float:
        """
        Wait for the appropriate delay before making a request

        Args:
            url: The URL being requested
            respect_robots_delay: Delay specified in robots.txt

        Returns:
            The actual delay used
        """
        domain = self._extract_domain(url)
        current_time = time.time()

        # Check if we're in a backoff period
        if domain in self._backoff_until and current_time < self._backoff_until[domain]:
            backoff_delay = self._backoff_until[domain] - current_time
            logger.info(f"Waiting {backoff_delay:.2f}s for backoff period to end for {domain}")
            await asyncio.sleep(backoff_delay)
            current_time = time.time()

        # Clean old requests (older than 1 minute)
        self._clean_old_requests(domain, current_time)

        # Check rate limit
        if len(self._domain_requests[domain]) >= self.requests_per_minute:
            # Wait until we can make another request
            oldest_request = self._domain_requests[domain][0]
            wait_time = 60.0 - (current_time - oldest_request)
            if wait_time > 0:
                logger.debug(f"Rate limit reached for {domain}, waiting {wait_time:.2f}s")
                await asyncio.sleep(wait_time)
                current_time = time.time()

        # Calculate delay based on various factors
        calculated_delay = self._calculate_delay(domain, respect_robots_delay)

        # Ensure minimum time between requests
        if domain in self._last_request_time:
            time_since_last = current_time - self._last_request_time[domain]
            if time_since_last < calculated_delay:
                actual_delay = calculated_delay - time_since_last
                logger.debug(f"Waiting {actual_delay:.2f}s before request to {domain}")
                await asyncio.sleep(actual_delay)
            else:
                actual_delay = 0
        else:
            actual_delay = calculated_delay
            logger.debug(f"First request to {domain}, waiting {actual_delay:.2f}s")
            await asyncio.sleep(actual_delay)

        # Record the request
        current_time = time.time()
        self._domain_requests[domain].append(current_time)
        self._last_request_time[domain] = current_time

        return actual_delay

    def record_success(self, url: str):
        """Record a successful request"""
        domain = self._extract_domain(url)
        if domain in self._failure_counts:
            # Reduce failure count on success
            self._failure_counts[domain] = max(0, self._failure_counts[domain] - 1)
        logger.debug(f"Recorded success for {domain}")

    def record_failure(self, url: str, status_code: Optional[int] = None):
        """Record a failed request and potentially trigger backoff"""
        domain = self._extract_domain(url)
        self._failure_counts[domain] += 1

        # Apply exponential backoff for repeated failures
        failure_count = self._failure_counts[domain]
        if failure_count >= 3:
            backoff_delay = min(self.max_delay, 2 ** (failure_count - 2))
            self._backoff_until[domain] = time.time() + backoff_delay
            logger.warning(f"Applied {backoff_delay:.2f}s backoff for {domain} after {failure_count} failures")

        # Special handling for specific status codes
        if status_code == 429:  # Too Many Requests
            backoff_delay = min(self.max_delay, 60.0)  # 1 minute backoff
            self._backoff_until[domain] = time.time() + backoff_delay
            logger.warning(f"Received 429 for {domain}, applying {backoff_delay:.2f}s backoff")
        elif status_code in [503, 502, 504]:  # Server errors
            backoff_delay = min(self.max_delay, 30.0)  # 30 second backoff
            self._backoff_until[domain] = time.time() + backoff_delay
            logger.warning(f"Received {status_code} for {domain}, applying {backoff_delay:.2f}s backoff")

    def _extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        try:
            parsed = urlparse(url)
            return parsed.netloc.lower()
        except Exception:
            return url.lower()

    def _clean_old_requests(self, domain: str, current_time: float):
        """Remove requests older than 1 minute"""
        cutoff_time = current_time - 60.0
        while (self._domain_requests[domain] and
               self._domain_requests[domain][0] < cutoff_time):
            self._domain_requests[domain].popleft()

    def _calculate_delay(self, domain: str, robots_delay: Optional[float] = None) -> float:
        """Calculate the appropriate delay for a request"""
        # Start with base delay
        delay = self.base_delay

        # Apply robots.txt delay if specified and higher
        if robots_delay is not None:
            delay = max(delay, robots_delay)

        # Apply backoff multiplier based on failure count
        failure_count = self._failure_counts.get(domain, 0)
        if failure_count > 0:
            backoff_multiplier = min(4.0, 1.0 + (failure_count * 0.5))
            delay *= backoff_multiplier

        # Add randomization to avoid thundering herd
        if self.randomization_factor > 0:
            random_factor = 1.0 + (random.random() - 0.5) * 2 * self.randomization_factor
            delay *= random_factor

        # Ensure delay is within bounds
        delay = max(0.1, min(self.max_delay, delay))

        return delay

    def get_domain_stats(self, domain: str) -> Dict[str, any]:
        """Get statistics for a domain"""
        current_time = time.time()
        self._clean_old_requests(domain, current_time)

        return {
            'domain': domain,
            'requests_last_minute': len(self._domain_requests[domain]),
            'failure_count': self._failure_counts.get(domain, 0),
            'in_backoff': domain in self._backoff_until and current_time < self._backoff_until[domain],
            'backoff_until': self._backoff_until.get(domain, 0),
            'last_request': self._last_request_time.get(domain, 0)
        }

    def reset_domain_stats(self, domain: str):
        """Reset statistics for a domain"""
        if domain in self._domain_requests:
            self._domain_requests[domain].clear()
        if domain in self._failure_counts:
            del self._failure_counts[domain]
        if domain in self._backoff_until:
            del self._backoff_until[domain]
        if domain in self._last_request_time:
            del self._last_request_time[domain]
        logger.info(f"Reset statistics for domain {domain}")


# Global rate limiter instance
rate_limiter = IntelligentRateLimiter()