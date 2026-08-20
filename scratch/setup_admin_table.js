const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://gymdate_user:GymDate@DB2024!@77.37.44.221:5432/gymdate_db',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Connected to database...\n');

    // ── 1. SUPER ADMIN TABLE ──────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ admin_users table ready');

    // ── 2. PARTNER ADMIN TABLE ────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        phone VARCHAR(20),
        password_hash VARCHAR(255),
        gym_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ partner_users table ready');

    // ── 3. OPERATION STAFF TABLE ──────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ staff_users table ready');

    // ── 4. USERS TABLE (customers - already exists, just confirm) ─
    const usersCheck = await client.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') as exists
    `);
    console.log(`✅ users table (customers): ${usersCheck.rows[0].exists ? 'exists' : 'missing!'}`);

    // ── 5. INSERT SUPER ADMIN ACCOUNT ─────────────────────────────
    const tempPassword = 'AdminGymdate2024';
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const result = await client.query(
      `INSERT INTO admin_users (email, full_name, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             full_name     = EXCLUDED.full_name,
             updated_at    = CURRENT_TIMESTAMP
       RETURNING id, email, full_name`,
      ['santoedgepvtltd@gmail.com', 'Super Admin', passwordHash]
    );

    console.log('\n🎉 Super Admin account created/updated:');
    console.log(`   Email:    ${result.rows[0].email}`);
    console.log(`   Name:     ${result.rows[0].full_name}`);
    console.log(`   Password: ${tempPassword}  ← CHANGE THIS AFTER LOGIN`);

    // ── 6. SHOW ALL TABLE COUNTS ──────────────────────────────────
    console.log('\n📊 Table summary:');
    const tables = ['admin_users', 'partner_users', 'staff_users', 'users'];
    for (const t of tables) {
      try {
        const r = await client.query(`SELECT COUNT(*) as c FROM ${t}`);
        console.log(`   ${t}: ${r.rows[0].c} records`);
      } catch (e) {
        console.log(`   ${t}: ERROR - ${e.message}`);
      }
    }

    console.log('\n✅ All done! Login at: https://gymdate.in/superadmin');
    console.log('   Email:    santoedgepvtltd@gmail.com');
    console.log('   Password: AdminGymdate2024');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
