import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET - fetch current referral config
export async function GET() {
  try {
    const result = await query(`SELECT key, value FROM platform_config WHERE key IN ('user_referral_bonus', 'max_wallet_per_txn', 'partner_referral_bonus', 'signup_bonus', 'max_referrals_allowed')`);
    const config: Record<string, string> = {};
    result.rows.forEach((r: any) => { config[r.key] = r.value; });
    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST - update referral config
export async function POST(req: NextRequest) {
  try {
    const { user_referral_bonus, max_wallet_per_txn, partner_referral_bonus, signup_bonus, max_referrals_allowed } = await req.json();

    const updates = [
      ['user_referral_bonus', user_referral_bonus],
      ['max_wallet_per_txn', max_wallet_per_txn],
      ['partner_referral_bonus', partner_referral_bonus],
      ['signup_bonus', signup_bonus],
      ['max_referrals_allowed', max_referrals_allowed],
    ];

    for (const [key, value] of updates) {
      if (value !== undefined) {
        await query(
          `INSERT INTO platform_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2`,
          [key, String(value)]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
