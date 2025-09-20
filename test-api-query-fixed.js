const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testQuery() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    const city = 'Atlanta';
    const county = null;
    const state = 'GA';
    
    // Use template literals for the query
    const query = `
      SELECT * FROM permit_offices
      WHERE active = true 
        AND (city = $1 OR city ILIKE $2) 
        AND state = $3
      ORDER BY
        CASE WHEN city = $1 THEN 1 ELSE 2 END,
        jurisdiction_type = 'city' DESC,
        city, county
      LIMIT 20
    `;
    
    const params = [city, `%${city}%`, state];
    
    console.log('Query:', query);
    console.log('Params:', params);
    
    const result = await sql.unsafe(query, params);
    console.log('Result count:', result.length);
    if (result.length > 0) {
      console.log('First result:', result[0]);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testQuery();
