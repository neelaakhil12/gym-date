require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function check() {
  try {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'gyms'");
    console.log("GYMS COLUMNS:", res.rows.map(r => r.column_name));
    
    const users = await pool.query("SELECT * FROM users LIMIT 5");
    console.log("USERS SAMPLE:", users.rows);
    
    const countUsers = await pool.query("SELECT role_id, COUNT(*) FROM users GROUP BY role_id");
    console.log("USER COUNTS BY ROLE:", countUsers.rows);

  } catch (e) {
    console.error("CHECK ERROR:", e);
  } finally {
    pool.end();
  }
}

check();
