import { NextRequest, NextResponse } from 'next/server'
import { EnhancedWebScraper, DetailedOfficeInfo } from '@/lib/enhanced-web-scraper'

// Type definitions for permit office data
interface PermitOffice {
  id: string
  created_at: string
  updated_at: string
  city: string
  county: string
  state: string
  jurisdiction_type: 'city' | 'county' | 'state' | 'special_district'
  department_name: string
  office_type: 'building' | 'planning' | 'zoning' | 'combined' | 'other'
  address: string
  phone: string | null
  email: string | null
  website: string | null
  hours_monday: string | null
  hours_tuesday: string | null
  hours_wednesday: string | null
  hours_thursday: string | null
  hours_friday: string | null
  hours_saturday: string | null
  hours_sunday: string | null
  building_permits: boolean
  electrical_permits: boolean
  plumbing_permits: boolean
  mechanical_permits: boolean
  zoning_permits: boolean
  planning_review: boolean
  inspections: boolean
  online_applications: boolean
  online_payments: boolean
  permit_tracking: boolean
  online_portal_url: string | null
  latitude: number | null
  longitude: number | null
  service_area_bounds: Record<string, unknown> | null
  data_source: 'web_search' | 'crawled' | 'api' | 'manual'
  last_verified: string | null
  crawl_frequency: 'daily' | 'weekly' | 'monthly'
  active: boolean
  distance?: number
}

// Search for permit offices by location using web search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const latitude = searchParams.get('lat')
    const longitude = searchParams.get('lng')
    const city = searchParams.get('city')
    const county = searchParams.get('county')
    const state = searchParams.get('state') || 'GA'

    console.log(`Searching for permit offices: city=${city}, county=${county}, state=${state}`)

    // Perform web search for permit offices
    const offices = await searchPermitOfficesWeb(city, county, state)

    // Calculate distances if coordinates provided
    let officesWithDistance = offices
    if (latitude && longitude) {
      const userLat = parseFloat(latitude)
      const userLng = parseFloat(longitude)
      
      officesWithDistance = offices.map(office => {
        if (office.latitude && office.longitude) {
          const distance = calculateDistance(userLat, userLng, office.latitude, office.longitude)
          return { ...office, distance }
        }
        return office
      }).sort((a, b) => {
        if (a.distance === undefined) return 1
        if (b.distance === undefined) return -1
        return a.distance - b.distance
      })
    }

    return NextResponse.json({
      success: true,
      offices: officesWithDistance,
      count: officesWithDistance.length,
      source: 'web_search',
      message: officesWithDistance.length === 0 ? 'No permit offices found for this location. Try a different address.' : undefined
    })

  } catch (error) {
    console.error('Web search API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search for permit offices',
        offices: [],
        count: 0,
        source: 'error'
      },
      { status: 500 }
    )
  }
}

// Web search function for permit offices
async function searchPermitOfficesWeb(city: string | null, county: string | null, state: string): Promise<PermitOffice[]> {
  const offices: PermitOffice[] = []
  
  try {
    // Search for city-level permit offices
    if (city) {
      const cityOffices = await searchCityPermitOffices(city, state)
      offices.push(...cityOffices)
    }
    
    // Search for county-level permit offices
    if (county) {
      const countyOffices = await searchCountyPermitOffices(county, state)
      offices.push(...countyOffices)
    }
    
    // If no specific results, do a general search
    if (offices.length === 0) {
      const generalOffices = await searchGeneralPermitOffices(state)
      offices.push(...generalOffices)
    }
    
    // Remove duplicates and limit results
    const uniqueOffices = removeDuplicateOffices(offices)
    return uniqueOffices.slice(0, 10)
    
  } catch (error) {
    console.error('Web search error:', error)
    return []
  }
}

