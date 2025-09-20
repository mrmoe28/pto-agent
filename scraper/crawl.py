"""
Main crawler logic for discovering and extracting permit data.
"""
import json
import time
import random
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlparse, parse_qs
from collections import deque, defaultdict
from typing import List, Dict, Set, Optional, Generator
from bs4 import BeautifulSoup

from .models import Record, CrawlStats, SeedMetadata
from .config import (
    MAX_DEPTH, DOMAIN_CONCURRENCY, PERMIT_KEYWORDS,
    PLATFORM_PRIORITY, RAW_DIR, LOGS_DIR
)
from .utils import (
    get, is_allowed, absolute_url, clean_text, is_same_domain,
    is_media_file, normalize_url, looks_js_heavy, extract_domain
)
from .dynamic import render_html_sync, is_playwright_available
from .pdf_extract import extract_pdf_content
from .fees_normalizer import summarize_fees

# Import platform detectors
from .rules.platforms import accela, etrakit, tyler_energov, cityview, opengov, civicplus, salesforce_exp
from .rules import generic

# Platform detection order
PLATFORM_MODULES = {
    'accela': accela,
    'etrakit': etrakit,
    'tyler-energov': tyler_energov,
    'cityview': cityview,
    'opengov': opengov,
    'civicplus': civicplus,
    'salesforce-exp': salesforce_exp,
}


