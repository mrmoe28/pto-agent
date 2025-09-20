// Georgia permit office data structure
// Data should be populated from web scraping, API calls, or database
// This file defines the structure but contains no hardcoded office data

// Interface for Georgia-specific permit office data
interface PermitOffice {
  city: string
  county: string
  state: string
  jurisdiction_type: 'city' | 'county' | 'state' | 'special_district'
  department_name: string
  office_type: 'building' | 'planning' | 'zoning' | 'combined' | 'other'
  address: string
  phone?: string
  email?: string
  website?: string
  online_applications?: boolean
  online_payments?: boolean
  permit_tracking?: boolean
  online_portal_url?: string
  building_permits?: boolean
  electrical_permits?: boolean
  plumbing_permits?: boolean
  mechanical_permits?: boolean
  zoning_permits?: boolean
  planning_review?: boolean
  inspections?: boolean
}

// Empty array - data populated dynamically from scraping/database
export const georgiaPermitOffices: PermitOffice[] = []

// Georgia-specific website patterns for crawling
export const georgiaWebsitePatterns = {
  common_domains: [
    '.ga.gov',
    '.georgia.gov',
    '.atlantaga.gov',
    '.savannahga.gov',
    '.augustaga.gov'
  ],

  permit_keywords: [
    'building permit',
    'construction permit',
    'electrical permit',
    'plumbing permit',
    'mechanical permit',
    'zoning permit',
    'planning department',
    'development services',
    'community development',
    'code enforcement'
  ],

  contact_selectors: [
    'contact',
    'phone',
    'address',
    'hours',
    'office hours',
    'location'
  ],

  common_permit_portals: [
    'accela.com',
    'citizenserve.com',
    'viewpoint.com',
    'clariti.com'
  ]
}

// Helper function to validate Georgia permit office data structure
export function validateGeorgiaPermitOffice(office: unknown): office is PermitOffice {
  if (!office || typeof office !== 'object') return false

  const o = office as Record<string, unknown>

  return (
    typeof o.city === 'string' &&
    typeof o.county === 'string' &&
    o.state === 'GA' &&
    ['city', 'county', 'state', 'special_district'].includes(o.jurisdiction_type as string) &&
    typeof o.department_name === 'string' &&
    ['building', 'planning', 'zoning', 'combined', 'other'].includes(o.office_type as string) &&
    typeof o.address === 'string'
  )
}

// Helper function to get Georgia counties for validation
export function getGeorgiaCounties(): string[] {
  // This would typically come from a database or API
  // Returning empty array as no hardcoded data should be included
  return []
}