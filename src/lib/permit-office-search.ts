import { DetailedOfficeInfo } from '@/lib/enhanced-web-scraper'
import { getDetailedOfficeInfo } from '@/lib/scraper-manager'

// Comprehensive data type interfaces
export interface PermitFee {
  amount?: number
  description?: string
  unit?: string
}

export interface PermitFees {
  [feeType: string]: PermitFee | PermitFee[]
}

export interface ProcessingTime {
  min?: number
  max?: number
  unit?: string
  description?: string
}

export interface ProcessingTimes {
  [permitType: string]: ProcessingTime | string
}

export interface ContactInfo {
  name?: string
  title?: string
  phone?: string
  email?: string
  department?: string
}

export interface ContactDetails {
  [contactType: string]: ContactInfo[]
}

export interface OfficeDetails {
  [detailType: string]: string[]
}

export interface PermitCategories {
  [category: string]: string[]
}

export interface RelatedPage {
  url: string
  title: string
  relevance: number
}

export interface DownloadableApplication {
  name: string
  url: string
  format: string
  description?: string
}

export interface DownloadableApplications {
  [applicationType: string]: DownloadableApplication[]
}

export interface Instructions {
  [instructionType: string]: string
}

export interface ServiceAreaBounds {
  north?: number
  south?: number
  east?: number
  west?: number
  center?: { lat: number; lng: number }
  radius?: number
}

export interface SeasonalHours {
  [season: string]: string
}

export interface SpecialRequirements {
  [permitType: string]: string
}

// Structured data interfaces for search results
interface OrganizationData {
  name?: string
  type?: string
  url?: string
  logo?: string
}

interface LocalBusinessData {
  name?: string
  address?: PostalAddressData
  telephone?: string
  openingHours?: string
  priceRange?: string
}

interface ContactPointData {
  telephone?: string
  email?: string
  contactType?: string
  areaServed?: string
}

interface PostalAddressData {
  streetAddress?: string
  addressLocality?: string
  addressRegion?: string
  postalCode?: string
  addressCountry?: string
}

interface StructuredData {
  organization?: OrganizationData
  localBusiness?: LocalBusinessData
  contactPoint?: ContactPointData
  postalAddress?: PostalAddressData
}

export interface PermitOffice {
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
  service_area_bounds: ServiceAreaBounds | null
  data_source: 'web_search' | 'crawled' | 'api' | 'manual'
  last_verified: string | null
  crawl_frequency: 'daily' | 'weekly' | 'monthly'
  active: boolean
  distance?: number
  enhancedData?: {
    dataCompleteness: number
    sourceReliability: number
    totalForms: number
    staffContacts: number
    specialServices: string[]
    onlineCapabilities: string[]
    availablePortals: string[]
    processInfo: unknown
    feeStructure: unknown
  }

  // Enhanced comprehensive data from multi-page scraping
  permit_fees?: PermitFees | null
  instructions?: Instructions | null
  downloadable_applications?: DownloadableApplications | null
  processing_times?: ProcessingTimes | null
  contact_details?: ContactDetails | null
  office_details?: OfficeDetails | null
  permit_categories?: PermitCategories | null
  related_pages?: RelatedPage[] | null

  // Additional contact methods
  fax?: string | null
  alternative_phones?: string[]
  alternative_emails?: string[]

  // Detailed service information
  service_area_description?: string | null
  staff_directory?: string[]
  department_divisions?: string[]

  // Permit-specific details
  permit_types_available?: string[]
  special_requirements?: SpecialRequirements | null
  inspection_services?: string[]

  // Operational details
  seasonal_hours?: SeasonalHours | null
  appointment_required?: boolean | null
  walk_in_hours?: string | null

  // Digital services
  online_portal_features?: string[]
  mobile_app_available?: boolean | null
  document_upload_supported?: boolean | null

  // Scraping metadata
  confidence_score?: number | null
  pages_crawled?: number | null
  crawl_depth?: number | null
}

interface SearchResult {
  title: string
  url: string
  snippet: string
  detailedInfo?: DetailedOfficeInfo
  structuredData?: StructuredData
}

export async function searchPermitOfficesWeb(city: string | null, county: string | null, state: string): Promise<PermitOffice[]> {
  const offices: PermitOffice[] = []

  try {
    if (city) {
      const cityOffices = await searchCityPermitOffices(city, state)
      offices.push(...cityOffices)
    }

    if (county) {
      const countyOffices = await searchCountyPermitOffices(county, state)
      offices.push(...countyOffices)
    }

    if (offices.length === 0) {
      const generalOffices = await searchGeneralPermitOffices(state)
      offices.push(...generalOffices)
    }

    const uniqueOffices = removeDuplicateOffices(offices)
    return uniqueOffices.slice(0, 10)
  } catch (error) {
    console.error('Web search error:', error)
    return []
  }
}

