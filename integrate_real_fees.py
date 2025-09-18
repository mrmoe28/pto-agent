#!/usr/bin/env python3
"""
Integrate real permit fee data into the database
"""

import json
import sys
import os
from datetime import datetime

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def load_real_fee_data():
    """Load the real fee data from the JSON file"""
    # Find the most recent real fee data file
    import glob
    fee_files = glob.glob("real_permit_fees_*.json")
    if not fee_files:
        print("❌ No real fee data files found. Run add_real_fee_data.py first.")
        return None
    
    # Get the most recent file
    latest_file = max(fee_files, key=os.path.getctime)
    print(f"📁 Loading real fee data from: {latest_file}")
    
    with open(latest_file, 'r') as f:
        return json.load(f)

def create_database_update_script():
    """Create a script to update the database with real fee data"""
    
    real_fees = load_real_fee_data()
    if not real_fees:
        return
    
    # Create SQL update statements
    sql_updates = []
    
    for city, data in real_fees.items():
        # Convert data to JSON string for database
        permit_fees_json = json.dumps(data.get('permitFees', {}))
        instructions_json = json.dumps(data.get('instructions', {}))
        downloadable_apps_json = json.dumps(data.get('downloadableApplications', {}))
        processing_times_json = json.dumps(data.get('processingTimes', {}))
        
        # Create UPDATE statement
        sql = f"""
UPDATE permit_offices 
SET 
    permit_fees = '{permit_fees_json}',
    instructions = '{instructions_json}',
    downloadable_applications = '{downloadable_apps_json}',
    processing_times = '{processing_times_json}',
    updated_at = NOW()
WHERE city = '{city}' AND state = 'GA';
"""
        sql_updates.append(sql)
    
    # Save SQL script
    sql_file = f"update_real_fees_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql"
    with open(sql_file, 'w') as f:
        f.write("-- Real permit fee data integration script\n")
        f.write(f"-- Generated on: {datetime.now()}\n\n")
        for sql in sql_updates:
            f.write(sql + "\n")
    
    print(f"✅ SQL update script created: {sql_file}")
    return sql_file

def create_api_update_script():
    """Create a Node.js script to update the database via API"""
    
    real_fees = load_real_fee_data()
    if not real_fees:
        return
    
    # Create Node.js script
    js_script = f"""
const {{ drizzle }} = require('drizzle-orm/neon-serverless');
const {{ Pool }} = require('@neondatabase/serverless');
const {{ eq, and }} = require('drizzle-orm');
const {{ pgTable, text, timestamp, uuid, boolean, jsonb }} = require('drizzle-orm/pg-core');

// Define the schema
const permitOffices = pgTable('permit_offices', {{
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', {{ mode: 'date' }}).defaultNow(),
  updatedAt: timestamp('updated_at', {{ mode: 'date' }}).defaultNow(),
  city: text('city').notNull(),
  county: text('county').notNull(),
  state: text('state').notNull(),
  jurisdictionType: text('jurisdiction_type').notNull(),
  departmentName: text('department_name').notNull(),
  officeType: text('office_type').notNull(),
  address: text('address').notNull(),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  hoursMonday: text('hours_monday'),
  hoursTuesday: text('hours_tuesday'),
  hoursWednesday: text('hours_wednesday'),
  hoursThursday: text('hours_thursday'),
  hoursFriday: text('hours_friday'),
  hoursSaturday: text('hours_saturday'),
  hoursSunday: text('hours_sunday'),
  buildingPermits: boolean('building_permits').default(false),
  electricalPermits: boolean('electrical_permits').default(false),
  plumbingPermits: boolean('plumbing_permits').default(false),
  mechanicalPermits: boolean('mechanical_permits').default(false),
  zoningPermits: boolean('zoning_permits').default(false),
  planningReview: boolean('planning_review').default(false),
  inspections: boolean('inspections').default(false),
  onlineApplications: boolean('online_applications').default(false),
  onlinePayments: boolean('online_payments').default(false),
  permitTracking: boolean('permit_tracking').default(false),
  onlinePortalUrl: text('online_portal_url'),
  permitFees: jsonb('permit_fees'),
  instructions: jsonb('instructions'),
  downloadableApplications: jsonb('downloadable_applications'),
  processingTimes: jsonb('processing_times'),
  latitude: text('latitude'),
  longitude: text('longitude'),
  serviceAreaBounds: jsonb('service_area_bounds'),
  dataSource: text('data_source').default('manual'),
  lastVerified: timestamp('last_verified', {{ mode: 'date' }}),
  crawlFrequency: text('crawl_frequency').default('monthly'),
  active: boolean('active').default(true),
}});

async function updateDatabase() {{
  try {{
    console.log('🚀 Updating database with real permit fee data...');
    
    const DATABASE_URL = process.env.DATABASE_URL;
    if (!DATABASE_URL) {{
      console.error('❌ DATABASE_URL environment variable is required');
      process.exit(1);
    }}
    
    const pool = new Pool({{ connectionString: DATABASE_URL }});
    const db = drizzle(pool);
    
    const realFees = {json.dumps(real_fees, indent=2)};
    
    let updatedCount = 0;
    
    for (const [city, data] of Object.entries(realFees)) {{
      console.log(`📝 Updating ${{city}} permit office...`);
      
      const result = await db
        .update(permitOffices)
        .set({{
          permitFees: data.permitFees || null,
          instructions: data.instructions || null,
          downloadableApplications: data.downloadableApplications || null,
          processingTimes: data.processingTimes || null,
        }})
        .where(
          and(
            eq(permitOffices.city, city),
            eq(permitOffices.state, 'GA')
          )
        );
      
      console.log(`✅ Updated ${{city}} permit office with real fee data`);
      updatedCount++;
    }}
    
    await pool.end();
    
    console.log('🎉 Database update complete!');
    console.log(`📊 Updated ${{updatedCount}} permit offices with real fee data`);
    console.log('📋 Real data now includes:');
    console.log('   - Actual permit fees from government sources');
    console.log('   - Real processing times and instructions');
    console.log('   - Downloadable application forms');
    console.log('   - Comprehensive permit information');
    
  }} catch (error) {{
    console.error('❌ Error updating database:', error);
    process.exit(1);
  }}
}}

updateDatabase();
"""
    
    # Save JavaScript script
    js_file = f"update_real_fees_{datetime.now().strftime('%Y%m%d_%H%M%S')}.js"
    with open(js_file, 'w') as f:
        f.write(js_script)
    
    print(f"✅ Node.js update script created: {js_file}")
    return js_file

def main():
    """Main function to create database update scripts"""
    print("🚀 Creating database update scripts for real permit fee data...")
    
    # Create SQL script
    sql_file = create_database_update_script()
    
    # Create Node.js script
    js_file = create_api_update_script()
    
    print(f"\n🎉 Update scripts created successfully!")
    print(f"📁 SQL script: {sql_file}")
    print(f"📁 Node.js script: {js_file}")
    print(f"\n💡 To update the database:")
    print(f"   1. Set DATABASE_URL environment variable")
    print(f"   2. Run: node {js_file}")
    print(f"   3. Or execute the SQL script directly in your database")

if __name__ == "__main__":
    main()
