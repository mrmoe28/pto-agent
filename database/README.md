# Database Schema and Migrations

This directory contains the database schema and migration files for the Permit Office Search Application.

## Files

- `../schema.sql` - Complete database schema with all comprehensive fields
- `migrations/add_comprehensive_fields.sql` - Migration to add enhanced scraping fields to existing database

## Applying the Schema

### For New Database Setup
Run the main schema file to create the complete table with all fields:

```sql
\i schema.sql
```

### For Existing Database (Migration)
If you have an existing `permit_offices` table and need to add the comprehensive fields:

```sql
\i database/migrations/add_comprehensive_fields.sql
```

## Database Fields Overview

The `permit_offices` table now includes:

### Core Fields
- Basic office information (id, timestamps, location, contact info)
- Services offered (building permits, electrical, plumbing, etc.)
- Operating hours for each day of the week

### Enhanced Comprehensive Fields (from multi-page scraping)
- `permit_fees` (JSONB) - Fee structures by permit type
- `instructions` (JSONB) - Application instructions by permit type
- `downloadable_applications` (JSONB) - Application forms and documents
- `processing_times` (JSONB) - Processing timeframes by permit type
- `contact_details` (JSONB) - Detailed contact information by department
- `office_details` (JSONB) - Staff directory and department divisions
- `permit_categories` (JSONB) - Detailed permit categories and subcategories
- `related_pages` (JSONB) - Related permit office pages and links

### Additional Contact Methods
- `fax`, `alternative_phones[]`, `alternative_emails[]`

### Service Details
- `service_area_description`, `staff_directory[]`, `department_divisions[]`
- `permit_types_available[]`, `special_requirements` (JSONB)
- `inspection_services[]`

### Operational Information
- `seasonal_hours` (JSONB), `appointment_required`, `walk_in_hours`
- `online_portal_features[]`, `mobile_app_available`, `document_upload_supported`

### Scraping Metadata
- `source_url`, `scraped_at`, `confidence_score`, `pages_crawled`, `crawl_depth`

## Data Population

The table structure supports data from multiple sources:
- Web scraping via the Python scraper
- Manual data entry
- API imports
- Web search results

No hardcoded data is included - all data should be populated through the application's data collection methods.