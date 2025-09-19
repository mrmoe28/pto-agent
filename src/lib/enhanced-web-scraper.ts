import * as cheerio from 'cheerio';
import { GovernmentPatternMatcher, COMMON_GOV_PATHS } from './government-patterns';

type PlaywrightChromium = typeof import('playwright')['chromium'];

export interface DetailedOfficeInfo {
  // Basic Information
  officeName: string;
  department: string;
  jurisdiction: 'city' | 'county' | 'state' | 'special_district';

  // Contact Details
  address: string;
  phone: string;
  email: string;
  website: string;

  // Location
  city: string;
  county: string;
  state: string;
  zipCode?: string;

  // Hours (detailed by day)
  businessHours: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };

  // Services Offered
  services: {
    buildingPermits: boolean;
    electricalPermits: boolean;
    plumbingPermits: boolean;
    mechanicalPermits: boolean;
    zoningPermits: boolean;
    planningReview: boolean;
    inspections: boolean;
    siteInspections: boolean;
    landDevelopment: boolean;
    subdivisionReview: boolean;
    varianceApplications: boolean;
    specialEventPermits: boolean;
    signPermits: boolean;
    demolitionPermits: boolean;
    fireDepartmentReview: boolean;
    healthDepartmentReview: boolean;
    environmentalReview: boolean;
  };

  // Online Services
  onlineServices: {
    onlineApplications: boolean;
    onlinePayments: boolean;
    permitTracking: boolean;
    schedulingInspections: boolean;
    documentSubmission: boolean;
    statusUpdates: boolean;
    renewals: boolean;
    appeals: boolean;
  };

  // Portal Information
  portals: {
    permitsPortal?: string;
    paymentsPortal?: string;
    inspectionsPortal?: string;
    planningPortal?: string;
    citizenPortal?: string;
  };

  // Fee Information
  feeStructure: {
    buildingPermitFees?: string;
    inspectionFees?: string;
    planReviewFees?: string;
    expeditedServiceFees?: string;
    feeScheduleUrl?: string;
  };

  // Staff Information
  staffContacts: {
    buildingOfficial?: { name: string; email?: string; phone?: string };
    chiefInspector?: { name: string; email?: string; phone?: string };
    planReviewer?: { name: string; email?: string; phone?: string };
    zoningAdministrator?: { name: string; email?: string; phone?: string };
    permitCoordinator?: { name: string; email?: string; phone?: string };
  };

  // Forms and Documents
  forms: {
    building: Array<{ name: string; url: string; type: string }>;
    electrical: Array<{ name: string; url: string; type: string }>;
    plumbing: Array<{ name: string; url: string; type: string }>;
    mechanical: Array<{ name: string; url: string; type: string }>;
    zoning: Array<{ name: string; url: string; type: string }>;
    planning: Array<{ name: string; url: string; type: string }>;
    other: Array<{ name: string; url: string; type: string }>;
  };

  // Process Information
  processInfo: {
    permitProcessSteps?: string[];
    typicalProcessingTime?: string;
    requirementsChecklist?: string[];
    inspectionTypes?: string[];
    appealProcess?: string;
  };

  // Additional Information
  additionalInfo: {
    publicNoticeRequirements?: string;
    neighborNotification?: string;
    meetingSchedules?: string;
    boardMeetings?: Array<{ type: string; schedule: string; location?: string }>;
    specialRequirements?: string[];
    emergencyContacts?: Array<{ type: string; phone: string; hours?: string }>;
  };

  // Data Quality Metrics
  metadata: {
    lastScraped: string;
    dataCompleteness: number; // 0-100 percentage
    sourceReliability: 'high' | 'medium' | 'low';
    validationStatus: 'verified' | 'unverified' | 'outdated';
    scrapingMethod: 'static' | 'dynamic' | 'api';
  };
}

export class EnhancedWebScraper {
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT = 30000;
  private readonly patternMatcher = new GovernmentPatternMatcher();
  private playwrightChromium: PlaywrightChromium | null = null;
  private warnedAboutChromium = false;
  private dynamicDisabledLogged = false;