// Search for city-specific permit offices
async function searchCityPermitOffices(city: string, state: string): Promise<PermitOffice[]> {
  const offices: PermitOffice[] = []
  
  try {
    // Search for city government websites
    const citySearchQueries = [
      `${city} ${state} building permits office`,
      `${city} ${state} planning department`,
      `${city} ${state} development services`,
      `${city} ${state} permit office site:gov`,
      `"${city}" "${state}" building permits`
    ]
    
    for (const query of citySearchQueries) {
      const searchResults = await performWebSearch(query)
      const extractedOffices = extractPermitOfficesFromSearchResults(searchResults, city, state, 'city')
      offices.push(...extractedOffices)
    }
    
  } catch (error) {
    console.error(`Error searching city offices for ${city}:`, error)
  }
  
  return offices
}

// Search for county-specific permit offices
async function searchCountyPermitOffices(county: string, state: string): Promise<PermitOffice[]> {
  const offices: PermitOffice[] = []
  
  try {
    // Search for county government websites
    const countySearchQueries = [
      `${county} County ${state} building permits office`,
      `${county} County ${state} planning department`,
      `${county} County ${state} development services`,
      `${county} County ${state} permit office site:gov`,
      `"${county} County" "${state}" building permits`
    ]
    
    for (const query of countySearchQueries) {
      const searchResults = await performWebSearch(query)
      const extractedOffices = extractPermitOfficesFromSearchResults(searchResults, county, state, 'county')
      offices.push(...extractedOffices)
    }
    
  } catch (error) {
    console.error(`Error searching county offices for ${county}:`, error)
  }
  
  return offices
}

// General permit office search
async function searchGeneralPermitOffices(state: string): Promise<PermitOffice[]> {
  const offices: PermitOffice[] = []
  
  try {
    const generalSearchQueries = [
      `${state} building permits office`,
      `${state} planning department`,
      `${state} development services site:gov`,
      `"${state}" building permits government`
    ]
    
    for (const query of generalSearchQueries) {
      const searchResults = await performWebSearch(query)
      const extractedOffices = extractPermitOfficesFromSearchResults(searchResults, '', state, 'state')
      offices.push(...extractedOffices)
    }
    
  } catch (error) {
    console.error(`Error searching general offices for ${state}:`, error)
  }
  
  return offices
}

// Enhanced type definition for search results with detailed office information
interface SearchResult {
  title: string
  url: string
  snippet: string
  detailedInfo?: DetailedOfficeInfo
  structuredData?: {
    organization?: Record<string, unknown>
    localBusiness?: Record<string, unknown>
    contactPoint?: Record<string, unknown>
    postalAddress?: Record<string, unknown>
  }
}

// Perform web search using a search API
async function performWebSearch(query: string): Promise<SearchResult[]> {
  console.log(`Searching web for: ${query}`)
  
  try {
    // Try multiple search strategies in order of preference
    const results: SearchResult[] = []
    
    // Strategy 1: Google Custom Search API (best for government sites)
    const googleResults = await searchGoogleCustomSearch(query)
    results.push(...googleResults)
    
    // Strategy 2: Bing Search API (good fallback)
    if (results.length === 0) {
      const bingResults = await searchBingAPI(query)
      results.push(...bingResults)
    }
    
    // Strategy 3: Direct government website search
    if (results.length === 0) {
      const govResults = await searchGovernmentWebsites(query)
      results.push(...govResults)
    }
    
    // Strategy 4: Known government website patterns
    if (results.length === 0) {
      const patternResults = await searchKnownPatterns(query)
      results.push(...patternResults)
    }
    
    return results.slice(0, 5) // Limit to 5 results
    
  } catch (error) {
    console.error('Web search error:', error)
    return []
  }
}

