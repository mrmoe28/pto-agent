#!/bin/bash

# Enhanced Permit Office Scraper Runner Script
# This script runs the enhanced scraper with sophisticated data extraction

echo "🚀 Starting Enhanced Permit Office Scraper..."

# Activate virtual environment
source venv/bin/activate

# Set environment variables
export DATABASE_URL="postgresql://neondb_owner:npg_CHW9DuN3bvTV@ep-long-wildflower-adf2shp3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
export GOOGLE_MAPS_API_KEY="AIzaSyAr5knif73PEUZK4nQjGg0-2Bbw6-aIHbo"
export GOOGLE_PLACES_API_KEY="AIzaSyAr5knif73PEUZK4nQjGg0-2Bbw6-aIHbo"

# Create logs directory if it doesn't exist
mkdir -p logs

# Run the enhanced scraper
echo "🔍 Running enhanced scraper with sophisticated data extraction..."
python enhanced_main.py

echo "✅ Enhanced scraper completed!"
echo "📊 Check logs/enhanced_scraper.log for detailed results"
echo "📁 Results saved to logs/enhanced_scraper_results_*.json"

