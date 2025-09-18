#!/bin/bash

# Government Scraper Runner Script
# Usage: ./run_gov_scrape.sh [start_urls...]

set -e

# Default configuration
DEFAULT_START_URLS=(
    "https://www.savannahga.gov/planning"
    "https://www.atlantaga.gov/government/departments/planning"
    "https://www.augustaga.gov/planning"
    "https://www.columbusga.gov/planning"
    "https://www.maconbibb.us/planning"
)

# Get start URLs from command line or use defaults
if [ $# -eq 0 ]; then
    START_URLS=("${DEFAULT_START_URLS[@]}")
    echo "Using default start URLs:"
    for url in "${START_URLS[@]}"; do
        echo "  - $url"
    done
else
    START_URLS=("$@")
    echo "Using provided start URLs:"
    for url in "${START_URLS[@]}"; do
        echo "  - $url"
    done
fi

# Create data directory
mkdir -p data/downloads

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install -r requirements-govscraper.txt

# Run the scraper
echo "Starting government scraper..."
python -m govscraper.cli gov-crawl \
    --start-url "${START_URLS[0]}" \
    --start-url "${START_URLS[1]}" \
    --start-url "${START_URLS[2]}" \
    --start-url "${START_URLS[3]}" \
    --start-url "${START_URLS[4]}" \
    --max-pages 200 \
    --concurrency 4 \
    --out ./data \
    --format jsonl,csv \
    --verbose

echo "Scraping completed! Check the ./data directory for results."