  // Enhanced patterns for data extraction
  private readonly PATTERNS = {
    phone: /(?:\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})|(?:\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g,
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    address: /\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Way|Lane|Ln|Circle|Cir|Court|Ct|Place|Pl),?\s*[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}(?:-\d{4})?/gi,
    zipCode: /\b\d{5}(?:-\d{4})?\b/g,
    hours: /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)[\s:,-]*(\d{1,2}:\d{2}\s*(?:am|pm)?(?:\s*[-–]\s*\d{1,2}:\d{2}\s*(?:am|pm)?)?)/gi,
    url: /https?:\/\/(?:[-\w.])+(?:[:\d]+)?(?:\/(?:[\w._~!$&'()*+,;=:@-]|%[\da-f]{2})*)*(?:\?(?:[\w._~!$&'()*+,;=:@/?-]|%[\da-f]{2})*)?(?:#(?:[\w._~!$&'()*+,;=:@/?-]|%[\da-f]{2})*)?/gi,
    fees: /\$\d+(?:\.\d{2})?(?:\s*(?:per|each|base|minimum|maximum|min|max))?/gi
  };

  private readonly SERVICE_KEYWORDS = {
    buildingPermits: ['building permit', 'construction permit', 'new construction', 'addition', 'renovation', 'remodel'],
    electricalPermits: ['electrical permit', 'electrical work', 'wiring', 'electrical service', 'electrical installation'],
    plumbingPermits: ['plumbing permit', 'plumbing work', 'water heater', 'sewer', 'water line', 'plumbing installation'],
    mechanicalPermits: ['mechanical permit', 'hvac', 'heating', 'cooling', 'ventilation', 'air conditioning'],
    zoningPermits: ['zoning permit', 'zoning application', 'variance', 'conditional use', 'rezoning'],
    planningReview: ['planning review', 'site plan', 'subdivision', 'land development', 'planning approval'],
    inspections: ['inspection', 'building inspection', 'final inspection', 'rough inspection', 'code compliance'],
    siteInspections: ['site inspection', 'grading inspection', 'foundation inspection', 'framing inspection'],
    landDevelopment: ['land development', 'subdivision', 'site development', 'infrastructure'],
    subdivisionReview: ['subdivision', 'subdivision review', 'plat approval', 'land division'],
    varianceApplications: ['variance', 'zoning variance', 'use variance', 'area variance'],
    specialEventPermits: ['special event', 'event permit', 'temporary use', 'festival permit'],
    signPermits: ['sign permit', 'signage permit', 'billboard', 'advertising sign'],
    demolitionPermits: ['demolition', 'demolition permit', 'building demolition', 'structure removal'],
    fireDepartmentReview: ['fire department', 'fire review', 'fire safety', 'fire code'],
    healthDepartmentReview: ['health department', 'health review', 'septic', 'well permit'],
    environmentalReview: ['environmental review', 'environmental impact', 'stormwater', 'wetlands']
  };

  private readonly ONLINE_SERVICE_KEYWORDS = {
    onlineApplications: ['online application', 'apply online', 'digital application', 'e-permit'],
    onlinePayments: ['online payment', 'pay online', 'e-payment', 'digital payment', 'credit card'],
    permitTracking: ['permit tracking', 'track permit', 'permit status', 'application status'],
    schedulingInspections: ['schedule inspection', 'inspection scheduling', 'book inspection'],
    documentSubmission: ['document upload', 'file upload', 'submit documents', 'digital submission'],
    statusUpdates: ['status update', 'notification', 'email updates', 'text alerts'],
    renewals: ['permit renewal', 'license renewal', 'renew permit'],
    appeals: ['appeal', 'appeal process', 'hearing', 'board of appeals']
  };

  async scrapeDetailedOfficeInfo(
    websiteUrl: string,
    options?: { allowDynamic?: boolean }
  ): Promise<DetailedOfficeInfo | null> {
    try {
      console.log(`Enhanced scraping started for: ${websiteUrl}`);

      // Try static scraping first
      const staticInfo = await this.scrapeStaticContent(websiteUrl);

      // Determine whether dynamic scraping should run
      const shouldRunDynamic = options?.allowDynamic ?? process.env.ENABLE_DYNAMIC_SCRAPER === 'true';

      let dynamicInfo: Partial<DetailedOfficeInfo> = {};
      if (shouldRunDynamic) {
        dynamicInfo = await this.scrapeDynamicContent(websiteUrl);
      } else {
        if (!this.dynamicDisabledLogged) {
          console.log('Dynamic scraping disabled via configuration. Skipping Playwright run.');
          this.dynamicDisabledLogged = true;
        }
      }

      // Crawl related government pages for more comprehensive data
      const relatedPagesInfo = await this.scrapeRelatedGovernmentPages(websiteUrl);

      // Merge all information sources
      const mergedInfo = this.mergeOfficeInfo(staticInfo, dynamicInfo, relatedPagesInfo);

      // Calculate data completeness
      mergedInfo.metadata.dataCompleteness = this.calculateDataCompleteness(mergedInfo);
      mergedInfo.metadata.lastScraped = new Date().toISOString();

      console.log(`Enhanced scraping completed. Data completeness: ${mergedInfo.metadata.dataCompleteness}%`);

      return mergedInfo;

    } catch (error) {
      console.error('Enhanced scraping failed:', error);
      return null;
    }
  }

  private async scrapeStaticContent(websiteUrl: string): Promise<Partial<DetailedOfficeInfo>> {
    try {
      const response = await fetch(websiteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PermitOfficeBot/2.0; +https://permitoffices.com/bot)'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      return {
        website: websiteUrl,
        officeName: this.extractOfficeName($),
        department: this.extractDepartment($),
        address: this.extractAddress($),
        phone: this.extractPhone($),
        email: this.extractEmail($),
        businessHours: this.extractBusinessHours($),
        services: this.extractServices($),
        onlineServices: this.extractOnlineServices($),
        portals: this.extractPortals($),
        feeStructure: this.extractFeeStructure($),
        staffContacts: this.extractStaffContacts($),
        forms: this.extractForms($, websiteUrl),
        processInfo: this.extractProcessInfo($),
        additionalInfo: this.extractAdditionalInfo($),
        metadata: {
          lastScraped: new Date().toISOString(),
          dataCompleteness: 0,
          scrapingMethod: 'static',
          sourceReliability: 'medium',
          validationStatus: 'unverified'
        }
      };

    } catch (error) {
      console.error('Static scraping failed:', error);
      return { metadata: { lastScraped: new Date().toISOString(), dataCompleteness: 0, scrapingMethod: 'static', sourceReliability: 'low', validationStatus: 'unverified' } };
    }
  }

  private async scrapeDynamicContent(websiteUrl: string): Promise<Partial<DetailedOfficeInfo>> {
    let browser;
    try {
      const chromium = await this.getChromium();
      if (!chromium) {
        return {};
      }

      browser = await chromium.launch({
        headless: true,
        timeout: this.TIMEOUT
      });

      const page = await browser.newPage();
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (compatible; PermitOfficeBot/2.0; +https://permitoffices.com/bot)'
      });

      // Navigate and wait for content
      await page.goto(websiteUrl, {
        waitUntil: 'networkidle',
        timeout: this.TIMEOUT
      });

      // Wait for dynamic content to load
      await page.waitForTimeout(3000);

      // Extract comprehensive information
      const dynamicData = await page.evaluate(() => {
        const data: Record<string, unknown> = {};

        // Extract all text content
        data.fullText = document.body.innerText;

        // Extract all links with context
        data.links = Array.from(document.querySelectorAll('a')).map(a => ({
          href: a.href,
          text: a.textContent?.trim() || '',
          title: a.title || '',
          context: a.parentElement?.textContent?.trim() || ''
        }));

        // Extract contact information from various sources
        data.contactSections = Array.from(document.querySelectorAll('div, section, article')).map(el => ({
          text: el.textContent?.trim() || '',
          className: el.className,
          id: el.id
        })).filter(el =>
          el.text.toLowerCase().includes('contact') ||
          el.text.toLowerCase().includes('phone') ||
          el.text.toLowerCase().includes('email') ||
          el.text.toLowerCase().includes('address') ||
          el.text.toLowerCase().includes('office') ||
          el.text.toLowerCase().includes('hours')
        );

        // Extract form elements and inputs
        data.forms = Array.from(document.querySelectorAll('form')).map(form => ({
          action: form.action,
          method: form.method,
          inputs: Array.from(form.querySelectorAll('input, select, textarea')).map(input => ({
            name: (input as HTMLInputElement).name,
            type: (input as HTMLInputElement).type,
            value: (input as HTMLInputElement).value,
            placeholder: (input as HTMLInputElement).placeholder
          }))
        }));

        // Extract table data (often contains fee schedules, hours, etc.)
        data.tables = Array.from(document.querySelectorAll('table')).map(table => ({
          headers: Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim()),
          rows: Array.from(table.querySelectorAll('tr')).map(tr =>
            Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim())
          )
        }));

        return data;
      });

      // Process the dynamic data
      return this.processDynamicData(dynamicData, websiteUrl);

    } catch (error) {
      console.error('Dynamic scraping failed:', error);
      return {};
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private async getChromium(): Promise<PlaywrightChromium | null> {
    if (this.playwrightChromium) {
      return this.playwrightChromium;
    }

    try {
      const playwright = await import('playwright');
      this.playwrightChromium = playwright.chromium;
      return this.playwrightChromium;
    } catch (error) {
      if (!this.warnedAboutChromium) {
        console.warn('Playwright not available; skipping dynamic scraping.', error);
        this.warnedAboutChromium = true;
      }
      return null;
    }
  }

  private processDynamicData(data: Record<string, unknown>, websiteUrl: string): Partial<DetailedOfficeInfo> {
    const fullText = (data.fullText as string)?.toLowerCase() || '';

    return {
      website: websiteUrl,
      officeName: this.extractOfficeNameFromText(data.fullText as string),
      phone: this.extractPatternsFromText(data.fullText as string, this.PATTERNS.phone)[0] || '',
      email: this.extractPatternsFromText(data.fullText as string, this.PATTERNS.email)[0] || '',
      address: this.extractPatternsFromText(data.fullText as string, this.PATTERNS.address)[0] || '',
      businessHours: this.extractHoursFromText(data.fullText as string),
      services: this.extractServicesFromText(fullText),
      onlineServices: this.extractOnlineServicesFromText(fullText),
      portals: this.extractPortalsFromLinks(data.links as Array<{ href?: string; text?: string; title?: string }>),
      forms: this.extractFormsFromLinks(data.links as Array<{ href?: string; text?: string; title?: string }>, websiteUrl),
      feeStructure: this.extractFeesFromText(data.fullText as string),
      processInfo: this.extractProcessInfoFromText(data.fullText as string),
      staffContacts: this.extractStaffFromText(data.fullText as string),
      additionalInfo: this.extractAdditionalInfoFromText(data.fullText as string),
      metadata: {
        lastScraped: new Date().toISOString(),
        dataCompleteness: 0,
        scrapingMethod: 'dynamic',
        sourceReliability: 'high',
        validationStatus: 'unverified'
      }
    };
  }

  private async scrapeRelatedGovernmentPages(baseUrl: string): Promise<Partial<DetailedOfficeInfo>> {
    const relatedInfo: Partial<DetailedOfficeInfo> = {
      forms: { building: [], electrical: [], plumbing: [], mechanical: [], zoning: [], planning: [], other: [] },
      metadata: { lastScraped: new Date().toISOString(), dataCompleteness: 0, scrapingMethod: 'static', sourceReliability: 'medium', validationStatus: 'unverified' }
    };

    try {
      console.log(`Scraping related government pages for: ${baseUrl}`);

      // Try common government page paths
      const baseUrlObj = new URL(baseUrl);
      const baseOrigin = baseUrlObj.origin;

      const pagesToCheck = COMMON_GOV_PATHS.map(path => `${baseOrigin}${path}`);

      // Add some additional paths based on the base URL structure
      if (baseUrlObj.pathname.includes('/department')) {
        pagesToCheck.push(`${baseOrigin}/departments/building/forms`);
        pagesToCheck.push(`${baseOrigin}/departments/planning/applications`);
      }

      let pagesChecked = 0;
      const maxPages = 5; // Limit to prevent excessive requests

      for (const pageUrl of pagesToCheck.slice(0, maxPages)) {
        try {
          console.log(`Checking related page: ${pageUrl}`);

          const response = await fetch(pageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; PermitOfficeBot/2.0; +https://permitoffices.com/bot)'
            }
          });

          if (response.ok) {
            const html = await response.text();
            const $ = cheerio.load(html);

            // Extract forms from this page
            const pageForms = this.extractForms($, pageUrl);

            // Merge forms
            Object.keys(pageForms).forEach(category => {
              const categoryKey = category as keyof DetailedOfficeInfo['forms'];
              if (relatedInfo.forms && relatedInfo.forms[categoryKey]) {
                relatedInfo.forms[categoryKey].push(...pageForms[categoryKey]);
              }
            });

            // Extract additional contact information if not found yet
            if (!relatedInfo.phone || !relatedInfo.email) {
              const additionalContact = {
                phone: this.extractPhone($),
                email: this.extractEmail($)
              };

              if (additionalContact.phone && !relatedInfo.phone) {
                relatedInfo.phone = additionalContact.phone;
              }
              if (additionalContact.email && !relatedInfo.email) {
                relatedInfo.email = additionalContact.email;
              }
            }

            // Extract business hours if not found yet
            if (!relatedInfo.businessHours || Object.keys(relatedInfo.businessHours).length === 0) {
              relatedInfo.businessHours = this.extractBusinessHours($);
            }

            pagesChecked++;

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          }

        } catch (pageError) {
          console.error(`Error scraping related page ${pageUrl}:`, pageError);
          continue;
        }
      }

      console.log(`Scraped ${pagesChecked} related government pages`);

    } catch (error) {
      console.error('Error scraping related government pages:', error);
    }

    return relatedInfo;
  }

  // Enhanced extraction methods
  private extractOfficeName($: cheerio.CheerioAPI): string {
    const selectors = [
      'h1',
      '.page-title',
      '.department-name',
      '.office-name',
      'title',
      '.site-title'
    ];

    for (const selector of selectors) {
      const text = $(selector).first().text().trim();
      if (text && text.length > 3 && text.length < 100) {
        return text;
      }
    }

    return '';
  }

  private extractDepartment($: cheerio.CheerioAPI): string {
    const text = $('body').text().toLowerCase();

    if (text.includes('building department')) return 'Building Department';
    if (text.includes('planning department')) return 'Planning Department';
    if (text.includes('development services')) return 'Development Services';
    if (text.includes('community development')) return 'Community Development';
    if (text.includes('zoning department')) return 'Zoning Department';

    return 'Building & Planning Department';
  }

  private extractAddress($: cheerio.CheerioAPI): string {
    const text = $('body').text();
    const addresses = this.extractPatternsFromText(text, this.PATTERNS.address);
    return addresses[0] || '';
  }

  private extractPhone($: cheerio.CheerioAPI): string {
    const text = $('body').text();
    const phones = this.extractPatternsFromText(text, this.PATTERNS.phone);
    return phones[0] || '';
  }

  private extractEmail($: cheerio.CheerioAPI): string {
    const text = $('body').text();
    const emails = this.extractPatternsFromText(text, this.PATTERNS.email);
    return emails.find(email => !email.includes('example.com')) || '';
  }

  private extractBusinessHours($: cheerio.CheerioAPI): DetailedOfficeInfo['businessHours'] {
    const text = $('body').text();
    return this.extractHoursFromText(text);
  }

  private extractServices($: cheerio.CheerioAPI): DetailedOfficeInfo['services'] {
    const text = $('body').text().toLowerCase();
    return this.extractServicesFromText(text);
  }

  private extractOnlineServices($: cheerio.CheerioAPI): DetailedOfficeInfo['onlineServices'] {
    const text = $('body').text().toLowerCase();
    return this.extractOnlineServicesFromText(text);
  }

  private extractPortals($: cheerio.CheerioAPI): DetailedOfficeInfo['portals'] {
    const links = $('a').map((_, el) => ({
      href: $(el).attr('href') || '',
      text: $(el).text().toLowerCase()
    })).get();

    return this.extractPortalsFromLinks(links);
  }

  private extractFeeStructure($: cheerio.CheerioAPI): DetailedOfficeInfo['feeStructure'] {
    const text = $('body').text();
    return this.extractFeesFromText(text);
  }

  private extractStaffContacts($: cheerio.CheerioAPI): DetailedOfficeInfo['staffContacts'] {
    const text = $('body').text();
    return this.extractStaffFromText(text);
  }

  private extractForms($: cheerio.CheerioAPI, baseUrl: string): DetailedOfficeInfo['forms'] {
    const links = $('a').map((_, el) => ({
      href: $(el).attr('href') || '',
      text: $(el).text().trim(),
      title: $(el).attr('title') || ''
    })).get();

    return this.extractFormsFromLinks(links, baseUrl);
  }

  private extractProcessInfo($: cheerio.CheerioAPI): DetailedOfficeInfo['processInfo'] {
    const text = $('body').text();
    return this.extractProcessInfoFromText(text);
  }

  private extractAdditionalInfo($: cheerio.CheerioAPI): DetailedOfficeInfo['additionalInfo'] {
    const text = $('body').text();
    return this.extractAdditionalInfoFromText(text);
  }

  // Utility extraction methods
  private extractPatternsFromText(text: string, pattern: RegExp): string[] {
    const matches = text.match(pattern) || [];
    return [...new Set(matches)]; // Remove duplicates
  }

  private extractHoursFromText(text: string): DetailedOfficeInfo['businessHours'] {
    const hours: DetailedOfficeInfo['businessHours'] = {};
    const lines = text.split('\n');

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayAbbrevs = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const abbrev = dayAbbrevs[i];

        if (lowerLine.includes(day) || lowerLine.includes(abbrev)) {
          const timeMatch = line.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?(?:\s*[-–]\s*\d{1,2}:\d{2}\s*(?:am|pm)?)?)/i);
          if (timeMatch) {
            hours[day as keyof DetailedOfficeInfo['businessHours']] = timeMatch[1].trim();
          } else if (lowerLine.includes('closed')) {
            hours[day as keyof DetailedOfficeInfo['businessHours']] = 'Closed';
          }
        }
      }
    }

    return hours;
  }

  private extractServicesFromText(text: string): DetailedOfficeInfo['services'] {
    const services: DetailedOfficeInfo['services'] = {
      buildingPermits: false,
      electricalPermits: false,
      plumbingPermits: false,
      mechanicalPermits: false,
      zoningPermits: false,
      planningReview: false,
      inspections: false,
      siteInspections: false,
      landDevelopment: false,
      subdivisionReview: false,
      varianceApplications: false,
      specialEventPermits: false,
      signPermits: false,
      demolitionPermits: false,
      fireDepartmentReview: false,
      healthDepartmentReview: false,
      environmentalReview: false
    };

    for (const [service, keywords] of Object.entries(this.SERVICE_KEYWORDS)) {
      services[service as keyof DetailedOfficeInfo['services']] = keywords.some(keyword =>
        text.includes(keyword)
      );
    }

    return services;
  }

  private extractOnlineServicesFromText(text: string): DetailedOfficeInfo['onlineServices'] {
    const onlineServices: DetailedOfficeInfo['onlineServices'] = {
      onlineApplications: false,
      onlinePayments: false,
      permitTracking: false,
      schedulingInspections: false,
      documentSubmission: false,
      statusUpdates: false,
      renewals: false,
      appeals: false
    };

    for (const [service, keywords] of Object.entries(this.ONLINE_SERVICE_KEYWORDS)) {
      onlineServices[service as keyof DetailedOfficeInfo['onlineServices']] = keywords.some(keyword =>
        text.includes(keyword)
      );
    }

    return onlineServices;
  }

  private extractPortalsFromLinks(links: Array<{ href?: string; text?: string; title?: string }>): DetailedOfficeInfo['portals'] {
    const portals: DetailedOfficeInfo['portals'] = {};

    for (const link of links) {
      const text = (link.text || '').toLowerCase();
      const href = link.href || '';

      if (text.includes('permit') && (text.includes('portal') || text.includes('system'))) {
        portals.permitsPortal = href;
      } else if (text.includes('payment') && text.includes('portal')) {
        portals.paymentsPortal = href;
      } else if (text.includes('inspection') && text.includes('portal')) {
        portals.inspectionsPortal = href;
      } else if (text.includes('planning') && text.includes('portal')) {
        portals.planningPortal = href;
      } else if (text.includes('citizen') && text.includes('portal')) {
        portals.citizenPortal = href;
      }
    }

    return portals;
  }

  private extractFormsFromLinks(links: Array<{ href?: string; text?: string; title?: string }>, baseUrl: string): DetailedOfficeInfo['forms'] {
    const forms: DetailedOfficeInfo['forms'] = {
      building: [],
      electrical: [],
      plumbing: [],
      mechanical: [],
      zoning: [],
      planning: [],
      other: []
    };

    const formExtensions = ['.pdf', '.doc', '.docx', '.xlsx', '.xls'];

    for (const link of links) {
      const text = (link.text || '').toLowerCase();
      const href = link.href || '';
      const title = (link.title || '').toLowerCase();

      // Check if it's a form link
      const isFormLink = formExtensions.some(ext => href.toLowerCase().includes(ext)) ||
                        text.includes('form') || text.includes('application') ||
                        title.includes('form') || title.includes('application');

      if (isFormLink && href) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).toString();
        const form = {
          name: link.text || 'Unknown Form',
          url: fullUrl,
          type: this.getFileType(href)
        };

        // Categorize the form
        if (text.includes('building') || text.includes('construction')) {
          forms.building.push(form);
        } else if (text.includes('electrical')) {
          forms.electrical.push(form);
        } else if (text.includes('plumbing')) {
          forms.plumbing.push(form);
        } else if (text.includes('mechanical') || text.includes('hvac')) {
          forms.mechanical.push(form);
        } else if (text.includes('zoning') || text.includes('variance')) {
          forms.zoning.push(form);
        } else if (text.includes('planning') || text.includes('development')) {
          forms.planning.push(form);
        } else {
          forms.other.push(form);
        }
      }
    }

    return forms;
  }

  private extractFeesFromText(text: string): DetailedOfficeInfo['feeStructure'] {
    const feeStructure: DetailedOfficeInfo['feeStructure'] = {};

    const lines = text.split('\n');
    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      if (lowerLine.includes('building permit') && lowerLine.includes('$')) {
        feeStructure.buildingPermitFees = line.trim();
      } else if (lowerLine.includes('inspection') && lowerLine.includes('$')) {
        feeStructure.inspectionFees = line.trim();
      } else if (lowerLine.includes('plan review') && lowerLine.includes('$')) {
        feeStructure.planReviewFees = line.trim();
      } else if (lowerLine.includes('expedite') && lowerLine.includes('$')) {
        feeStructure.expeditedServiceFees = line.trim();
      }
    }

    return feeStructure;
  }

  private extractStaffFromText(text: string): DetailedOfficeInfo['staffContacts'] {
    const staffContacts: DetailedOfficeInfo['staffContacts'] = {};

    const lines = text.split('\n');
    for (const line of lines) {
      const lowerLine = line.toLowerCase();

      if (lowerLine.includes('building official') || lowerLine.includes('chief building')) {
        staffContacts.buildingOfficial = this.extractContactFromLine(line);
      } else if (lowerLine.includes('chief inspector') || lowerLine.includes('inspector')) {
        staffContacts.chiefInspector = this.extractContactFromLine(line);
      } else if (lowerLine.includes('plan review') || lowerLine.includes('reviewer')) {
        staffContacts.planReviewer = this.extractContactFromLine(line);
      } else if (lowerLine.includes('zoning') && lowerLine.includes('administrator')) {
        staffContacts.zoningAdministrator = this.extractContactFromLine(line);
      } else if (lowerLine.includes('permit') && lowerLine.includes('coordinator')) {
        staffContacts.permitCoordinator = this.extractContactFromLine(line);
      }
    }

    return staffContacts;
  }

  private extractContactFromLine(line: string): { name: string; email?: string; phone?: string } {
    const contact: { name: string; email?: string; phone?: string } = { name: '' };

    // Extract name (assume it's the first part before contact info)
    const nameMatch = line.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    if (nameMatch) {
      contact.name = nameMatch[1];
    }

    // Extract email
    const emailMatch = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
      contact.email = emailMatch[0];
    }

    // Extract phone
    const phoneMatch = line.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    if (phoneMatch) {
      contact.phone = phoneMatch[0];
    }

    return contact;
  }

  private extractProcessInfoFromText(text: string): DetailedOfficeInfo['processInfo'] {
    const processInfo: DetailedOfficeInfo['processInfo'] = {};

    // Extract processing time
    const timeMatch = text.match(/(?:processing time|review time|turnaround time)[\s:]*(\d+[-\s]*(?:business\s*)?(?:days?|weeks?|months?))/i);
    if (timeMatch) {
      processInfo.typicalProcessingTime = timeMatch[1];
    }

    // Extract steps if they're listed
    const stepMatches = text.match(/step\s*\d+[:\s]([^.\n]+)/gi);
    if (stepMatches) {
      processInfo.permitProcessSteps = stepMatches.map(step => step.replace(/step\s*\d+[:\s]/i, '').trim());
    }

    return processInfo;
  }

  private extractAdditionalInfoFromText(text: string): DetailedOfficeInfo['additionalInfo'] {
    const additionalInfo: DetailedOfficeInfo['additionalInfo'] = {};

    // Extract meeting schedules
    const meetingMatch = text.match(/(planning commission|zoning board|city council).*?meetings?.*?(\d+(?:st|nd|rd|th)?\s+\w+)/gi);
    if (meetingMatch) {
      additionalInfo.meetingSchedules = meetingMatch.join('; ');
    }

    return additionalInfo;
  }

  private extractOfficeNameFromText(text: string): string {
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 10 && trimmed.length < 100) {
        if (trimmed.toLowerCase().includes('department') ||
            trimmed.toLowerCase().includes('office') ||
            trimmed.toLowerCase().includes('building') ||
            trimmed.toLowerCase().includes('planning')) {
          return trimmed;
        }
      }
    }

    return '';
  }

  private getFileType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'PDF';
      case 'doc': case 'docx': return 'DOC';
      case 'xls': case 'xlsx': return 'XLS';
      default: return 'LINK';
    }
  }

  private mergeOfficeInfo(staticInfo: Partial<DetailedOfficeInfo>, dynamic: Partial<DetailedOfficeInfo>, related?: Partial<DetailedOfficeInfo>): DetailedOfficeInfo {
    // Merge the two data sources, preferring more complete data
    const merged: DetailedOfficeInfo = {
      officeName: dynamic.officeName || staticInfo.officeName || '',
      department: dynamic.department || staticInfo.department || '',
      jurisdiction: 'city', // This should be determined by the search context
      address: dynamic.address || staticInfo.address || related?.address || '',
      phone: dynamic.phone || staticInfo.phone || related?.phone || '',
      email: dynamic.email || staticInfo.email || related?.email || '',
      website: staticInfo.website || dynamic.website || '',
      city: '', // This should be set from search context
      county: '', // This should be set from search context
      state: 'GA', // Default to GA for now
      businessHours: { ...staticInfo.businessHours, ...dynamic.businessHours, ...related?.businessHours },
      services: {
        buildingPermits: false,
        electricalPermits: false,
        plumbingPermits: false,
        mechanicalPermits: false,
        zoningPermits: false,
        planningReview: false,
        inspections: false,
        siteInspections: false,
        landDevelopment: false,
        subdivisionReview: false,
        varianceApplications: false,
        specialEventPermits: false,
        signPermits: false,
        demolitionPermits: false,
        fireDepartmentReview: false,
        healthDepartmentReview: false,
        environmentalReview: false,
        ...staticInfo.services,
        ...dynamic.services
      },
      onlineServices: {
        onlineApplications: false,
        onlinePayments: false,
        permitTracking: false,
        schedulingInspections: false,
        documentSubmission: false,
        statusUpdates: false,
        renewals: false,
        appeals: false,
        ...staticInfo.onlineServices,
        ...dynamic.onlineServices
      },
      portals: { ...staticInfo.portals, ...dynamic.portals },
      feeStructure: { ...staticInfo.feeStructure, ...dynamic.feeStructure },
      staffContacts: { ...staticInfo.staffContacts, ...dynamic.staffContacts },
      forms: {
        building: [...(staticInfo.forms?.building || []), ...(dynamic.forms?.building || []), ...(related?.forms?.building || [])],
        electrical: [...(staticInfo.forms?.electrical || []), ...(dynamic.forms?.electrical || []), ...(related?.forms?.electrical || [])],
        plumbing: [...(staticInfo.forms?.plumbing || []), ...(dynamic.forms?.plumbing || []), ...(related?.forms?.plumbing || [])],
        mechanical: [...(staticInfo.forms?.mechanical || []), ...(dynamic.forms?.mechanical || []), ...(related?.forms?.mechanical || [])],
        zoning: [...(staticInfo.forms?.zoning || []), ...(dynamic.forms?.zoning || []), ...(related?.forms?.zoning || [])],
        planning: [...(staticInfo.forms?.planning || []), ...(dynamic.forms?.planning || []), ...(related?.forms?.planning || [])],
        other: [...(staticInfo.forms?.other || []), ...(dynamic.forms?.other || []), ...(related?.forms?.other || [])]
      },
      processInfo: { ...staticInfo.processInfo, ...dynamic.processInfo },
      additionalInfo: { ...staticInfo.additionalInfo, ...dynamic.additionalInfo },
      metadata: {
        lastScraped: new Date().toISOString(),
        dataCompleteness: 0, // Will be calculated
        sourceReliability: dynamic.metadata?.sourceReliability || staticInfo.metadata?.sourceReliability || 'medium',
        validationStatus: 'unverified',
        scrapingMethod: dynamic.metadata?.scrapingMethod || staticInfo.metadata?.scrapingMethod || 'static'
      }
    };

    return merged;
  }

  private calculateDataCompleteness(info: DetailedOfficeInfo): number {
    let score = 0;
    let maxScore = 0;

    // Basic information (20 points)
    maxScore += 20;
    if (info.officeName) score += 5;
    if (info.address) score += 5;
    if (info.phone) score += 5;
    if (info.email) score += 5;

    // Business hours (10 points)
    maxScore += 10;
    const hoursCount = Object.values(info.businessHours).filter(h => h).length;
    score += (hoursCount / 7) * 10;

    // Services (20 points)
    maxScore += 20;
    const servicesCount = Object.values(info.services).filter(s => s).length;
    score += (servicesCount / Object.keys(info.services).length) * 20;

    // Online services (15 points)
    maxScore += 15;
    const onlineServicesCount = Object.values(info.onlineServices).filter(s => s).length;
    score += (onlineServicesCount / Object.keys(info.onlineServices).length) * 15;

    // Forms (15 points)
    maxScore += 15;
    const totalForms = Object.values(info.forms).reduce((sum, arr) => sum + arr.length, 0);
    score += Math.min(totalForms / 10, 1) * 15; // Max 15 points for 10+ forms

    // Staff contacts (10 points)
    maxScore += 10;
    const staffCount = Object.values(info.staffContacts).filter(s => s?.name).length;
    score += (staffCount / Object.keys(info.staffContacts).length) * 10;

    // Fee structure (5 points)
    maxScore += 5;
    const feeCount = Object.values(info.feeStructure).filter(f => f).length;
    score += (feeCount / Object.keys(info.feeStructure).length) * 5;

    // Process info (5 points)
    maxScore += 5;
    const processCount = Object.values(info.processInfo).filter(p => p).length;
    score += (processCount / Object.keys(info.processInfo).length) * 5;

    return Math.round((score / maxScore) * 100);
  }
}