export function generatePermitOfficeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 11)
}

async function searchCityPermitOffices(city: string, state: string): Promise<PermitOffice[]> {
  const offices: PermitOffice[] = []

  try {
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

async function searchCountyPermitOffices(county: string, state: string): Promise<PermitOffice[]> {
  const offices: PermitOffice[] = []

  try {
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

async function performWebSearch(query: string): Promise<SearchResult[]> {
  console.log(`Searching web for: ${query}`)

  try {
    const results: SearchResult[] = []

    const googleResults = await searchGoogleCustomSearch(query)
    results.push(...googleResults)

    if (results.length === 0) {
      const bingResults = await searchBingAPI(query)
      results.push(...bingResults)
    }

    if (results.length === 0) {
      const govResults = await searchGovernmentWebsites(query)
      results.push(...govResults)
    }

    if (results.length === 0) {
      const patternResults = await searchKnownPatterns(query)
      results.push(...patternResults)
    }

    return results.slice(0, 5)
  } catch (error) {
    console.error('Web search error:', error)
    return []
  }
}

async function searchGoogleCustomSearch(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = []

  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
    const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID

    if (!GOOGLE_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
      console.log('Google Custom Search API not configured, skipping...')
      return results
    }

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

    const processedUrls = new Set<string>()

    for (const searchQuery of searchQueries) {
      try {
        const searchUrl = new URL('https://www.googleapis.com/customsearch/v1')
        searchUrl.searchParams.set('key', GOOGLE_API_KEY)
        searchUrl.searchParams.set('cx', GOOGLE_SEARCH_ENGINE_ID)
        searchUrl.searchParams.set('q', searchQuery)
        searchUrl.searchParams.set('num', '5')
        searchUrl.searchParams.set('fields', 'items(title,link,snippet,pagemap)')

        const response = await fetch(searchUrl.toString(), {
          headers: {
            'User-Agent': 'PermitOfficeSearchBot/2.0 (+https://permitoffices.com/bot)'
          }
        })

        if (!response.ok) {
          console.warn(`Google search failed with status ${response.status}`)
          continue
        }

        const responseText = await response.text()
        if (!responseText.trim()) {
          console.log(`Empty response for query: ${searchQuery}`)
          continue
        }

        let data: unknown
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error(`JSON parse error for query "${searchQuery}":`, parseError)
          console.error('Response preview:', responseText.substring(0, 200))
          continue
        }

        const items = (data as { items?: Array<{
          title?: string
          link?: string
          snippet?: string
          pagemap?: StructuredData
        }> }).items || []

        for (const item of items) {
          const link = typeof item.link === 'string' ? item.link : null
          if (!link || processedUrls.has(link)) {
            continue
          }

          processedUrls.add(link)
          console.log(`Enhanced scraping: ${link}`)
          const detailedInfo = await getDetailedOfficeInfo(link)

          const enhancedResult: SearchResult = {
            title: String(item.title ?? ''),
            url: link,
            snippet: String(item.snippet ?? ''),
            detailedInfo: detailedInfo || undefined,
            structuredData: item.pagemap as SearchResult['structuredData']
          }

          results.push(enhancedResult)
        }

        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (queryError) {
        console.error(`Error with search query "${searchQuery}":`, queryError)
        continue
      }
    }
  } catch (error) {
    console.error('Enhanced Google Custom Search error:', error)
  }

  return results.slice(0, 5)
}

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
      try {
        const searchUrl = new URL('https://api.bing.microsoft.com/v7.0/search')
        searchUrl.searchParams.set('q', searchQuery)
        searchUrl.searchParams.set('count', '3')

        const response = await fetch(searchUrl.toString(), {
          headers: {
            'Ocp-Apim-Subscription-Key': BING_API_KEY
          }
        })

        if (!response.ok) {
          console.warn(`Bing search failed with status ${response.status}`)
          continue
        }

        const responseText = await response.text()
        if (!responseText.trim()) {
          console.log(`Empty response for Bing query: ${searchQuery}`)
          continue
        }

        let data: unknown
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error(`Bing JSON parse error for query "${searchQuery}":`, parseError)
          console.error('Response preview:', responseText.substring(0, 200))
          continue
        }

        const webPages = (data as { webPages?: { value?: Array<{
          name?: string
          url?: string
          snippet?: string
        }> } }).webPages
        const values = webPages?.value || []

        for (const item of values) {
          if (typeof item.url !== 'string') continue
          results.push({
            title: String(item.name ?? ''),
            url: item.url,
            snippet: String(item.snippet ?? '')
          })
        }
      } catch (err) {
        console.error(`Bing query error: ${err}`)
      }
    }
  } catch (error) {
    console.error('Bing Search API error:', error)
  }

  return results.slice(0, 3)
}

