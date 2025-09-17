import { neon } from '@neondatabase/serverless'

// Get the database URL from environment variables
const databaseUrl = process.env.DATABASE_URL || ''

// Validate database URL
if (!databaseUrl) {
  console.warn('DATABASE_URL environment variable is not set. Database operations will fail.')
}

// Create a Neon client
export const sql = neon(databaseUrl)

// Database types for Georgia permit offices
export interface PermitOffice {
  id: string
  created_at: string
  updated_at: string

  // Location Information
  city: string
  county: string
  state: string
  jurisdiction_type: 'city' | 'county' | 'state' | 'special_district'

  // Office Details
  department_name: string
  office_type: 'building' | 'planning' | 'zoning' | 'combined' | 'other'

  // Contact Information
  address: string
  phone: string | null
  email: string | null
  website: string | null

  // Operating Hours
  hours_monday: string | null
  hours_tuesday: string | null
  hours_wednesday: string | null
  hours_thursday: string | null
  hours_friday: string | null
  hours_saturday: string | null
  hours_sunday: string | null

  // Services Offered
  building_permits: boolean
  electrical_permits: boolean
  plumbing_permits: boolean
  mechanical_permits: boolean
  zoning_permits: boolean
  planning_review: boolean
  inspections: boolean

  // Online Services
  online_applications: boolean
  online_payments: boolean
  permit_tracking: boolean
  online_portal_url: string | null

  // Geographic Data
  latitude: number | null
  longitude: number | null
  service_area_bounds: Record<string, unknown> | null // GeoJSON polygon

  // Metadata
  data_source: 'crawled' | 'api' | 'manual'
  last_verified: string | null
  crawl_frequency: 'daily' | 'weekly' | 'monthly'
  active: boolean
}

// Helper function to execute queries with error handling
export async function query<T = unknown>(
  queryText: string
): Promise<T[]> {
  try {
    // For dynamic queries, we need to use a different approach
    // This is a simplified version - in production, consider using a query builder
    const result = await sql.unsafe(queryText) as unknown as T[]
    return result
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}