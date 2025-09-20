# Database Migration Instructions

## Prerequisites

Before running the migration, you need to set up your database connection:

### 1. Environment Variables

Create or update your `.env.local` file with your Neon database connection string:

```bash
# .env.local
DATABASE_URL="postgresql://[username]:[password]@[host]/[database]?sslmode=require"
```

**To get your DATABASE_URL:**
1. Go to your Neon Database dashboard
2. Navigate to your project
3. Go to "Connection Details"
4. Copy the connection string for Node.js

### 2. Run the Migration

Once your DATABASE_URL is set, run the migration:

```bash
npm run migrate:db
```

## What the Migration Does

The migration adds **25+ new comprehensive fields** to your `permit_offices` table:

### Enhanced Data Fields (JSONB):
- `permit_fees` - Fee structures by permit type
- `instructions` - Application instructions by permit type
- `downloadable_applications` - Forms and documents
- `processing_times` - Processing timeframes by permit type
- `contact_details` - Detailed contact information by department
- `office_details` - Staff directory and department divisions
- `permit_categories` - Detailed permit categories and subcategories
- `related_pages` - Related permit office pages and links

### Additional Contact Fields:
- `fax` - Fax number
- `alternative_phones[]` - Array of alternative phone numbers
- `alternative_emails[]` - Array of alternative email addresses

### Service Detail Fields:
- `service_area_description` - Description of service area
- `staff_directory[]` - Array of staff members
- `department_divisions[]` - Array of department divisions
- `permit_types_available[]` - Array of available permit types
- `special_requirements` (JSONB) - Special requirements by permit type
- `inspection_services[]` - Array of inspection services

### Operational Fields:
- `seasonal_hours` (JSONB) - Special hours during certain seasons
- `appointment_required` - Whether appointments are required
- `walk_in_hours` - Walk-in hours description
- `online_portal_features[]` - Array of online portal features
- `mobile_app_available` - Whether a mobile app is available
- `document_upload_supported` - Whether document upload is supported

### Scraping Metadata:
- `source_url` - URL where data was scraped from
- `scraped_at` - Timestamp of when data was scraped
- `confidence_score` - Data quality score (0.00 to 1.00)
- `pages_crawled` - Number of pages crawled for this office
- `crawl_depth` - Maximum depth reached during crawling

## Manual Migration (Alternative)

If you prefer to run the migration manually, you can:

1. Connect to your Neon database using their SQL Editor or any PostgreSQL client
2. Run the SQL commands from: `database/migrations/add_comprehensive_fields.sql`

## Verification

After running the migration, you can verify it worked by:

1. Checking the table structure in your database interface
2. Looking for the new columns in your Neon database dashboard
3. Running a simple query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'permit_offices';`

## Next Steps

After the migration is complete:

1. **Run the Python scraper** to populate the new comprehensive fields
2. **Check your database tables** - you should now see many more columns
3. **The enhanced scraper data** will now be stored in these comprehensive fields

## Troubleshooting

**Error: "No database connection string"**
- Make sure your `.env.local` file contains the correct `DATABASE_URL`
- Ensure you're running the command from the project root directory

**Error: "Column already exists"**
- This is normal if you've run the migration before
- The script will skip existing columns and continue

**Permission errors**
- Ensure your database user has CREATE and ALTER permissions
- Check that your connection string includes the correct credentials