// Enhanced Google Custom Search API with comprehensive data extraction
async function searchGoogleCustomSearch(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = []

  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
    const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID

    if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
      console.log('Google Custom Search API not configured, skipping...')
      return results
    }

    // Enhanced search queries with more specific targeting
    const searchQueries = [
      `${query} site:gov`,
      `${query} "building permits" OR "building department" site:gov`,
      `${query} "planning department" OR "development services" site:gov`,
      `${query} "permit office" OR "permit center" site:gov`,
      `${query} "zoning" OR "code enforcement" site:gov`,
      `${query} "building inspection" OR "permit application" site:gov`,
      `${query} intitle:"permits" site:gov`,
      `${query} intitle:"building" OR intitle:"planning" site:gov`
    ]

    const scraper = new EnhancedWebScraper()
    const processedUrls = new Set<string>() // Avoid scraping the same URL multiple times

    for (const searchQuery of searchQueries) {
      try {
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(searchQuery)}&num=5&fields=items(title,link,snippet,pagemap)`

        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'PermitOfficeSearchBot/2.0 (+https://permitoffices.com/bot)'
          }
        })

        if (response.ok) {
          const responseText = await response.text()
          if (!responseText.trim()) {
            console.log(`Empty response for query: ${searchQuery}`)
            continue
          }
          
          let data
          try {
            data = JSON.parse(responseText)
          } catch (parseError) {
            console.error(`JSON parse error for query "${searchQuery}":`, parseError)
            console.error('Response text:', responseText.substring(0, 200))
            continue
          }

          if (data.items) {
            // Process each search result with enhanced data extraction
            for (const item of data.items) {
              if (!processedUrls.has(item.link)) {
                processedUrls.add(item.link)

                // Extract detailed information from the website
                console.log(`Enhanced scraping: ${item.link}`)
                const detailedInfo = await scraper.scrapeDetailedOfficeInfo(item.link)

                // Create enhanced search result with extracted data
                const enhancedResult: SearchResult & { detailedInfo?: DetailedOfficeInfo } = {
                  title: item.title,
                  url: item.link,
                  snippet: item.snippet,
                  detailedInfo: detailedInfo || undefined
                }

                // Extract additional metadata from Google's structured data if available
                if (item.pagemap) {
                  enhancedResult.structuredData = {
                    organization: item.pagemap.organization?.[0],
                    localBusiness: item.pagemap.localbusiness?.[0],
                    contactPoint: item.pagemap.contactpoint?.[0],
                    postalAddress: item.pagemap.postaladdress?.[0]
                  }
                }

                results.push(enhancedResult)
              }
            }
          }
        }

        // Rate limiting to be respectful
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (queryError) {
        console.error(`Error with search query "${searchQuery}":`, queryError)
        continue
      }
    }

  } catch (error) {
    console.error('Enhanced Google Custom Search error:', error)
  }

  return results.slice(0, 5) // Return more results since we have better data
}

// Bing Search API (good fallback)
async function searchBingAPI(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  
  try {
    const BING_API_KEY = process.env.BING_SEARCH_API_KEY
    
    if (!BING_API_KEY) {
      console.log('Bing Search API not configured, skipping...')
      return results
    }
    
    const searchQueries = [
      `${query} site:gov`,
      `${query} "building permits" site:gov`,
      `${query} "planning department" site:gov`
    ]
    
    for (const searchQuery of searchQueries) {
      const searchUrl = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(searchQuery)}&count=3`
      
      const response = await fetch(searchUrl, {
        headers: {
          'Ocp-Apim-Subscription-Key': BING_API_KEY
        }
      })
      
      if (response.ok) {
        const responseText = await response.text()
        if (!responseText.trim()) {
          console.log(`Empty response for Bing query: ${searchQuery}`)
          continue
        }
        
        let data
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error(`Bing JSON parse error for query "${searchQuery}":`, parseError)
          console.error('Response text:', responseText.substring(0, 200))
          continue
        }
        
        if (data.webPages && data.webPages.value) {
          for (const item of data.webPages.value) {
            results.push({
              title: item.name,
              url: item.url,
              snippet: item.snippet
            })
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Bing Search API error:', error)
  }
  
  return results.slice(0, 3)
}

// Search for government websites directly
async function searchGovernmentWebsites(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  
  try {
    // Common government website patterns
    const govPatterns = [
      `${query} site:gov`,
      `${query} "building permits" site:gov`,
      `${query} "planning department" site:gov`,
      `${query} "development services" site:gov`
    ]
    
    for (const pattern of govPatterns) {
      try {
        // Use a simple web search approach
        const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(pattern)}`
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; PermitOfficeBot/1.0)'
          }
        })
        
        if (response.ok) {
          const html = await response.text()
          const matches = extractGovernmentLinks(html, query)
          results.push(...matches)
        }
      } catch (err) {
        console.error(`Error searching pattern ${pattern}:`, err)
      }
    }
    
  } catch (error) {
    console.error('Government website search error:', error)
  }
  
  return results.slice(0, 3) // Limit to 3 results
}

// Search using DuckDuckGo HTML (more comprehensive) - currently unused
/*
async function searchDuckDuckGoHTML(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PermitOfficeBot/1.0)'
      }
    })
    
    if (response.ok) {
      const html = await response.text()
      const matches = extractGovernmentLinks(html, query)
      results.push(...matches)
    }
  } catch (error) {
    console.error('DuckDuckGo HTML search error:', error)
  }
  
  return results.slice(0, 3)
}
*/

// Search using known government website patterns
async function searchKnownPatterns(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  
  try {
    // Extract city and state from query
    const cityMatch = query.match(/([A-Za-z\s]+),?\s+(GA|Georgia)/i)
    if (cityMatch) {
      const city = cityMatch[1].trim()
      const state = 'GA'
      
      // Try common government website patterns
      const patterns = [
        `https://www.${city.toLowerCase().replace(/\s+/g, '')}.gov`,
        `https://www.${city.toLowerCase().replace(/\s+/g, '')}.ga.gov`,
        `https://${city.toLowerCase().replace(/\s+/g, '')}.gov`,
        `https://${city.toLowerCase().replace(/\s+/g, '')}.ga.gov`
      ]
      
      for (const pattern of patterns) {
        try {
          const response = await fetch(pattern, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; PermitOfficeBot/1.0)'
            }
          })
          
          if (response.ok) {
            results.push({
              title: `${city} Government Website`,
              url: pattern,
              snippet: `Official government website for ${city}, ${state}`
            })
            break // Use first working URL
          }
        } catch {
          // Continue to next pattern
        }
      }
    }
  } catch (error) {
    console.error('Known patterns search error:', error)
  }
  
  return results
}

