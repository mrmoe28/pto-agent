#!/bin/bash

# Permit Office Scraper Runner Script
# This script sets up the environment and runs the scraper

echo "🚀 Starting Permit Office Scraper..."

# Activate virtual environment
source venv/bin/activate

# Set environment variables
export DATABASE_URL="postgresql://neondb_owner:npg_CHW9DuN3bvTV@ep-long-wildflower-adf2shp3-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
export GOOGLE_MAPS_API_KEY="AIzaSyAr5knif73PEUZK4nQjGg0-2Bbw6-aIHbo"
export GOOGLE_PLACES_API_KEY="AIzaSyAr5knif73PEUZK4nQjGg0-2Bbw6-aIHbo"

# Run the scraper
echo "🔍 Running scraper..."
python main.py

echo "✅ Scraper completed!"
