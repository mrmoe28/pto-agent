"""
Database service for syncing scraped data with the web application
"""
import asyncio
import asyncpg
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging
from models import PermitOffice, ScrapingResult
from config import config

logger = logging.getLogger(__name__)

class DatabaseService:
    """Service for database operations with improved connection pool management"""

    def __init__(self,
                 min_connections: int = 1,
                 max_connections: int = 10,
                 connection_timeout: float = 30.0,
                 command_timeout: float = 60.0):
        self.pool = None
        self.min_connections = min_connections
        self.max_connections = max_connections
        self.connection_timeout = connection_timeout
        self.command_timeout = command_timeout
        self._pool_lock = asyncio.Lock()

    async def __aenter__(self):
        """Async context manager entry with improved pool configuration"""
        async with self._pool_lock:
            if self.pool is None:
                try:
                    self.pool = await asyncpg.create_pool(
                        config.DATABASE_URL,
                        min_size=self.min_connections,
                        max_size=self.max_connections,
                        timeout=self.connection_timeout,
                        command_timeout=self.command_timeout,
                        max_inactive_connection_lifetime=300.0,  # 5 minutes
                        max_queries=50000,  # Reset connection after this many queries
                        setup=self._setup_connection
                    )
                    logger.info(f"Created database pool with {self.min_connections}-{self.max_connections} connections")
                except Exception as e:
                    logger.error(f"Failed to create database pool: {e}")
                    raise
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit with proper cleanup"""
        if self.pool:
            try:
                # Close the pool gracefully with timeout
                await asyncio.wait_for(self.pool.close(), timeout=30.0)
                logger.info("Database pool closed successfully")
            except asyncio.TimeoutError:
                logger.warning("Database pool close timed out")
            except Exception as e:
                logger.error(f"Error closing database pool: {e}")
            finally:
                self.pool = None

    async def _setup_connection(self, connection):
        """Setup function called for each new connection"""
        try:
            # Set connection-specific settings
            await connection.execute("SET timezone = 'UTC'")
            await connection.execute("SET statement_timeout = '60s'")
            await connection.execute("SET lock_timeout = '30s'")
            logger.debug("Database connection configured")
        except Exception as e:
            logger.warning(f"Failed to setup database connection: {e}")

    async def _get_connection(self):
        """Get a connection from the pool with error handling"""
        if self.pool is None:
            raise RuntimeError("Database pool not initialized")

        try:
            return await asyncio.wait_for(
                self.pool.acquire(),
                timeout=self.connection_timeout
            )
        except asyncio.TimeoutError:
            logger.error("Timeout acquiring database connection")
            raise
        except Exception as e:
            logger.error(f"Error acquiring database connection: {e}")
            raise
    
    async def save_office(self, office: PermitOffice) -> Optional[str]:
        """Save a permit office to the database with improved error handling"""
        connection = None
        try:
            connection = await self._get_connection()

            # Check if office already exists
            existing = await connection.fetchrow(
                    """
                    SELECT id FROM permit_offices 
                    WHERE department_name = $1 AND city = $2 AND state = $3
                    """,
                    office.department_name, office.city, office.state
                )
                
                if existing:
                    # Update existing office
                    await connection.execute(
                        """
                        UPDATE permit_offices SET
                            county = $2,
                            jurisdiction_type = $3,
                            office_type = $4,
                            address = $5,
                            phone = $6,
                            email = $7,
                            website = $8,
                            hours_monday = $9,
                            hours_tuesday = $10,
                            hours_wednesday = $11,
                            hours_thursday = $12,
                            hours_friday = $13,
                            hours_saturday = $14,
                            hours_sunday = $15,
                            building_permits = $16,
                            electrical_permits = $17,
                            plumbing_permits = $18,
                            mechanical_permits = $19,
                            zoning_permits = $20,
                            planning_review = $21,
                            inspections = $22,
                            online_applications = $23,
                            online_payments = $24,
                            permit_tracking = $25,
                            online_portal_url = $26,
                            latitude = $27,
                            longitude = $28,
                            service_area_bounds = $29,
                            data_source = $30,
                            last_verified = $31,
                            crawl_frequency = $32,
                            active = $33,
                            updated_at = NOW()
                        WHERE id = $1
                        """,
                        existing['id'],
                        office.county,
                        office.jurisdiction_type.value,
                        office.office_type.value,
                        office.address,
                        office.phone,
                        office.email,
                        office.website,
                        office.hours_monday,
                        office.hours_tuesday,
                        office.hours_wednesday,
                        office.hours_thursday,
                        office.hours_friday,
                        office.hours_saturday,
                        office.hours_sunday,
                        office.building_permits,
                        office.electrical_permits,
                        office.plumbing_permits,
                        office.mechanical_permits,
                        office.zoning_permits,
                        office.planning_review,
                        office.inspections,
                        office.online_applications,
                        office.online_payments,
                        office.permit_tracking,
                        office.online_portal_url,
                        office.latitude,
                        office.longitude,
                        office.service_area_bounds,
                        office.data_source.value,
                        office.last_verified,
                        office.crawl_frequency.value,
                        office.active
                    )
                    logger.info(f"Updated office: {office.department_name}")
                    return existing['id']
                else:
                    # Insert new office
                    result = await connection.fetchrow(
                        """
                        INSERT INTO permit_offices (
                            city, county, state, jurisdiction_type, department_name,
                            office_type, address, phone, email, website,
                            hours_monday, hours_tuesday, hours_wednesday, hours_thursday,
                            hours_friday, hours_saturday, hours_sunday,
                            building_permits, electrical_permits, plumbing_permits,
                            mechanical_permits, zoning_permits, planning_review, inspections,
                            online_applications, online_payments, permit_tracking,
                            online_portal_url, latitude, longitude, service_area_bounds,
                            data_source, last_verified, crawl_frequency, active,
                            created_at, updated_at
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                            $31, $32, $33, $34, NOW(), NOW()
                        ) RETURNING id
                        """,
                        office.city,
                        office.county,
                        office.state,
                        office.jurisdiction_type.value,
                        office.department_name,
                        office.office_type.value,
                        office.address,
                        office.phone,
                        office.email,
                        office.website,
                        office.hours_monday,
                        office.hours_tuesday,
                        office.hours_wednesday,
                        office.hours_thursday,
                        office.hours_friday,
                        office.hours_saturday,
                        office.hours_sunday,
                        office.building_permits,
                        office.electrical_permits,
                        office.plumbing_permits,
                        office.mechanical_permits,
                        office.zoning_permits,
                        office.planning_review,
                        office.inspections,
                        office.online_applications,
                        office.online_payments,
                        office.permit_tracking,
                        office.online_portal_url,
                        office.latitude,
                        office.longitude,
                        office.service_area_bounds,
                        office.data_source.value,
                        office.last_verified,
                        office.crawl_frequency.value,
                        office.active
                    )
                    logger.info(f"Inserted new office: {office.department_name}")
                    return result['id']

        except Exception as e:
            logger.error(f"Failed to save office {office.department_name}: {e}")
            return None
        finally:
            if connection:
                try:
                    await self.pool.release(connection)
                except Exception as e:
                    logger.warning(f"Error releasing database connection: {e}")
    
    async def save_offices_batch(self, offices: List[PermitOffice]) -> Dict[str, Any]:
        """Save multiple offices in a batch with transaction support"""
        results = {
            'saved': 0,
            'updated': 0,
            'errors': 0,
            'office_ids': []
        }

        if not offices:
            return results

        connection = None
        try:
            connection = await self._get_connection()

            # Use transaction for batch operations
            async with connection.transaction():
                for office in offices:
                    try:
                        # Check if office already exists
                        existing = await connection.fetchrow(
                            """
                            SELECT id FROM permit_offices
                            WHERE department_name = $1 AND city = $2 AND state = $3
                            """,
                            office.department_name, office.city, office.state
                        )

                        if existing:
                            # Update existing office (same query as save_office)
                            await connection.execute(
                                """
                                UPDATE permit_offices SET
                                    county = $2, jurisdiction_type = $3, office_type = $4,
                                    address = $5, phone = $6, email = $7, website = $8,
                                    hours_monday = $9, hours_tuesday = $10, hours_wednesday = $11,
                                    hours_thursday = $12, hours_friday = $13, hours_saturday = $14,
                                    hours_sunday = $15, building_permits = $16, electrical_permits = $17,
                                    plumbing_permits = $18, mechanical_permits = $19, zoning_permits = $20,
                                    planning_review = $21, inspections = $22, online_applications = $23,
                                    online_payments = $24, permit_tracking = $25, online_portal_url = $26,
                                    latitude = $27, longitude = $28, service_area_bounds = $29,
                                    data_source = $30, last_verified = $31, crawl_frequency = $32,
                                    active = $33, updated_at = NOW()
                                WHERE id = $1
                                """,
                                existing['id'], office.county, office.jurisdiction_type.value if office.jurisdiction_type else None,
                                office.office_type.value if office.office_type else None, office.address, office.phone, office.email,
                                office.website, office.hours_monday, office.hours_tuesday, office.hours_wednesday,
                                office.hours_thursday, office.hours_friday, office.hours_saturday, office.hours_sunday,
                                office.building_permits, office.electrical_permits, office.plumbing_permits,
                                office.mechanical_permits, office.zoning_permits, office.planning_review,
                                office.inspections, office.online_applications, office.online_payments,
                                office.permit_tracking, office.online_portal_url, office.latitude, office.longitude,
                                office.service_area_bounds, office.data_source.value if office.data_source else None,
                                office.last_verified, office.crawl_frequency.value if office.crawl_frequency else None,
                                office.active
                            )
                            results['office_ids'].append(existing['id'])
                            results['updated'] += 1
                        else:
                            # Insert new office
                            result = await connection.fetchrow(
                                """
                                INSERT INTO permit_offices (
                                    city, county, state, jurisdiction_type, department_name,
                                    office_type, address, phone, email, website,
                                    hours_monday, hours_tuesday, hours_wednesday, hours_thursday,
                                    hours_friday, hours_saturday, hours_sunday,
                                    building_permits, electrical_permits, plumbing_permits,
                                    mechanical_permits, zoning_permits, planning_review, inspections,
                                    online_applications, online_payments, permit_tracking,
                                    online_portal_url, latitude, longitude, service_area_bounds,
                                    data_source, last_verified, crawl_frequency, active,
                                    created_at, updated_at
                                ) VALUES (
                                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                                    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                                    $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
                                    $31, $32, $33, $34, NOW(), NOW()
                                ) RETURNING id
                                """,
                                office.city, office.county, office.state,
                                office.jurisdiction_type.value if office.jurisdiction_type else None,
                                office.department_name, office.office_type.value if office.office_type else None,
                                office.address, office.phone, office.email, office.website,
                                office.hours_monday, office.hours_tuesday, office.hours_wednesday,
                                office.hours_thursday, office.hours_friday, office.hours_saturday,
                                office.hours_sunday, office.building_permits, office.electrical_permits,
                                office.plumbing_permits, office.mechanical_permits, office.zoning_permits,
                                office.planning_review, office.inspections, office.online_applications,
                                office.online_payments, office.permit_tracking, office.online_portal_url,
                                office.latitude, office.longitude, office.service_area_bounds,
                                office.data_source.value if office.data_source else None,
                                office.last_verified, office.crawl_frequency.value if office.crawl_frequency else None,
                                office.active
                            )
                            results['office_ids'].append(result['id'])
                            results['saved'] += 1

                    except Exception as e:
                        logger.error(f"Error saving office {office.department_name} in batch: {e}")
                        results['errors'] += 1

        except Exception as e:
            logger.error(f"Batch save transaction failed: {e}")
            results['errors'] = len(offices)  # Mark all as errors
        finally:
            if connection:
                try:
                    await self.pool.release(connection)
                except Exception as e:
                    logger.warning(f"Error releasing database connection: {e}")

        return results
    
    async def get_offices_by_location(self, latitude: float, longitude: float, radius_miles: float = 50) -> List[Dict[str, Any]]:
        """Get offices within a radius of the given coordinates"""
        try:
            async with self.pool.acquire() as conn:
                # Use Haversine formula for distance calculation
                offices = await conn.fetch(
                    """
                    SELECT *, 
                        (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * 
                         cos(radians(longitude) - radians($2)) + 
                         sin(radians($1)) * sin(radians(latitude)))) * 0.621371 as distance_miles
                    FROM permit_offices 
                    WHERE latitude IS NOT NULL 
                    AND longitude IS NOT NULL 
                    AND active = true
                    HAVING distance_miles <= $3
                    ORDER BY distance_miles
                    """,
                    latitude, longitude, radius_miles
                )
                
                return [dict(office) for office in offices]
                
        except Exception as e:
            logger.error(f"Failed to get offices by location: {e}")
            return []
    
    async def get_offices_by_city_county(self, city: str, county: str, state: str) -> List[Dict[str, Any]]:
        """Get offices by city, county, and state"""
        try:
            async with self.pool.acquire() as conn:
                offices = await conn.fetch(
                    """
                    SELECT * FROM permit_offices 
                    WHERE city ILIKE $1 
                    AND county ILIKE $2 
                    AND state = $3 
                    AND active = true
                    ORDER BY department_name
                    """,
                    f'%{city}%', f'%{county}%', state
                )
                
                return [dict(office) for office in offices]
                
        except Exception as e:
            logger.error(f"Failed to get offices by city/county: {e}")
            return []
    
    async def update_office_confidence(self, office_id: str, confidence_score: float):
        """Update confidence score for an office"""
        try:
            async with self.pool.acquire() as conn:
                await conn.execute(
                    "UPDATE permit_offices SET confidence_score = $1, updated_at = NOW() WHERE id = $2",
                    confidence_score, office_id
                )
        except Exception as e:
            logger.error(f"Failed to update confidence for office {office_id}: {e}")
    
    async def mark_office_inactive(self, office_id: str):
        """Mark an office as inactive"""
        try:
            async with self.pool.acquire() as conn:
                await conn.execute(
                    "UPDATE permit_offices SET active = false, updated_at = NOW() WHERE id = $1",
                    office_id
                )
        except Exception as e:
            logger.error(f"Failed to mark office {office_id} as inactive: {e}")
    
    async def get_scraping_stats(self) -> Dict[str, Any]:
        """Get statistics about scraped data"""
        try:
            async with self.pool.acquire() as conn:
                stats = await conn.fetchrow(
                    """
                    SELECT 
                        COUNT(*) as total_offices,
                        COUNT(CASE WHEN active = true THEN 1 END) as active_offices,
                        COUNT(CASE WHEN data_source = 'crawled' THEN 1 END) as crawled_offices,
                        COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as geocoded_offices,
                        AVG(confidence_score) as avg_confidence
                    FROM permit_offices
                    """
                )
                
                return dict(stats)
                
        except Exception as e:
            logger.error(f"Failed to get scraping stats: {e}")
            return {}
    
    async def cleanup_old_data(self, days_old: int = 30):
        """Clean up old inactive offices"""
        try:
            async with self.pool.acquire() as conn:
                result = await conn.execute(
                    """
                    DELETE FROM permit_offices 
                    WHERE active = false 
                    AND updated_at < NOW() - INTERVAL '%s days'
                    """,
                    days_old
                )
                
                logger.info(f"Cleaned up {result} old inactive offices")
                
        except Exception as e:
            logger.error(f"Failed to cleanup old data: {e}")
