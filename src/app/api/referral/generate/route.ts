import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

// GET /api/referral/generate?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    // Check if user already has a referral code
    const existing = await query('SELECT referral_code, wallet_balance FROM users WHERE id = $1', [userId]);
    if (existing.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let code = existing.rows[0].referral_code;
    const walletBalance = existing.rows[0].wallet_balance || 0;

    // Generate a new unique code if not set
    if (!code) {
      code = crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F92C1B"
      await query('UPDATE users SET referral_code = $1 WHERE id = $2', [code, userId]);
    }

    // Get referral stats
    const stats = await query(
      `SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_earned
       FROM referral_transactions WHERE referrer_id = $1`,
      [userId]
    );

    // Get config
    const config = await query(`SELECT key, value FROM platform_config WHERE key IN ('user_referral_bonus', 'max_wallet_per_txn')`);
    const configMap: Record<string, string> = {};
    config.rows.forEach((r: any) => { configMap[r.key] = r.value; });

    return NextResponse.json({
      success: true,
      referralCode: code,
      referralLink: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://gymdate.in'}/login?ref=${code}`,
      walletBalance: parseFloat(walletBalance),
      totalReferrals: parseInt(stats.rows[0].total),
      totalEarned: parseFloat(stats.rows[0].total_earned),
      bonusPerReferral: parseFloat(configMap['user_referral_bonus'] || '20'),
      maxWalletPerTxn: parseFloat(configMap['max_wallet_per_txn'] || '10'),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
