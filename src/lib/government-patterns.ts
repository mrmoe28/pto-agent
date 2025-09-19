// Enhanced government website patterns and specialized scrapers for different types of permit offices
import * as cheerio from 'cheerio';

export interface GovernmentPattern {
  type: 'city' | 'county' | 'state' | 'special_district'
  urlPatterns: string[]
  departmentPatterns: string[]
  serviceIndicators: string[]
  contactSelectors: string[]
  formSelectors: string[]
  hoursSelectors: string[]
}

export const GOVERNMENT_PATTERNS: GovernmentPattern[] = [
  // City Government Patterns
  {
    type: 'city',
    urlPatterns: [
      '*.city.*.gov',
      '*.ci.*.gov',
      'www.*.gov',
      '*.municipal.*.gov'
    ],
    departmentPatterns: [
      'building department',
      'planning department',
      'development services',
      'community development',
      'code enforcement',
      'building & safety'
    ],
    serviceIndicators: [
      'building permits',
      'permit applications',
      'inspections',
      'plan review',
      'zoning',
      'variances'
    ],
    contactSelectors: [
      '.contact-info',
      '.department-contact',
      '.office-hours',
      '#contact',
      '.address',
      '.phone'
    ],
    formSelectors: [
      'a[href*=".pdf"]',
      'a[href*="form"]',
      'a[href*="application"]',
      '.forms-list a',
      '.downloads a'
    ],
    hoursSelectors: [
      '.hours',
      '.office-hours',
      '.business-hours',
      '.schedule',
      '.operating-hours'
    ]
  },

  // County Government Patterns
  {
    type: 'county',
    urlPatterns: [
      '*.county.*.gov',
      '*.co.*.gov',
      '*county*.gov'
    ],
    departmentPatterns: [
      'building department',
      'planning & development',
      'development services',
      'community development',
      'building & zoning',
      'planning & zoning'
    ],
    serviceIndicators: [
      'building permits',
      'unincorporated areas',
      'county permits',
      'rural development',
      'subdivision review'
    ],
    contactSelectors: [
      '.county-contact',
      '.department-info',
      '.office-location',
      '.contact-us'
    ],
    formSelectors: [
      'a[href*="permit"]',
      'a[href*="application"]',
      'a[href*=".pdf"]',
      '.permit-forms a'
    ],
    hoursSelectors: [
      '.county-hours',
      '.office-hours',
      '.hours-operation'
    ]
  },

  // State Government Patterns
  {
    type: 'state',
    urlPatterns: [
      '*.state.*.gov',
      '*.ga.gov',
      'dca.ga.gov',
      'georgia.gov'
    ],
    departmentPatterns: [
      'community affairs',
      'state fire marshal',
      'environmental protection',
      'transportation'
    ],
    serviceIndicators: [
      'state permits',
      'environmental permits',
      'fire safety',
      'accessibility compliance'
    ],
    contactSelectors: [
      '.state-contact',
      '.agency-contact',
      '.regional-office'
    ],
    formSelectors: [
      'a[href*="state"]',
      'a[href*="permit"]',
      'a[href*="application"]'
    ],
    hoursSelectors: [
      '.state-hours',
      '.agency-hours'
    ]
  }
]

export class GovernmentPatternMatcher {

  // Identify government website type and extract relevant patterns
  identifyGovernmentType(url: string, title: string, content: string): GovernmentPattern | null {
    const lowerUrl = url.toLowerCase()
    const lowerTitle = title.toLowerCase()
    const lowerContent = content.toLowerCase()

    for (const pattern of GOVERNMENT_PATTERNS) {
      // Check URL patterns
      const urlMatch = pattern.urlPatterns.some(urlPattern => {
        const regex = new RegExp(urlPattern.replace(/\*/g, '.*'))
        return regex.test(lowerUrl)
      })

      // Check department patterns in title/content
      const deptMatch = pattern.departmentPatterns.some(dept =>
        lowerTitle.includes(dept) || lowerContent.includes(dept)
      )

      // Check service indicators
      const serviceMatch = pattern.serviceIndicators.some(service =>
        lowerContent.includes(service)
      )

      if (urlMatch || (deptMatch && serviceMatch)) {
        return pattern
      }
    }

    // Default fallback for .gov domains
    if (lowerUrl.includes('.gov')) {
      return {
        type: 'city', // Default assumption
        urlPatterns: [],
        departmentPatterns: [],
        serviceIndicators: [],
        contactSelectors: ['.contact', '.phone', '.email', '.address'],
        formSelectors: ['a[href*=".pdf"]', 'a[href*="form"]'],
        hoursSelectors: ['.hours', '.schedule']
      }
    }

    return null
  }

  // Extract specialized information based on government type
  extractSpecializedInfo(pattern: GovernmentPattern, $: cheerio.CheerioAPI, url: string): Record<string, unknown> {
    const specializedInfo = {
      governmentType: pattern.type,
      extractedData: {
        contacts: this.extractContactsByPattern(pattern, $),
        forms: this.extractFormsByPattern(pattern, $, url),
        hours: this.extractHoursByPattern(pattern, $),
        services: this.extractServicesByType(pattern.type, $)
      }
    }

    return specializedInfo
  }

  private extractContactsByPattern(pattern: GovernmentPattern, $: cheerio.CheerioAPI): Record<string, string> {
    const contacts: Record<string, string> = {}

    for (const selector of pattern.contactSelectors) {
      try {
        const element = $(selector)
        if (element.length > 0) {
          const text = element.text().trim()

          // Extract phone numbers
          const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
          if (phoneMatch) contacts.phone = phoneMatch[0]

          // Extract email addresses
          const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
          if (emailMatch) contacts.email = emailMatch[0]

          // Extract addresses
          const addressMatch = text.match(/\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd)[\s,]+[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}/)
          if (addressMatch) contacts.address = addressMatch[0]
        }
      } catch (error) {
        console.error(`Error extracting contact with selector ${selector}:`, error)
      }
    }

