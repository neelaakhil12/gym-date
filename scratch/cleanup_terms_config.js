const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query("DELETE FROM platform_config WHERE key IN ('terms_user', 'terms_partner')");
    console.log('Deleted rows:', res.rowCount);
    const check = await client.query("SELECT key, description FROM platform_config ORDER BY key");
    console.log('Remaining keys:', check.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(console.error);
