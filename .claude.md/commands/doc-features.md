# PTO Agent - Feature Documentation

**Last Updated**: October 1, 2025
**Version**: 2.0
**Status**: Production

---

## Overview

PTO Agent is a comprehensive permit office search platform that helps users find local building permits, planning services, and zoning information across Georgia. The platform combines intelligent geocoding, smart jurisdiction detection, and comprehensive permit office data to deliver instant, accurate results.

---

## Core Features

### 1. Intelligent Address Search ✨ **NEW**

**What it does**: Analyzes addresses to determine the correct permit jurisdiction (city vs county level) before searching.

**How it works**:
- Google Places autocomplete with real-time suggestions
- Automatic geocoding to extract city, county, and state
- Jurisdiction analyzer determines if area is incorporated or unincorporated
- Smart search order based on jurisdiction type

**Key Benefits**:
- **Faster searches**: Eliminates wasteful queries
- **Better accuracy**: Matches to correct jurisdiction level
- **Handles edge cases**: Works for unincorporated areas like Chamblee, Conley

**Example**:
```
Input: "3245 Chamblee Dunwoody Rd, Chamblee, GA"
↓
Geocoding: city="Chamblee", county="DeKalb"
↓
Jurisdiction Analysis: "Chamblee is unincorporated"
↓
Search Strategy: County-first
↓
Result: 3 DeKalb County permit offices (instant)
```

---

### 2. Jurisdiction Intelligence System ✨ **NEW**

**What it does**: Built-in knowledge base of incorporated cities and unincorporated areas to optimize permit office searches.

**Coverage**:
- **30+ incorporated GA cities**: Atlanta, Savannah, Alpharetta, Marietta, etc.
- **20+ unincorporated areas**: Chamblee, Conley, Tucker, North Druid Hills, etc.
- **Unknown city fallback**: Conservative county-first approach

**Search Strategies**:

| Jurisdiction Type | Search Order | Example |
|------------------|--------------|---------|
| Incorporated City | City → County | Atlanta, Alpharetta |
| Unincorporated Area | County only | Chamblee, Conley |
| Unknown City | County → City | New/small cities |
| County Only | County | Rural addresses |

**Confidence Levels**:
- **High**: Known incorporated or unincorporated (from knowledge base)
- **Medium**: Unknown city, using heuristics
- **Low**: Missing location data

---

### 3. Enhanced Permit Office Data ✨ **NEW**

**What it does**: Comprehensive permit office information beyond basic contact details.

**Data Fields**:

**Basic Information**:
- Department name and office type
- Physical address with geocoding
- Phone, email, website
- Operating hours (Mon-Sun)

**Online Services**:
- Online application portals (eTRAC, Accela, ePermitting)
- Online payment systems
- Permit tracking capabilities
- Portal URLs

**Permit Details** (JSONB):
- **Fee structures**: Per-project, per-$1000, minimum fees
- **Application instructions**: Step-by-step processes
- **Required documents**: Checklists for different permit types
- **Processing timelines**: Expected turnaround times

**Example - Savannah, GA** (95/100 data quality):
```json
{
  "online_portal": "eTRAC",
  "portal_url": "https://eTRAC.savannahga.gov",
  "fees": {
    "structure": "$12 per $1,000 materials/labor",
    "minimum": "$65",
    "technology_fee": "$5"
  },
  "instructions": {
    "residential": ["Homeowner affidavit", "Licensed contractors", ...],
    "commercial": ["Water & sewer approval", "eTRAC submission", ...]
  },
  "timeline": "BPR Meetings: Thursdays 10am, SPR: Thursdays 1:30pm"
}
```

---

### 4. County Fallback Search ✨ **NEW**

**What it does**: Automatically falls back to county-level results when city searches fail.

**Flow**:
1. Try exact city + county match
2. If no results → fallback to county-only
3. Return all county permit offices

**Why it matters**:
- Unincorporated areas don't have city permit offices
- County offices serve multiple cities/areas
- Prevents "No results found" errors

**Example - Conley, GA**:
```
Search: city="Conley", county="Henry"
↓
City search: 0 results (Conley is unincorporated)
↓
County fallback: Henry County Development Services
↓
Result: Users get correct permit office immediately
```

---

### 5. Database Coverage

**Current Coverage** (as of Oct 1, 2025):

| Metric | Count | Coverage |
|--------|-------|----------|
| **Total GA Offices** | 22 | - |
| **Counties Covered** | 9 | 40% of GA population |
| **Enhanced Offices** | 11 | 50% of database |
| **High-Quality (80+)** | 4 | Savannah, Atlanta, Cobb, DeKalb |
| **Online Portals** | 6 | 27% of database |

