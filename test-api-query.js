const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testQuery() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    const city = 'Atlanta';
    const county = null;
    const state = 'GA';
    
    const conditions = ['active = true'];
    const params = [];
    
    if (city) {
      conditions.push('(city = $' + (params.length + 1) + ' OR city ILIKE $' + (params.length + 2) + ')');
      params.push(city, `%${city}%`);
    }
    
    if (county) {
      conditions.push('(county = $' + (params.length + 1) + ' OR county ILIKE $' + (params.length + 2) + ')');
      params.push(county, `%${county}%`);
    }
    
    conditions.push('state = $' + (params.length + 1));
    params.push(state);
    
    const clause = conditions.join(' AND ');
    const query = `
      SELECT * FROM permit_offices
      WHERE ${clause}
      ORDER BY
        CASE WHEN city = $${city ? '1' : 'NULL'} THEN 1 ELSE 2 END,
        jurisdiction_type = 'city' DESC,
        city, county
      LIMIT 20
    `;
    
    console.log('Query:', query);
    console.log('Params:', params);
    
    const result = await sql.unsafe(query, params);
    console.log('Result count:', result.length);
    console.log('First result:', result[0]);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
}

testQuery();
