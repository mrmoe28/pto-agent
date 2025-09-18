#!/usr/bin/env python3
"""
Database migration script to add new enhanced fields to permit_offices table
"""
import asyncio
import asyncpg
import json
import logging
from config import config

logger = logging.getLogger(__name__)

async def migrate_database():
    """Add new enhanced fields to the permit_offices table"""
    
    # SQL to add new columns
    migration_sql = """
    -- Add new enhanced information columns
    ALTER TABLE permit_offices 
    ADD COLUMN IF NOT EXISTS permit_fees JSONB,
    ADD COLUMN IF NOT EXISTS instructions JSONB,
    ADD COLUMN IF NOT EXISTS downloadable_applications JSONB,
    ADD COLUMN IF NOT EXISTS processing_times JSONB;
    
    -- Add indexes for better query performance
    CREATE INDEX IF NOT EXISTS idx_permit_offices_permit_fees ON permit_offices USING GIN (permit_fees);
    CREATE INDEX IF NOT EXISTS idx_permit_offices_instructions ON permit_offices USING GIN (instructions);
    CREATE INDEX IF NOT EXISTS idx_permit_offices_downloadable_apps ON permit_offices USING GIN (downloadable_applications);
    CREATE INDEX IF NOT EXISTS idx_permit_offices_processing_times ON permit_offices USING GIN (processing_times);
    
    -- Add comments to document the new columns
    COMMENT ON COLUMN permit_offices.permit_fees IS 'JSON structure containing permit fees by type (building, electrical, plumbing, etc.)';
    COMMENT ON COLUMN permit_offices.instructions IS 'JSON structure containing application instructions and guidelines by permit type';
    COMMENT ON COLUMN permit_offices.downloadable_applications IS 'JSON structure containing URLs to downloadable application forms by permit type';
    COMMENT ON COLUMN permit_offices.processing_times IS 'JSON structure containing processing time estimates by permit type';
    """
    
    try:
        # Connect to database
        conn = await asyncpg.connect(config.DATABASE_URL)
        
        logger.info("Connected to database. Starting migration...")
        
        # Execute migration
        await conn.execute(migration_sql)
        
        logger.info("Migration completed successfully!")
        
        # Verify the new columns exist
        columns_query = """
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'permit_offices' 
        AND column_name IN ('permit_fees', 'instructions', 'downloadable_applications', 'processing_times')
        ORDER BY column_name;
        """
        
        columns = await conn.fetch(columns_query)
        
        logger.info("New columns added:")
        for column in columns:
            logger.info(f"  - {column['column_name']}: {column['data_type']} (nullable: {column['is_nullable']})")
        
        # Check indexes
        indexes_query = """
        SELECT indexname, indexdef
        FROM pg_indexes 
        WHERE tablename = 'permit_offices' 
        AND indexname LIKE 'idx_permit_offices_%'
        ORDER BY indexname;
        """
        
        indexes = await conn.fetch(indexes_query)
        
        logger.info("New indexes created:")
        for index in indexes:
            logger.info(f"  - {index['indexname']}")
        
        await conn.close()
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise

async def test_migration():
    """Test the migration by inserting sample data"""
    
    sample_data = {
        'permit_fees': {
            'building': {'amount': 150.00, 'description': 'Building permit fee', 'unit': 'USD'},
            'electrical': {'amount': 75.00, 'description': 'Electrical permit fee', 'unit': 'USD'}
        },
        'instructions': {
            'general': 'Submit completed application with required documents and fees',
            'building': 'Include site plans, construction drawings, and structural calculations',
            'requiredDocuments': ['Site plan', 'Construction drawings', 'Structural calculations']
        },
        'downloadable_applications': {
            'building': ['https://example.com/building-permit.pdf'],
            'electrical': ['https://example.com/electrical-permit.pdf']
        },
        'processing_times': {
            'building': {'min': 5, 'max': 10, 'unit': 'days', 'description': 'Building permit processing time'},
            'electrical': {'min': 3, 'max': 5, 'unit': 'days', 'description': 'Electrical permit processing time'}
        }
    }
    
    try:
        conn = await asyncpg.connect(config.DATABASE_URL)
        
        # Insert test data
        test_query = """
        INSERT INTO permit_offices (
            city, county, state, jurisdiction_type, department_name, office_type,
            address, phone, email, website,
            permit_fees, instructions, downloadable_applications, processing_times,
            data_source, active
        ) VALUES (
            'Test City', 'Test County', 'GA', 'city', 'Test Building Department', 'combined',
            '123 Test St, Test City, GA 30000', '(555) 123-4567', 'test@testcity.gov', 'https://testcity.gov',
            $1, $2, $3, $4,
            'manual', true
        ) RETURNING id;
        """
        
        result = await conn.fetchval(
            test_query,
            json.dumps(sample_data['permit_fees']),
            json.dumps(sample_data['instructions']),
            json.dumps(sample_data['downloadable_applications']),
            json.dumps(sample_data['processing_times'])
        )
        
        logger.info(f"Test data inserted with ID: {result}")
        
        # Query the data back to verify
        verify_query = """
        SELECT permit_fees, instructions, downloadable_applications, processing_times
        FROM permit_offices 
        WHERE id = $1;
        """
        
        row = await conn.fetchrow(verify_query, result)
        
        logger.info("Retrieved data:")
        logger.info(f"  Permit fees: {row['permit_fees']}")
        logger.info(f"  Instructions: {row['instructions']}")
        logger.info(f"  Downloadable applications: {row['downloadable_applications']}")
        logger.info(f"  Processing times: {row['processing_times']}")
        
        # Clean up test data
        await conn.execute("DELETE FROM permit_offices WHERE id = $1", result)
        logger.info("Test data cleaned up")
        
        await conn.close()
        
    except Exception as e:
        logger.error(f"Test failed: {e}")
        raise

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    print("Database Migration for Enhanced Permit Office Data")
    print("=================================================")
    
    # Run migration
    asyncio.run(migrate_database())
    
    print("\n" + "="*50 + "\n")
    
    # Test migration
    print("Testing migration with sample data...")
    asyncio.run(test_migration())
    
    print("\nMigration completed successfully!")
