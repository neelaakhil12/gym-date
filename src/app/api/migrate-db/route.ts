import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Ensure partner_requests table exists and has all columns
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
    await query(`ALTER TABLE partner_requests ADD COLUMN IF NOT EXISTS referred_by VARCHAR(100)`);

    // 2. Add wallet & referral columns to users
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by VARCHAR(20)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT`);

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
        ('partner_referral_bonus', '100', 'Default amount credited per gym partner referral (₹)'),
        ('signup_bonus', '0', 'Bonus given to new users upon account creation (₹)'),
        ('max_referrals_allowed', '5', 'Maximum number of referrals a user can get bonus for')
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
    await query(`ALTER TABLE gyms ADD COLUMN IF NOT EXISTS partner_referral_amount DECIMAL(10,2) DEFAULT 100`);

    // 6. Fix users who have role_id='partner' but no gym
    const fixResult = await query(`
      UPDATE users SET role_id = 'user'
      WHERE role_id = 'partner'
        AND id::text NOT IN (SELECT DISTINCT partner_id::text FROM gyms WHERE partner_id IS NOT NULL)
    `);

    // 7. Fetch diagnostic info
    const userList = await query(`SELECT COUNT(*) FROM users`);
    const leadList = await query(`SELECT COUNT(*) FROM partner_requests`);
    const config = await query(`SELECT key, value FROM platform_config`);

    return NextResponse.json({ 
      success: true, 
      message: "All migrations applied successfully. Please refresh the admin panel.",
      usersCount: userList.rows[0].count,
      leadsCount: leadList.rows[0].count,
      platformConfig: config.rows,
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
