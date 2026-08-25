const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'gymdate_user',
  password: 'GymDate@DB2024!',
  database: 'gymdate_db',
});

async function run() {
  // Update partner_users id to match users.id for akhilneela95@gmail.com
  await pool.query("UPDATE partner_users SET id = '3c285a44-7e7c-4dda-ae5b-a8422bb06e77' WHERE LOWER(email) = 'akhilneela95@gmail.com'");
  console.log("Updated partner_users for akhilneela95@gmail.com");

  const check = await pool.query(`
    SELECT g.id, g.name, g.partner_id, u.email as user_email, pu.email as partner_user_email
    FROM gyms g
    LEFT JOIN users u ON g.partner_id::text = u.id::text
    LEFT JOIN partner_users pu ON g.partner_id::text = pu.id::text
    WHERE g.name ILIKE '%Akhil Harish%'
  `);
  console.log("RESULT:", check.rows);

  await pool.end();
}

run().catch(console.error);
