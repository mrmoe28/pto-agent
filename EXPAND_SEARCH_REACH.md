# Expanding Search Reach - Strategy & Implementation

## Current Limitations
- **Geographic**: Currently focused on Georgia only
- **Data Sources**: Relying primarily on Google Custom Search
- **Coverage**: Limited to ~11 manually seeded offices
- **Discovery**: Only finding offices with online presence

## Expansion Strategies

### 1. Multi-Source Data Aggregation

#### Additional Search APIs
```typescript
// Currently using:
- Google Custom Search API ✓
- Bing Search API (configured but limited)

// Add these:
- DuckDuckGo HTML scraping ✓ (already implemented)
- Brave Search API
- SerpAPI (aggregates multiple search engines)
- Programmable Search Engines (custom configs)
```

#### Government Data Sources
```typescript
// Federal/State APIs
- USA.gov API - government directory
- Data.gov - open datasets
- State-specific open data portals
- Municipal API directories

// Implementation:
interface GovDataSource {
  name: string
  apiUrl: string
  dataFormat: 'json' | 'xml' | 'csv'
  updateFrequency: 'daily' | 'weekly' | 'monthly'
}
```

#### Crowdsourced Data
```typescript
// Community contributions
- User-submitted permit office info
- Contractor-verified data
- Community forums and Reddit
- Professional networks (LinkedIn, contractor associations)
```

### 2. Enhanced Search Patterns

#### Keyword Expansion
```typescript
// Current keywords
const currentKeywords = [
  'building permits',
  'planning department',
  'development services'
]

// Expanded solar-specific keywords
const solarKeywords = [
  'solar permit',
  'photovoltaic permit',
  'PV system permit',
  'renewable energy permit',
  'electrical service upgrade',
  'solar panel installation permit',
  'grid-tied solar permit',
  'net metering application',
  'interconnection agreement',
  'solar contractor license'
]

// Location-specific patterns
const locationPatterns = [
  '{city} {state} solar permit office',
  '{county} county solar permit requirements',
  '{city} renewable energy permit',
  '{city} electrical permit solar',
  'solar installation {city} {state} permit',
  '{city} building department solar',
  '{city} planning solar photovoltaic'
]
```

#### URL Pattern Discovery
```typescript
// Common government website patterns
const govUrlPatterns = [
  'https://{city}.gov/permits',
  'https://{city}.{state}.gov/building',
  'https://www.{city}{state}.gov',
  'https://{county}county.gov/permits',
  'https://{city}-{state}.gov/development',
  'https://permits.{city}.gov',
  'https://planning.{city}.gov',
  'https://buildingservices.{city}.gov'
]

// Solar-specific paths
const solarPaths = [
  '/solar-permits',
  '/renewable-energy',
  '/solar-installation',
  '/photovoltaic-permits',
  '/green-building',
  '/sustainability/solar'
]
```

### 3. Intelligent Fallback Strategies

#### Hierarchical Search
```typescript
async function hierarchicalSearch(address: string) {
  // Level 1: Exact city match
  let results = await searchCity(city, state)
  if (results.length > 0) return results

  // Level 2: County fallback
  results = await searchCounty(county, state)
  if (results.length > 0) return results

  // Level 3: Nearby cities (within 20 miles)
  results = await searchNearbyCities(lat, lng, 20)
  if (results.length > 0) return results

  // Level 4: State-level resources
  results = await searchStateResources(state)
  if (results.length > 0) return results

  // Level 5: Regional offices
  results = await searchRegionalOffices(state, region)
  return results
}
```

#### Smart Redirects
```typescript
// Handle common redirects and jurisdiction transfers
const jurisdictionRules = {
  'unincorporated': 'county',  // Unincorporated areas → County
  'special_district': 'nearest_city',
  'newly_annexed': 'check_both' // Check both city and county
}
```

### 4. Geographic Expansion

#### State-by-State Rollout
```typescript
// Priority states (solar installation leaders)
const priorityStates = [
  'CA', // California - #1 solar market
  'TX', // Texas
  'FL', // Florida
  'NY', // New York
  'AZ', // Arizona
  'NC', // North Carolina
  'NJ', // New Jersey
  'MA', // Massachusetts
  'NV', // Nevada
  'GA'  // Georgia (current)
]

// State-specific configurations
interface StateConfig {
  abbreviation: string
  permitPortalTypes: string[]  // 'Accela', 'Viewpoint', 'ePermitting'
  commonFeeStructure: string    // '$X base + $Y/kW'
  typicalTimeline: string       // '5-10 business days'
  solarIncentives: string[]     // State-specific programs
}
```