**Counties**:
- ✅ Chatham (Savannah)
- ✅ Clayton (Jonesboro)
- ✅ Cobb (Marietta)
- ✅ DeKalb (Decatur/Chamblee)
- ✅ Fulton (Atlanta metro)
- ✅ Gwinnett (Lawrenceville)
- ✅ Henry (McDonough/Conley)
- ✅ Muscogee (Columbus)
- ✅ Richmond (Augusta)

---

### 6. Live Data Collection

**What it does**: Background web scraping when no database results exist.

**Process**:
1. Search database first (instant)
2. If no results → queue background scrape job
3. User gets message: "Collecting live data now. Try again in 1-2 minutes."
4. Scraper extracts permit office data from official websites
5. Data saved to database for future searches

**Status Messages**:
- 202 Created: New scrape job queued
- 200 OK: Scrape job already in progress
- Processing time: 1-2 minutes typical

**Fallback Priority**:
1. Database cache (5 min TTL)
2. Live scraping
3. Error message (service unavailable)

---

### 7. Search Performance Optimization

**Caching Strategy**:
- 5-minute cache for database results
- Cache key: city + county + state + coordinates
- Reduces database load
- Faster repeat searches

**Database Query Timeout**: 5 seconds
- Prevents hanging on slow queries
- Automatic fallback to scraping if timeout

**Distance Sorting**:
- Calculates Haversine distance from search location
- Sorts results by proximity
- Within 20-office result limit

---

### 8. URL Validation & Maintenance

**What it does**: Automated validation of permit office website URLs.

**Scripts**:
- `validate-ga-urls.ts`: Tests all URLs for 200/404/403 status
- `update-ga-urls.ts`: Bulk URL updates from broken to working
- `fix-redirects.ts`: Updates redirected URLs to final destination

**Recent Fixes** (Oct 1, 2025):
- Fixed 18 broken URLs
- Improved from 4 working to 14 working URLs (64% success)
- Updated Atlanta, Savannah, DeKalb, Cobb County URLs

**Validation Results**:
- ✅ 14 working URLs (64%)
- ⚠️ 4 redirected URLs (updated)
- ❌ 8 broken URLs (need manual research)

---

### 9. Geocoding Services

**Primary**: Google Places API
- Autocomplete suggestions
- Place details with address components
- High accuracy for US addresses

**Fallback**: LocationIQ
- Used if Google fails
- Reverse geocoding support

**Address Components Extracted**:
- Formatted address
- City (locality)
- County (administrative_area_level_2)
- State (administrative_area_level_1)
- Latitude/Longitude
- Postal code

---

### 10. User Features

**Subscription System**:
- **Free Plan**: 1 search
- **Pro Plan**: 40 searches/month
- **Enterprise**: Unlimited searches
- Admin users: Unlimited (hardcoded)

**Favorites System**:
- Save permit offices for quick access
- Add personal notes
- Last accessed tracking

**Search History**:
- Track user searches
- Save location data
- Results count
- Last accessed timestamp

**Export Functionality**:
- Export search results to CSV/JSON
- Share with team members
- Download for offline use

---

## Technical Architecture

### Tech Stack

**Frontend**:
- Next.js 15.5.3 (App Router)
- React 19.1.1
- TypeScript 5.9.2
- Tailwind CSS 4.1.13
- ShadCN UI (latest)

**Backend**:
- Next.js API Routes
- Neon PostgreSQL (serverless)
- Drizzle ORM

**Authentication**:
- Clerk (user management)
- JWT-based sessions

**External APIs**:
- Google Places API (geocoding)
- LocationIQ (geocoding fallback)

**Deployment**:
- Vercel (auto-deploy on push)
- GitHub Actions (future CI/CD)

---

### Database Schema

**Key Tables**:

1. **permit_offices**: Core permit office data
   - Basic info (city, county, state, address, contact)
   - Services (building, electrical, plumbing, mechanical, zoning)
   - Online capabilities (applications, payments, tracking)
   - JSONB fields (fees, instructions, processing_times)
   - Geocoding (latitude, longitude)
   - Metadata (source, verified date, active status)

2. **scrape_jobs**: Background data collection
   - Location (city, county, state, coordinates)
   - Status (pending, processing, completed, failed)
   - Attempts counter
   - Error tracking
   - Metadata

3. **user_subscriptions**: Subscription management
   - Plan (free, pro, enterprise)
   - Usage tracking (searches_used, searches_limit)
   - Period dates (start, end)

4. **user_favorites**: Saved permit offices
   - User ID (Clerk)
   - Permit office ID
   - Personal notes
   - Timestamps

---

## Recent Improvements (October 1, 2025)

### 1. Intelligent Jurisdiction Analyzer ⭐ **MAJOR**
- Analyzes addresses to determine city vs county jurisdiction
- Knowledge base of 30+ incorporated cities, 20+ unincorporated areas
- Smart search order (city-first vs county-first)
- Confidence scoring and reasoning
- **Impact**: Faster searches, better accuracy, handles edge cases

