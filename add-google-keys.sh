#!/bin/bash

# Script to add Google Custom Search API keys to environment
# This will create a new .env.local.new file that you can then rename

echo "🔧 Google Custom Search API Key Setup"
echo "======================================"
echo ""

# Prompt for API Key
echo "Please enter your Google Custom Search API Key:"
echo "(It should start with 'AIza...')"
read -r API_KEY

echo ""
echo "Please enter your Google Custom Search Engine ID:"
echo "(It should look like: 017576662512468239146:omuauf_lfve)"
read -r SEARCH_ENGINE_ID

echo ""
echo "🔍 Creating new environment configuration..."

# Read the current .env.local and create a new one
if [ -f .env.local ]; then
    # Copy current content
    cp .env.local .env.local.new
    
    # Add Google Custom Search configuration
    echo "" >> .env.local.new
    echo "# Google Custom Search API (for government website search)" >> .env.local.new
    echo "GOOGLE_CUSTOM_SEARCH_API_KEY=$API_KEY" >> .env.local.new
    echo "GOOGLE_CUSTOM_SEARCH_ENGINE_ID=$SEARCH_ENGINE_ID" >> .env.local.new
    
    echo "✅ Created .env.local.new with your Google Custom Search API keys!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Backup your current .env.local: mv .env.local .env.local.backup"
    echo "2. Use the new file: mv .env.local.new .env.local"
    echo "3. Restart your development server: npm run dev"
    echo ""
    echo "🔍 You should then see 'Using Google Custom Search API' in the logs!"
    
else
    echo "❌ .env.local file not found!"
    exit 1
fi
