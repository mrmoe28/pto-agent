# Deep Crawler Implementation Guide

## Overview

The Deep Crawler is a comprehensive web scraping system designed to extract detailed solar/electrical permit information from municipal websites. It goes beyond basic scraping by:

- **Multi-level crawling**: Recursively follows links up to 4 levels deep
- **Intelligent targeting**: Focuses on solar/permit-relevant pages using keyword matching
- **Comprehensive extraction**: Extracts forms, tables, fees, timelines, contacts, and documents
- **Data quality assessment**: Scores pages based on permit-relevant content
- **Structured output**: Returns organized data ready for database storage

## Architecture

### Core Components

1. **DeepPermitCrawler** (`src/lib/deep-crawler.ts`)
   - Main crawler class with recursive crawling logic
   - Extracts structured data from HTML pages
   - Aggregates data across multiple pages

2. **Enhanced Permit Scraper** (`src/lib/enhanced-permit-scraper.ts`)
   - Integrates deep crawler with search functionality
   - Builds complete permit office records
   - Handles fallback extraction methods

3. **Test Script** (`scripts/test-deep-crawl.ts`)
   - Tests crawler on existing GA offices
   - Generates quality metrics and pattern analysis
   - Produces JSON output for blueprint creation

## Data Extraction Capabilities

### 1. Instructions & Requirements

**What it extracts:**
- Step-by-step application instructions
- General permit process guidelines
- Required document lists
- Submission requirements

**How it works:**
```typescript
// Searches for sections containing these keywords
const instructionKeywords = [
  'how to apply',
  'application process',
  'submit',
  'submission requirements',
  'steps to apply',
  'permit process'
]
```

**Output structure:**
```json
{
  "generalInstructions": ["String instruction 1", "String instruction 2"],
  "stepByStep": ["Step 1: Do this", "Step 2: Do that"],
  "requiredDocuments": [
    "Completed permit application",
    "Site plan with panel locations",
    "Electrical diagram"
  ]
}
```

### 2. Fees & Pricing

**What it extracts:**
- Base permit fees
- Variable fees (per kW, per SF, etc.)
- Fee descriptions and applicability

**Patterns recognized:**
```typescript
// Matches: $150, $1,500.00, $25 per kW
const feePatterns = [
  /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/,
  /\$(\d+(?:\.\d{2})?)\s*(?:per|\/)\s*(\w+)/i
]
```

**Output structure:**
```json
{
  "fees": [
    {
      "permitType": "solar",
      "baseFee": 150,
      "variableFee": {
        "amount": 25,
        "unit": "kW",
        "description": "$25 per kW of system capacity"
      },
      "description": "Base electrical permit fee $150, plus $25 per kW",
      "applicableTo": ["residential", "commercial"]
    }
  ]
}
```

### 3. Processing Timelines

**What it extracts:**
- Minimum/maximum processing days
- Average processing time
- Conditional timelines
- Business vs. calendar days

**Patterns recognized:**
```typescript
const timelinePatterns = [
  /(\d+)\s*(?:to|-)\s*(\d+)?\s*(business\s+)?days?/i,  // "5-10 business days"
  /within\s+(\d+)\s*(business\s+)?days?/i,            // "within 10 days"
  /(\d+)\s*week/i                                      // "2 weeks"
]
```

**Output structure:**
```json
{
  "timelines": [
    {
      "permitType": "solar",
      "minDays": 5,
      "maxDays": 10,
      "description": "Plan review typically takes 5-10 business days",
      "conditions": ["complete application", "all documents submitted"]
    }
  ]
}
```

### 4. Contact Information

**What it extracts:**
- Phone numbers with context
- Email addresses
- Names and titles
- Department information
- Office hours

**Patterns recognized:**
```typescript
const phonePattern = /(?:phone|call|contact):?\s*(\(?\d{3}\)?[-.\\s]?\d{3}[-.\\s]?\d{4})/gi
const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})/gi
```

**Output structure:**
```json
{
  "contacts": [
    {
      "name": "John Smith",
      "title": "Building Official",
      "department": "Development Services",
      "phone": "(770) 963-2414",
      "email": "permits@lawrenceville.org",
      "hours": "Monday-Friday 8:00 AM - 5:00 PM"
    }
  ]
}
```

### 5. Forms & Applications

**What it extracts:**
- Online application URLs
- Downloadable PDF forms
- Form field structures
- Required vs. optional fields

