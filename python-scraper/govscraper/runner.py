"""
Main crawler runner for government websites
"""
import asyncio
import logging
import time
from typing import List, Optional
from urllib.parse import urlparse
import tldextract
from bs4 import BeautifulSoup

from .config import Config
from .http_client import HTTPClient
from .robots import RobotsChecker
from .state import StateManager
from .pagination import LinkDiscoverer
from .extractors import GovernmentExtractor
from .downloads import DownloadManager
from .persist import DataPersister
from .models import GovRecord

logger = logging.getLogger(__name__)

class GovernmentCrawler:
    """Main government website crawler"""
    
    def __init__(self, config: Config):
        self.config = config
        self.http_client = HTTPClient(config)
        self.robots_checker = RobotsChecker(config.respect_robots)
        self.state_manager = StateManager(config.sqlite_path)
        self.link_discoverer = LinkDiscoverer()
        self.extractor = GovernmentExtractor()
        self.download_manager = DownloadManager(config.downloads_dir, config.max_download_mb)
        self.persister = DataPersister(config.out_dir, config.format)
        
        # Statistics
        self.stats = {
            'pages_processed': 0,
            'records_saved': 0,
            'errors': 0,
            'start_time': time.time()
        }
    
    async def crawl(self, start_urls: List[str]) -> dict:
        """Main crawling method"""
        logger.info(f"Starting government crawler with {len(start_urls)} start URLs")
        logger.info(f"Max pages: {self.config.max_pages}, Max depth: {self.config.max_depth}")
        
        async with self.state_manager, self.persister:
            # Initialize frontier with start URLs
            await self.state_manager.push_urls(start_urls, 0)
            
            # Main crawling loop
            while self.stats['pages_processed'] < self.config.max_pages:
                # Get batch of URLs to process
                url_batch = await self.state_manager.pop_batch(self.config.concurrency)
                if not url_batch:
                    logger.info("No more URLs in frontier")
                    break
                
                # Process batch concurrently
                tasks = []
                for url, depth in url_batch:
                    if depth <= self.config.max_depth:
                        task = self._process_url(url, depth)
                        tasks.append(task)
                
                if tasks:
                    results = await asyncio.gather(*tasks, return_exceptions=True)
                    
                    # Handle results
                    for result in results:
                        if isinstance(result, Exception):
                            logger.error(f"Task failed: {result}")
                            self.stats['errors'] += 1
                        elif result:
                            self.stats['records_saved'] += 1
                
                # Log progress
                await self._log_progress()
                
                # Check if we should stop
                if self.stats['pages_processed'] >= self.config.max_pages:
                    logger.info(f"Reached max pages limit: {self.config.max_pages}")
                    break
            
            # Final statistics
            final_stats = await self._get_final_stats()
            logger.info(f"Crawling completed: {final_stats}")
            
            return final_stats
    
    async def _process_url(self, url: str, depth: int) -> Optional[GovRecord]:
        """Process a single URL"""
        try:
            # Check robots.txt
            if not await self.robots_checker.allowed(url):
                logger.debug(f"URL not allowed by robots.txt: {url}")
                await self.state_manager.mark_visited(url, 'robots_disallowed')
                return None
            
            # Fetch page
            response = await self.http_client.fetch(url)
            if not response:
                logger.warning(f"Failed to fetch: {url}")
                await self.state_manager.mark_visited(url, 'fetch_failed')
                self.stats['errors'] += 1
                return None
            
            # Parse HTML
            soup = BeautifulSoup(response.text, 'lxml')
            
            # Extract record
            record = self.extractor.extract_record(soup, url)
            
            # Save record if it has valuable data
            if record.has_valuable_data():
                await self.persister.save_record(record)
                logger.info(f"Extracted data from: {url}")
            else:
                logger.debug(f"No valuable data found: {url}")
            
            # Discover new links
            await self._discover_and_add_links(soup, url, depth)
            
            # Mark as visited
            await self.state_manager.mark_visited(url, 'success')
            self.stats['pages_processed'] += 1
            
            return record if record.has_valuable_data() else None
            
        except Exception as e:
            logger.error(f"Error processing {url}: {e}")
            await self.state_manager.mark_visited(url, 'error')
            self.stats['errors'] += 1
            return None
    
    async def _discover_and_add_links(self, soup: BeautifulSoup, base_url: str, current_depth: int):
        """Discover and add new links to frontier"""
        try:
            # Get base domain for filtering
            base_domain = tldextract.extract(base_url).registered_domain
            
            # Discover pagination links
            pagination_links = self.link_discoverer.discover_next_links(soup, base_url)
            
            # Discover internal links
            internal_links = self.link_discoverer.discover_internal_links(soup, base_url)
            
            # Filter links to same domain
            all_links = pagination_links + internal_links
            same_domain_links = []
            
            for link in all_links:
                link_domain = tldextract.extract(link).registered_domain
                if link_domain == base_domain:
                    same_domain_links.append(link)
            
            # Add to frontier
            if same_domain_links:
                await self.state_manager.push_urls(same_domain_links, current_depth + 1)
                logger.debug(f"Added {len(same_domain_links)} links to frontier")
            
        except Exception as e:
            logger.warning(f"Error discovering links from {base_url}: {e}")
    
    async def _log_progress(self):
        """Log crawling progress"""
        if self.stats['pages_processed'] % 10 == 0:  # Log every 10 pages
            frontier_size = await self.state_manager.frontier_size()
            visited_count = await self.state_manager.visited_count()
            
            elapsed_time = time.time() - self.stats['start_time']
            pages_per_second = self.stats['pages_processed'] / elapsed_time if elapsed_time > 0 else 0
            
            logger.info(
                f"Progress: {self.stats['pages_processed']} pages processed, "
                f"{self.stats['records_saved']} records saved, "
                f"{frontier_size} URLs in frontier, "
                f"{visited_count} visited, "
                f"{self.stats['errors']} errors, "
                f"{pages_per_second:.2f} pages/sec"
            )
    
    async def _get_final_stats(self) -> dict:
        """Get final crawling statistics"""
        frontier_size = await self.state_manager.frontier_size()
        visited_count = await self.state_manager.visited_count()
        
        elapsed_time = time.time() - self.stats['start_time']
        pages_per_second = self.stats['pages_processed'] / elapsed_time if elapsed_time > 0 else 0
        
        return {
            'pages_processed': self.stats['pages_processed'],
            'records_saved': self.stats['records_saved'],
            'errors': self.stats['errors'],
            'frontier_size': frontier_size,
            'visited_count': visited_count,
            'elapsed_time': elapsed_time,
            'pages_per_second': pages_per_second,
            'persister_stats': self.persister.get_stats()
        }
    
    async def close(self):
        """Close all resources"""
        await self.http_client.close()
        await self.robots_checker.close()

async def crawl(start_urls: List[str], config: Optional[Config] = None) -> dict:
    """Convenience function to run crawling"""
    if config is None:
        config = Config()
    
    crawler = GovernmentCrawler(config)
    try:
        return await crawler.crawl(start_urls)
    finally:
        await crawler.close()