// Extract government links from HTML
function extractGovernmentLinks(html: string, query: string): SearchResult[] {
  const results: SearchResult[] = []
  
  try {
    // Simple regex to extract links and titles
    const linkRegex = /<a[^>]+href="([^"]*)"[^>]*>([^<]*)<\/a>/gi
    let match
    
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1]
      const title = match[2].replace(/<[^>]*>/g, '').trim()
      
      // Only include .gov domains
      if (url.includes('.gov') && title && title.length > 10) {
        results.push({
          title: title,
          url: url.startsWith('http') ? url : `https://duckduckgo.com${url}`,
          snippet: `Government website for ${query}`
        })
      }
    }
  } catch (error) {
    console.error('Error extracting links:', error)
  }
  
  return results
}

// Enhanced extraction of permit office information from search results with detailed data
function extractPermitOfficesFromSearchResults(searchResults: SearchResult[], location: string, state: string, jurisdictionType: string): PermitOffice[] {
  const offices: PermitOffice[] = []

  for (const result of searchResults) {
    // Skip if not a government website
    if (!result.url.includes('.gov')) {
      continue
    }

    // Use detailed information if available from enhanced scraping
    const detailedInfo = result.detailedInfo
    const structuredData = result.structuredData

    // Extract enhanced office information
    const office: PermitOffice = {
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),

      // Location information (prefer detailed info, fallback to extracted)
      city: detailedInfo?.city ||
            (jurisdictionType === 'city' ? location : extractCityFromTitle(result.title, location)) ||
            (structuredData?.postalAddress?.addressLocality as string) || '',
      county: detailedInfo?.county ||
              (jurisdictionType === 'county' ? location : extractCountyFromTitle(result.title, location)) || '',
      state: detailedInfo?.state || state,

      jurisdiction_type: detailedInfo?.jurisdiction ||
                        (jurisdictionType as 'city' | 'county' | 'state' | 'special_district'),

      // Office details (prefer detailed info)
      department_name: detailedInfo?.department ||
                      detailedInfo?.officeName ||
                      extractDepartmentName(result.title, result.snippet) ||
                      (structuredData?.organization?.name as string) || '',

      office_type: extractOfficeTypeFromDetailed(detailedInfo) ||
                   extractOfficeType(result.title, result.snippet),

      // Contact information (comprehensive from detailed scraping)
      address: detailedInfo?.address ||
               extractAddressFromSnippet(result.snippet) ||
               formatStructuredAddress(structuredData?.postalAddress) || '',

      phone: detailedInfo?.phone ||
             extractPhoneFromSnippet(result.snippet) ||
             (structuredData?.contactPoint?.telephone as string) || '',

      email: detailedInfo?.email ||
             extractEmailFromSnippet(result.snippet) ||
             (structuredData?.contactPoint?.email as string) || '',

      website: result.url,

      // Enhanced business hours from detailed scraping
      hours_monday: detailedInfo?.businessHours?.monday || '8:00 AM - 5:00 PM',
      hours_tuesday: detailedInfo?.businessHours?.tuesday || '8:00 AM - 5:00 PM',
      hours_wednesday: detailedInfo?.businessHours?.wednesday || '8:00 AM - 5:00 PM',
      hours_thursday: detailedInfo?.businessHours?.thursday || '8:00 AM - 5:00 PM',
      hours_friday: detailedInfo?.businessHours?.friday || '8:00 AM - 5:00 PM',
      hours_saturday: detailedInfo?.businessHours?.saturday || null,
      hours_sunday: detailedInfo?.businessHours?.sunday || null,

      // Enhanced service information from detailed scraping
      building_permits: detailedInfo?.services?.buildingPermits ?? true,
      electrical_permits: detailedInfo?.services?.electricalPermits ?? true,
      plumbing_permits: detailedInfo?.services?.plumbingPermits ?? true,
      mechanical_permits: detailedInfo?.services?.mechanicalPermits ?? true,
      zoning_permits: detailedInfo?.services?.zoningPermits ?? true,
      planning_review: detailedInfo?.services?.planningReview ?? true,
      inspections: detailedInfo?.services?.inspections ?? true,

      // Enhanced online services information
      online_applications: detailedInfo?.onlineServices?.onlineApplications ??
                          (result.snippet.toLowerCase().includes('online') ||
                           result.snippet.toLowerCase().includes('digital')),

      online_payments: detailedInfo?.onlineServices?.onlinePayments ??
                      (result.snippet.toLowerCase().includes('payment') ||
                       result.snippet.toLowerCase().includes('pay online')),

      permit_tracking: detailedInfo?.onlineServices?.permitTracking ??
                      (result.snippet.toLowerCase().includes('track') ||
                       result.snippet.toLowerCase().includes('status')),

      // Enhanced portal information
      online_portal_url: detailedInfo?.portals?.permitsPortal ||
                        detailedInfo?.portals?.citizenPortal ||
                        (result.snippet.toLowerCase().includes('portal') ? result.url : null),

      // Geographic coordinates (to be enhanced with geocoding)
      latitude: null,
      longitude: null,
      service_area_bounds: null,

      // Enhanced metadata
      data_source: 'web_search' as const,
      last_verified: new Date().toISOString(),
      crawl_frequency: 'daily' as const,
      active: true
    }

    // Add enhanced properties for API response (not in database schema)
    if (detailedInfo) {
      (office as PermitOffice & { enhancedData?: Record<string, unknown> }).enhancedData = {
        dataCompleteness: detailedInfo.metadata.dataCompleteness,
        sourceReliability: detailedInfo.metadata.sourceReliability,
        totalForms: Object.values(detailedInfo.forms).reduce((sum, arr) => sum + arr.length, 0),
        staffContacts: Object.keys(detailedInfo.staffContacts).length,
        specialServices: [
          detailedInfo.services.landDevelopment && 'Land Development',
          detailedInfo.services.subdivisionReview && 'Subdivision Review',
          detailedInfo.services.varianceApplications && 'Variance Applications',
          detailedInfo.services.specialEventPermits && 'Special Event Permits',
          detailedInfo.services.signPermits && 'Sign Permits',
          detailedInfo.services.demolitionPermits && 'Demolition Permits'
        ].filter(Boolean),
        onlineCapabilities: [
          detailedInfo.onlineServices.documentSubmission && 'Document Submission',
          detailedInfo.onlineServices.schedulingInspections && 'Inspection Scheduling',
          detailedInfo.onlineServices.statusUpdates && 'Status Updates',
          detailedInfo.onlineServices.renewals && 'Permit Renewals'
        ].filter(Boolean),
        availablePortals: Object.keys(detailedInfo.portals).filter(key => detailedInfo.portals[key as keyof typeof detailedInfo.portals]),
        processInfo: detailedInfo.processInfo,
        feeStructure: detailedInfo.feeStructure
      }
    }

    offices.push(office)
  }

  return offices
}

