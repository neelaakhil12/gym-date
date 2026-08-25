const { Pool } = require('pg');
require('dotenv').config({ path: '/var/www/gymdate/.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const email = 'partner@gmail.com';
  let userRes = await pool.query("SELECT id, email, full_name FROM partner_users WHERE LOWER(email) = $1", [email]);
  if (userRes.rows.length === 0) {
    userRes = await pool.query("SELECT id, email, full_name FROM users WHERE LOWER(email) = $1", [email]);
  }
  const partnerUser = userRes.rows[0];
  console.log("Partner user found:", partnerUser);

  const gymRes = await pool.query(`
    SELECT g.* FROM gyms g
    WHERE g.partner_id::text = $1::text 
       OR g.partner_id::text IN (
         SELECT id::text FROM users WHERE LOWER(email) = $2
         UNION
         SELECT id::text FROM partner_users WHERE LOWER(email) = $2
       )
    LIMIT 1
  `, [partnerUser.id, email]);

  console.log("Gym found:", gymRes.rows[0]);
  await pool.end();
}

run();
