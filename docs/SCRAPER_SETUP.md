# Permit Price Scraper Setup Guide

## Overview

The permit price scraper extracts fee information from government permit office websites. It uses intelligent table parsing, text extraction, and deep crawling to find pricing data.

## Critical Requirements

### 1. Google Custom Search API (Required for Website Discovery)

The scraper uses Google Custom Search to find permit office websites. Without this, it cannot discover websites to scrape.

**Setup Steps:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Custom Search API**
3. Create credentials (API Key)
4. Create a **Programmable Search Engine** at [programmablesearchengine.google.com](https://programmablesearchengine.google.com/)
5. Add both keys to `.env.local`:

```env
GOOGLE_CUSTOM_SEARCH_API_KEY="your_api_key_here"
GOOGLE_CUSTOM_SEARCH_ENGINE_ID="your_search_engine_id"
```

### 2. Playwright Dynamic Scraping (Required for Modern Websites)

Government websites use JavaScript and anti-bot protection. Static scrapers get blocked (HTTP 403/404).

**Enable Dynamic Scraping:**

Add to `.env.local`:
```env
ENABLE_DYNAMIC_SCRAPER=true
```

This enables Playwright headless browser to bypass anti-bot measures.

## How Price Extraction Works

### 1. Table Extraction (deep-crawler.ts)

- **Intelligent Column Detection**: Automatically identifies permit type and fee columns
- **Flexible Header Matching**: Recognizes "fee", "cost", "price", "charge", "amount", "permit type"
- **Multi-Column Support**: Handles tables with multiple fee columns (residential, commercial, etc.)
- **Complex Fee Parsing**:
  - Fee ranges: `$50-$100` → uses minimum as base
  - No fee cases: "No fee", "Waived", "N/A" → returns $0
  - Variable fees: `$5 per kW`, `$0.10/SF`
  - Percentage fees: `2% of project value`
  - Plain numbers: `100.00` (when context indicates fees)

### 2. Text-Based Extraction (enhanced-web-scraper.ts)

- Extracts fees from unstructured text
- Handles multiple fee formats and edge cases
- Better unit extraction for multi-word units

### 3. Deep Crawling (enhanced-permit-scraper.ts)

The scraper crawls up to 15 pages with 4 levels of depth, targeting:

**Fee-Specific Pages:**
- `/fees`, `/fee-schedule`, `/fee-structure`, `/fees-and-charges`
- `/pricing`, `/cost`, `/charges`, `/rates`

**Permit Type Pages:**
- `/building`, `/construction`, `/electrical`, `/plumbing`
- `/mechanical`, `/hvac`, `/zoning`, `/planning`

**Department Pages:**
- `/development-services`, `/building-department`
- `/community-development`, `/building-safety`

## Database Schema

Fees are stored in the `permit_fees` JSONB column:

```typescript
permitFees: {
  building?: { amount?: number; description?: string; unit?: string };
  electrical?: { amount?: number; description?: string; unit?: string };
  plumbing?: { amount?: number; description?: string; unit?: string };
  mechanical?: { amount?: number; description?: string; unit?: string };
  zoning?: { amount?: number; description?: string; unit?: string };
  inspection?: { amount?: number; description?: string; unit?: string };
  planReview?: { amount?: number; description?: string; unit?: string };
  expedited?: { amount?: number; description?: string; unit?: string };
  general?: { amount?: number; description?: string; unit?: string };
  feeScheduleUrl?: string;
}
```

## Testing the Scraper

### Test with Known URLs (Direct Scraping)

```bash
npx tsx scripts/test-direct-scraping.ts
```

This tests the scraper against known permit office URLs, bypassing Google Search.

### Test with Google Search

```bash
npx tsx scripts/test-scraper-pricing.ts
```

This tests the full flow including website discovery via Google Custom Search.

## Common Issues

### Issue: "Google Custom Search API not configured"

**Cause**: Missing `GOOGLE_CUSTOM_SEARCH_API_KEY` or `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`

**Fix**: Follow the Google Custom Search API setup steps above.

### Issue: HTTP 403/404 Errors from Government Websites

**Cause**: Government websites block static scrapers

**Fix**: Enable dynamic scraping:
```env
ENABLE_DYNAMIC_SCRAPER=true
```

### Issue: No Fees Extracted

**Possible Causes:**
1. Website doesn't have fee schedules publicly available
2. Fees are in PDFs (scraper extracts PDF links but doesn't parse PDF content yet)
3. Fees are behind authentication/login walls
4. Fee information is in images/screenshots

**Debug Steps:**
1. Manually visit the permit office website
2. Check if fees are visible without login
3. Check if fees are in tables vs. PDF documents
4. Review scraper logs for extraction attempts

## Rate Limiting

The scraper implements respectful rate limiting:
- Minimum 2 second delay between requests
- Maximum 15 pages per site
- Maximum 4 levels of depth

## Production Deployment

When deploying to production (Vercel), ensure:

1. Add all environment variables to Vercel project settings
2. Enable dynamic scraping:
   ```
   ENABLE_DYNAMIC_SCRAPER=true
   ```
3. Add Google Custom Search API credentials
4. Test with a single location first before enabling for all searches

## Future Improvements

- PDF fee schedule extraction
- OCR for image-based fee schedules
- Cached fee schedules to reduce scraping frequency
- Machine learning for better fee detection
- Support for more permit types (sign permits, demolition, etc.)
