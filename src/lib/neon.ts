import { Pool } from 'pg'

const databaseUrl = process.env.DATABASE_URL || ''

if (!databaseUrl) {
  console.warn('DATABASE_URL environment variable is not set. Database operations will fail.')
}

const pool = new Pool({ connectionString: databaseUrl })

// Matches the permissive return type of @neondatabase/serverless's neon() tagged template.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

interface SqlFn {
  <T = Row>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>
  unsafe: <T = Row>(raw: string, params?: unknown[]) => Promise<T[]>
}

const sqlFn = async <T = Row>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> => {
  let text = strings[0]
  for (let i = 0; i < values.length; i++) {
    text += `$${i + 1}${strings[i + 1]}`
  }
  const result = await pool.query(text, values as unknown[])
  return result.rows as T[]
}

sqlFn.unsafe = async <T = Row>(raw: string, params: unknown[] = []): Promise<T[]> => {
  const result = await pool.query(raw, params)
  return result.rows as T[]
}

export const sql = sqlFn as SqlFn

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
    return await sql.unsafe<T>(queryText)
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}
