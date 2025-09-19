# Google Custom Search API Setup Guide

## 🎯 Quick Setup Steps

Since you've already added the Google Custom Search API to your Google Cloud project, follow these steps:

### 1. Get Your API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Find your API key and copy it

### 2. Create Custom Search Engine
1. Go to [Google Custom Search](https://cse.google.com/)
2. Click "Add" to create a new search engine
3. In "Sites to search", enter: `*.gov`
4. Click "Create"
5. Copy the "Search Engine ID" from the setup page

### 3. Update Your Environment Variables

Add these lines to your `.env.local` file:

```bash
# Google Custom Search API (for government website search)
GOOGLE_CUSTOM_SEARCH_API_KEY=your_actual_api_key_here
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_actual_search_engine_id_here
```

### 4. Test the Configuration

After adding the environment variables, restart your development server:

```bash
npm run dev
```

Then test with a Smyrna address to see real government websites!

## 🔍 What This Enables

With Google Custom Search API configured, the system will:

1. **Search specifically for `.gov` websites** - Perfect for government permit offices
2. **Find real permit offices** - No more "No permit offices found" errors
3. **Get accurate results** - Real government websites with contact info, hours, etc.
4. **Use 100 free searches per day** - Great for development and testing

## 🚀 Expected Results

Once configured, searching for "Smyrna, GA" should return:
- City of Smyrna government website
- Cobb County government website  
- Building permit department pages
- Planning department information
- Real contact details and hours

## 🛠️ Troubleshooting

If you don't see results:
1. Verify the API key is correct
2. Check the Search Engine ID is correct
3. Make sure the Custom Search Engine is set to search `*.gov`
4. Check the browser console for any error messages

## 📊 Monitoring Usage

- Check your Google Cloud Console for API usage
- 100 free searches per day
- $5 per 1,000 additional searches
- Monitor usage in the "APIs & Services" → "Quotas" section
