import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Validate Supabase configuration
if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseKey === 'placeholder-key') {
  console.warn('Supabase environment variables are not properly configured. Using placeholder values.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

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