async function searchGovernmentWebsites(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = []

  try {
    const govPatterns = [
      `${query} site:gov`,
      `${query} "building permits" site:gov`,
      `${query} "planning department" site:gov`,
      `${query} "development services" site:gov`
    ]

    for (const pattern of govPatterns) {
      try {
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

  return results.slice(0, 3)
}

async function searchKnownPatterns(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = []

  try {
    const cityMatch = query.match(/([A-Za-z\s]+),?\s+([A-Za-z]{2}|[A-Za-z]+)/i)
    if (cityMatch) {
      const city = cityMatch[1].trim()
      const rawState = cityMatch[2].trim()
      const normalizedState = rawState.length === 2 ? rawState.toLowerCase() : rawState.toLowerCase() === 'georgia' ? 'ga' : rawState.toLowerCase()
      const stateLabel = rawState.toUpperCase()
      const citySlug = city.toLowerCase().replace(/\s+/g, '')

      const patterns = new Set<string>([
        `https://www.${citySlug}.gov`,
        `https://${citySlug}.gov`
      ])

      if (normalizedState.length === 2) {
        patterns.add(`https://www.${citySlug}.${normalizedState}.gov`)
        patterns.add(`https://${citySlug}.${normalizedState}.gov`)
      }

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
              snippet: `Official government website for ${city}, ${stateLabel}`
            })
            break
          }
        } catch {
          // Try next pattern
        }
      }
    }
  } catch (error) {
    console.error('Known patterns search error:', error)
  }

  return results
}

