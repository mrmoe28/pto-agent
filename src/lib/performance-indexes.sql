-- Performance indexes for permit office searches
-- Run this SQL to optimize database queries

-- Index for location-based searches (city, county, state)
CREATE INDEX IF NOT EXISTS idx_permit_offices_location
ON permit_offices (state, county, city, active)
WHERE active = true;

-- Index for coordinate-based searches
CREATE INDEX IF NOT EXISTS idx_permit_offices_coordinates
ON permit_offices (latitude, longitude, active)
WHERE active = true AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index for service-based searches (online applications)
CREATE INDEX IF NOT EXISTS idx_permit_offices_services
ON permit_offices (jurisdiction_type, online_applications, active)
WHERE active = true;

-- Index for popular office queries
CREATE INDEX IF NOT EXISTS idx_permit_offices_popular
ON permit_offices (jurisdiction_type, building_permits, electrical_permits, plumbing_permits, website, active)
WHERE active = true;

-- Composite index for address searches
CREATE INDEX IF NOT EXISTS idx_permit_offices_address_search
ON permit_offices (state, city, county, jurisdiction_type, active)
WHERE active = true;

-- Index for missing coordinates (for background population)
CREATE INDEX IF NOT EXISTS idx_permit_offices_missing_coords
ON permit_offices (active, latitude, longitude, address, jurisdiction_type)
WHERE active = true AND (latitude IS NULL OR longitude IS NULL);

-- Analyze tables to update statistics
ANALYZE permit_offices;