**Form extraction:**
```typescript
interface FormData {
  action: string           // Form submission URL
  method: string           // GET or POST
  fields: FormField[]      // All form inputs
}

interface FormField {
  name: string            // Field name
  type: string            // input type (text, select, etc.)
  label?: string          // Associated label
  required: boolean       // Whether field is required
  options?: string[]      // For select dropdowns
}
```

**Output structure:**
```json
{
  "onlineForms": [
    "https://example.com/permits/apply"
  ],
  "downloadableForms": [
    "https://example.com/forms/solar-permit-application.pdf",
    "https://example.com/forms/electrical-permit.pdf"
  ]
}
```

### 6. Tables & Fee Schedules

**What it extracts:**
- Table headers and rows
- Fee schedules
- Timeline charts
- Requirement checklists

**Table structure:**
```typescript
interface TableData {
  headers: string[]        // Column headers
  rows: string[][]         // Table data rows
  caption?: string         // Table caption/title
}
```

## Configuration Options

### CrawlConfig

```typescript
interface CrawlConfig {
  maxDepth: number          // Maximum link depth (default: 4)
  maxPages: number          // Maximum pages to crawl (default: 15)
  followExternal: boolean   // Follow external links? (default: false)
  targetPaths: string[]     // URL paths to prioritize
  extractPDFs: boolean      // Extract PDF links? (default: true)
}
```

### Recommended Settings

#### For Testing (Fast)
```typescript
{
  maxDepth: 2,
  maxPages: 5,
  followExternal: false,
  targetPaths: ['/permit', '/solar'],
  extractPDFs: false
}
```

#### For Production (Comprehensive)
```typescript
{
  maxDepth: 4,
  maxPages: 15,
  followExternal: false,
  targetPaths: [
    '/permit', '/solar', '/electrical', '/renewable',
    '/application', '/form', '/fee', '/requirement',
    '/instruction', '/timeline', '/process'
  ],
  extractPDFs: true
}
```

#### For Deep Analysis (Maximum Data)
```typescript
{
  maxDepth: 5,
  maxPages: 25,
  followExternal: true,    // Follow to portal sites
  targetPaths: [ /* all paths */ ],
  extractPDFs: true
}
```

## Usage Examples

### 1. Basic Crawl

```typescript
import { DeepPermitCrawler } from '@/lib/deep-crawler'

const crawler = new DeepPermitCrawler()
const data = await crawler.crawlSite('https://example.com/permits', {
  maxDepth: 3,
  maxPages: 10,
  followExternal: false,
  targetPaths: ['/permit', '/solar'],
  extractPDFs: true
})

console.log(`Found ${data.fees.length} fee structures`)
console.log(`Found ${data.timelines.length} timeline entries`)
```

### 2. Integration with Scraper

```typescript
import { scrapeSolarPermitData } from '@/lib/enhanced-permit-scraper'

const offices = await scrapeSolarPermitData({
  city: 'Atlanta',
  county: 'Fulton',
  state: 'GA',
  latitude: 33.7490,
  longitude: -84.3880
})

// Deep crawler runs automatically within scrapeSolarPermitData
// Extracted data is stored in offices[].instructions.deepCrawlData
```

### 3. Test Script (Batch Processing)

```bash
# Run test script on GA offices
npm run test:deep-crawl

# Output saved to: crawl-results/ga-deep-crawl-{timestamp}.json
```

## Data Quality Assessment

The crawler assigns a quality score (0-1) to each page based on:

| Criterion | Points | Description |
|-----------|--------|-------------|
| Has forms | 2 | Page contains form elements |
| Has tables | 2 | Page contains data tables (likely fees) |
| Has lists | 1 | Page contains bullet/numbered lists |
| Has contact info | 1 | Phone number detected |
| Has email | 1 | Email address detected |
| Has PDFs | 1 | Links to PDF documents |
| Has solar keywords | 2 | Contains "solar", "photovoltaic", etc. |
| **Total** | **10** | Maximum quality score |

**Quality threshold:**
- **High quality (≥0.7)**: Page has most permit-relevant data
- **Medium quality (0.4-0.6)**: Page has some useful data
- **Low quality (<0.4)**: Limited permit information

## Blueprint Generation

The test script (`npm run test:deep-crawl`) generates a data blueprint by:

### 1. Coverage Metrics
- % of offices with instructions
- % of offices with fee data
- % of offices with timelines
- % of offices with contact info
- % of offices with forms

