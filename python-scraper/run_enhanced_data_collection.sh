#!/bin/bash

# Enhanced Data Collection Script
# This script runs the enhanced pricing and instruction scraper

echo "🚀 Starting Enhanced Data Collection for Permit Offices"
echo "=================================================="

# Change to the python-scraper directory
cd "$(dirname "$0")"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "📦 Activating virtual environment..."
    source venv/bin/activate
fi

# Install/update dependencies
echo "📦 Installing/updating dependencies..."
pip install -r requirements.txt

# Run the enhanced pricing scraper
echo "🔍 Running enhanced pricing and instruction scraper..."
python run_enhanced_pricing_scraper.py

# Check if the script ran successfully
if [ $? -eq 0 ]; then
    echo "✅ Enhanced data collection completed successfully!"
    echo ""
    echo "📊 Data collected includes:"
    echo "  • Detailed permit fees and pricing"
    echo "  • Comprehensive submission instructions"
    echo "  • Required documents lists"
    echo "  • Application processes"
    echo "  • Processing times"
    echo "  • Downloadable application forms"
    echo "  • Online portal links"
    echo "  • Enhanced contact information"
    echo ""
    echo "🎯 The enhanced data is now available in your permit office search results!"
else
    echo "❌ Enhanced data collection failed. Check the logs for details."
    exit 1
fi

echo "🏁 Script completed!"
