# Permit Office Scraper

A Python-based web scraper for collecting permit office data from government websites. This service integrates with the Next.js web application to provide comprehensive permit office search functionality.

## Features

- **Multi-method scraping**: BeautifulSoup, Playwright, and Selenium
- **Intelligent data extraction**: Automatically identifies office information
- **Geocoding integration**: Google Maps and OpenStreetMap support
- **Rate limiting**: Respectful scraping with configurable delays
- **Error handling**: Robust error handling and retry logic
- **Data validation**: Confidence scoring for scraped data

## Technology Stack

- **Python 3.8+**
- **BeautifulSoup4** - HTML parsing
- **Scrapy** - Web crawling framework
- **Selenium** - JavaScript-heavy sites
- **Playwright** - Modern browser automation
- **Google Maps API** - Geocoding
- **PostgreSQL** - Data storage
- **Pydantic** - Data validation

## Installation

1. **Install Python dependencies:**
   ```bash
   cd python-scraper
   pip install -r requirements.txt
   ```

2. **Install Playwright browsers:**
   ```bash
   playwright install chromium
   ```

3. **Install Chrome for Selenium:**
   ```bash
   # On Ubuntu/Debian
   sudo apt-get install chromium-chromedriver
   
   # On macOS
   brew install chromedriver
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Configuration

Edit `config.py` to configure:

- **Target websites** to scrape
- **CSS selectors** for data extraction
- **Rate limiting** settings
- **Database connection**
- **API keys** for geocoding

## Usage

### Basic Usage

```bash
python main.py
```

### Custom Targets

```python
from scraper import PermitOfficeScraper
from models import ScrapingTarget

target = ScrapingTarget(
    name="Atlanta Building Department",
    url="https://www.atlantaga.gov/building",
    type="city",
    state="GA",
    city="Atlanta",
    county="Fulton",
    selectors={
        "office_name": "h1, .department-name",
        "address": ".address, .location",
        "phone": ".phone, [href^='tel:']",
        "email": ".email, [href^='mailto:']"
    }
)

async with PermitOfficeScraper() as scraper:
    result = await scraper.scrape_target(target)
    print(f"Found {result.offices_processed} offices")
```

### Scheduled Scraping

```python
import schedule
import time

def run_scraper():
    asyncio.run(main())

# Schedule scraping every day at 2 AM
schedule.every().day.at("02:00").do(run_scraper)

while True:
    schedule.run_pending()
    time.sleep(60)
```

## Data Models

### PermitOffice

```python
class PermitOffice(BaseModel):
    # Location
    city: str
    county: str
    state: str
    jurisdiction_type: JurisdictionType
    
    # Office details
    department_name: str
    office_type: OfficeType
    address: str
    phone: Optional[str]
    email: Optional[str]
    website: Optional[str]
    
    # Services
    building_permits: bool
    electrical_permits: bool
    plumbing_permits: bool
    # ... more services
    
    # Geographic data
    latitude: Optional[float]
    longitude: Optional[float]
    
    # Metadata
    data_source: DataSource
    confidence_score: Optional[float]
```

## Scraping Methods

### 1. BeautifulSoup (Fast, Simple)
- Best for static HTML content
- Fastest method
- Limited JavaScript support

### 2. Playwright (Recommended)
- Handles JavaScript-heavy sites
- Modern, fast, reliable
- Good for complex government sites

### 3. Selenium (Fallback)
- Maximum compatibility
- Slower than Playwright
- Use when others fail

## Integration with Web App

The scraper integrates with the Next.js web application through:

1. **Database synchronization** - Scraped data is stored in PostgreSQL
2. **API endpoints** - Web app queries scraped data via REST API
3. **Google Places integration** - Address autocomplete works with scraped data
4. **Real-time updates** - New data is immediately available

## Monitoring and Logging

- **Structured logging** with configurable levels
- **Performance metrics** for each scraping operation
- **Error tracking** with detailed error messages
- **Confidence scoring** for data quality assessment

## Best Practices

1. **Respect robots.txt** and rate limits
2. **Use appropriate delays** between requests
3. **Handle errors gracefully** with retry logic
4. **Validate scraped data** before storing
5. **Monitor scraping performance** and adjust as needed

## Troubleshooting

### Common Issues

1. **Chrome/Chromium not found**
   ```bash
   # Install Chrome/Chromium
   playwright install chromium
   ```

2. **Rate limiting errors**
   - Increase delays in config
   - Reduce concurrent requests

3. **Geocoding failures**
   - Check API keys
   - Verify address formats

4. **Database connection errors**
   - Check DATABASE_URL
   - Ensure database is running

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
python main.py
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## License

MIT License - see LICENSE file for details