class PermitCrawler:
    """Main crawler class for discovering and extracting permit data."""

    def __init__(self, max_depth: int = MAX_DEPTH, allow_dynamic: bool = False):
        self.max_depth = max_depth
        self.allow_dynamic = allow_dynamic
        self.stats = CrawlStats()
        self.visited_urls: Set[str] = set()
        self.discovered_urls: Dict[str, deque] = defaultdict(deque)  # Per-domain queues
        self.extracted_records: List[Record] = []
        self.seed_metadata: Dict[str, SeedMetadata] = {}

    def add_seed_urls(self, urls: List[str], metadata: Optional[List[dict]] = None):
        """Add seed URLs to the crawler."""
        if metadata:
            for url, meta in zip(urls, metadata):
                if meta:
                    self.seed_metadata[url] = SeedMetadata(**meta)

        for url in urls:
            domain = extract_domain(url)
            self.discovered_urls[domain].append({
                'url': url,
                'depth': 0,
                'discovered_via': 'seed',
                'parent_url': None
            })

    def discover_sitemap_urls(self, base_url: str) -> List[str]:
        """Discover URLs from sitemap.xml."""
        sitemap_urls = []
        domain = extract_domain(base_url)

        try:
            sitemap_url = f"https://{domain}/sitemap.xml"
            if not is_allowed(sitemap_url):
                return sitemap_urls

            response = get(sitemap_url)
            soup = BeautifulSoup(response.content, 'xml')

            # Handle sitemap index
            sitemaps = soup.find_all('sitemap')
            if sitemaps:
                for sitemap in sitemaps[:5]:  # Limit to 5 sitemaps
                    loc = sitemap.find('loc')
                    if loc:
                        sub_sitemap_url = loc.text
                        sitemap_urls.extend(self.discover_sitemap_urls(sub_sitemap_url))

            # Handle URL set
            urls = soup.find_all('url')
            for url_tag in urls:
                loc = url_tag.find('loc')
                if loc:
                    url = loc.text
                    url_lower = url.lower()

                    # Filter for permit-related URLs
                    if any(keyword in url_lower for keyword in PERMIT_KEYWORDS):
                        sitemap_urls.append(url)

        except Exception as e:
            self.stats.add_error(f"Sitemap discovery failed for {base_url}: {str(e)}")

        return sitemap_urls[:50]  # Limit total URLs from sitemap

    def extract_next_links(self, url: str, soup: BeautifulSoup, current_depth: int) -> List[Dict]:
        """Extract relevant links from the current page."""
        if current_depth >= self.max_depth:
            return []

        links = []
        domain = extract_domain(url)

        # Find all anchor tags
        anchor_tags = soup.find_all('a', href=True)

        for tag in anchor_tags:
            href = tag.get('href')
            if not href:
                continue

            # Convert to absolute URL
            absolute_href = absolute_url(url, href)

            # Skip if not same domain
            if not is_same_domain(url, absolute_href):
                continue

            # Skip media files
            if is_media_file(absolute_href):
                continue

            # Normalize URL
            normalized_url = normalize_url(absolute_href)

            # Skip if already visited
            if normalized_url in self.visited_urls:
                continue

            # Check if link text or URL contains permit keywords
            link_text = clean_text(tag.get_text()).lower()
            url_path = urlparse(absolute_href).path.lower()

            relevant = False
            for keyword in PERMIT_KEYWORDS:
                if keyword in link_text or keyword in url_path:
                    relevant = True
                    break

            if relevant:
                links.append({
                    'url': normalized_url,
                    'depth': current_depth + 1,
                    'discovered_via': 'crawl',
                    'parent_url': url,
                    'link_text': link_text[:100]  # Store for context
                })

        return links[:20]  # Limit links per page

    def detect_platform(self, url: str, html: str, soup: BeautifulSoup) -> str:
        """Detect which platform the page is using."""
        for platform_name in PLATFORM_PRIORITY:
            if platform_name in PLATFORM_MODULES:
                module = PLATFORM_MODULES[platform_name]
                if hasattr(module, 'detect') and module.detect(url, html):
                    return platform_name
        return 'unknown'

    def parse_page(self, url: str, html: str, soup: BeautifulSoup, discovered_via: str) -> Optional[Record]:
        """Parse a page for permit information using platform-specific parsers."""
        # Detect platform
        platform = self.detect_platform(url, html, soup)

        record = None

        # Try platform-specific parser
        if platform != 'unknown' and platform in PLATFORM_MODULES:
            module = PLATFORM_MODULES[platform]
            if hasattr(module, 'parse'):
                try:
                    record = module.parse(url, html, soup)
                    if record:
                        self.stats.add_platform_detection(platform)
                except Exception as e:
                    self.stats.add_error(f"Platform parser error for {platform} on {url}: {str(e)}")

        # Fallback to generic parser
        if not record:
            try:
                seed_meta = self.seed_metadata.get(url)
                seed_meta_dict = seed_meta.model_dump() if seed_meta else None
                record = generic.parse(url, html, soup, seed_meta_dict)
                if record:
                    self.stats.add_platform_detection('generic')
            except Exception as e:
                self.stats.add_error(f"Generic parser error on {url}: {str(e)}")

        if record:
            record.discovered_via = discovered_via
            record.set_timestamp()

            # Process linked PDFs for fee information
            self.process_pdf_links(record, soup)

        return record

    def process_pdf_links(self, record: Record, soup: BeautifulSoup):
        """Process PDF links to extract fee information."""
        pdf_links = soup.find_all('a', href=lambda x: x and x.lower().endswith('.pdf'))

        for link in pdf_links[:3]:  # Limit to 3 PDFs per page
            href = link.get('href')
            link_text = clean_text(link.get_text()).lower()

            # Only process fee-related PDFs
            if any(keyword in link_text for keyword in ['fee', 'schedule', 'cost', 'valuation']):
                try:
                    pdf_url = absolute_url(record.source_url, href)
                    pdf_result = extract_pdf_content(pdf_url)

                    if pdf_result['success']:
                        self.stats.pdfs_parsed += 1

                        # Summarize fees from PDF
                        fee_summary = summarize_fees(pdf_result['tables'], pdf_result['text'])
                        if fee_summary:
                            if record.permit_fee:
                                record.permit_fee += " | PDF: " + " ".join(fee_summary[:3])
                            else:
                                record.permit_fee = "PDF: " + " ".join(fee_summary[:3])

                except Exception as e:
                    self.stats.add_error(f"PDF processing error for {pdf_url}: {str(e)}")

    def crawl_page(self, url_info: Dict) -> Optional[Record]:
        """Crawl a single page and extract permit information."""
        url = url_info['url']
        depth = url_info['depth']
        discovered_via = url_info['discovered_via']

        # Check robots.txt
        if not is_allowed(url):
            self.stats.robots_skipped += 1
            return None

        try:
            # Fetch page
            response = get(url)
            html = response.text
            self.stats.pages_fetched += 1

            # Check if page needs JavaScript rendering
            if self.allow_dynamic and looks_js_heavy(html):
                rendered_html = render_html_sync(url)
                if rendered_html and len(rendered_html) > len(html):
                    html = rendered_html
                    self.stats.rendered_pages += 1

            # Parse HTML
            soup = BeautifulSoup(html, 'html.parser')

            # Extract record
            record = self.parse_page(url, html, soup, discovered_via)

            # Discover new URLs if not at max depth
            if depth < self.max_depth:
                new_links = self.extract_next_links(url, soup, depth)
                domain = extract_domain(url)

                for link_info in new_links:
                    link_url = link_info['url']
                    if link_url not in self.visited_urls:
                        self.discovered_urls[domain].append(link_info)

            return record

        except Exception as e:
            self.stats.add_error(f"Crawl error for {url}: {str(e)}")
            return None

    def crawl(self, seed_urls: List[str], seed_metadata: Optional[List[dict]] = None) -> Generator[Record, None, None]:
        """
        Main crawl method that yields records as they are discovered.
        """
        self.stats.start_time = datetime.utcnow().isoformat()

        # Add seed URLs
        self.add_seed_urls(seed_urls, seed_metadata)

        # Discover sitemap URLs
        for seed_url in seed_urls:
            sitemap_urls = self.discover_sitemap_urls(seed_url)
            if sitemap_urls:
                domain = extract_domain(seed_url)
                for sitemap_url in sitemap_urls:
                    if sitemap_url not in self.visited_urls:
                        self.discovered_urls[domain].append({
                            'url': sitemap_url,
                            'depth': 0,
                            'discovered_via': 'sitemap',
                            'parent_url': seed_url
                        })

        # Process URLs by domain with concurrency limits
        while any(self.discovered_urls.values()):
            # Process one URL from each domain (round-robin)
            for domain, queue in list(self.discovered_urls.items()):
                if not queue:
                    continue

                url_info = queue.popleft()
                url = url_info['url']

                if url in self.visited_urls:
                    continue

                self.visited_urls.add(url)

                # Crawl the page
                record = self.crawl_page(url_info)

                if record:
                    self.extracted_records.append(record)
                    yield record

        self.stats.end_time = datetime.utcnow().isoformat()

    def get_stats(self) -> CrawlStats:
        """Get crawl statistics."""
        return self.stats

    def save_raw_data(self, records: List[Record], output_dir: Path = RAW_DIR):
        """Save raw data as NDJSON files per host."""
        output_dir.mkdir(parents=True, exist_ok=True)

        # Group records by host
        by_host = defaultdict(list)
        for record in records:
            host = extract_domain(record.source_url)
            by_host[host].append(record)

        # Save each host's data
        for host, host_records in by_host.items():
            filename = f"{host.replace('.', '_')}.ndjson"
            filepath = output_dir / filename

            with open(filepath, 'w') as f:
                for record in host_records:
                    f.write(json.dumps(record.model_dump()) + '\n')

    def save_crawl_ledger(self, output_dir: Path = LOGS_DIR):
        """Save crawl ledger with statistics."""
        output_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        filename = f"crawl_ledger_{timestamp}.json"
        filepath = output_dir / filename

        ledger = {
            'stats': self.stats.model_dump(),
            'records_count': len(self.extracted_records),
            'visited_urls_count': len(self.visited_urls),
            'seed_metadata_count': len(self.seed_metadata)
        }

        with open(filepath, 'w') as f:
            json.dump(ledger, f, indent=2)

        return filepath