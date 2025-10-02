import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

interface PermitForm {
  name: string;
  url: string;
  type: 'electrical';
  description?: string;
  fileType?: string;
}

interface BusinessHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

interface ScrapedForms {
  electrical: PermitForm[];
  businessHours?: BusinessHours;
}

// Electrical permit form keywords only
const ELECTRICAL_KEYWORDS = [
  'electrical permit', 'electrical application', 'electrical work',
  'wiring permit', 'electrical inspection', 'electrical installation',
  'electrical service', 'electrical upgrade', 'electric permit',
  'electrical contractor', 'electrical form', 'solar electrical',
  'photovoltaic electrical', 'pv electrical', 'solar permit'
];

// File extensions that indicate downloadable forms
const FORM_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xlsx', '.xls'];

// Keywords that indicate business hours information (used in dynamic scraping)
const HOURS_KEYWORDS = [
  'hours', 'office hours', 'business hours', 'operating hours', 'open hours',
  'hours of operation', 'office schedule', 'business schedule', 'open',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'weekday', 'weekend', 'schedule', 'availability', 'contact hours'
];

export async function scrapePermitForms(websiteUrl: string): Promise<ScrapedForms> {
  const forms: ScrapedForms = {
    electrical: []
  };

  try {
    // First try with simple fetch for static content
    const response = await fetch(websiteUrl);
    const html = await response.text();
    const $ = cheerio.load(html);

    // Find all links that might be forms
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      const text = $(element).text().toLowerCase();
      const title = $(element).attr('title')?.toLowerCase() || '';

      if (href && isLikelyFormLink(href, text, title)) {
        const fullUrl = resolveUrl(href, websiteUrl);
        const form: PermitForm = {
          name: cleanFormName($(element).text()),
          url: fullUrl,
          type: 'electrical',
          fileType: getFileType(href)
        };

        forms.electrical.push(form);
      }
    });

    // If we didn't find forms with static scraping, try dynamic scraping
    if (getTotalFormsCount(forms) === 0) {
      const dynamicForms = await scrapeDynamicContent(websiteUrl);
      mergeForms(forms, dynamicForms);
    }

    // Look for common permit pages if we still don't have forms
    if (getTotalFormsCount(forms) === 0) {
      const permitPageForms = await scrapeCommonPermitPages(websiteUrl);
      mergeForms(forms, permitPageForms);
    }

  } catch (error) {
    console.error('Error scraping forms:', error);
  }

  return forms;
}

async function scrapeDynamicContent(websiteUrl: string): Promise<ScrapedForms> {
  const forms: ScrapedForms = {
    electrical: []
  };

  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(websiteUrl, { waitUntil: 'networkidle' });

    // Wait for potential dynamic content to load
    await page.waitForTimeout(2000);

    // Get all links
    const links = await page.evaluate(() => {
      const anchors = document.querySelectorAll('a');
      return Array.from(anchors).map(a => ({
        href: a.href,
        text: a.textContent || '',
        title: a.title || ''
      }));
    });

    for (const link of links) {
      if (link.href && isLikelyFormLink(link.href, link.text.toLowerCase(), link.title.toLowerCase())) {
        const form: PermitForm = {
          name: cleanFormName(link.text),
          url: link.href,
          type: 'electrical',
          fileType: getFileType(link.href)
        };

        forms.electrical.push(form);
      }
    }

    // Extract business hours from the page content
    try {
      const businessHours = await page.evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        const lines = text.split('\n');
        const hoursData: Record<string, string> = {};

        // Look for common business hours patterns
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayAbbrevs = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

        for (const line of lines) {
          // Skip lines that are too long (probably not hours)
          if (line.length > 200) continue;

          // Look for lines that contain day names and time patterns
          const hasDay = days.some(day => line.includes(day)) || dayAbbrevs.some(abbrev => line.includes(abbrev));
          const hasTime = /\d{1,2}:\d{2}|\d{1,2}\s*(am|pm)/i.test(line);
          const hasHoursKeyword = HOURS_KEYWORDS.some(keyword => line.includes(keyword));

          if ((hasDay && hasTime) || (hasHoursKeyword && hasTime)) {
            // Try to extract day-specific hours
            for (let i = 0; i < days.length; i++) {
              const day = days[i];
              const abbrev = dayAbbrevs[i];

              if (line.includes(day) || line.includes(abbrev)) {
                // Extract time from the line
                const timeMatch = line.match(/(\d{1,2}:\d{2}\s*(?:am|pm)?(?:\s*-\s*\d{1,2}:\d{2}\s*(?:am|pm)?)?)/i);
                if (timeMatch) {
                  hoursData[day] = timeMatch[1].trim();
                }
              }
            }
          }
        }

        return hoursData;
      });

      if (Object.keys(businessHours).length > 0) {
        forms.businessHours = businessHours;
      }
    } catch (hoursError) {
      console.error('Error extracting business hours:', hoursError);
    }

    await browser.close();
  } catch (dynamicError) {
    console.error('Error with dynamic scraping:', dynamicError);
  }

  return forms;
}

