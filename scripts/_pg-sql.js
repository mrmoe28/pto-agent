const { Pool } = require('pg');

function createSql(connectionString) {
  const pool = new Pool({ connectionString });
  const sql = async (strings, ...values) => {
    let text = strings[0];
    for (let i = 0; i < values.length; i++) {
      text += `$${i + 1}${strings[i + 1]}`;
    }
    const result = await pool.query(text, values);
    return result.rows;
  };
  return { sql, pool };
}

module.exports = { createSql };
