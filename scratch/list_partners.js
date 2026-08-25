const { Pool } = require('pg');
require('dotenv').config({ path: '/var/www/gymdate/.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const pUsers = await pool.query("SELECT id, email, full_name FROM partner_users");
  console.log("All partner_users:", pUsers.rows);

  const uUsers = await pool.query("SELECT id, email, full_name, role_id FROM users WHERE role_id = 'partner'");
  console.log("All users (partner):", uUsers.rows);

  const gyms = await pool.query("SELECT id, name, partner_id FROM gyms");
  console.log("All gyms:", gyms.rows);

  await pool.end();
}

run();
