-- Neon Database Schema for Permit Office Search Application
-- This file creates the permit_offices table with all necessary fields

CREATE TABLE IF NOT EXISTS permit_offices (
  -- Primary Key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Location Information
  city VARCHAR(255) NOT NULL,
  county VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,
  jurisdiction_type VARCHAR(50) NOT NULL CHECK (jurisdiction_type IN ('city', 'county', 'state', 'special_district')),

  -- Office Details
  department_name VARCHAR(255) NOT NULL,
  office_type VARCHAR(50) NOT NULL CHECK (office_type IN ('building', 'planning', 'zoning', 'combined', 'other')),

  -- Contact Information
  address VARCHAR(500) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(500),

  -- Operating Hours
  hours_monday VARCHAR(100),
  hours_tuesday VARCHAR(100),
  hours_wednesday VARCHAR(100),
  hours_thursday VARCHAR(100),
  hours_friday VARCHAR(100),
  hours_saturday VARCHAR(100),
  hours_sunday VARCHAR(100),

  -- Services Offered
  building_permits BOOLEAN DEFAULT false,
  electrical_permits BOOLEAN DEFAULT false,
  plumbing_permits BOOLEAN DEFAULT false,
  mechanical_permits BOOLEAN DEFAULT false,
  zoning_permits BOOLEAN DEFAULT false,
  planning_review BOOLEAN DEFAULT false,
  inspections BOOLEAN DEFAULT false,

  -- Online Services
  online_applications BOOLEAN DEFAULT false,
  online_payments BOOLEAN DEFAULT false,
  permit_tracking BOOLEAN DEFAULT false,
  online_portal_url VARCHAR(500),

  -- Geographic Data
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  service_area_bounds JSONB,

  -- Metadata
  data_source VARCHAR(50) DEFAULT 'manual' CHECK (data_source IN ('crawled', 'api', 'manual', 'web_search')),
  last_verified TIMESTAMPTZ,
  crawl_frequency VARCHAR(50) DEFAULT 'monthly' CHECK (crawl_frequency IN ('daily', 'weekly', 'monthly')),
  active BOOLEAN DEFAULT true,

  -- Enhanced comprehensive data from multi-page scraping (JSON columns)
  permit_fees JSONB,
  instructions JSONB,
  downloadable_applications JSONB,
  processing_times JSONB,
  contact_details JSONB,
  office_details JSONB,
  permit_categories JSONB,
  related_pages JSONB,

  -- Additional contact methods
  fax VARCHAR(50),
  alternative_phones TEXT[],
  alternative_emails TEXT[],

  -- Detailed service information
  service_area_description TEXT,
  staff_directory TEXT[],
  department_divisions TEXT[],

  -- Permit-specific details
  permit_types_available TEXT[],
  special_requirements JSONB,
  inspection_services TEXT[],

  -- Operational details
  seasonal_hours JSONB,
  appointment_required BOOLEAN,
  walk_in_hours VARCHAR(200),

  -- Digital services
  online_portal_features TEXT[],
  mobile_app_available BOOLEAN,
  document_upload_supported BOOLEAN,

  -- Scraping metadata
  source_url VARCHAR(500),
  scraped_at TIMESTAMPTZ,
  confidence_score DECIMAL(3,2),
  pages_crawled INTEGER,
  crawl_depth INTEGER,

  -- Unique constraint to prevent duplicate offices
  UNIQUE(city, county, department_name)
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_permit_offices_state ON permit_offices(state);
CREATE INDEX IF NOT EXISTS idx_permit_offices_city ON permit_offices(city);
CREATE INDEX IF NOT EXISTS idx_permit_offices_county ON permit_offices(county);
CREATE INDEX IF NOT EXISTS idx_permit_offices_active ON permit_offices(active);
CREATE INDEX IF NOT EXISTS idx_permit_offices_jurisdiction ON permit_offices(jurisdiction_type);
CREATE INDEX IF NOT EXISTS idx_permit_offices_location ON permit_offices(latitude, longitude);

-- Create indexes for new comprehensive fields
CREATE INDEX IF NOT EXISTS idx_permit_offices_source_url ON permit_offices(source_url);
CREATE INDEX IF NOT EXISTS idx_permit_offices_confidence_score ON permit_offices(confidence_score);
CREATE INDEX IF NOT EXISTS idx_permit_offices_scraped_at ON permit_offices(scraped_at);
CREATE INDEX IF NOT EXISTS idx_permit_offices_permit_types ON permit_offices USING GIN(permit_types_available);
CREATE INDEX IF NOT EXISTS idx_permit_offices_permit_fees ON permit_offices USING GIN(permit_fees);
CREATE INDEX IF NOT EXISTS idx_permit_offices_processing_times ON permit_offices USING GIN(processing_times);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function before any update
CREATE TRIGGER update_permit_offices_updated_at
  BEFORE UPDATE ON permit_offices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for comprehensive field documentation
COMMENT ON COLUMN permit_offices.permit_fees IS 'JSON structure containing permit fee information organized by permit type';
COMMENT ON COLUMN permit_offices.instructions IS 'JSON structure containing application instructions by permit type';
COMMENT ON COLUMN permit_offices.downloadable_applications IS 'JSON structure containing downloadable application forms by type';
COMMENT ON COLUMN permit_offices.processing_times IS 'JSON structure containing processing time information by permit type';
COMMENT ON COLUMN permit_offices.contact_details IS 'JSON structure containing detailed contact information organized by department/role';
COMMENT ON COLUMN permit_offices.office_details IS 'JSON structure containing detailed office information like staff directory and divisions';
COMMENT ON COLUMN permit_offices.permit_categories IS 'JSON structure containing detailed permit categories and subcategories';
COMMENT ON COLUMN permit_offices.related_pages IS 'JSON array of related permit office pages with URLs and titles';
COMMENT ON COLUMN permit_offices.confidence_score IS 'Data quality confidence score from 0.00 to 1.00';
COMMENT ON COLUMN permit_offices.pages_crawled IS 'Number of pages crawled for this office during last scraping session';
COMMENT ON COLUMN permit_offices.crawl_depth IS 'Maximum depth reached during crawling for this office';