// Enhanced helper functions for extracting information from search results
function extractOfficeTypeFromDetailed(detailedInfo?: DetailedOfficeInfo): 'building' | 'planning' | 'zoning' | 'combined' | 'other' {
  if (!detailedInfo) return 'combined'

  const services = detailedInfo.services
  let serviceCount = 0

  if (services.buildingPermits) serviceCount++
  if (services.planningReview) serviceCount++
  if (services.zoningPermits) serviceCount++

  if (serviceCount >= 2) return 'combined'
  if (services.planningReview) return 'planning'
  if (services.zoningPermits) return 'zoning'
  if (services.buildingPermits) return 'building'

  return 'other'
}

function formatStructuredAddress(postalAddress?: Record<string, unknown>): string {
  if (!postalAddress) return ''

  const parts = [
    postalAddress.streetAddress,
    postalAddress.addressLocality,
    postalAddress.addressRegion,
    postalAddress.postalCode
  ].filter(Boolean)

  return parts.join(', ')
}

function extractCityFromTitle(title: string, fallback: string): string {
  const cityMatch = title.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+(GA|Georgia)/i)
  return cityMatch ? cityMatch[1] : fallback
}

function extractCountyFromTitle(title: string, fallback: string): string {
  const countyMatch = title.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+County/i)
  return countyMatch ? countyMatch[1] : fallback
}

