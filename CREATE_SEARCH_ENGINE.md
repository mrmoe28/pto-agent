# Create Google Custom Search Engine

## 🎯 You're Missing the Search Engine ID!

Your API key looks good: `AIzaSyAr5knif73PEUZK4nQjGg0-2Bbw6-aIHbo`

But you need to create a **Custom Search Engine** to get the Search Engine ID.

## 📋 Steps to Create Search Engine:

### 1. Go to Google Custom Search
Visit: [https://cse.google.com/](https://cse.google.com/)

### 2. Click "Add" to Create New Search Engine
- Click the "Add" button to create a new search engine

### 3. Configure the Search Engine
- **Sites to search**: Enter `*.gov`
- **Language**: English
- **Search engine name**: "Government Websites Search" (or any name you prefer)

### 4. Click "Create"
- Click the "Create" button

### 5. Get Your Search Engine ID
After creation, you'll see a page with:
- **Search engine ID**: This will look like `017576662512468239146:omuauf_lfve`
- Copy this ID

### 6. Update Your .env.local
Replace `no search engine id` with your actual Search Engine ID:

```bash
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_actual_search_engine_id_here
```

## 🔧 Quick Fix Script

Once you have your Search Engine ID, run:

```bash
# Replace YOUR_SEARCH_ENGINE_ID with your actual ID
sed -i '' 's/no search engine id/YOUR_SEARCH_ENGINE_ID/' .env.local
```

## ✅ Expected Result

Your Search Engine ID should look something like:
- `017576662512468239146:omuauf_lfve`
- `012345678901234567890:abcdefghijk`

## 🚀 After Getting the ID

1. Update the `.env.local` file with your real Search Engine ID
2. Restart the development server: `npm run dev`
3. Test the search - you should see "Using Google Custom Search API" in the logs!

**The API key is working, you just need the Search Engine ID to complete the setup!**
