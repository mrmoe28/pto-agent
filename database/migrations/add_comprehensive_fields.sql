-- Migration to add comprehensive permit office fields
-- This migration adds all the enhanced fields that are collected by the multi-page scraper

-- Enhanced comprehensive data fields (JSON columns for complex data)
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS permit_fees JSONB;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS instructions JSONB;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS downloadable_applications JSONB;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS processing_times JSONB;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS contact_details JSONB;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS office_details JSONB;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS permit_categories JSONB;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS related_pages JSONB;

-- Additional contact methods
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS fax VARCHAR(50);
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS alternative_phones TEXT[];
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS alternative_emails TEXT[];

-- Detailed service information
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS service_area_description TEXT;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS staff_directory TEXT[];
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS department_divisions TEXT[];

-- Permit-specific details
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS permit_types_available TEXT[];
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS special_requirements JSONB;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS inspection_services TEXT[];

-- Operational details
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS seasonal_hours JSONB;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS appointment_required BOOLEAN;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS walk_in_hours VARCHAR(200);

-- Digital services
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS online_portal_features TEXT[];
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS mobile_app_available BOOLEAN;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS document_upload_supported BOOLEAN;

-- Scraping metadata
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS source_url VARCHAR(500);
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS scraped_at TIMESTAMPTZ;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS pages_crawled INTEGER;
ALTER TABLE permit_offices ADD COLUMN IF NOT EXISTS crawl_depth INTEGER;

-- Update data_source enum to include 'web_search'
ALTER TABLE permit_offices DROP CONSTRAINT IF EXISTS permit_offices_data_source_check;
ALTER TABLE permit_offices ADD CONSTRAINT permit_offices_data_source_check
  CHECK (data_source IN ('crawled', 'api', 'manual', 'web_search'));

-- Create indexes for new searchable fields
CREATE INDEX IF NOT EXISTS idx_permit_offices_source_url ON permit_offices(source_url);
CREATE INDEX IF NOT EXISTS idx_permit_offices_confidence_score ON permit_offices(confidence_score);
CREATE INDEX IF NOT EXISTS idx_permit_offices_scraped_at ON permit_offices(scraped_at);
CREATE INDEX IF NOT EXISTS idx_permit_offices_permit_types ON permit_offices USING GIN(permit_types_available);
CREATE INDEX IF NOT EXISTS idx_permit_offices_permit_fees ON permit_offices USING GIN(permit_fees);
CREATE INDEX IF NOT EXISTS idx_permit_offices_processing_times ON permit_offices USING GIN(processing_times);

-- Add comments for documentation
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