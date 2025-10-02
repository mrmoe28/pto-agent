import * as cheerio from 'cheerio'

interface CrawlConfig {
  maxDepth: number
  maxPages: number
  followExternal: boolean
  targetPaths: string[]
  extractPDFs: boolean
}

interface CrawledData {
  url: string
  title: string
  content: string
  links: string[]
  pdfs: string[]
  forms: FormData[]
  tables: TableData[]
  lists: string[][]
  metadata: {
    crawlDepth: number
    timestamp: string
    dataQuality: number
  }
}

interface FormData {
  action: string
  method: string
  fields: FormField[]
}

interface FormField {
  name: string
  type: string
  label?: string
  required: boolean
  options?: string[]
}

interface TableData {
  headers: string[]
  rows: string[][]
  caption?: string
}

interface PermitRequirements {
  generalInstructions: string[]
  stepByStep: string[]
  requiredDocuments: string[]
  fees: FeeStructure[]
  timelines: Timeline[]
  contacts: Contact[]
  onlineForms: string[]
  downloadableForms: string[]
}

interface FeeStructure {
  permitType: string
  baseFee?: number
  variableFee?: {
    unit: string
    amount: number
    description: string
  }
  description: string
  applicableTo?: string[]
}

interface Timeline {
  permitType: string
  minDays?: number
  maxDays?: number
  averageDays?: number
  description: string
  conditions?: string[]
}

interface Contact {
  name?: string
  title?: string
  department?: string
  phone?: string
  email?: string
  hours?: string
}

/**
 * Deep crawler that extracts comprehensive permit data from municipal websites
 */
export class DeepPermitCrawler {
  private visited = new Set<string>()
  private crawledData: CrawledData[] = []

  private electricalKeywords = [
    'electrical', 'electrical permit', 'electrical application',
    'solar', 'photovoltaic', 'pv', 'solar permit', 'solar electrical',
    'renewable', 'panel', 'interconnection', 'net metering',
    'wiring', 'electrical installation', 'electrical service'
  ]

  private targetPaths = [
    '/permit', '/electrical', '/electrical-permit', '/electrical-application',
    '/solar', '/solar-permit', '/renewable', '/energy',
    '/application', '/form', '/fee', '/requirement', '/instruction',
    '/how-to', '/guide', '/checklist', '/process', '/timeline',
    '/contact', '/staff', '/department', '/submit', '/apply'
  ]

  async crawlSite(startUrl: string, config: CrawlConfig): Promise<PermitRequirements> {
    this.visited.clear()
    this.crawledData = []

    await this.crawlRecursive(startUrl, 0, config)

    // Aggregate and structure all crawled data
    return this.aggregatePermitData()
  }

