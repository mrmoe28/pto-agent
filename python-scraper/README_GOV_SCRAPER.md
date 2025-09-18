# Government Website Scraper

A comprehensive, resume-safe scraper for U.S. city/county Planning & Building department websites. Extracts permit fees, processing instructions, turnaround times, contact information, and downloadable applications with high accuracy.

## Features

### 🏛️ Government-Specific Extraction
- **Permit Fees**: Extracts fee tables, schedules, and pricing information
- **Processing Instructions**: Captures application processes, requirements, and checklists  
- **Turnaround Times**: Finds processing periods and review times
- **Contact Information**: Phone numbers, email addresses, and physical addresses
- **Downloadable Applications**: PDF forms, documents, and applications
- **Jurisdiction Information**: Department names and jurisdictional details

### 🚀 Advanced Crawling Features
- **Deep Discovery**: Pagination detection and internal link discovery
- **Resume-Safe**: SQLite-based state management for interrupted crawls
- **Politeness**: Respects robots.txt, rate limiting, and random delays
- **Concurrent Processing**: Async HTTP/2 with configurable concurrency
- **Smart Filtering**: Domain-aware crawling with government-specific keywords

### 📊 Data Quality & Output
- **Multiple Formats**: JSONL and CSV output
- **Deduplication**: Content fingerprinting to avoid duplicates
- **Validation**: Pydantic models with data validation
- **Rich Reporting**: Detailed statistics and progress tracking

## Installation

### Requirements
- Python 3.8+
- Virtual environment (recommended)

### Setup
```bash
# Clone or navigate to the project directory
cd python-scraper

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements-govscraper.txt
```

## Quick Start

### 1. Basic Usage
```bash
# Run with default Georgia government websites
./run_gov_scrape.sh

# Or specify custom URLs
python -m govscraper.cli gov-crawl \
    --start-url "https://www.cityofatlanta.gov/planning" \
    --start-url "https://www.savannahga.gov/building" \
    --max-pages 100 \
    --concurrency 4 \
    --out ./data \
    --format jsonl,csv \
    --verbose
```

### 2. Test Single URL
```bash
# Test extraction on a specific page
python -m govscraper.cli gov-test "https://www.savannahga.gov/planning/permits" --verbose
```

### 3. Validate Results
```bash
# Validate JSONL output
python -m govscraper.cli gov-validate data/gov_scraper_results_20231218_143022.jsonl

# Remove duplicates
python -m govscraper.cli gov-dedupe data/gov_scraper_results_20231218_143022.jsonl
```

## Configuration

### Environment Variables
Copy `env.example` to `.env` and customize:

```bash
# Politeness settings
CONCURRENCY=8
RATE_LIMIT_PER_SEC=1
DELAY_MS_MIN=250
DELAY_MS_MAX=1200
MAX_PAGES=500
MAX_DEPTH=6
RESPECT_ROBOTS=true

# Output settings
OUT_DIR=./data
FORMAT=jsonl,csv

# Downloads
DOWNLOADS_DIR=./data/downloads
MAX_DOWNLOAD_MB=25
```

### Command Line Options
```bash
python -m govscraper.cli gov-crawl --help
```

**Key Options:**
- `--start-url`: Starting URLs (repeatable)
- `--max-pages`: Maximum pages to crawl
- `--max-depth`: Maximum crawl depth
- `--concurrency`: Number of concurrent requests
- `--out`: Output directory
- `--format`: Output formats (jsonl, csv)
- `--resume`: Resume from previous crawl
- `--fresh`: Start fresh (clear state)
- `--verbose`: Detailed logging

## Data Schema

### GovRecord Structure
```python
{
    "jurisdiction_name": "City of Savannah Planning & Development",
    "source_url": "https://www.savannahga.gov/planning/permits",
    "permit_fee": "$75 base fee + $5 per $1,000 valuation",
    "processing_instructions": "Submit application with required documents...",
    "turnaround_time": "5-10 business days",
    "downloadable_applications": [
        {
            "name": "Building Permit Application",
            "href": "https://example.gov/forms/building_permit.pdf",
            "file_path": "/data/downloads/building_permit.pdf",
            "bytes": 245760,
            "content_hash": "sha256:abc123...",
            "filetype": "pdf"
        }
    ],
    "phone": "+15555551234",
    "email": "planning@savannahga.gov",
    "address": "123 Main St, Savannah, GA 31401",
    "last_scraped_at": "2023-12-18T14:30:22Z",
    "notes": null
}
```

## Architecture