#### Regional Variations
```typescript
// Different regions have different systems
const regionalPatterns = {
  northeast: {
    portalSystems: ['Accela', 'CitizenServe'],
    commonDepartments: ['Building Inspector', 'Code Enforcement']
  },
  southeast: {
    portalSystems: ['Accela', 'Municity'],
    commonDepartments: ['Development Services', 'Building Safety']
  },
  west: {
    portalSystems: ['Accela', 'ePermitting', 'Clariti'],
    commonDepartments: ['Planning & Building', 'Community Development']
  }
}
```

### 5. Data Enrichment & Validation

#### Automated Data Validation
```typescript
interface DataValidation {
  checkPhoneNumber: (phone: string) => Promise<boolean>
  verifyAddress: (address: string) => Promise<boolean>
  validateWebsite: (url: string) => Promise<boolean>
  confirmHours: (hours: string) => Promise<boolean>
}

// Validation pipeline
async function validateOfficeData(office: PermitOffice) {
  const validations = [
    validatePhone(office.phone),
    validateWebsite(office.website),
    validateAddress(office.address),
    checkBusinessHours(office.hours_monday)
  ]

  const results = await Promise.all(validations)
  const confidenceScore = results.filter(r => r).length / results.length

  return {
    ...office,
    confidence_score: confidenceScore,
    last_validated: new Date()
  }
}
```

#### Cross-Reference Verification
```typescript
// Verify data across multiple sources
async function crossReferenceOffice(office: PermitOffice) {
  const sources = [
    checkGoogleMaps(office.address),
    checkYelp(office.name, office.city),
    checkBBB(office.name, office.city),
    checkLinkedIn(office.department_name),
    checkMunicipalWebsite(office.city, office.state)
  ]

  const verifications = await Promise.all(sources)
  return consolidateData(verifications)
}
```

### 6. Advanced Scraping Techniques

#### Deep Crawling
```typescript
// Current: 3 pages per office
// Enhanced: Comprehensive site crawl

interface CrawlStrategy {
  maxDepth: number          // 5 levels deep
  maxPages: number          // 20 pages per office
  followExternal: boolean   // Follow links to forms, PDFs
  extractPDFs: boolean      // Parse PDF documents
  extractForms: boolean     // Parse online forms
}

// Targeted crawling for solar info
const solarCrawlTargets = [
  '/solar',
  '/renewable',
  '/green-building',
  '/sustainability',
  '/fees',
  '/forms',
  '/applications',
  '/requirements'
]
```

#### Document Parsing
```typescript
// Parse PDF permit applications
async function parsePDFApplication(pdfUrl: string) {
  const pdf = await fetchPDF(pdfUrl)
  const text = await extractText(pdf)

  return {
    requiredFields: extractFormFields(text),
    instructions: extractInstructions(text),
    fees: extractFeeSchedule(text),
    submittalRequirements: extractRequirements(text)
  }
}
```

### 7. API Integration

#### Third-Party Data Providers
```typescript
// Permit data aggregators
interface PermitDataProvider {
  name: string
  apiKey: string
  endpoint: string
  coverage: string[]  // States covered
  dataTypes: string[] // 'fees', 'requirements', 'timelines'
}

const providers = [
  {
    name: 'PermitPlace',
    coverage: ['CA', 'TX', 'FL'],
    dataTypes: ['fees', 'timelines', 'requirements']
  },
  {
    name: 'SolarPermit',
    coverage: ['all_states'],
    dataTypes: ['solar_specific', 'incentives', 'interconnection']
  }
]
```

#### Municipal Portal APIs
```typescript
// Direct integration with permit portals
const portalAPIs = {
  accela: {
    endpoint: 'https://apis.accela.com',
    auth: 'oauth2',
    methods: ['getPermitInfo', 'searchApplications', 'getFees']
  },
  viewpoint: {
    endpoint: 'https://api.viewpointcloud.com',
    auth: 'api_key',
    methods: ['permitLookup', 'feeCalculator', 'submitApplication']
  }
}
```

### 8. Machine Learning Enhancement

