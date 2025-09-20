const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testQuery() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Test simple query first
    const simpleResult = await sql`SELECT * FROM permit_offices WHERE state = 'GA' LIMIT 5`;
    console.log('Simple query result count:', simpleResult.length);
    console.log('First result:', simpleResult[0]);
    
    // Test with city filter
    const cityResult = await sql`SELECT * FROM permit_offices WHERE state = 'GA' AND city ILIKE '%Atlanta%' LIMIT 5`;
    console.log('City query result count:', cityResult.length);
    if (cityResult.length > 0) {
      console.log('First city result:', cityResult[0]);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testQuery();