  private async crawlRecursive(
    url: string,
    depth: number,
    config: CrawlConfig
  ): Promise<void> {
    // Stop conditions
    if (depth > config.maxDepth) return
    if (this.visited.size >= config.maxPages) return
    if (this.visited.has(url)) return

    this.visited.add(url)

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PermitBot/2.0)'
        }
      })

      if (!response.ok) return

      const html = await response.text()
      const $ = cheerio.load(html)

      // Extract all data from this page
      const pageData = this.extractPageData($, url, depth)
      this.crawledData.push(pageData)

      // Find relevant links to follow
      const links = this.findRelevantLinks($, url, config)

      // Recursively crawl relevant pages
      for (const link of links) {
        if (this.visited.size < config.maxPages) {
          await this.crawlRecursive(link, depth + 1, config)
        }
      }

    } catch (error) {
      console.error(`Error crawling ${url}:`, error)
    }
  }

  private extractPageData($: cheerio.CheerioAPI, url: string, depth: number): CrawledData {
    return {
      url,
      title: $('title').text().trim(),
      content: this.extractMainContent($),
      links: this.extractLinks($, url),
      pdfs: this.extractPDFLinks($),
      forms: this.extractForms($),
      tables: this.extractTables($),
      lists: this.extractLists($),
      metadata: {
        crawlDepth: depth,
        timestamp: new Date().toISOString(),
        dataQuality: this.assessDataQuality($)
      }
    }
  }

  private extractMainContent($: cheerio.CheerioAPI): string {
    // Remove navigation, headers, footers, ads
    $('nav, header, footer, .nav, .menu, .sidebar, .advertisement, script, style').remove()

    // Get main content area
    const mainSelectors = ['main', 'article', '.content', '.main-content', '#content', '#main']

    for (const selector of mainSelectors) {
      const main = $(selector)
      if (main.length > 0) {
        return main.text().trim()
      }
    }

    // Fallback to body
    return $('body').text().trim()
  }

  private extractLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const links: string[] = []
    const base = new URL(baseUrl)

    $('a').each((_, elem): void => {
      const href = $(elem).attr('href')
      if (!href) return

      try {
        const fullUrl = href.startsWith('http')
          ? href
          : new URL(href, base.origin).toString()

        // Only same-origin links
        const linkUrl = new URL(fullUrl)
        if (linkUrl.origin === base.origin) {
          links.push(fullUrl)
        }
      } catch {
        // Invalid URL, skip
      }
    })

    return [...new Set(links)]
  }

  private extractPDFLinks($: cheerio.CheerioAPI): string[] {
    const pdfs: string[] = []

    $('a').each((_, elem): void => {
      const href = $(elem).attr('href')
      const text = $(elem).text().toLowerCase()
      const title = $(elem).attr('title')?.toLowerCase() || ''
      const combinedText = `${text} ${title} ${href}`.toLowerCase()

      if (href && href.toLowerCase().endsWith('.pdf')) {
        // Only include PDFs that are likely to be electrical permit applications
        const isElectricalPermit = this.electricalKeywords.some(keyword =>
          combinedText.includes(keyword)
        ) && (combinedText.includes('permit') ||
              combinedText.includes('application') ||
              combinedText.includes('form'))

        const isExcluded = combinedText.includes('ordinance') ||
                          combinedText.includes('code') ||
                          combinedText.includes('regulation') ||
                          combinedText.includes('policy') ||
                          combinedText.includes('manual') ||
                          combinedText.includes('guide') ||
                          combinedText.includes('instruction') ||
                          combinedText.includes('checklist') ||
                          combinedText.includes('requirement') ||
                          combinedText.includes('fee schedule') ||
                          combinedText.includes('calendar') ||
                          combinedText.includes('meeting') ||
                          combinedText.includes('minutes') ||
                          combinedText.includes('agenda') ||
                          combinedText.includes('report') ||
                          combinedText.includes('brochure')

        if (isElectricalPermit && !isExcluded) {
          pdfs.push(href)
        }
      }
    })

    return pdfs
  }

  private extractForms($: cheerio.CheerioAPI): FormData[] {
    const forms: FormData[] = []

    $('form').each((_, elem): void => {
      const $form = $(elem)
      const action = $form.attr('action') || ''
      const method = $form.attr('method') || 'get'

      const fields: FormField[] = []

      $form.find('input, select, textarea').each((_, field): void => {
        const $field = $(field)
        const name = $field.attr('name') || ''
        const tagName = $field.prop('tagName')
        const type = $field.attr('type') || (typeof tagName === 'string' ? tagName.toLowerCase() : 'text')
        const required = $field.attr('required') !== undefined

        // Try to find label
        const id = $field.attr('id')
        const label = id ? $(`label[for="${id}"]`).text().trim() : ''

        // For select, get options
        const options = $field.is('select')
          ? $field.find('option').map((_, opt) => $(opt).text().trim()).get()
          : undefined

        if (name) {
          fields.push({ name, type, label, required, options })
        }
      })

      if (fields.length > 0) {
        forms.push({ action, method, fields })
      }
    })

    return forms
  }

  private extractTables($: cheerio.CheerioAPI): TableData[] {
    const tables: TableData[] = []

    $('table').each((_, elem): void => {
      const $table = $(elem)
      const caption = $table.find('caption').text().trim()

      const headers: string[] = []
      $table.find('thead th, tr:first-child th').each((_, th): void => {
        headers.push($(th).text().trim())
      })

      const rows: string[][] = []
      $table.find('tbody tr, tr').each((_, tr): void => {
        const cells: string[] = []
        $(tr).find('td').each((_, td): void => {
          cells.push($(td).text().trim())
        })
        if (cells.length > 0) {
          rows.push(cells)
        }
      })

      if (headers.length > 0 || rows.length > 0) {
        tables.push({ headers, rows, caption })
      }
    })

    return tables
  }

  private extractLists($: cheerio.CheerioAPI): string[][] {
    const lists: string[][] = []

    $('ul, ol').each((_, elem): void => {
      const items: string[] = []
      $(elem).find('li').each((_, li): void => {
        const text = $(li).clone().children().remove().end().text().trim()
        if (text) items.push(text)
      })
      if (items.length > 0) {
        lists.push(items)
      }
    })

    return lists
  }

  private findRelevantLinks($: cheerio.CheerioAPI, baseUrl: string, config: CrawlConfig): string[] {
    const links: string[] = []
    const base = new URL(baseUrl)

    $('a').each((_, elem): void => {
      const href = $(elem).attr('href')
      const text = $(elem).text().toLowerCase()

      if (!href) return

      // Check if link text or href contains electrical permit keywords
      const isRelevant =
        this.electricalKeywords.some(kw => text.includes(kw) || href.toLowerCase().includes(kw)) ||
        this.targetPaths.some(path => href.includes(path))

      if (isRelevant) {
        try {
          const fullUrl = href.startsWith('http')
            ? href
            : new URL(href, base.origin).toString()

          const linkUrl = new URL(fullUrl)
          if (linkUrl.origin === base.origin || config.followExternal) {
            links.push(fullUrl)
          }
        } catch {
          // Invalid URL
        }
      }
    })

    return [...new Set(links)]
  }

  private assessDataQuality($: cheerio.CheerioAPI): number {
    let score = 0
    const maxScore = 10

    // Has forms
    if ($('form').length > 0) score += 2

    // Has tables (likely fee schedules)
    if ($('table').length > 0) score += 2

    // Has lists (likely requirements)
    if ($('ul, ol').length > 0) score += 1

    // Has contact info
    if ($('body').text().match(/\(\d{3}\)\s*\d{3}-\d{4}|\d{3}-\d{3}-\d{4}/)) score += 1

    // Has email
    if ($('body').text().match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) score += 1

    // Has PDF links
    if ($('a[href$=".pdf"]').length > 0) score += 1

    // Has electrical/solar keywords
    const text = $('body').text().toLowerCase()
    if (this.electricalKeywords.some(kw => text.includes(kw))) score += 2

    return score / maxScore
  }

  private aggregatePermitData(): PermitRequirements {
    const requirements: PermitRequirements = {
      generalInstructions: [],
      stepByStep: [],
      requiredDocuments: [],
      fees: [],
      timelines: [],
      contacts: [],
      onlineForms: [],
      downloadableForms: []
    }

    // Extract from all crawled pages
    for (const page of this.crawledData) {
      // Extract instructions from lists
      for (const list of page.lists) {
        if (this.isInstructionList(list)) {
          requirements.stepByStep.push(...list)
        } else if (this.isDocumentList(list)) {
          requirements.requiredDocuments.push(...list)
        }
      }

      // Extract fees from tables
      for (const table of page.tables) {
        const fees = this.extractFeesFromTable(table)
        requirements.fees.push(...fees)
      }

      // Extract timelines from content
      const timelines = this.extractTimelinesFromContent(page.content)
      requirements.timelines.push(...timelines)

      // Extract contacts
      const contacts = this.extractContactsFromContent(page.content)
      requirements.contacts.push(...contacts)

      // Collect forms
      for (const form of page.forms) {
        if (form.action) {
          requirements.onlineForms.push(form.action)
        }
      }

      // Collect PDFs
      requirements.downloadableForms.push(...page.pdfs)
    }

    // Deduplicate
    requirements.generalInstructions = [...new Set(requirements.generalInstructions)]
    requirements.stepByStep = [...new Set(requirements.stepByStep)]
    requirements.requiredDocuments = [...new Set(requirements.requiredDocuments)]
    requirements.onlineForms = [...new Set(requirements.onlineForms)]
    requirements.downloadableForms = [...new Set(requirements.downloadableForms)]

    return requirements
  }

  private isInstructionList(list: string[]): boolean {
    const text = list.join(' ').toLowerCase()
    return text.includes('step') || text.includes('how to') ||
           text.includes('process') || text.includes('apply')
  }

  private isDocumentList(list: string[]): boolean {
    const text = list.join(' ').toLowerCase()
    return text.includes('document') || text.includes('required') ||
           text.includes('submit') || text.includes('provide')
  }

  private extractFeesFromTable(table: TableData): FeeStructure[] {
    const fees: FeeStructure[] = []

    // Check if this is a fee table
    const headerText = table.headers.join(' ').toLowerCase()
    if (!headerText.includes('fee') && !headerText.includes('cost') && !headerText.includes('price')) {
      return fees
    }

    for (const row of table.rows) {
      const permitType = row[0] || ''
      const feeText = row[1] || ''

      // Parse fee amount
      const match = feeText.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/)
      const baseFee = match ? parseFloat(match[1].replace(/,/g, '')) : undefined

      // Check for variable fees (per kW, per SF, etc.)
      const variableMatch = feeText.match(/\$(\d+(?:\.\d{2})?)\s*(?:per|\/)\s*(\w+)/i)
      const variableFee = variableMatch ? {
        amount: parseFloat(variableMatch[1]),
        unit: variableMatch[2],
        description: feeText
      } : undefined

      if (permitType && (baseFee || variableFee)) {
        fees.push({
          permitType,
          baseFee,
          variableFee,
          description: feeText
        })
      }
    }

    return fees
  }

  private extractTimelinesFromContent(content: string): Timeline[] {
    const timelines: Timeline[] = []

    // Pattern: "5-10 business days", "2 weeks", "30 days"
    const patterns = [
      /(\d+)\s*(?:to|-)\s*(\d+)\s*(business\s+)?days?/gi,
      /(\d+)\s*(?:to|-)\s*(\d+)\s*weeks?/gi,
      /within\s+(\d+)\s*(business\s+)?days?/gi,
      /(\d+)\s*day\s*(?:review|processing|turnaround)/gi
    ]

    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const timeline: Timeline = {
          permitType: 'general',
          description: match[0],
          minDays: parseInt(match[1]),
          maxDays: match[2] ? parseInt(match[2]) : undefined
        }

        // Check if specific to electrical/solar
        const context = content.slice(Math.max(0, match.index - 100), match.index + 100)
        if (this.electricalKeywords.some(kw => context.toLowerCase().includes(kw))) {
          timeline.permitType = 'electrical'
        }

        timelines.push(timeline)
      }
    }

    return timelines
  }

  private extractContactsFromContent(content: string): Contact[] {
    const contacts: Contact[] = []

    // Extract phone numbers with context
    const phonePattern = /(?:phone|call|contact):?\s*(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/gi
    let match
    while ((match = phonePattern.exec(content)) !== null) {
      contacts.push({
        phone: match[1]
      })
    }

    // Extract emails with context
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
    while ((match = emailPattern.exec(content)) !== null) {
      // Find if there's a name or title nearby
      const context = content.slice(Math.max(0, match.index - 50), match.index)
      const nameMatch = context.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/)

      contacts.push({
        email: match[1],
        name: nameMatch ? nameMatch[1] : undefined
      })
    }

    return contacts
  }
}

export async function deepCrawlPermitOffice(websiteUrl: string): Promise<PermitRequirements> {
  const crawler = new DeepPermitCrawler()

  const config: CrawlConfig = {
    maxDepth: 4,
    maxPages: 15,
    followExternal: false,
    targetPaths: [
      '/permit', '/electrical', '/electrical-permit', '/solar',
      '/solar-permit', '/renewable', '/application', '/form',
      '/fee', '/requirement'
    ],
    extractPDFs: true
  }

  return await crawler.crawlSite(websiteUrl, config)
}

// Export types for use in other modules
export type {
  CrawlConfig,
  CrawledData,
  FormData,
  FormField,
  TableData,
  PermitRequirements,
  FeeStructure,
  Timeline,
  Contact
}