function extractGovernmentLinks(html: string, query: string): SearchResult[] {
  const results: SearchResult[] = []

  try {
    const linkRegex = /<a[^>]+href="([^"]*)"[^>]*>([^<]*)<\/a>/gi
    let match: RegExpExecArray | null

    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1]
      const title = match[2].replace(/<[^>]*>/g, '').trim()

      if (url.includes('.gov') && title && title.length > 10) {
        results.push({
          title,
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

function extractPermitOfficesFromSearchResults(searchResults: SearchResult[], location: string, state: string, jurisdictionType: string): PermitOffice[] {
  const offices: PermitOffice[] = []

  for (const result of searchResults) {
    if (!result.url.includes('.gov')) {
      continue
    }

    const detailedInfo = result.detailedInfo
    const structuredData = result.structuredData
    const combinedText = `${result.title} ${result.snippet}`.toLowerCase()
    const includesAny = (keywords: string[]) => keywords.some(keyword => combinedText.includes(keyword))

    const office: PermitOffice = {
      id: generatePermitOfficeId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      city: detailedInfo?.city || (jurisdictionType === 'city' ? location : extractCityFromTitle(result.title, location)) || (structuredData?.postalAddress?.addressLocality as string) || '',
      county: detailedInfo?.county || (jurisdictionType === 'county' ? location : extractCountyFromTitle(result.title, location)) || '',
      state: detailedInfo?.state || state,
      jurisdiction_type: detailedInfo?.jurisdiction || (jurisdictionType as 'city' | 'county' | 'state' | 'special_district'),
      department_name: detailedInfo?.department || detailedInfo?.officeName || extractDepartmentName(result.title, result.snippet) || (structuredData?.organization?.name as string) || '',
      office_type: extractOfficeTypeFromDetailed(detailedInfo) || extractOfficeType(result.title, result.snippet),
      address: detailedInfo?.address || extractAddressFromSnippet(result.snippet) || formatStructuredAddress(structuredData?.postalAddress) || '',
      phone: detailedInfo?.phone || extractPhoneFromSnippet(result.snippet) || (structuredData?.contactPoint?.telephone as string) || '',
      email: detailedInfo?.email || extractEmailFromSnippet(result.snippet) || (structuredData?.contactPoint?.email as string) || '',
      website: result.url,
      hours_monday: detailedInfo?.businessHours?.monday ?? null,
      hours_tuesday: detailedInfo?.businessHours?.tuesday ?? null,
      hours_wednesday: detailedInfo?.businessHours?.wednesday ?? null,
      hours_thursday: detailedInfo?.businessHours?.thursday ?? null,
      hours_friday: detailedInfo?.businessHours?.friday ?? null,
      hours_saturday: detailedInfo?.businessHours?.saturday ?? null,
      hours_sunday: detailedInfo?.businessHours?.sunday ?? null,
      building_permits: detailedInfo?.services?.buildingPermits ?? includesAny(['building permit', 'permit center', 'building department']),
      electrical_permits: detailedInfo?.services?.electricalPermits ?? includesAny(['electrical permit', 'electrical inspections']),
      plumbing_permits: detailedInfo?.services?.plumbingPermits ?? includesAny(['plumbing permit', 'plumbing inspections']),
      mechanical_permits: detailedInfo?.services?.mechanicalPermits ?? includesAny(['mechanical permit', 'mechanical inspection', 'hvac permit']),
      zoning_permits: detailedInfo?.services?.zoningPermits ?? includesAny(['zoning permit', 'zoning application', 'zoning department']),
      planning_review: detailedInfo?.services?.planningReview ?? includesAny(['planning review', 'development review', 'site plan']),
      inspections: detailedInfo?.services?.inspections ?? includesAny(['inspection', 'inspections department', 'inspection scheduling']),
      online_applications: detailedInfo?.onlineServices?.onlineApplications ?? includesAny(['online application', 'apply online', 'e-permit']),
      online_payments: detailedInfo?.onlineServices?.onlinePayments ?? includesAny(['online payment', 'pay online']),
      permit_tracking: detailedInfo?.onlineServices?.permitTracking ?? includesAny(['permit tracking', 'permit status']),
      online_portal_url: detailedInfo?.portals?.permitsPortal || detailedInfo?.portals?.citizenPortal || (result.snippet.toLowerCase().includes('portal') ? result.url : null),
      latitude: null,
      longitude: null,
      service_area_bounds: null,
      data_source: 'web_search',
      last_verified: new Date().toISOString(),
      crawl_frequency: 'daily',
      active: true
    }

    if (detailedInfo) {
      office.enhancedData = {
        dataCompleteness: detailedInfo.metadata.dataCompleteness,
        sourceReliability: typeof detailedInfo.metadata.sourceReliability === 'number'
          ? detailedInfo.metadata.sourceReliability
          : parseFloat(String(detailedInfo.metadata.sourceReliability)) || 0,
        totalForms: Object.values(detailedInfo.forms).reduce((sum, arr) => sum + arr.length, 0),
        staffContacts: Object.keys(detailedInfo.staffContacts).length,
        specialServices: [
          detailedInfo.services.landDevelopment && 'Land Development',
          detailedInfo.services.subdivisionReview && 'Subdivision Review',
          detailedInfo.services.varianceApplications && 'Variance Applications',
          detailedInfo.services.specialEventPermits && 'Special Event Permits',
          detailedInfo.services.signPermits && 'Sign Permits',
          detailedInfo.services.demolitionPermits && 'Demolition Permits'
        ].filter((service): service is string => Boolean(service)),
        onlineCapabilities: [
          detailedInfo.onlineServices.documentSubmission && 'Document Submission',
          detailedInfo.onlineServices.schedulingInspections && 'Inspection Scheduling',
          detailedInfo.onlineServices.statusUpdates && 'Status Updates',
          detailedInfo.onlineServices.renewals && 'Permit Renewals'
        ].filter((capability): capability is string => Boolean(capability)),
        availablePortals: Object.keys(detailedInfo.portals).filter(key => detailedInfo.portals[key as keyof typeof detailedInfo.portals]),
        processInfo: detailedInfo.processInfo,
        feeStructure: detailedInfo.feeStructure
      }
    }

    offices.push(office)
  }

  return offices
}

function removeDuplicateOffices(offices: PermitOffice[]): PermitOffice[] {
  const seen = new Set<string>()
  return offices.filter(office => {
    const key = `${office.city.toLowerCase()}-${office.county.toLowerCase()}-${office.department_name.toLowerCase()}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

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

function formatStructuredAddress(postalAddress?: PostalAddressData): string {
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
  const addressMatch = snippet.match(/(\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Way|Lane|Ln),?\s+[A-Za-z\s]+,?\s+[A-Z]{2}\s+\d{5})/i)
  return addressMatch ? addressMatch[1] : ''
}

function extractPhoneFromSnippet(snippet: string): string {
  const phoneMatch = snippet.match(/(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i)
  return phoneMatch ? phoneMatch[1] : ''
}

function extractEmailFromSnippet(snippet: string): string {
  const emailMatch = snippet.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
  return emailMatch ? emailMatch[1] : ''
}

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
