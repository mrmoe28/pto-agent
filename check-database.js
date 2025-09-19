const { neon } = require('@neondatabase/serverless');

async function checkDatabase() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('Checking database connection...');
    
    // Check if table exists and count records
    const countResult = await sql`SELECT COUNT(*) as count FROM permit_offices`;
    console.log('Total permit offices in database:', countResult[0].count);
    
    // Get sample data
    const sampleData = await sql`SELECT city, county, department_name, data_source FROM permit_offices LIMIT 5`;
    console.log('Sample data:');
    sampleData.forEach((row, index) => {
      console.log(`${index + 1}. ${row.city}, ${row.county} - ${row.department_name} (${row.data_source})`);
    });
    
    // Check for Jonesboro/Clayton County specifically
    const jonesboroData = await sql`SELECT * FROM permit_offices WHERE city ILIKE '%jonesboro%' OR county ILIKE '%clayton%' LIMIT 3`;
    console.log('\nJonesboro/Clayton County data:');
    jonesboroData.forEach((row, index) => {
      console.log(`${index + 1}. ${row.city}, ${row.county} - ${row.department_name}`);
    });
    
  } catch (error) {
    console.error('Database error:', error.message);
  }
}

checkDatabase();
