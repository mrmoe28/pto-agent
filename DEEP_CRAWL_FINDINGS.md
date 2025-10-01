# Deep Crawl Findings & Data Collection Blueprint

## Executive Summary

**Date**: October 1, 2025
**Scope**: Georgia permit offices (22 total offices across 9 counties)
**Goal**: Extract comprehensive permit data to create blueprint for state expansion

### Key Findings

1. **URL Validation Success**: Fixed 18 broken URLs, improving from 4 working to 14 working URLs
2. **Automated Crawling Limitations**: Deep crawler unable to extract data due to:
   - Heavy JavaScript rendering on government sites
   - Bot protection (403 Forbidden errors)
   - Content buried deep in site navigation
   - Interactive elements requiring user actions

3. **Manual Data Collection Feasibility**: Successfully extracted detailed permit data from Savannah, GA through targeted page fetching

## Current Database Status

### Georgia Counties Coverage
- **Total Counties**: 9 (out of 159 in Georgia)
- **Total Offices**: 22
- **Population Coverage**: ~40% of Georgia
- **Working Website URLs**: 14 (64%)

### Counties Represented
1. ✅ Chatham County (Savannah) - 2 offices
2. ✅ Clayton County (Jonesboro) - 2 offices
3. ✅ Cobb County (Marietta) - 2 offices
4. ✅ DeKalb County (Decatur) - 3 offices
5. ✅ Fulton County (Atlanta metro) - 6 offices
6. ✅ Gwinnett County (Lawrenceville) - 3 offices
7. ✅ Henry County (McDonough/Conley) - 1 office
8. ✅ Muscogee County (Columbus) - 1 office
9. ✅ Richmond County (Augusta) - 1 office

## URL Validation Results

### ✅ Working URLs (14 offices)
- Savannah Development Services (2 offices)
- Jonesboro offices (2)
- Marietta/Cobb County (2)
- DeKalb County (3)
- Gwinnett County (3)
- Columbus (1)
- Fulton County Permits (1)

### ❌ Problematic URLs (8 offices)
**403 Forbidden (Bot Protection)**:
- Atlanta Office of Buildings
- Atlanta Online Permitting
- Roswell Community Development
- Marietta Community Development

**404 Not Found**:
- Sandy Springs (2 offices)
- Lawrenceville Planning

**Connection Failed**:
- (None after URL updates)

## Data Collection Strategy

### Phase 1: Manual Targeted Extraction ✅ PROVEN

**Success Case: Savannah, GA**

Successfully extracted from targeted pages:
- Application process (step-by-step)
- Required documents (homeowner affidavit, checklists)
- Fee structures ($12 per $1,000 materials, $65 minimum)
- Specific fees (reinstatement: $500, re-inspection: $100)
- Contact information (912-651-6530)
- Online portal (eTRAC.savannahga.gov)
- Special requirements (floodplain, historic districts)

**Recommended Approach**:
1. Search for specific permit pages using site: operator
2. Target specific subpages:
   - `/building-permits`
   - `/fee-schedule`
   - `/applications-forms`
   - `/how-to-apply`
   - `/requirements`
3. Use WebFetch on specific URLs
4. Manual data entry into database

### Phase 2: Automated Crawling ❌ NOT EFFECTIVE

**Attempted**: Deep crawler with maxDepth: 4, maxPages: 15
**Result**: 0 data points from 5 offices
**Reason**: Government sites use heavy JavaScript, bot protection, complex navigation

**Not Recommended** unless:
- Implement headless browser (Playwright/Puppeteer)
- Add JavaScript rendering
- Implement CAPTCHA solving
- Use residential proxies to bypass bot detection
- Significantly increase development time

### Phase 3: Hybrid Approach (RECOMMENDED)

1. **Initial Site Mapping**
   - Use web search to find specific permit pages
   - Identify actual permit/application pages vs general department pages
   - Map out common URL patterns by state

2. **Targeted Data Extraction**
   - WebFetch on specific permit pages
   - Extract structured data using AI prompts
   - Store in temporary JSON format

3. **Manual Review & Enhancement**
   - Review AI-extracted data for accuracy
   - Add missing critical information
   - Verify contact information and fees

4. **Database Population**
   - Bulk insert verified data
   - Update existing office records
   - Link forms and resources

## Data Points to Collect (Priority Order)

### Tier 1: Critical (Must Have)
- [x] Office name
- [x] Address
- [x] Phone number
- [x] Website URL
- [ ] **Online portal URL** (if exists)
- [ ] **Contact email**
- [ ] **Office hours**

### Tier 2: High Priority (Should Have)
- [ ] **General fee structure** (e.g., "$X per $1,000")
- [ ] **Minimum permit fee**
- [ ] **Typical processing timeline**
- [ ] **Required documents checklist**
- [ ] **Online application availability**

### Tier 3: Nice to Have
- [ ] Specific permit type fees
- [ ] Step-by-step application process
- [ ] Special requirements (floodplain, historic)
- [ ] Inspection scheduling process
- [ ] Appeal/variance process

## Specific URL Patterns Found

### Building Permits Pages
```
Pattern 1: /building-permits
- savannahga.gov/892/Building-Permits ✅
- dekalbcountyga.gov/planning-and-sustainability/building-permits ✅

Pattern 2: /permits OR /permitting
- atlantaga.gov/.../online-permitting ⚠️ (403)
- fultoncountyga.gov/business-services/permits-and-inspections ✅

Pattern 3: /community-development
- alpharetta.ga.us/157/Community-Development ✅
- cobbcounty.gov/community-development ✅
```

