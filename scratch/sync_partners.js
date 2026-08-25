const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'gymdate_user',
  password: 'GymDate@DB2024!',
  database: 'gymdate_db',
});

async function run() {
  console.log("=== SYNCING PARTNERS AND GYMS ===");

  // 1. For every partner_user, ensure matching user exists and gyms are linked
  const pUsers = await pool.query("SELECT * FROM partner_users");
  for (const pu of pUsers.rows) {
    const email = pu.email.toLowerCase().trim();
    console.log(`Checking partner: ${email} (PU ID: ${pu.id})`);

    // Check users table
    const uRes = await pool.query("SELECT id FROM users WHERE LOWER(email) = $1", [email]);
    if (uRes.rows.length > 0) {
      const uId = uRes.rows[0].id;
      console.log(`  Found users table ID: ${uId}`);

      // Check if gym is linked to uId or pu.id
      const gymByUId = await pool.query("SELECT id, name, partner_id FROM gyms WHERE partner_id::text = $1::text OR partner_id::text = $2::text", [uId, pu.id]);
      console.log(`  Found gyms:`, gymByUId.rows);

      // If gym partner_id doesn't match pu.id, update gym to pu.id or update partner_users to uId
      // Let's ensure gyms point to pu.id (the primary partner_users ID that NextAuth uses)
      if (gymByUId.rows.length > 0) {
        for (const g of gymByUId.rows) {
          // Let's link gym to pu.id
          // Note: If foreign key constraint to users exists, make sure users has pu.id or update users table
          try {
            await pool.query("UPDATE gyms SET partner_id = $1 WHERE id = $2", [uId, g.id]);
            console.log(`  Updated gym ${g.name} partner_id to users ID ${uId}`);
          } catch (e) {
            console.warn(`  Could not update gym:`, e.message);
          }
        }
      }
    }
  }

  console.log("=== ALL GYMS CURRENT STATE ===");
  const allGyms = await pool.query(`
    SELECT g.id, g.name, g.partner_id, u.email as user_email, pu.email as partner_user_email
    FROM gyms g
    LEFT JOIN users u ON g.partner_id::text = u.id::text
    LEFT JOIN partner_users pu ON g.partner_id::text = pu.id::text
  `);
  console.log(allGyms.rows);

  await pool.end();
}

run().catch(console.error);
