#!/bin/bash

# Comprehensive Data Collection Script
# This script runs both enhanced data scraping and specialized fee scraping

echo "🚀 Starting Comprehensive Data Collection for Permit Offices"
echo "============================================================="

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

# Run the comprehensive scraper
echo "🔍 Running comprehensive data and fee scraper..."
echo "   This will:"
echo "   • Search multiple pages per office for detailed data"
echo "   • Extract comprehensive pricing and fee information"
echo "   • Collect detailed submission instructions"
echo "   • Find downloadable applications and forms"
echo "   • Identify online portals and services"
echo ""

python run_comprehensive_scraper.py

# Check if the script ran successfully
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Comprehensive data collection completed successfully!"
    echo ""
    echo "📊 Data collected includes:"
    echo "  • Detailed permit fees and pricing from government websites"
    echo "  • Comprehensive submission instructions and requirements"
    echo "  • Required documents lists and application processes"
    echo "  • Processing times and turnaround information"
    echo "  • Downloadable application forms and PDFs"
    echo "  • Online portal links and electronic services"
    echo "  • Enhanced contact information and office hours"
    echo ""
    echo "🎯 The comprehensive data is now available in your permit office search results!"
    echo "   Users will now see detailed pricing, instructions, and submission requirements."
else
    echo "❌ Comprehensive data collection failed. Check the logs for details."
    exit 1
fi

echo "🏁 Script completed!"