### Core Components
- **`config.py`**: Configuration management with environment variables
- **`models.py`**: Pydantic data models with validation
- **`http_client.py`**: Async HTTP/2 client with rate limiting and retries
- **`robots.py`**: Robots.txt compliance checking
- **`state.py`**: SQLite-based crawl state management
- **`pagination.py`**: Link discovery and pagination detection
- **`extractors.py`**: Government-specific field extraction
- **`downloads.py`**: File download and processing
- **`persist.py`**: Data persistence (JSONL, CSV)
- **`runner.py`**: Main crawler orchestration
- **`cli.py`**: Command-line interface

### Extraction Heuristics

#### Permit Fees
- Searches for fee-related headings and sections
- Extracts from tables, definition lists, and text blocks
- Recognizes currency patterns: `$1,234.56`, `1234.56 dollars`
- Captures context around fee information

#### Processing Instructions
- Finds instruction-related headings
- Extracts ordered/unordered lists and paragraphs
- Looks for application processes and requirements

#### Turnaround Times
- Pattern matching for time expressions
- Recognizes: "5-10 business days", "2 weeks", "within 30 days"
- Prioritizes more specific time ranges

#### Contact Information
- **Phone**: Uses `phonenumbers` library for validation and E.164 formatting
- **Email**: Regex matching with noreply filtering
- **Address**: `usaddress` library for structured address parsing

#### Downloadable Applications
- Finds links to PDF, DOC, DOCX files
- Filters by application-related keywords
- Downloads files under size limit with content hashing

## Best Practices

### Respectful Crawling
- Always respects robots.txt
- Conservative rate limiting (1 request/second by default)
- Random delays between requests
- Rotating user agents
- Proper error handling and retries

### Data Quality
- Content deduplication using fingerprints
- Data validation with Pydantic models
- Comprehensive error logging
- Progress tracking and statistics

### Scalability
- Async/await throughout for performance
- Configurable concurrency limits
- Resume-safe state management
- Efficient SQLite storage

## Troubleshooting

### Common Issues

#### No Data Extracted
- Check if the website blocks automated access
- Verify the site structure matches expected patterns
- Use `gov-test` command to debug single URLs
- Enable verbose logging for detailed extraction info

#### Rate Limited
- Reduce `CONCURRENCY` setting
- Increase `DELAY_MS_MIN` and `DELAY_MS_MAX`
- Lower `RATE_LIMIT_PER_SEC`

#### Memory Issues
- Reduce `MAX_PAGES` for large crawls
- Lower `CONCURRENCY` setting
- Clear state periodically with `--fresh`

### Logging
Enable verbose logging for debugging:
```bash
python -m govscraper.cli gov-crawl --verbose
```

### State Management
- Crawl state is stored in SQLite (`./data/state.sqlite`)
- Use `--resume` to continue interrupted crawls
- Use `--fresh` to start clean

## Output Files

### Generated Files
```
data/
├── gov_scraper_results_20231218_143022.jsonl  # JSONL output
├── gov_scraper_results_20231218_143022.csv    # CSV output
├── scraping_summary_20231218_143022.txt       # Summary report
├── state.sqlite                               # Crawl state
└── downloads/                                 # Downloaded files
    ├── City_of_Savannah/
    │   ├── building_permit.pdf
    │   └── zoning_application.docx
    └── Chatham_County/
        └── electrical_permit.pdf
```

### Data Analysis
Use pandas to analyze results:
```python
import pandas as pd

# Load CSV results
df = pd.read_csv('data/gov_scraper_results_20231218_143022.csv')

# Analyze fee coverage
fee_coverage = len(df[df['permit_fee'].notna()]) / len(df)
print(f"Fee coverage: {fee_coverage:.2%}")

# Top jurisdictions by record count
top_jurisdictions = df['jurisdiction_name'].value_counts().head(10)
print(top_jurisdictions)
```

## Contributing

### Adding New Extractors
Extend the `GovernmentExtractor` class in `extractors.py`:
```python
def _extract_custom_field(self, soup: BeautifulSoup) -> Optional[str]:
    # Custom extraction logic
    pass
```

### Testing
```bash
# Test single URL extraction
python -m govscraper.cli gov-test "https://example.gov/planning"

# Validate output schema
python -m govscraper.cli gov-validate output.jsonl
```

## License

This project is designed for research and legitimate data collection purposes. Always respect website terms of service and robots.txt files.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Enable verbose logging for debugging
3. Test with single URLs using `gov-test`
4. Review the extraction patterns in `extractors.py`