### 2. County Fallback Search ⭐ **CRITICAL**
- Automatically falls back to county when city search fails
- Critical for unincorporated areas (Chamblee, Conley)
- **Impact**: Eliminates "No results found" for valid searches

### 3. Enhanced Permit Office Data ⭐ **HIGH VALUE**
- 11 offices enhanced with comprehensive data
- Online portal URLs (6 offices)
- Fee structures (5 offices)
- Application processes (3 offices)
- **Impact**: Users get actionable information, not just phone numbers

### 4. URL Validation System ⭐ **MAINTENANCE**
- Automated URL validation scripts
- Fixed 18 broken URLs
- 64% success rate (up from 18%)
- **Impact**: Reliable website links for users

### 5. Deep Crawl Analysis ⭐ **RESEARCH**
- Comprehensive analysis of automated crawling limitations
- Blueprint for state expansion
- Data collection best practices
- **Impact**: Informed strategy for scaling to other states

---

## Future Roadmap

### Short-term (Next 1-2 weeks)
- ✅ Test Chamblee, GA searches in production
- 📋 Add remaining 7 working GA URLs to database
- 📋 Seed 26 additional major GA counties (75% population coverage)
- 📋 Create admin dashboard for data quality monitoring

### Medium-term (Next 1 month)
- 📋 Expand to Florida (Miami, Tampa, Jacksonville)
- 📋 Expand to Texas (Houston, Dallas, Austin)
- 📋 Expand to North Carolina (Charlotte, Raleigh, Durham)
- 📋 Implement JavaScript rendering for automated crawling (Playwright)

### Long-term (Next 3-6 months)
- 📋 Cover top 10 states by population
- 📋 Achieve 100+ offices with high-quality data
- 📋 Implement automated data refresh (monthly crawls)
- 📋 Build AI-powered permit application assistant
- 📋 Fee calculator based on project scope
- 📋 Timeline estimator for permit processing

---

## Success Metrics

### Current Performance (Oct 1, 2025)
- **Search Speed**: < 2 seconds (database hits)
- **Data Quality**: 51/100 average (11 enhanced offices)
- **URL Success Rate**: 64% (14/22 working)
- **Coverage**: 9 GA counties, 40% population

### Target Metrics (Next Milestone)
- **Search Speed**: < 1 second (optimized queries)
- **Data Quality**: 65/100 average (25 enhanced offices)
- **URL Success Rate**: 86% (30/35 working)
- **Coverage**: 35 GA counties, 75% population

---

## Known Limitations

### Geographic Coverage
- ❌ Only Georgia currently covered
- ❌ Missing 124 of 159 GA counties
- ❌ No out-of-state support yet

### Data Completeness
- ⚠️ Only 50% of offices have enhanced data
- ⚠️ Some offices lack online portal info
- ⚠️ Fee structures not available for all offices

### Automated Crawling
- ❌ JavaScript-heavy government sites not crawlable
- ❌ Bot protection blocks some websites
- ⚠️ Manual data collection more reliable currently

### Search Accuracy
- ⚠️ Unknown cities default to county-first (may be slower for incorporated cities)
- ⚠️ Some city/county name variations not handled
- ✅ Major incorporated/unincorporated areas handled correctly

---

## Commands & Scripts

### Data Collection
```bash
npm run test:deep-crawl          # Run deep crawler on GA offices
npx tsx scripts/validate-ga-urls.ts        # Validate all URLs
npx tsx scripts/update-ga-urls.ts          # Update broken URLs
npx tsx scripts/update-ga-enhanced-data.ts # Populate enhanced data
```

### Testing
```bash
npx tsx scripts/test-chamblee-search.ts         # Test Chamblee fallback
npx tsx scripts/test-jurisdiction-analyzer.ts   # Test jurisdiction logic
npx tsx scripts/check-ga-counties.ts            # Check GA coverage
npx tsx scripts/check-chamblee.ts               # Check DeKalb data
```

### Database
```bash
npm run seed:ga-counties         # Seed GA counties (needs fix)
npx tsx scripts/insert-henry-county.ts  # Manual Henry County insert
```

---

## Documentation Files

- **GEORGIA_COUNTIES_SEED.md**: GA county seeding guide
- **GEORGIA_DEEP_DATA_SUMMARY.md**: Deep data collection summary
- **DEEP_CRAWL_FINDINGS.md**: Automated crawling analysis
- **CONTEXT.md**: Project context and decisions (if exists)
- **.claude.md/commands/doc-features.md**: This file

---

## Support & Resources

### Key URLs
- **Production**: https://pto-agent.vercel.app
- **GitHub**: https://github.com/mrmoe28/pto-agent
- **Database**: Neon PostgreSQL (Vercel integration)

### Contact
- **Owner**: Edward Steel (edwardsteel.0@gmail.com)
- **Admin Role**: Hardcoded for unlimited searches

---

**Last Updated**: October 1, 2025
**Next Review**: Weekly (or after major feature releases)