### Fee Schedules
```
Pattern 1: /fee-schedule
- savannahga.gov/3315/Permit-fee-schedule ✅

Pattern 2: /fees
- savannahga.gov/1820/Fee-Information ✅

Pattern 3: PDF Documents
- savannahga.gov/DocumentCenter/View/54/Building-Permit-and-Plan-Review-Fees-2025 ✅
```

### Application Forms
```
Pattern 1: /how-to-apply
- savannahga.gov/1643/How-to-Apply-for-Residential-Building-Pe ✅
- savannahga.gov/1644/How-to-Apply-for-Commercial-Building-Per ✅

Pattern 2: /applications-forms
- atlantaga.gov/.../applications-forms-and-checklists ⚠️ (403)

Pattern 3: /resources
- alpharetta.ga.us/194/Resources (found via search)
```

## Recommendations for State Expansion

### 1. Start with Top 3 Cities Per State
Rather than trying to cover all counties:
- Focus on largest cities first (covers 50-70% of searches)
- Georgia: Atlanta, Savannah, Augusta ✅ (already have)
- Florida: Miami, Tampa, Jacksonville
- Texas: Houston, Dallas, Austin
- etc.

### 2. Prioritize Data Quality Over Quantity
Better to have:
- 10 offices with complete, accurate data
- Than 100 offices with just name and address

### 3. Use Savannah as Template
Savannah has excellent, accessible permit data:
- Clear fee structures
- Step-by-step processes
- Online portal (eTRAC)
- Downloadable forms
- Contact information

Use this as the "gold standard" for data collection.

### 4. Create State-Specific Scripts
Each state has different:
- URL patterns
- Website structures
- Terminology (some say "Building Department", others "Development Services")
- Online systems (some use Accela, others use custom portals)

Create targeted extraction scripts per state.

### 5. Implement Progressive Enhancement
1. **Week 1**: Basic office info (address, phone, website)
2. **Week 2**: Add contact info and hours
3. **Week 3**: Add fee structures
4. **Week 4**: Add application processes
5. **Week 5**: Add forms and resources

## Immediate Next Steps

### Option A: Continue Georgia Deep Data Collection
1. Manually extract data from 14 working URLs
2. Create structured JSON for each office
3. Populate database with rich permit data
4. Use as proof-of-concept for other states

**Estimated Time**: 3-4 hours for 14 offices
**Output**: Complete permit data for Metro Atlanta, Savannah, Columbus

### Option B: Expand to Additional GA Counties
1. Add remaining 26 major counties (from GEORGIA_COUNTIES_SEED.md)
2. Validate URLs for new counties
3. Basic data collection (name, address, phone only)
4. Achieve 75% Georgia population coverage

**Estimated Time**: 2-3 hours for 26 counties
**Output**: Geographic coverage for most GA searches

### Option C: Begin Multi-State Expansion
1. Research top 3 cities in Florida, Texas, North Carolina
2. Create seed data for 10-15 offices
3. Validate URLs and basic info
4. Test search functionality

**Estimated Time**: 4-5 hours for 3 states
**Output**: National coverage for major metro areas

## Technical Improvements Needed

### 1. Enhanced Crawler (Future)
- Add Playwright for JavaScript rendering
- Implement retry logic with delays
- Add proxy rotation for bot protection
- Create site-specific extractors

### 2. Data Validation Pipeline
- Phone number formatting (XXX) XXX-XXXX
- URL validation (200 status check)
- Address geocoding verification
- Hours parsing and standardization

### 3. Database Schema Enhancements
```sql
-- Add fields for rich permit data
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS online_portal_url TEXT;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS fee_structure JSONB;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS required_documents JSONB;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS application_process JSONB;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS processing_timeline TEXT;
```

### 4. Search Enhancement
```typescript
// Add relevance scoring
interface SearchResult {
  office: PermitOffice
  dataQualityScore: number  // 0-100 based on completeness
  distanceScore: number     // proximity to search location
  relevanceScore: number    // combined score
}
```

## Success Metrics

### Phase 1 (Current - Georgia Focus)
- [ ] 14/22 offices with validated working URLs
- [ ] 5/22 offices with complete permit data
- [ ] 9/159 counties with any coverage
- [ ] ~40% population coverage

### Phase 2 (Georgia Completion)
- [ ] 35/159 counties covered (top 75% population)
- [ ] All metro Atlanta offices (15+) complete data
- [ ] 90% URL validation success rate
- [ ] Average 8+ data points per office

### Phase 3 (Multi-State Expansion)
- [ ] Top 3 cities in 10 states covered
- [ ] 100+ offices in database
- [ ] 50%+ searches find results
- [ ] Average 10+ data points per office

## Conclusion

**Current State**: Successfully validated and fixed URLs for 14 Georgia permit offices. Automated crawling ineffective due to JavaScript-heavy government sites and bot protection.

**Recommended Path**: Manual targeted data extraction using web search + WebFetch on specific permit pages, starting with 14 working Georgia URLs.

**Expected Outcome**: Rich, accurate permit data for Metro Atlanta, Savannah, and other major GA cities within 3-4 hours of focused work.

**Next Decision Point**: Choose between:
1. Deep data collection for existing 14 offices (Option A) ⭐ **RECOMMENDED**
2. Geographic expansion to 35 counties (Option B)
3. Multi-state expansion (Option C)

---

**Created**: October 1, 2025
**Last Updated**: October 1, 2025
**Status**: Ready for manual data collection phase
