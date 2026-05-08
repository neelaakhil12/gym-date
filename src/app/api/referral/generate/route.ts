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
    const existing = await query('SELECT referral_code, wallet_balance, role_id FROM users WHERE id = $1', [userId]);
    if (existing.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const user = existing.rows[0];
    let code = user.referral_code;
    const walletBalance = user.wallet_balance || 0;
    const isPartner = user.role_id === 'partner';

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

    // 4. Get config
    const config = await query(`SELECT key, value FROM platform_config WHERE key IN ('refer_a_friend', 'max_wallet_per_txn')`);
    const configMap: Record<string, string> = {};
    config.rows.forEach((r: any) => { configMap[r.key] = r.value; });

    // Use the "User Referral Bonus" setting from Super Admin for everyone
    let bonusPerReferral = parseFloat(configMap['refer_a_friend'] || '30');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gymdate.in';
    const referralLink = isPartner 
      ? `${siteUrl}/partner?ref=${code}`
      : `${siteUrl}/login?ref=${code}`;

    // Get recent transactions (earnings)
    const transactions = await query(
      `SELECT amount, created_at, referred_user_email as detail, 'credit' as type 
       FROM referral_transactions 
       WHERE referrer_id::text = $1::text 
       ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    // Get recent payouts (withdrawals)
    const payouts = await query(
      `SELECT amount, created_at, status as detail, 'debit' as type 
       FROM payout_requests p
       JOIN gyms g ON p.gym_id = g.id
       WHERE g.partner_id::text = $1::text AND p.payout_type = 'referral'
       ORDER BY p.created_at DESC LIMIT 10`,
      [userId]
    );

    // Combine and sort by date
    const history = [...(transactions.rows || []), ...(payouts.rows || [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      referralCode: code,
      referralLink,
      walletBalance: parseFloat(walletBalance || '0'),
      totalReferrals: parseInt(stats.rows[0]?.total || '0'),
      totalEarned: parseFloat(stats.rows[0]?.total_earned || '0'),
      bonusPerReferral,
      maxWalletPerTxn: parseFloat(configMap['max_wallet_per_txn'] || '10'),
      isPartner,
      history
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
