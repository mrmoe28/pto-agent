"""
Multi-page crawler for comprehensive permit office data extraction
"""
import asyncio
import logging
from typing import List, Dict, Set, Any, Optional
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import aiohttp
from dataclasses import dataclass

from models import PermitOffice, ScrapingTarget
from enhanced_data_extractor import EnhancedDataExtractor
from rate_limiter import IntelligentRateLimiter
from robots_checker import RobotsChecker
from config import config

logger = logging.getLogger(__name__)

@dataclass
class CrawlPage:
    """Represents a page to be crawled"""
    url: str
    title: str
    relevance: float
    depth: int = 0
    parent_url: Optional[str] = None

@dataclass
class CrawlResult:
    """Results from crawling a page"""
    url: str
    success: bool
    data: Dict[str, Any]
    related_pages: List[Dict[str, str]]
    error: Optional[str] = None

class MultiPageCrawler:
    """Advanced crawler that discovers and scrapes multiple related pages"""

    def __init__(self,
                 max_pages: int = 5,
                 max_depth: int = 2,
                 min_relevance: float = 1.0):
        self.max_pages = max_pages
        self.max_depth = max_depth
        self.min_relevance = min_relevance

        self.data_extractor = EnhancedDataExtractor()
        self.rate_limiter = IntelligentRateLimiter(
            base_delay=config.SCRAPING_DELAY,
            requests_per_minute=config.RATE_LIMIT_REQUESTS // 60
        )
        self.robots_checker = RobotsChecker(user_agent=config.USER_AGENT)

        self.session = None
        self.crawled_urls: Set[str] = set()
        self.failed_urls: Set[str] = set()

    async def __aenter__(self):
        """Async context manager entry"""
        headers = {
            'User-Agent': config.USER_AGENT,
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
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            try:
                await asyncio.wait_for(self.session.close(), timeout=5.0)
            except Exception as e:
                logger.warning(f"Failed to close session gracefully: {e}")

    async def crawl_comprehensive_data(self, target: ScrapingTarget) -> Dict[str, Any]:
        """
        Perform comprehensive multi-page crawling to extract detailed permit information

        Args:
            target: Initial scraping target

        Returns:
            Comprehensive data from multiple pages
        """
        logger.info(f"Starting comprehensive crawl for {target.name}")

        # Initialize comprehensive data structure
        comprehensive_data = {
            'permit_fees': {},
            'instructions': {},
            'downloadable_applications': {},
            'processing_times': {},
            'contact_details': {},
            'office_details': {},
            'permit_categories': {},
            'related_pages': [],
            'crawled_pages': [],
            'pages_discovered': 0,
            'pages_successfully_crawled': 0
        }

        # Start with the main page
        crawl_queue = [CrawlPage(
            url=target.url,
            title=target.name,
            relevance=10.0,  # Highest relevance for starting page
            depth=0
        )]

        crawled_count = 0

        while crawl_queue and crawled_count < self.max_pages:
            # Sort queue by relevance (highest first)
            crawl_queue.sort(key=lambda x: x.relevance, reverse=True)

            current_page = crawl_queue.pop(0)

            # Skip if already crawled or failed
            if current_page.url in self.crawled_urls or current_page.url in self.failed_urls:
                continue

            # Skip if depth exceeds limit
            if current_page.depth > self.max_depth:
                continue

            # Skip if relevance is too low
            if current_page.relevance < self.min_relevance:
                continue

            logger.info(f"Crawling page {crawled_count + 1}/{self.max_pages}: {current_page.title}")

            # Crawl the page
            crawl_result = await self._crawl_single_page(current_page)

            if crawl_result.success:
                crawled_count += 1
                self.crawled_urls.add(current_page.url)

                # Merge data from this page
                self._merge_comprehensive_data(comprehensive_data, crawl_result.data)

                # Add page info to results
                comprehensive_data['crawled_pages'].append({
                    'url': current_page.url,
                    'title': current_page.title,
                    'relevance': current_page.relevance,
                    'depth': current_page.depth
                })

                # Add related pages to queue for further crawling
                for related_page in crawl_result.related_pages:
                    if (related_page['url'] not in self.crawled_urls and
                        related_page['url'] not in self.failed_urls):

                        new_page = CrawlPage(
                            url=related_page['url'],
                            title=related_page['title'],
                            relevance=related_page['relevance'],
                            depth=current_page.depth + 1,
                            parent_url=current_page.url
                        )
                        crawl_queue.append(new_page)

                comprehensive_data['pages_discovered'] += len(crawl_result.related_pages)

            else:
                self.failed_urls.add(current_page.url)
                logger.warning(f"Failed to crawl {current_page.url}: {crawl_result.error}")

        comprehensive_data['pages_successfully_crawled'] = crawled_count

        logger.info(f"Comprehensive crawl completed: {crawled_count} pages crawled, "
                   f"{len(comprehensive_data['crawled_pages'])} total pages discovered")

        return comprehensive_data

    async def _crawl_single_page(self, page: CrawlPage) -> CrawlResult:
        """Crawl a single page and extract all relevant data"""
        try:
            # Check robots.txt compliance
            if not await self.robots_checker.is_crawling_allowed(page.url):
                return CrawlResult(
                    url=page.url,
                    success=False,
                    data={},
                    related_pages=[],
                    error="Crawling disallowed by robots.txt"
                )

            # Apply rate limiting
            robots_delay = await self.robots_checker.get_crawl_delay(page.url)
            await self.rate_limiter.wait_for_request(page.url, robots_delay)

            # Fetch the page
            async with self.session.get(page.url) as response:
                if response.status == 200:
                    self.rate_limiter.record_success(page.url)
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')

                    # Extract comprehensive data
                    extracted_data = self.data_extractor.extract_enhanced_data(soup, page.url)

                    return CrawlResult(
                        url=page.url,
                        success=True,
                        data=extracted_data,
                        related_pages=extracted_data.get('related_pages', [])
                    )
                else:
                    self.rate_limiter.record_failure(page.url, response.status)
                    return CrawlResult(
                        url=page.url,
                        success=False,
                        data={},
                        related_pages=[],
                        error=f"HTTP {response.status}"
                    )

        except Exception as e:
            self.rate_limiter.record_failure(page.url)
            return CrawlResult(
                url=page.url,
                success=False,
                data={},
                related_pages=[],
                error=str(e)
            )

    def _merge_comprehensive_data(self, comprehensive_data: Dict[str, Any], page_data: Dict[str, Any]):
        """Merge data from a single page into comprehensive results"""

        # Merge permit fees
        if page_data.get('permit_fees'):
            for fee_type, fees in page_data['permit_fees'].items():
                if fee_type not in comprehensive_data['permit_fees']:
                    comprehensive_data['permit_fees'][fee_type] = []
                if isinstance(fees, list):
                    comprehensive_data['permit_fees'][fee_type].extend(fees)
                else:
                    comprehensive_data['permit_fees'][fee_type].append(fees)

        # Merge instructions (keep most detailed ones)
        if page_data.get('instructions'):
            for instruction_type, instruction in page_data['instructions'].items():
                if instruction_type not in comprehensive_data['instructions']:
                    comprehensive_data['instructions'][instruction_type] = instruction
                else:
                    # Keep the longer/more detailed instruction
                    existing = comprehensive_data['instructions'][instruction_type]
                    if len(str(instruction)) > len(str(existing)):
                        comprehensive_data['instructions'][instruction_type] = instruction

        # Merge downloadable applications
        if page_data.get('downloadable_applications'):
            for app_type, apps in page_data['downloadable_applications'].items():
                if app_type not in comprehensive_data['downloadable_applications']:
                    comprehensive_data['downloadable_applications'][app_type] = []
                comprehensive_data['downloadable_applications'][app_type].extend(apps)

        # Merge processing times
        if page_data.get('processing_times'):
            comprehensive_data['processing_times'].update(page_data['processing_times'])

        # Merge contact details (accumulate all contact info)
        if page_data.get('contact_details'):
            contact_data = page_data['contact_details']
            for contact_type, contact_info in contact_data.items():
                if contact_type not in comprehensive_data['contact_details']:
                    comprehensive_data['contact_details'][contact_type] = []
                if isinstance(contact_info, list):
                    comprehensive_data['contact_details'][contact_type].extend(contact_info)
                else:
                    comprehensive_data['contact_details'][contact_type].append(contact_info)

        # Merge office details
        if page_data.get('office_details'):
            office_data = page_data['office_details']
            for detail_type, details in office_data.items():
                if detail_type not in comprehensive_data['office_details']:
                    comprehensive_data['office_details'][detail_type] = []
                if isinstance(details, list):
                    comprehensive_data['office_details'][detail_type].extend(details)
                else:
                    comprehensive_data['office_details'][detail_type].append(details)

        # Merge permit categories
        if page_data.get('permit_categories'):
            for category, permit_types in page_data['permit_categories'].items():
                if category not in comprehensive_data['permit_categories']:
                    comprehensive_data['permit_categories'][category] = []
                comprehensive_data['permit_categories'][category].extend(permit_types)

        # Deduplicate lists to avoid duplicates
        self._deduplicate_comprehensive_data(comprehensive_data)

    def _deduplicate_comprehensive_data(self, comprehensive_data: Dict[str, Any]):
        """Remove duplicates from list-based comprehensive data"""

        # Deduplicate permit fees
        for fee_type in comprehensive_data['permit_fees']:
            if isinstance(comprehensive_data['permit_fees'][fee_type], list):
                unique_fees = []
                seen_amounts = set()
                for fee in comprehensive_data['permit_fees'][fee_type]:
                    if isinstance(fee, dict) and 'amount' in fee:
                        if fee['amount'] not in seen_amounts:
                            seen_amounts.add(fee['amount'])
                            unique_fees.append(fee)
                    else:
                        unique_fees.append(fee)
                comprehensive_data['permit_fees'][fee_type] = unique_fees

        # Deduplicate downloadable applications
        for app_type in comprehensive_data['downloadable_applications']:
            comprehensive_data['downloadable_applications'][app_type] = list(
                set(comprehensive_data['downloadable_applications'][app_type])
            )

        # Deduplicate contact details
        for contact_type in comprehensive_data['contact_details']:
            if isinstance(comprehensive_data['contact_details'][contact_type], list):
                comprehensive_data['contact_details'][contact_type] = list(
                    set(comprehensive_data['contact_details'][contact_type])
                )

        # Deduplicate office details
        for detail_type in comprehensive_data['office_details']:
            if isinstance(comprehensive_data['office_details'][detail_type], list):
                comprehensive_data['office_details'][detail_type] = list(
                    set(comprehensive_data['office_details'][detail_type])
                )

        # Deduplicate permit categories
        for category in comprehensive_data['permit_categories']:
            comprehensive_data['permit_categories'][category] = list(
                set(comprehensive_data['permit_categories'][category])
            )

    def get_crawl_statistics(self) -> Dict[str, Any]:
        """Get statistics about the crawling session"""
        return {
            'total_urls_crawled': len(self.crawled_urls),
            'total_urls_failed': len(self.failed_urls),
            'success_rate': len(self.crawled_urls) / (len(self.crawled_urls) + len(self.failed_urls)) if (len(self.crawled_urls) + len(self.failed_urls)) > 0 else 0,
            'crawled_urls': list(self.crawled_urls),
            'failed_urls': list(self.failed_urls)
        }