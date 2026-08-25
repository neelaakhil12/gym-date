const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'gymdate_user',
  password: 'GymDate@DB2024!',
  database: 'gymdate_db',
});

async function run() {
  console.log("=== CHECKING AKHILNEELA95 ===");
  const pUsers = await pool.query("SELECT * FROM partner_users WHERE email ILIKE '%akhilneela95%'");
  console.log("PARTNER_USERS:", pUsers.rows);

  const users = await pool.query("SELECT id, email, full_name, role_id FROM users WHERE email ILIKE '%akhilneela95%'");
  console.log("USERS:", users.rows);

  const gyms = await pool.query("SELECT id, name, location, partner_id FROM gyms WHERE id::text ILIKE 'ccb6cf12%' OR name ILIKE '%Akhil Harish%'");
  console.log("MATCHING_GYMS:", gyms.rows);

  const allGyms = await pool.query("SELECT id, name, partner_id FROM gyms");
  console.log("ALL_GYMS:", allGyms.rows);

  await pool.end();
}

run().catch(console.error);
