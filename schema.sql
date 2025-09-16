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
  data_source VARCHAR(50) DEFAULT 'manual' CHECK (data_source IN ('crawled', 'api', 'manual')),
  last_verified TIMESTAMPTZ,
  crawl_frequency VARCHAR(50) DEFAULT 'monthly' CHECK (crawl_frequency IN ('daily', 'weekly', 'monthly')),
  active BOOLEAN DEFAULT true,

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

-- Sample insert statement (commented out)
/*
INSERT INTO permit_offices (
  city, county, state, jurisdiction_type, department_name, office_type,
  address, phone, email, website,
  building_permits, electrical_permits, plumbing_permits,
  active
) VALUES (
  'Atlanta', 'Fulton', 'GA', 'city', 'City of Atlanta Building Department', 'building',
  '55 Trinity Avenue SW, Atlanta, GA 30303', '404-330-6100', 'permits@atlantaga.gov', 'https://www.atlantaga.gov/permits',
  true, true, true,
  true
);
*/