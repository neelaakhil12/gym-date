import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Ensure partner_requests table exists (safe)
    await query(`
      CREATE TABLE IF NOT EXISTS partner_requests (
        id SERIAL PRIMARY KEY,
        gym_name VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        city VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Add wallet & referral columns to users
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by VARCHAR(20)`);

    // 3. Platform config table
    await query(`
      CREATE TABLE IF NOT EXISTS platform_config (
        key VARCHAR(100) PRIMARY KEY,
        value VARCHAR(255) NOT NULL,
        description TEXT
      )
    `);
    await query(`
      INSERT INTO platform_config (key, value, description) VALUES
        ('user_referral_bonus', '20', 'Amount credited per successful user referral (₹)'),
        ('max_wallet_per_txn', '10', 'Max wallet amount usable per subscription renewal (₹)'),
        ('partner_referral_bonus', '500', 'Default amount credited per gym partner referral (₹)')
      ON CONFLICT (key) DO NOTHING
    `);

    // 4. Referral transactions log
    await query(`
      CREATE TABLE IF NOT EXISTS referral_transactions (
        id SERIAL PRIMARY KEY,
        referrer_id VARCHAR NOT NULL,
        referred_user_email VARCHAR NOT NULL,
        type VARCHAR(20) DEFAULT 'user',
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'credited',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Add partner_referral_amount to gyms
    await query(`ALTER TABLE gyms ADD COLUMN IF NOT EXISTS partner_referral_amount DECIMAL(10,2) DEFAULT 500`);

    // 6. Fix users who have role_id='partner' but no gym
    const fixResult = await query(`
      UPDATE users SET role_id = 'user'
      WHERE role_id = 'partner'
        AND id NOT IN (SELECT DISTINCT partner_id FROM gyms WHERE partner_id IS NOT NULL)
    `);

    // 7. List all users
    const userList = await query(`
      SELECT u.email, u.full_name, u.role_id, u.wallet_balance, u.referral_code,
             g.name as gym_name
      FROM users u
      LEFT JOIN gyms g ON u.id = g.partner_id
      ORDER BY u.created_at DESC
    `);

    const config = await query(`SELECT key, value FROM platform_config`);

    return NextResponse.json({ 
      success: true, 
      message: "All migrations applied successfully.",
      rolesFixed: fixResult.rowCount,
      totalUsers: userList.rows.length,
      allUsers: userList.rows,
      platformConfig: config.rows,
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
