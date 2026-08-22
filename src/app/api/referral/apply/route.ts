import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/referral/apply - called after login/signup to bind referral code to new user
// Referral bonus is credited ONLY when referee purchases their first subscription (in payment/verify)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, referralCode } = body;
    if (!email || !referralCode) {
      return NextResponse.json({ error: 'Missing email or referralCode' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRefCode = referralCode.trim().toUpperCase();

    // Ensure users_extra table exists
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
    } catch (e) {}

    // 1. Look up the referee user
    const userRes = await query(`
      SELECT u.id, u.email, ue.referred_by, ue.referral_code
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

    // 3. If referee already has a referred_by code attached, do not overwrite
    if (userData.referred_by) {
      return NextResponse.json({ success: true, message: 'Referral already recorded for this user' });
    }

    // 4. Find the referrer by referral code in users_extra
    const referrerRes = await query(`
      SELECT u.id, u.email, u.role_id, u.full_name, ue.referral_code
      FROM users u
      JOIN users_extra ue ON u.id = ue.user_id
      WHERE TRIM(UPPER(ue.referral_code)) = $1
    `, [cleanRefCode]);

    if (referrerRes.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    const referrer = referrerRes.rows[0];

    // Prevent self-referral if user IDs match
    if (referrer.id === userData.id) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // 5. Save the referrer code on referee in users_extra
    await query(`
      INSERT INTO users_extra (user_id, referred_by, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET referred_by = EXCLUDED.referred_by, updated_at = CURRENT_TIMESTAMP
    `, [userData.id, cleanRefCode]);

    console.log(`[Referral Apply] Successfully linked referee ${cleanEmail} to referrer ${referrer.email} (Code: ${cleanRefCode}). Bonus will be credited upon subscription payment.`);

    return NextResponse.json({
      success: true,
      message: `Referral linked! Bonus will be credited when ${cleanEmail} takes their first subscription.`
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (err: any) {
    console.error("[Referral Apply Error]:", err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
