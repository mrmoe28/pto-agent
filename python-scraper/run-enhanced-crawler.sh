#!/bin/bash

# Enhanced Permit Office Crawler Runner
# This script runs the enhanced crawler with new data extraction capabilities

echo "Enhanced Permit Office Crawler"
echo "=============================="
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run database migration first
echo ""
echo "Running database migration..."
python migrate_database.py

if [ $? -ne 0 ]; then
    echo "Migration failed. Exiting."
    exit 1
fi

echo ""
echo "Migration completed successfully!"
echo ""

# Test the enhanced data extractor
echo "Testing enhanced data extractor..."
python -c "
import asyncio
from test_enhanced_crawler import test_data_extractor
asyncio.run(test_data_extractor())
"

if [ $? -ne 0 ]; then
    echo "Data extractor test failed. Exiting."
    exit 1
fi

echo ""
echo "Data extractor test passed!"
echo ""

# Run the enhanced crawler test
echo "Running enhanced crawler test..."
python test_enhanced_crawler.py

if [ $? -ne 0 ]; then
    echo "Enhanced crawler test failed."
    exit 1
fi

echo ""
echo "Enhanced crawler test completed!"
echo ""

# Optionally run the full enhanced scraper
read -p "Do you want to run the full enhanced scraper on all targets? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running full enhanced scraper..."
    python enhanced_main.py
else
    echo "Skipping full scraper run."
fi

echo ""
echo "Enhanced crawler setup complete!"
echo ""
echo "New capabilities added:"
echo "- Permit fees extraction"
echo "- Instructions and guidelines extraction"
echo "- Downloadable application detection"
echo "- Processing times extraction"
echo "- Enhanced office hours parsing"
echo ""
echo "The crawler will now extract much more detailed information"
echo "from permit office websites and store it in the database."