### 2. Pattern Identification

**Fee patterns:**
- Range of base fees ($X - $Y)
- Average base fee
- Common variable fee structures (per kW, per SF)

**Timeline patterns:**
- Typical minimum processing days
- Typical maximum processing days
- Average turnaround time

**Document patterns:**
- Most frequently required documents
- Common document naming conventions
- Standard checklist items

### 3. Output Format

```json
{
  "office": {
    "id": "123",
    "city": "Lawrenceville",
    "county": "Gwinnett",
    "website": "https://example.com"
  },
  "data": {
    "stepByStep": [...],
    "fees": [...],
    "timelines": [...],
    "contacts": [...],
    "onlineForms": [...],
    "downloadableForms": [...]
  },
  "quality": {
    "hasInstructions": true,
    "hasFees": true,
    "hasTimelines": true,
    "hasContacts": true,
    "hasForms": true,
    "totalDataPoints": 42
  }
}
```

## Performance Considerations

### Request Rate Limiting

The crawler includes automatic delays:
- **2 seconds** between pages (same site)
- **5 seconds** between different offices (test script)

### Memory Management

- Visited URLs tracked in Set (prevents duplicate crawling)
- HTML not stored (parsed then discarded)
- Maximum 15-25 pages per site to prevent memory bloat

### Error Handling

```typescript
try {
  const data = await crawler.crawlSite(url, config)
} catch (crawlError) {
  // Crawler logs error and returns partial data
  // System falls back to basic extraction
  console.error('Deep crawl failed:', crawlError)
}
```

## Expansion to New States

### Step 1: Run Blueprint Generation

```bash
npm run test:deep-crawl
```

Review output in `crawl-results/ga-deep-crawl-{timestamp}.json`

### Step 2: Identify Common Patterns

From the blueprint, extract:
- Common fee structures to use as templates
- Standard timeline ranges for validation
- Required document templates
- Common portal systems (Accela, ViewPoint, etc.)

### Step 3: Customize for New State

```typescript
// State-specific configuration
const californiaConfig = {
  maxDepth: 4,
  maxPages: 20,  // CA sites tend to be larger
  followExternal: true,  // CA uses many external portals
  targetPaths: [
    '/permit', '/solar', '/building-and-safety',
    '/community-development',  // Common in CA
    ...standardPaths
  ],
  extractPDFs: true
}
```

### Step 4: Validate Results

Compare new state data against GA blueprint:
- Similar fee ranges?
- Similar timeline ranges?
- Same document types required?
- Flagging outliers for manual review

## Troubleshooting

### Issue: No data extracted

**Check:**
1. Is the website accessible? (Check for 403/404 errors)
2. Are there solar-specific pages? (Check targetPaths)
3. Is JavaScript required? (Crawler only handles static HTML)

**Solution:**
- Increase maxDepth and maxPages
- Add more targetPaths
- Check data quality score (may need manual extraction)

### Issue: Too much irrelevant data

**Check:**
1. Are too many pages being crawled?
2. Are non-permit pages being followed?

**Solution:**
- Reduce maxPages
- Be more specific with targetPaths
- Set followExternal: false

### Issue: Missing specific data type

**Check:**
1. Does the website have that data?
2. Is it in a format the crawler recognizes?

**Solution:**
- Review HTML source for patterns
- Add new extraction patterns
- Update keyword lists

## Future Enhancements

### Phase 1: PDF Parsing
- Extract text from PDF permit applications
- Parse fee schedules in PDF tables
- Extract requirements from PDF checklists

### Phase 2: Form Submission
- Auto-fill permit applications
- Upload required documents
- Track application status

### Phase 3: AI Enhancement
- Use LLM to summarize instructions
- Extract requirements from unstructured text
- Classify permit types automatically

### Phase 4: Real-time Updates
- Monitor websites for changes
- Auto-update fee schedules
- Notify users of requirement changes

## Conclusion

The Deep Crawler provides comprehensive permit data extraction for expansion beyond Georgia. By analyzing patterns from existing offices, we can:

1. **Validate new data** against known patterns
2. **Auto-populate** common fields
3. **Flag anomalies** for manual review
4. **Scale efficiently** to all 50 states

**Next Steps:**
1. Run test script on GA offices
2. Analyze blueprint patterns
3. Customize configs for priority states (CA, TX, FL)
4. Deploy to production
