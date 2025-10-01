import { db, permitOffices } from './db'
import type { NewPermitOffice } from './db/schema'
import * as cheerio from 'cheerio'
import { DeepPermitCrawler, type PermitRequirements } from './deep-crawler'

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
  deepCrawlData?: PermitRequirements
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
 * Uses deep crawler for comprehensive data extraction
 */
async function extractSolarPermitInfo(url: string): Promise<SolarPermitInfo> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PermitBot/2.0)'
      }
    })

    if (!response.ok) {
      console.warn(`Failed to fetch ${url}: ${response.status}`)
      return {}
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const solarInfo: SolarPermitInfo = {}

    // Extract basic information first
    solarInfo.instructions = extractInstructions($)
    solarInfo.timeline = extractTimeline($)
    solarInfo.fees = extractFees($)
    solarInfo.requiredDocuments = extractRequiredDocuments($)
    solarInfo.applicationUrl = extractApplicationUrl($)

    // Run deep crawler for comprehensive extraction
    try {
      const crawler = new DeepPermitCrawler()
      const deepData = await crawler.crawlSite(url, {
        maxDepth: 4,
        maxPages: 15,
        followExternal: false,
        targetPaths: [
          '/permit', '/solar', '/electrical', '/renewable',
          '/application', '/form', '/fee', '/requirement',
          '/instruction', '/timeline', '/process'
        ],
        extractPDFs: true
      })

      solarInfo.deepCrawlData = deepData

      // Merge deep crawl data with basic extraction
      if (deepData.stepByStep.length > 0 && !solarInfo.instructions) {
        solarInfo.instructions = deepData.stepByStep.join(' → ')
      }

      if (deepData.requiredDocuments.length > 0 && !solarInfo.requiredDocuments) {
        solarInfo.requiredDocuments = deepData.requiredDocuments
      }

      if (deepData.fees.length > 0 && !solarInfo.fees) {
        const primaryFee = deepData.fees[0]
        solarInfo.fees = {
          amount: primaryFee.baseFee,
          description: primaryFee.description,
          unit: 'USD'
        }
      }

      if (deepData.timelines.length > 0 && !solarInfo.timeline) {
        const primaryTimeline = deepData.timelines[0]
        solarInfo.timeline = primaryTimeline.description
      }

      console.log(`Deep crawl found: ${deepData.stepByStep.length} instructions, ${deepData.fees.length} fees, ${deepData.timelines.length} timelines`)

    } catch (crawlError) {
      console.error('Deep crawl failed, using basic extraction:', crawlError)
      // Continue with basic extraction if deep crawl fails
    }

    // Fallback: Crawl related pages if still missing data
    if (!solarInfo.instructions || !solarInfo.timeline || !solarInfo.fees) {
      const relatedLinks = findRelatedPermitLinks($, url)
      for (const link of relatedLinks.slice(0, 3)) {
        const relatedInfo = await extractFromRelatedPage(link)
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

  // Build comprehensive instructions from deep crawl data
  const deepData = solarInfo.deepCrawlData
  const instructions: Record<string, unknown> = {
    general: solarInfo.instructions || deepData?.generalInstructions.join('\n'),
    electrical: solarInfo.instructions || deepData?.stepByStep.join('\n'),
    requiredDocuments: solarInfo.requiredDocuments || deepData?.requiredDocuments,
  }

  // Add deep crawl specific data
  if (deepData) {
    if (deepData.onlineForms.length > 0) {
      instructions.onlineForms = deepData.onlineForms
    }
    if (deepData.downloadableForms.length > 0) {
      instructions.downloadableForms = deepData.downloadableForms
    }
    if (deepData.contacts.length > 0) {
      instructions.contacts = deepData.contacts
    }
  }

  // Build comprehensive fee structure
  const permitFees: Record<string, unknown> = {}
  if (solarInfo.fees) {
    permitFees.electrical = solarInfo.fees
  } else if (deepData && deepData.fees.length > 0) {
    permitFees.electrical = deepData.fees.map(fee => ({
      permitType: fee.permitType,
      amount: fee.baseFee,
      variableFee: fee.variableFee,
      description: fee.description,
      applicableTo: fee.applicableTo
    }))
  }

  // Build comprehensive processing times
  const processingTimes: Record<string, unknown> = {}
  if (solarInfo.timeline) {
    processingTimes.electrical = {
      description: solarInfo.timeline
    }
  } else if (deepData && deepData.timelines.length > 0) {
    processingTimes.electrical = deepData.timelines.map(timeline => ({
      permitType: timeline.permitType,
      minDays: timeline.minDays,
      maxDays: timeline.maxDays,
      averageDays: timeline.averageDays,
      description: timeline.description,
      conditions: timeline.conditions
    }))
  }

  const office: PermitOfficeData = {
    city,
    county: county || '',
    state,
    jurisdictionType,
    departmentName,
    officeType: 'combined',
    address: `${city}, ${state}`,
    phone: deepData?.contacts[0]?.phone || null,
    email: deepData?.contacts[0]?.email || null,
    website: result.link,
    buildingPermits: true,
    electricalPermits: true,
    plumbingPermits: false,
    mechanicalPermits: false,
    zoningPermits: false,
    planningReview: true,
    inspections: true,
    onlineApplications: !!(solarInfo.applicationUrl || deepData?.onlineForms.length),
    onlinePayments: false,
    permitTracking: false,
    onlinePortalUrl: solarInfo.applicationUrl || deepData?.onlineForms[0] || null,
    latitude: latitude?.toString() || null,
    longitude: longitude?.toString() || null,
    dataSource: 'crawled',
    active: true,
    instructions: Object.keys(instructions).length > 0 ? instructions : undefined,
    permitFees: Object.keys(permitFees).length > 0 ? permitFees : undefined,
    processingTimes: Object.keys(processingTimes).length > 0 ? processingTimes : undefined
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