#### Intelligent Pattern Recognition
```typescript
// ML model to identify permit office pages
interface MLClassifier {
  trainOn: 'known_permit_pages'
  features: [
    'url_patterns',
    'page_structure',
    'keyword_density',
    'form_presence',
    'government_indicators'
  ]
  accuracy: 0.95  // Target 95% accuracy
}

// Use ML to extract structured data
async function mlExtractPermitInfo(html: string) {
  const model = await loadModel('permit-info-extractor')

  return model.predict({
    fees: extractWithML(html, 'fee_patterns'),
    timeline: extractWithML(html, 'timeline_patterns'),
    requirements: extractWithML(html, 'requirement_patterns')
  })
}
```

### 9. Real-Time Updates

#### Change Detection
```typescript
// Monitor permit office websites for changes
interface ChangeMonitor {
  checkFrequency: 'daily' | 'weekly'
  compareFields: ['fees', 'hours', 'requirements', 'contact']
  notifyOn: 'any_change' | 'significant_change'
}

// Automatic re-scrape when changes detected
async function monitorOfficeChanges(officeId: string) {
  const current = await fetchCurrentData(officeId)
  const stored = await getStoredData(officeId)

  const changes = compareData(current, stored)

  if (changes.length > 0) {
    await updateDatabase(officeId, current)
    await notifyUsers(officeId, changes)
  }
}
```

### 10. Implementation Priority

#### Phase 1 - Immediate (1-2 weeks)
- [ ] Expand search keywords (solar-specific)
- [ ] Add more URL patterns
- [ ] Implement hierarchical fallback search
- [ ] Add 5 more priority states (CA, TX, FL, AZ, NC)

#### Phase 2 - Short-term (1 month)
- [ ] Integrate additional search APIs (Brave, SerpAPI)
- [ ] Add government data sources
- [ ] Implement PDF parsing for applications
- [ ] Deep crawling (5 levels, 20 pages)

#### Phase 3 - Medium-term (2-3 months)
- [ ] ML-based page classification
- [ ] Automated data validation
- [ ] Cross-reference verification
- [ ] Portal API integrations (Accela, Viewpoint)

#### Phase 4 - Long-term (3-6 months)
- [ ] Full 50-state coverage
- [ ] Real-time change monitoring
- [ ] Crowdsourced data validation
- [ ] Predictive timeline estimates

## Metrics to Track

### Coverage Metrics
```typescript
interface CoverageMetrics {
  states_covered: number
  cities_with_data: number
  counties_with_data: number
  total_permit_offices: number
  data_completeness_avg: number  // 0-100%
}
```

### Quality Metrics
```typescript
interface QualityMetrics {
  data_accuracy: number          // % verified accurate
  freshness: number              // avg days since update
  completeness: number           // % fields populated
  user_satisfaction: number      // rating 1-5
}
```

### Performance Metrics
```typescript
interface PerformanceMetrics {
  avg_search_time: number        // milliseconds
  cache_hit_rate: number         // percentage
  scrape_success_rate: number    // percentage
  api_response_time: number      // milliseconds
}
```

## Quick Wins

### 1. Expand Solar Keywords (30 minutes)
```typescript
// Add to enhanced-permit-scraper.ts
const expandedKeywords = [
  'solar permit',
  'photovoltaic',
  'PV system',
  'solar panel installation',
  'renewable energy permit',
  'net metering',
  'interconnection'
]
```

### 2. Add More States (1 hour)
```typescript
// Update seed data for top 5 solar states
// CA, TX, FL, AZ, NC
// Use same structure as Georgia seed file
```

### 3. Implement Nearby Search (2 hours)
```typescript
// If no results in city, search within 20 miles
async function searchNearby(lat: number, lng: number, radius: number) {
  const nearbyCities = await getCitiesWithinRadius(lat, lng, radius)
  for (const city of nearbyCities) {
    const results = await searchCity(city.name, city.state)
    if (results.length > 0) return results
  }
}
```

### 4. Better Error Messages (30 minutes)
```typescript
// Instead of generic "no results"
// Provide helpful alternatives:
"No permit office found for {city}. Try:
- {county} County permit office
- Nearby cities: {city1}, {city2}, {city3}
- State resources: {state} solar permit guide"
```

## Next Steps

1. **Choose priority expansion** (which strategy to implement first?)
2. **Allocate resources** (time, API credits, compute)
3. **Set success metrics** (coverage goals, quality targets)
4. **Create implementation timeline** (sprint planning)
5. **Monitor and iterate** (track metrics, adjust strategy)

Would you like me to implement any of these strategies right now?