    return contacts
  }

  private extractFormsByPattern(pattern: GovernmentPattern, $: cheerio.CheerioAPI, baseUrl: string): Array<Record<string, string>> {
    const forms: Array<Record<string, string>> = []

    for (const selector of pattern.formSelectors) {
      try {
        $(selector).each((index: number, element) => {
          const href = $(element).attr('href')
          const text = $(element).text().trim()

          if (href && text) {
            const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).toString()

            forms.push({
              name: text,
              url: fullUrl,
              type: this.getFormType(href),
              category: this.categorizeForm(text)
            })
          }
        })
      } catch (error) {
        console.error(`Error extracting forms with selector ${selector}:`, error)
      }
    }

    return forms
  }

  private extractHoursByPattern(pattern: GovernmentPattern, $: cheerio.CheerioAPI): Record<string, string> {
    const hours: Record<string, string> = {}

    for (const selector of pattern.hoursSelectors) {
      try {
        const element = $(selector)
        if (element.length > 0) {
          const text = element.text()
          const extractedHours = this.parseBusinessHours(text)
          Object.assign(hours, extractedHours)
        }
      } catch (error) {
        console.error(`Error extracting hours with selector ${selector}:`, error)
      }
    }

    return hours
  }

  private extractServicesByType(type: string, $: cheerio.CheerioAPI): string[] {
    const services: string[] = []
    const bodyText = $('body').text().toLowerCase()

    const servicesByType = {
      city: [
        'building permits',
        'electrical permits',
        'plumbing permits',
        'mechanical permits',
        'zoning variances',
        'business licenses',
        'sign permits',
        'fence permits'
      ],
      county: [
        'building permits',
        'septic permits',
        'well permits',
        'driveway permits',
        'flood permits',
        'agricultural permits',
        'subdivision review',
        'environmental review'
      ],
      state: [
        'fire safety permits',
        'environmental permits',
        'accessibility compliance',
        'elevator permits',
        'pressure vessel permits',
        'underground storage tanks'
      ]
    }

    const typeServices = servicesByType[type as keyof typeof servicesByType] || []

    for (const service of typeServices) {
      if (bodyText.includes(service.toLowerCase())) {
        services.push(service)
      }
    }

    return services
  }

  private getFormType(href: string): string {
    const lowerHref = href.toLowerCase()

    if (lowerHref.includes('.pdf')) return 'PDF'
    if (lowerHref.includes('.doc')) return 'DOC'
    if (lowerHref.includes('.xls')) return 'XLS'

    return 'LINK'
  }

  private categorizeForm(text: string): string {
    const lowerText = text.toLowerCase()

    if (lowerText.includes('building')) return 'building'
    if (lowerText.includes('electrical')) return 'electrical'
    if (lowerText.includes('plumbing')) return 'plumbing'
    if (lowerText.includes('mechanical') || lowerText.includes('hvac')) return 'mechanical'
    if (lowerText.includes('zoning')) return 'zoning'
    if (lowerText.includes('planning')) return 'planning'
    if (lowerText.includes('sign')) return 'signage'
    if (lowerText.includes('business')) return 'business'

    return 'other'
  }

  private parseBusinessHours(text: string): Record<string, string> {
    const hours: Record<string, string> = {}
    const lines = text.split('\n')

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const dayAbbrevs = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

    for (const line of lines) {
      const lowerLine = line.toLowerCase()

      for (let i = 0; i < days.length; i++) {
        const day = days[i]
        const abbrev = dayAbbrevs[i]

        if (lowerLine.includes(day) || lowerLine.includes(abbrev)) {
          const timeMatch = line.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?(?:\s*[-–]\s*\d{1,2}:\d{2}\s*(?:am|pm)?)?)/i)
          if (timeMatch) {
            hours[day] = timeMatch[1].trim()
          } else if (lowerLine.includes('closed')) {
            hours[day] = 'Closed'
          }
        }
      }
    }

    return hours
  }
}

// Common government website structures and navigation patterns
export const COMMON_GOV_PATHS = [
  // Building/Permit specific paths
  '/building',
  '/permits',
  '/building-permits',
  '/development',
  '/planning',
  '/zoning',
  '/code-enforcement',
  '/inspections',

  // Department paths
  '/departments/building',
  '/departments/planning',
  '/departments/development',
  '/services/permits',
  '/services/building',

  // Common page names
  '/permit-center',
  '/forms-and-applications',
  '/online-services',
  '/business-services',
  '/development-services',

  // Document/form paths
  '/forms',
  '/applications',
  '/documents',
  '/downloads',
  '/resources'
]

// Enhanced search terms for government websites
export const ENHANCED_SEARCH_TERMS = {
  building: [
    'building permits',
    'construction permits',
    'building department',
    'building codes',
    'building inspection',
    'residential permits',
    'commercial permits',
    'permit applications'
  ],
  planning: [
    'planning department',
    'city planning',
    'zoning permits',
    'land use',
    'site plan review',
    'subdivision',
    'development review',
    'planning commission'
  ],
  permits: [
    'permit office',
    'permit center',
    'online permits',
    'permit applications',
    'permit tracking',
    'permit fees',
    'permit forms',
    'permit requirements'
  ],
  services: [
    'development services',
    'community development',
    'building services',
    'planning services',
    'permit services',
    'code enforcement',
    'inspection services'
  ]
}