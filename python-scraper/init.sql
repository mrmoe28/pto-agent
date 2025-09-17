-- Database initialization script for permit office scraper
-- This creates the necessary tables if they don't exist

-- Create the permit_offices table (matching your existing schema)
CREATE TABLE IF NOT EXISTS permit_offices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Location Information
    city VARCHAR(255) NOT NULL,
    county VARCHAR(255) NOT NULL,
    state VARCHAR(10) NOT NULL,
    jurisdiction_type VARCHAR(50) NOT NULL,
    
    -- Office Details
    department_name VARCHAR(500) NOT NULL,
    office_type VARCHAR(50) NOT NULL,
    
    -- Contact Information
    address TEXT NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    website TEXT,
    
    -- Operating Hours
    hours_monday VARCHAR(100),
    hours_tuesday VARCHAR(100),
    hours_wednesday VARCHAR(100),
    hours_thursday VARCHAR(100),
    hours_friday VARCHAR(100),
    hours_saturday VARCHAR(100),
    hours_sunday VARCHAR(100),
    
    -- Services Offered
    building_permits BOOLEAN DEFAULT FALSE,
    electrical_permits BOOLEAN DEFAULT FALSE,
    plumbing_permits BOOLEAN DEFAULT FALSE,
    mechanical_permits BOOLEAN DEFAULT FALSE,
    zoning_permits BOOLEAN DEFAULT FALSE,
    planning_review BOOLEAN DEFAULT FALSE,
    inspections BOOLEAN DEFAULT FALSE,
    
    -- Online Services
    online_applications BOOLEAN DEFAULT FALSE,
    online_payments BOOLEAN DEFAULT FALSE,
    permit_tracking BOOLEAN DEFAULT FALSE,
    online_portal_url TEXT,
    
    -- Geographic Data
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    service_area_bounds JSONB,
    
    -- Metadata
    data_source VARCHAR(50) DEFAULT 'crawled',
    last_verified TIMESTAMP WITH TIME ZONE,
    crawl_frequency VARCHAR(20) DEFAULT 'weekly',
    active BOOLEAN DEFAULT TRUE,
    
    -- Scraping metadata
    source_url TEXT,
    scraped_at TIMESTAMP WITH TIME ZONE,
    confidence_score DECIMAL(3, 2)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_permit_offices_location ON permit_offices(city, county, state);
CREATE INDEX IF NOT EXISTS idx_permit_offices_coordinates ON permit_offices(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_permit_offices_active ON permit_offices(active);
CREATE INDEX IF NOT EXISTS idx_permit_offices_data_source ON permit_offices(data_source);
CREATE INDEX IF NOT EXISTS idx_permit_offices_updated_at ON permit_offices(updated_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_permit_offices_updated_at ON permit_offices;
CREATE TRIGGER update_permit_offices_updated_at
    BEFORE UPDATE ON permit_offices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO permit_offices (
    city, county, state, jurisdiction_type, department_name, office_type,
    address, phone, email, website, building_permits, electrical_permits,
    plumbing_permits, online_applications, data_source, active
) VALUES (
    'Atlanta', 'Fulton', 'GA', 'city', 'Department of City Planning - Bureau of Buildings',
    'combined', '55 Trinity Avenue SW, Suite 3350, Atlanta, GA 30303',
    '(404) 330-6145', 'permits@atlantaga.gov',
    'https://www.atlantaga.gov/government/departments/city-planning/bureau-of-buildings',
    TRUE, TRUE, TRUE, TRUE, 'manual', TRUE
) ON CONFLICT DO NOTHING;

-- Create a view for easy querying
CREATE OR REPLACE VIEW active_permit_offices AS
SELECT 
    id, city, county, state, jurisdiction_type, department_name, office_type,
    address, phone, email, website, latitude, longitude,
    building_permits, electrical_permits, plumbing_permits, mechanical_permits,
    zoning_permits, planning_review, inspections,
    online_applications, online_payments, permit_tracking, online_portal_url,
    data_source, last_verified, confidence_score
FROM permit_offices
WHERE active = TRUE;

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE permit_offices TO scraper;
GRANT ALL PRIVILEGES ON VIEW active_permit_offices TO scraper;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO scraper;
