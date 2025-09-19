#!/bin/bash

# Google Custom Search API Setup Script
# Usage: ./setup-google-search.sh "YOUR_API_KEY" "YOUR_SEARCH_ENGINE_ID"

if [ $# -ne 2 ]; then
    echo "Usage: $0 \"YOUR_API_KEY\" \"YOUR_SEARCH_ENGINE_ID\""
    echo ""
    echo "Example:"
    echo "$0 \"AIzaSyB...your-api-key...\" \"017576662512468239146:omuauf_lfve\""
    exit 1
fi

API_KEY="$1"
SEARCH_ENGINE_ID="$2"

echo "🔧 Adding Google Custom Search API configuration..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

# Check if the configuration already exists
if grep -q "GOOGLE_CUSTOM_SEARCH_API_KEY" .env.local; then
    echo "⚠️  Google Custom Search API configuration already exists in .env.local"
    echo "Would you like to update it? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        # Remove existing lines
        sed -i '' '/GOOGLE_CUSTOM_SEARCH_API_KEY/d' .env.local
        sed -i '' '/GOOGLE_CUSTOM_SEARCH_ENGINE_ID/d' .env.local
        echo "🔄 Removed existing configuration"
    else
        echo "❌ Cancelled"
        exit 0
    fi
fi

# Add the new configuration
echo "" >> .env.local
echo "# Google Custom Search API (for government website search)" >> .env.local
echo "GOOGLE_CUSTOM_SEARCH_API_KEY=$API_KEY" >> .env.local
echo "GOOGLE_CUSTOM_SEARCH_ENGINE_ID=$SEARCH_ENGINE_ID" >> .env.local

echo "✅ Google Custom Search API configuration added successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Restart your development server: npm run dev"
echo "2. Test the search with: curl \"http://localhost:3002/api/permit-offices?city=Smyrna&county=Cobb&state=GA\""
echo ""
echo "🔍 You should now see 'Using Google Custom Search API' in the logs instead of 'not configured, skipping...'"
