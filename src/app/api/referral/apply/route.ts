import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/referral/apply - called after login/signup to apply referral & credit bonus to referrer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, referralCode } = body;
    if (!email || !referralCode) {
      return NextResponse.json({ error: 'Missing email or referralCode' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRefCode = referralCode.trim().toUpperCase();

    // Ensure users_extra and referral_transactions tables exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS users_extra (
          user_id UUID PRIMARY KEY,
          referral_code VARCHAR(50),
          referred_by VARCHAR(50),
          wallet_balance DECIMAL(10,2) DEFAULT 0,
          address TEXT,
          latitude DOUBLE PRECISION,
          longitude DOUBLE PRECISION,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await query("ALTER TABLE users_extra ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50)");
      await query("ALTER TABLE users_extra ADD COLUMN IF NOT EXISTS referred_by VARCHAR(50)");
      await query("ALTER TABLE users_extra ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0");

      await query(`
        CREATE TABLE IF NOT EXISTS referral_transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          referrer_id UUID REFERENCES users(id),
          referred_user_email TEXT,
          type TEXT,
          amount DECIMAL(10,2),
          status TEXT DEFAULT 'credited',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {}

    // 1. Look up the referee user
    const userRes = await query(`
      SELECT u.id, u.email, ue.referred_by, ue.referral_code, COALESCE(ue.wallet_balance, 0) as wallet_balance
      FROM users u
      LEFT JOIN users_extra ue ON u.id = ue.user_id
      WHERE u.email = $1
    `, [cleanEmail]);

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userRes.rows[0];

    // 2. Prevent self-referral
    if (userData.referral_code && userData.referral_code.toUpperCase() === cleanRefCode) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // 3. Prevent duplicate referral if already referred
    if (userData.referred_by) {
      return NextResponse.json({ success: true, message: 'Referral already recorded for this user' });
    }

    // 4. Find the referrer by referral code in users_extra (case-insensitive)
    const referrerRes = await query(`
      SELECT u.id, u.email, u.role_id, u.full_name, COALESCE(ue.wallet_balance, 0) as wallet_balance, ue.referral_code
      FROM users u
      JOIN users_extra ue ON u.id = ue.user_id
      WHERE TRIM(UPPER(ue.referral_code)) = $1
    `, [cleanRefCode]);

    if (referrerRes.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    const referrer = referrerRes.rows[0];

    // Prevent self-referral if IDs match
    if (referrer.id === userData.id) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Check if bonus was already credited for this referee to this referrer
    const existingTxn = await query(
      `SELECT id FROM referral_transactions 
       WHERE referrer_id::text = $1::text 
         AND LOWER(referred_user_email) = $2 
         AND type = 'user'`,
      [referrer.id, cleanEmail]
    );

    if (existingTxn.rows.length > 0) {
      await query(`
        INSERT INTO users_extra (user_id, referred_by, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET referred_by = EXCLUDED.referred_by, updated_at = CURRENT_TIMESTAMP
      `, [userData.id, cleanRefCode]);
      return NextResponse.json({ success: true, message: 'Referral bonus already awarded previously' });
    }

    // 5. Get user referral bonus amount from platform_config (key: refer_a_friend)
    let bonusAmount = 30; // default ₹30
    try {
      const configRes = await query("SELECT value FROM platform_config WHERE key = 'refer_a_friend'");
      if (configRes.rows.length > 0 && configRes.rows[0].value) {
        bonusAmount = parseFloat(configRes.rows[0].value) || 30;
      }
    } catch (e) {
      console.warn("Could not fetch refer_a_friend config, using default 30:", e);
    }

    // 6. Execute atomic transaction to update referred_by, credit referrer wallet in users_extra, and record transaction
    await query("BEGIN");
    try {
      // Set referred_by on referee in users_extra
      await query(`
        INSERT INTO users_extra (user_id, referred_by, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET referred_by = EXCLUDED.referred_by, updated_at = CURRENT_TIMESTAMP
      `, [userData.id, cleanRefCode]);

      // Credit referrer's wallet in users_extra
      await query(`
        INSERT INTO users_extra (user_id, wallet_balance, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) 
        DO UPDATE SET wallet_balance = COALESCE(users_extra.wallet_balance, 0) + $2, updated_at = CURRENT_TIMESTAMP
      `, [referrer.id, bonusAmount]);

      // Record referral transaction
      await query(
        `INSERT INTO referral_transactions (referrer_id, referred_user_email, type, amount, status)
         VALUES ($1, $2, 'user', $3, 'credited')`,
        [referrer.id, cleanEmail, bonusAmount]
      );

      await query("COMMIT");
      console.log(`[Referral Apply] Successfully credited ₹${bonusAmount} to referrer ${referrer.email} for new user login ${cleanEmail}`);
    } catch (txnErr) {
      await query("ROLLBACK");
      throw txnErr;
    }

    return NextResponse.json({
      success: true,
      message: `Referral applied! ₹${bonusAmount} credited to ${referrer.email}'s wallet.`,
      bonusAmount
    });
  } catch (err: any) {
    console.error("[Referral Apply Error]:", err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
