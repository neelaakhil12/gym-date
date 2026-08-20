// Run this script to create admin_users table and migrate existing super admins
// Usage: node scratch/setup_admin_table.js

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://gymdate_user:GymDate@DB2024!@77.37.44.221:5432/gymdate_db',
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Connected to database...\n');

    // 1. Create admin_users table
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
    console.log('✅ admin_users table created (or already exists)');

    // 2. Migrate existing super_admin from users table
    const migrated = await client.query(`
      INSERT INTO admin_users (id, email, full_name, password_hash, created_at)
      SELECT
        id::uuid,
        email,
        full_name,
        password_hash,
        COALESCE(created_at, CURRENT_TIMESTAMP)
      FROM users
      WHERE role_id = 'super_admin'
      ON CONFLICT (email) DO UPDATE
        SET full_name     = EXCLUDED.full_name,
            password_hash = EXCLUDED.password_hash
      RETURNING id, email, full_name
    `);
    console.log(`✅ Migrated ${migrated.rows.length} super_admin(s) from users table:`);
    migrated.rows.forEach(r => console.log(`   - ${r.email} (${r.full_name})`));

    // 3. Show all admins
    const allAdmins = await client.query('SELECT id, email, full_name FROM admin_users');
    console.log(`\n📋 Total admin_users in table: ${allAdmins.rows.length}`);
    allAdmins.rows.forEach(r => console.log(`   - ${r.email} (${r.full_name})`));

    if (allAdmins.rows.length === 0) {
      console.log('\n⚠️  No admins found! You need to insert one manually.');
      console.log('Run this SQL in your DB:');
      console.log(`
INSERT INTO admin_users (email, full_name, password_hash)
VALUES ('santoedgepvtltd@gmail.com', 'Super Admin', '<bcrypt_hashed_password>');
      `);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
