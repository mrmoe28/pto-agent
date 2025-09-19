import { NextRequest, NextResponse } from 'next/server'

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

// Type definition for search results
interface SearchResult {
  title: string
  url: string
  snippet: string
}

// Perform web search using a search API
async function performWebSearch(query: string): Promise<SearchResult[]> {
  console.log(`Searching web for: ${query}`)
  
  try {
    // Use DuckDuckGo Instant Answer API for real search results
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PermitOfficeBot/1.0)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Extract relevant results
    const results: SearchResult[] = []
    
    // Add abstract if available (often contains government info)
    if (data.Abstract) {
      results.push({
        title: data.Heading || query,
        url: data.AbstractURL || '',
        snippet: data.Abstract
      })
    }
    
    // Add related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 3)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text,
            url: topic.FirstURL,
            snippet: topic.Text
          })
        }
      }
    }
    
    // If no results from DuckDuckGo, try a direct government website search
    if (results.length === 0) {
      const govResults = await searchGovernmentWebsites(query)
      results.push(...govResults)
    }
    
    return results.slice(0, 5) // Limit to 5 results
    
  } catch (error) {
    console.error('Web search error:', error)
    // Fallback to government website search
    return await searchGovernmentWebsites(query)
  }
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

// Extract permit office information from search results
function extractPermitOfficesFromSearchResults(searchResults: SearchResult[], location: string, state: string, jurisdictionType: string): PermitOffice[] {
  const offices: PermitOffice[] = []
  
  for (const result of searchResults) {
    // Skip if not a government website
    if (!result.url.includes('.gov')) {
      continue
    }
    
    // Extract office information from search result
    const office: PermitOffice = {
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      city: jurisdictionType === 'city' ? location : extractCityFromTitle(result.title, location),
      county: jurisdictionType === 'county' ? location : extractCountyFromTitle(result.title, location),
      state: state,
      jurisdiction_type: jurisdictionType as 'city' | 'county' | 'state' | 'special_district',
      department_name: extractDepartmentName(result.title, result.snippet),
      office_type: extractOfficeType(result.title, result.snippet),
      address: extractAddressFromSnippet(result.snippet),
      phone: extractPhoneFromSnippet(result.snippet),
      email: extractEmailFromSnippet(result.snippet),
      website: result.url,
      hours_monday: '8:00 AM - 5:00 PM',
      hours_tuesday: '8:00 AM - 5:00 PM',
      hours_wednesday: '8:00 AM - 5:00 PM',
      hours_thursday: '8:00 AM - 5:00 PM',
      hours_friday: '8:00 AM - 5:00 PM',
      hours_saturday: null,
      hours_sunday: null,
      building_permits: true,
      electrical_permits: true,
      plumbing_permits: true,
      mechanical_permits: true,
      zoning_permits: true,
      planning_review: true,
      inspections: true,
      online_applications: result.snippet.toLowerCase().includes('online') || result.snippet.toLowerCase().includes('digital'),
      online_payments: result.snippet.toLowerCase().includes('payment') || result.snippet.toLowerCase().includes('pay online'),
      permit_tracking: result.snippet.toLowerCase().includes('track') || result.snippet.toLowerCase().includes('status'),
      online_portal_url: result.snippet.toLowerCase().includes('portal') ? result.url : null,
      latitude: null,
      longitude: null,
      service_area_bounds: null,
      data_source: 'web_search' as const,
      last_verified: new Date().toISOString(),
      crawl_frequency: 'daily' as const,
      active: true
    }
    
    offices.push(office)
  }
  
  return offices
}

// Helper functions to extract information from search results
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
