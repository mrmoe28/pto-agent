import { db, permitOffices } from './db'
import type { NewPermitOffice } from './db/schema'
import * as cheerio from 'cheerio'

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

interface SearchResult {
  title: string
  link: string
  snippet: string
}

interface SolarPermitInfo {
  instructions?: string
  timeline?: string
  fees?: {
    amount?: number
    description?: string
    unit?: string
  }
  requiredDocuments?: string[]
  applicationUrl?: string
}

/**
 * Enhanced scraper focusing on solar/electrical permits
 * Crawls multiple pages to find detailed instructions and timelines
 */
export async function scrapeSolarPermitData(params: ScrapeParams): Promise<PermitOfficeData[] | null> {
  const { city, county, state } = params

  console.log(`Scraping solar permit data for: ${city}, ${county}, ${state}`)

  try {
    // Search for solar/electrical permit pages
    const solarQuery = `${city} ${county} ${state} solar panel electrical permit requirements`
    const solarResults = await searchForPermitOffices(solarQuery)

    if (solarResults.length === 0) {
      console.log('No solar permit results found')
      return null
    }

    const officeData: PermitOfficeData[] = []

    // Process each result and crawl for detailed information
    for (const result of solarResults) {
      const solarInfo = await extractSolarPermitInfo(result.link)
      const office = await buildOfficeData(result, params, solarInfo)

      if (office) {
        // Insert into database
        await db.insert(permitOffices).values(office).onConflictDoNothing()
        officeData.push(office)
      }
    }

    return officeData.length > 0 ? officeData : null

  } catch (error) {
    console.error('Solar permit scraping error:', error)
    throw error
  }
}

/**
 * Extract solar/electrical permit information from a webpage
 * Crawls the page and related pages for instructions and timelines
 */