async function scrapeCommonPermitPages(baseUrl: string): Promise<ScrapedForms> {
  const forms: ScrapedForms = {
    electrical: []
  };

  // Common electrical permit page paths
  const commonPaths = [
    '/permits',
    '/electrical',
    '/electrical-permits',
    '/electrical-forms',
    '/forms',
    '/applications',
    '/downloads',
    '/resources',
    '/documents',
    '/permit-forms',
    '/permit-applications',
    '/electrical-department',
    '/solar',
    '/solar-permits',
    '/renewable-energy'
  ];

  for (const path of commonPaths) {
    try {
      const url = new URL(path, baseUrl).toString();
      const response = await fetch(url);

      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);

        $('a').each((_, element) => {
          const href = $(element).attr('href');
          const text = $(element).text().toLowerCase();
          const title = $(element).attr('title')?.toLowerCase() || '';

          if (href && isLikelyFormLink(href, text, title)) {
            const fullUrl = resolveUrl(href, url);

            // Check if we already have this form
            const exists = forms.electrical.some(f => f.url === fullUrl);
            if (!exists) {
              const form: PermitForm = {
                name: cleanFormName($(element).text()),
                url: fullUrl,
                type: 'electrical',
                fileType: getFileType(href)
              };

              forms.electrical.push(form);
            }
          }
        });
      }
    } catch {
      // Silently continue if a path doesn't exist
    }
  }

  return forms;
}

function isLikelyFormLink(href: string, text: string, title: string): boolean {
  const combinedText = `${text} ${title} ${href}`.toLowerCase();

  // Check if it's a downloadable file
  const hasFormExtension = FORM_EXTENSIONS.some(ext => href.toLowerCase().includes(ext));

  if (!hasFormExtension) return false;

  // MUST contain electrical-related keywords
  const hasElectricalKeyword = ELECTRICAL_KEYWORDS.some(keyword =>
    combinedText.includes(keyword)
  );

  const hasFormKeyword = combinedText.includes('form') ||
                        combinedText.includes('application') ||
                        combinedText.includes('apply');

  // EXCLUDE common non-application documents
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
                    combinedText.includes('fee sheet') ||
                    combinedText.includes('calendar') ||
                    combinedText.includes('meeting') ||
                    combinedText.includes('minutes') ||
                    combinedText.includes('agenda') ||
                    combinedText.includes('report') ||
                    combinedText.includes('plan') ||
                    combinedText.includes('brochure') ||
                    combinedText.includes('flyer');

  return hasFormExtension && hasElectricalKeyword && hasFormKeyword && !isExcluded;
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    // If it's already a full URL, return it
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return href;
    }

    // Otherwise, resolve it relative to the base URL
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

function cleanFormName(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\.pdf$/i, '')
    .replace(/\.doc[x]?$/i, '')
    .replace(/\.xls[x]?$/i, '')
    .substring(0, 100); // Limit length
}

function getFileType(url: string): string {
  const lowercaseUrl = url.toLowerCase();
  for (const ext of FORM_EXTENSIONS) {
    if (lowercaseUrl.includes(ext)) {
      return ext.substring(1).toUpperCase();
    }
  }
  return 'LINK';
}

function getTotalFormsCount(forms: ScrapedForms): number {
  return Object.values(forms).reduce((total, formArray) => total + formArray.length, 0);
}

function mergeForms(target: ScrapedForms, source: ScrapedForms): void {
  // Merge business hours if available
  if (source.businessHours && !target.businessHours) {
    target.businessHours = source.businessHours;
  }

  // Merge electrical forms
  for (const form of source.electrical) {
    // Check if form URL already exists
    const exists = target.electrical.some(f => f.url === form.url);
    if (!exists) {
      target.electrical.push(form);
    }
  }
}

// Function to fetch and cache forms for a specific office
export async function fetchAndCachePermitForms(office: {
  website: string | null;
  city: string;
  county: string;
  state: string;
}): Promise<ScrapedForms | null> {
  if (!office.website) {
    return null;
  }

  try {
    const forms = await scrapePermitForms(office.website);

    // Store in database or cache
    // This would be implemented based on your database setup

    return forms;
  } catch (error) {
    console.error('Error fetching forms for office:', error);
    return null;
  }
}