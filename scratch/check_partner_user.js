const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function main() {
  try {
    const email = "sailakshmineela75@gmail.com";
    const partnerUser = await pool.query("SELECT * FROM partner_users WHERE email = $1", [email]);
    console.log("PARTNER_USERS:", partnerUser.rows);

    const users = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    console.log("USERS:", users.rows);

    const gyms = await pool.query("SELECT id, name, partner_id FROM gyms");
    console.log("ALL GYMS:", gyms.rows);

  } catch (err) {
    console.error("DB ERROR:", err);
  } finally {
    await pool.end();
  }
}

main();
