import { db, permitOffices } from './db'
import type { NewPermitOffice } from './db/schema'

interface ScrapeParams {
  city: string
  county: string
  state: string
  latitude: number | null
  longitude: number | null
}

interface PermitOfficeData extends Partial<NewPermitOffice> {
  city: string
  county: string
  state: string
  jurisdictionType: string
  departmentName: string
  officeType: string
  address: string
}

/**
 * Scrapes permit office data from the web
 * This is a placeholder that should be enhanced with actual web scraping logic
 */
export async function scrapePermitOfficeData(params: ScrapeParams): Promise<PermitOfficeData[] | null> {
  const { city, county, state } = params

  console.log(`Scraping permit office data for: ${city}, ${county}, ${state}`)

  try {
    // TODO: Implement actual web scraping logic here
    // For now, we'll use Google Custom Search to find relevant permit office pages

    const searchQuery = `${city} ${county} ${state} building permits department`
    const results = await searchForPermitOffices(searchQuery)

    if (results.length === 0) {
      console.log('No results found from web search')
      return null
    }

    // Extract and structure the data
    const officeData: PermitOfficeData[] = []

    for (const result of results) {
      const office = await extractOfficeInfo(result, params)
      if (office) {
        // Insert into database
        await db.insert(permitOffices).values(office).onConflictDoNothing()
        officeData.push(office)
      }
    }

    return officeData.length > 0 ? officeData : null

  } catch (error) {
    console.error('Scraping error:', error)
    throw error
  }
}

interface SearchResult {
  title: string
  link: string
  snippet: string
}

/**
 * Search for permit office websites using Google Custom Search
 */
async function searchForPermitOffices(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID

  if (!apiKey || !searchEngineId) {
    console.warn('Google Custom Search API not configured')
    return []
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('cx', searchEngineId)
    url.searchParams.set('q', query)
    url.searchParams.set('num', '5')

    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error('Google Search API error:', response.status)
      return []
    }

    const data = await response.json()

    return data.items?.map((item: {title: string; link: string; snippet: string}) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet
    })) || []

  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

/**
 * Extract permit office information from search result
 * This is a basic implementation that should be enhanced with actual scraping
 */
async function extractOfficeInfo(
  result: SearchResult,
  params: ScrapeParams
): Promise<PermitOfficeData | null> {
  try {
    // Basic extraction from search result
    // In a production system, you'd fetch and parse the actual page

    const { city, county, state, latitude, longitude } = params

    // Try to determine if this is a city or county office
    const isCountyOffice = result.title.toLowerCase().includes('county') ||
                          result.link.toLowerCase().includes('county')

    const jurisdictionType = isCountyOffice ? 'county' : 'city'

    // Extract department name from title
    let departmentName = 'Development Services'
    if (result.title.toLowerCase().includes('planning')) {
      departmentName = 'Planning and Development'
    } else if (result.title.toLowerCase().includes('building')) {
      departmentName = 'Building Department'
    }

    // Create office data
    const office: PermitOfficeData = {
      city: city,
      county: county || '',
      state: state,
      jurisdictionType,
      departmentName,
      officeType: 'combined',
      address: `${city}, ${state}`, // Placeholder - should be scraped from page
      phone: null,
      email: null,
      website: result.link,
      buildingPermits: true,
      electricalPermits: true,
      plumbingPermits: true,
      mechanicalPermits: true,
      zoningPermits: true,
      planningReview: true,
      inspections: true,
      onlineApplications: true,
      onlinePayments: false,
      permitTracking: false,
      latitude: latitude?.toString() || null,
      longitude: longitude?.toString() || null,
      dataSource: 'web_search',
      active: true,
      instructions: {
        general: extractInstructions(result.snippet),
      }
    }

    return office

  } catch (error) {
    console.error('Error extracting office info:', error)
    return null
  }
}

/**
 * Extract permit submission instructions from text
 */
function extractInstructions(text: string): string {
  // Basic instruction extraction
  // Look for common patterns like "apply", "submit", "permit application"

  const instructionPatterns = [
    /how to (apply|submit|get|obtain).*permit/i,
    /permit (application|process|submission)/i,
    /apply (online|in person)/i,
    /required documents?/i
  ]

  for (const pattern of instructionPatterns) {
    if (pattern.test(text)) {
      return text
    }
  }

  return 'Visit the website for detailed permit application instructions.'
}