function extractOfficeType(title: string, snippet: string): 'building' | 'planning' | 'zoning' | 'combined' | 'other' {
  const text = `${title} ${snippet}`.toLowerCase()
  
  if (text.includes('planning') && text.includes('building')) return 'combined'
  if (text.includes('planning department')) return 'planning'
  if (text.includes('zoning office')) return 'zoning'
  if (text.includes('building department')) return 'building'
  
  return 'combined'
}

function extractAddressFromSnippet(snippet: string): string {
  // Look for address patterns
  const addressMatch = snippet.match(/(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Way|Lane|Ln),?\s+[A-Za-z\s]+,?\s+[A-Z]{2}\s+\d{5})/i)
  return addressMatch ? addressMatch[1] : ''
}

function extractPhoneFromSnippet(snippet: string): string {
  // Look for phone number patterns
  const phoneMatch = snippet.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i)
  return phoneMatch ? phoneMatch[1] : ''
}

function extractEmailFromSnippet(snippet: string): string {
  // Look for email patterns
  const emailMatch = snippet.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
  return emailMatch ? emailMatch[1] : ''
}

// Helper function to extract department name from search results
function extractDepartmentName(title: string, snippet: string): string {
  const text = `${title} ${snippet}`.toLowerCase()
  
  if (text.includes('planning department')) return 'Planning Department'
  if (text.includes('development services')) return 'Development Services Department'
  if (text.includes('building department')) return 'Building Department'
  if (text.includes('community development')) return 'Community Development Department'
  if (text.includes('permit office')) return 'Permit Office'
  if (text.includes('zoning office')) return 'Zoning Office'
  
  return 'Building & Planning Department'
}

// Helper function to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Helper function to remove duplicate offices
function removeDuplicateOffices(offices: PermitOffice[]): PermitOffice[] {
  const seen = new Set<string>()
  return offices.filter(office => {
    const key = `${office.city}-${office.county}-${office.department_name}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}
