-- Performance optimization indexes for permit_offices table
-- These indexes will significantly improve query performance for common search patterns

-- 1. Core location-based searches (city, county, state combinations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permit_offices_location_active
ON permit_offices(state, county, city, active)
WHERE active = true;

-- 2. Geographic/coordinate-based searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permit_offices_coordinates
ON permit_offices(latitude, longitude, active)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND active = true;

-- 3. Services-based filtering (most common permit types)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permit_offices_services
ON permit_offices(building_permits, electrical_permits, plumbing_permits, active)
WHERE active = true;

-- 4. Jurisdiction type prioritization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permit_offices_jurisdiction_state
ON permit_offices(jurisdiction_type, state, active)
WHERE active = true;

-- 5. Online services filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permit_offices_online_services
ON permit_offices(online_applications, online_payments, permit_tracking, active)
WHERE active = true;

-- 6. Data freshness and verification
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permit_offices_last_verified
ON permit_offices(last_verified, data_source, active)
WHERE active = true;

-- 7. Text search optimization for city names (case-insensitive)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permit_offices_city_text
ON permit_offices USING gin (to_tsvector('english', city))
WHERE active = true;

-- 8. Text search optimization for county names (case-insensitive)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permit_offices_county_text
ON permit_offices USING gin (to_tsvector('english', county))
WHERE active = true;

-- 9. Composite index for most common search pattern
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permit_offices_search_priority
ON permit_offices(state, active, jurisdiction_type, city, county)
WHERE active = true;

-- 10. Website availability (for prioritizing offices with online presence)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_permit_offices_website_available
ON permit_offices(website, active)
WHERE website IS NOT NULL AND active = true;

-- Performance statistics and monitoring
-- Run these queries to monitor index usage and performance

-- Query to check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE tablename = 'permit_offices'
-- ORDER BY idx_scan DESC;

-- Query to check table statistics:
-- SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup
-- FROM pg_stat_user_tables
-- WHERE tablename = 'permit_offices';

-- Query to find slow queries:
-- SELECT query, mean_time, calls, total_time
-- FROM pg_stat_statements
-- WHERE query LIKE '%permit_offices%'
-- ORDER BY mean_time DESC
-- LIMIT 10;