async function extractSolarPermitInfo(url: string): Promise<SolarPermitInfo> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PermitBot/1.0)'
      }
    })

    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`)
      return {}
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const solarInfo: SolarPermitInfo = {}

    // Extract instructions
    solarInfo.instructions = extractInstructions($)

    // Extract timeline/processing time
    solarInfo.timeline = extractTimeline($)

    // Extract fees
    solarInfo.fees = extractFees($)

    // Extract required documents
    solarInfo.requiredDocuments = extractRequiredDocuments($)

    // Look for application/form URLs
    solarInfo.applicationUrl = extractApplicationUrl($)

    // Crawl related pages for more details
    const relatedLinks = findRelatedPermitLinks($, url)
    for (const link of relatedLinks.slice(0, 3)) { // Limit to 3 related pages
      const relatedInfo = await extractFromRelatedPage(link)
      // Merge information
      if (!solarInfo.instructions && relatedInfo.instructions) {
        solarInfo.instructions = relatedInfo.instructions
      }
      if (!solarInfo.timeline && relatedInfo.timeline) {
        solarInfo.timeline = relatedInfo.timeline
      }
      if (!solarInfo.fees && relatedInfo.fees) {
        solarInfo.fees = relatedInfo.fees
      }
      if (!solarInfo.requiredDocuments && relatedInfo.requiredDocuments) {
        solarInfo.requiredDocuments = relatedInfo.requiredDocuments
      }
    }

    return solarInfo

  } catch (error) {
    console.error(`Error extracting solar info from ${url}:`, error)
    return {}
  }
}

/**
 * Extract permit submission instructions from page
 */
function extractInstructions($: cheerio.CheerioAPI): string | undefined {
  const instructionKeywords = [
    'how to apply',
    'application process',
    'submit',
    'submission requirements',
    'steps to apply',
    'permit process',
    'solar permit instructions',
    'electrical permit instructions'
  ]

  let instructions = ''

  // Look for instruction sections
  $('h1, h2, h3, h4, p, li').each((_, elem): boolean | void => {
    const text = $(elem).text().toLowerCase()

    if (instructionKeywords.some(keyword => text.includes(keyword))) {
      const parent = $(elem).parent()
      const content = parent.find('p, li').map((_, el) => $(el).text().trim()).get().join(' ')

      if (content.length > instructions.length && content.length < 2000) {
        instructions = content
      }
    }
  })

  return instructions || undefined
}

/**
 * Extract permit timeline/processing time
 */
function extractTimeline($: cheerio.CheerioAPI): string | undefined {
  const timelinePatterns = [
    /(\d+)\s*(to|-)?\s*(\d+)?\s*(business\s+)?days?/i,
    /(\d+)\s*(to|-)?\s*(\d+)?\s*weeks?/i,
    /processing\s+time[:\s]+(.+)/i,
    /review\s+time[:\s]+(.+)/i,
    /timeline[:\s]+(.+)/i,
    /typical.*?(\d+.*?(?:day|week|month))/i
  ]

  let timeline = ''

  $('p, li, td, div').each((_, elem): boolean | void => {
    const text = $(elem).text()

    for (const pattern of timelinePatterns) {
      const match = text.match(pattern)
      if (match && match[0].length < 200) {
        timeline = match[0].trim()
        return false // Break loop
      }
    }
  })

  return timeline || undefined
}

/**
 * Extract permit fees
 */
function extractFees($: cheerio.CheerioAPI): SolarPermitInfo['fees'] | undefined {
  const feePatterns = [
    /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?)/i
  ]

  let feeInfo: SolarPermitInfo['fees'] = {}

  $('p, li, td').each((_, elem): boolean | void => {
    const text = $(elem).text().toLowerCase()

    if (text.includes('solar') || text.includes('electrical')) {
      for (const pattern of feePatterns) {
        const match = $(elem).text().match(pattern)
        if (match) {
          const amount = parseFloat(match[1].replace(/,/g, ''))
          feeInfo = {
            amount,
            description: $(elem).text().trim().slice(0, 200),
            unit: 'USD'
          }
          return false
        }
      }
    }
  })

  return Object.keys(feeInfo).length > 0 ? feeInfo : undefined
}

/**
 * Extract required documents list
 */
function extractRequiredDocuments($: cheerio.CheerioAPI): string[] | undefined {
  const documents: string[] = []
  const docKeywords = ['required', 'document', 'submit', 'checklist', 'need']

  $('ul, ol').each((_, list): void => {
    const listText = $(list).text().toLowerCase()

    if (docKeywords.some(keyword => listText.includes(keyword))) {
      $(list).find('li').each((_, item): void => {
        const doc = $(item).text().trim()
        if (doc.length > 5 && doc.length < 200) {
          documents.push(doc)
        }
      })
    }
  })

  return documents.length > 0 ? documents : undefined
}

/**
 * Extract application/form URL
 */
function extractApplicationUrl($: cheerio.CheerioAPI): string | undefined {
  let appUrl: string | undefined

  $('a').each((_, elem): boolean | void => {
    const text = $(elem).text().toLowerCase()
    const href = $(elem).attr('href')

    if (href && (
      text.includes('apply') ||
      text.includes('application') ||
      text.includes('form') ||
      text.includes('submit')
    )) {
      appUrl = href.startsWith('http') ? href : undefined
      return false
    }
  })

  return appUrl
}

/**
 * Find related permit page links
 */
function findRelatedPermitLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const links: string[] = []
  const permitKeywords = [
    'solar',
    'electrical',
    'permit',
    'requirement',
    'application',
    'instruction',
    'guideline'
  ]

  $('a').each((_, elem): void => {
    const href = $(elem).attr('href')
    const text = $(elem).text().toLowerCase()

    if (href && permitKeywords.some(keyword => text.includes(keyword))) {
      let fullUrl = href

      if (href.startsWith('/')) {
        const base = new URL(baseUrl)
        fullUrl = `${base.origin}${href}`
      } else if (!href.startsWith('http')) {
        const base = new URL(baseUrl)
        fullUrl = `${base.origin}/${href}`
      }

      if (fullUrl.startsWith('http') && !links.includes(fullUrl)) {
        links.push(fullUrl)
      }
    }
  })

  return links
}

/**
 * Extract information from related page
 */
async function extractFromRelatedPage(url: string): Promise<SolarPermitInfo> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PermitBot/1.0)'
      }
    })

    if (!response.ok) return {}

    const html = await response.text()
    const $ = cheerio.load(html)

    return {
      instructions: extractInstructions($),
      timeline: extractTimeline($),
      fees: extractFees($),
      requiredDocuments: extractRequiredDocuments($)
    }
  } catch (error) {
    console.error(`Error extracting from related page ${url}:`, error)
    return {}
  }
}

/**
 * Build complete office data from search result and scraped info
 */
async function buildOfficeData(
  result: SearchResult,
  params: ScrapeParams,
  solarInfo: SolarPermitInfo
): Promise<PermitOfficeData | null> {
  const { city, county, state, latitude, longitude } = params

  const isCountyOffice = result.title.toLowerCase().includes('county') ||
                        result.link.toLowerCase().includes('county')

  const jurisdictionType = isCountyOffice ? 'county' : 'city'

  let departmentName = 'Development Services'
  if (result.title.toLowerCase().includes('planning')) {
    departmentName = 'Planning and Development'
  } else if (result.title.toLowerCase().includes('building')) {
    departmentName = 'Building Department'
  }

  const office: PermitOfficeData = {
    city,
    county: county || '',
    state,
    jurisdictionType,
    departmentName,
    officeType: 'combined',
    address: `${city}, ${state}`,
    phone: null,
    email: null,
    website: result.link,
    buildingPermits: true,
    electricalPermits: true,
    plumbingPermits: false,
    mechanicalPermits: false,
    zoningPermits: false,
    planningReview: true,
    inspections: true,
    onlineApplications: !!solarInfo.applicationUrl,
    onlinePayments: false,
    permitTracking: false,
    onlinePortalUrl: solarInfo.applicationUrl || null,
    latitude: latitude?.toString() || null,
    longitude: longitude?.toString() || null,
    dataSource: 'web_search',
    active: true,
    instructions: {
      general: solarInfo.instructions,
      electrical: solarInfo.instructions,
      requiredDocuments: solarInfo.requiredDocuments,
    },
    permitFees: solarInfo.fees ? {
      electrical: solarInfo.fees
    } : undefined,
    processingTimes: solarInfo.timeline ? {
      electrical: {
        description: solarInfo.timeline
      }
    } : undefined
  }

  return office
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
    url.searchParams.set('num', '10') // Get more results for better coverage

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
