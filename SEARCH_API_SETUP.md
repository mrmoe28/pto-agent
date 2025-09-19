# Search API Setup Guide

## 🎯 Recommended Search Engines for Government Websites

Based on research, here are the best search engines for finding government permit offices:

### 1. **Google Custom Search API** ⭐ **RECOMMENDED**
- **Best for**: Government websites (.gov domains)
- **Coverage**: Most comprehensive index of government sites
- **Pricing**: 100 free searches/day, then $5 per 1,000 queries
- **Setup**: Requires Google Cloud account and Custom Search Engine

### 2. **Bing Search API** ⭐ **GOOD FALLBACK**
- **Best for**: Alternative to Google, good free tier
- **Coverage**: Good government site coverage
- **Pricing**: 1,000 free queries/month, then $5 per 1,000 queries
- **Setup**: Requires Microsoft Azure account

### 3. **SerpApi** ⭐ **PREMIUM OPTION**
- **Best for**: No technical complexity, handles everything
- **Coverage**: Multiple search engines (Google, Bing, Yahoo, DuckDuckGo)
- **Pricing**: $50/month for 5,000 searches
- **Setup**: Simple API key setup

## 🔧 Environment Variables Setup

Add these to your `.env.local` file:

```bash
# Google Custom Search API (RECOMMENDED)
GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_api_key_here
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id_here

# Bing Search API (FALLBACK)
BING_SEARCH_API_KEY=your_bing_api_key_here

# SerpApi (PREMIUM OPTION)
SERPAPI_API_KEY=your_serpapi_key_here
```

## 📋 Setup Instructions

### Google Custom Search API Setup:

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable the Custom Search API

2. **Create API Key**:
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Copy the API key to `GOOGLE_CUSTOM_SEARCH_API_KEY`

3. **Create Custom Search Engine**:
   - Go to [Google Custom Search](https://cse.google.com/)
   - Click "Add" to create new search engine
   - In "Sites to search", enter: `*.gov`
   - Copy the Search Engine ID to `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`

### Bing Search API Setup:

1. **Create Azure Account**:
   - Go to [Azure Portal](https://portal.azure.com/)
   - Create a new resource group

2. **Create Bing Search Resource**:
   - Search for "Bing Search v7" in Azure Marketplace
   - Create the resource
   - Go to "Keys and Endpoint" → copy key to `BING_SEARCH_API_KEY`

### SerpApi Setup (Optional):

1. **Sign Up**:
   - Go to [SerpApi](https://serpapi.com/)
   - Create account and get API key
   - Copy to `SERPAPI_API_KEY`

## 🚀 Implementation Priority

The system will try search engines in this order:

1. **Google Custom Search API** (if configured)
2. **Bing Search API** (if configured)
3. **DuckDuckGo HTML scraping** (fallback)
4. **Known government website patterns** (last resort)

## 💡 Cost Optimization

- **Start with Google Custom Search**: 100 free searches/day
- **Add Bing as fallback**: 1,000 free queries/month
- **Monitor usage**: Check API usage in respective dashboards
- **Upgrade as needed**: Based on actual usage patterns

## 🔍 Search Query Examples

The system will search for:
- `"Smyrna GA" site:gov`
- `"Smyrna GA building permits" site:gov`
- `"Smyrna GA planning department" site:gov`
- `"Smyrna GA development services" site:gov`

## ✅ Testing

After setup, test with:
```bash
curl "http://localhost:3000/api/permit-offices?city=Smyrna&county=Cobb&state=GA"
```

You should see real government websites returned instead of "No permit offices found".
