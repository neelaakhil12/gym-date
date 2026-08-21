import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import crypto from 'crypto';

// GET /api/referral/generate?userId=xxx&type=user|partner
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'user' or 'partner'
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    // Inspect available columns in users table
    const userColsRes = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    const userCols = new Set((userColsRes.rows || []).map((r: any) => r.column_name.toLowerCase()));

    // Check if user exists
    const existing = await query('SELECT * FROM users WHERE id::text = $1::text', [userId]);
    if (existing.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const user = existing.rows[0];
    let code = user.referral_code;
    let walletBalance = parseFloat(user.wallet_balance || '0');

    // Check users_extra for referral code or wallet balance fallback
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS users_extra (
          user_id UUID PRIMARY KEY,
          referral_code VARCHAR(50),
          wallet_balance DECIMAL(10,2) DEFAULT 0,
          address TEXT,
          latitude DOUBLE PRECISION,
          longitude DOUBLE PRECISION,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      const extraRes = await query('SELECT referral_code, wallet_balance FROM users_extra WHERE user_id::text = $1::text', [userId]);
      if (extraRes.rows.length > 0) {
        if (!code) code = extraRes.rows[0].referral_code;
        if (!walletBalance && extraRes.rows[0].wallet_balance) walletBalance = parseFloat(extraRes.rows[0].wallet_balance);
      }
    } catch (e) {}
    
    // Determine role context: use 'type' param if provided, otherwise fallback to database role
    const isPartnerContext = type ? (type === 'partner') : (user.role_id === 'partner');

    // Generate a new unique code if not set
    if (!code) {
      code = crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. "A3F92C1B"
      if (userCols.has("referral_code")) {
        try {
          await query('UPDATE users SET referral_code = $1 WHERE id::text = $2::text', [code, userId]);
        } catch (err) {}
      }
      try {
        await query(`
          INSERT INTO users_extra (user_id, referral_code, updated_at)
          VALUES ($1, $2, CURRENT_TIMESTAMP)
          ON CONFLICT (user_id) DO UPDATE SET referral_code = EXCLUDED.referral_code, updated_at = CURRENT_TIMESTAMP
        `, [userId, code]);
      } catch (err) {}
    }

    // Ensure referral_transactions table exists
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS referral_transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          referrer_id UUID REFERENCES users(id),
          referred_user_email TEXT,
          type TEXT,
          amount DECIMAL(10,2),
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {}

    // Get referral stats (using referrer_id::text to prevent uuid comparison errors)
    const stats = await query(
      `SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as total_earned
       FROM referral_transactions WHERE referrer_id::text = $1::text`,
      [userId]
    );

    // Get platform config
    const config = await query(`SELECT key, value FROM platform_config WHERE key IN ('refer_a_friend', 'partner_referral_bonus', 'max_wallet_per_txn')`);
    const configMap: Record<string, string> = {};
    config.rows.forEach((r: any) => { configMap[r.key] = r.value; });

    // Determine correct bonus based on context and partner custom amount
    let bonusPerReferral = isPartnerContext 
      ? parseFloat(configMap['partner_referral_bonus'] || '500')
      : parseFloat(configMap['refer_a_friend'] || '30');

    if (isPartnerContext) {
      try {
        const gymRes = await query('SELECT partner_referral_amount FROM gyms WHERE partner_id::text = $1::text LIMIT 1', [userId]);
        if (gymRes.rows.length > 0 && gymRes.rows[0].partner_referral_amount) {
          bonusPerReferral = parseFloat(gymRes.rows[0].partner_referral_amount);
        }
      } catch (err) {}
    }

    // Resolve site origin
    let host = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
    let proto = req.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl && host) {
      siteUrl = `${proto}://${host}`;
    }
    if (!siteUrl) {
      siteUrl = 'https://gymdate.in';
    }
    siteUrl = siteUrl.replace(/\/$/, '');

    const referralLink = isPartnerContext 
      ? `${siteUrl}/partner?ref=${code}`
      : `${siteUrl}/login?ref=${code}`;

    // Get recent transactions (earnings)
    let history: any[] = [];
    try {
      const transactions = await query(
        `SELECT amount, created_at, referred_user_email as detail, 'credit' as type 
         FROM referral_transactions 
         WHERE referrer_id::text = $1::text 
         ORDER BY created_at DESC LIMIT 10`,
        [userId]
      );
      history = [...(transactions.rows || [])];
    } catch (e) {
      console.error("Error fetching referral transactions:", e);
    }

    // Get recent payouts (withdrawals)
    try {
      const payouts = await query(
        `SELECT p.amount, p.created_at, p.status as detail, 'debit' as type 
         FROM payout_requests p
         JOIN gyms g ON p.gym_id = g.id
         WHERE g.partner_id::text = $1::text AND p.payout_type = 'referral'
         ORDER BY p.created_at DESC LIMIT 10`,
        [userId]
      );
      history = [...history, ...(payouts.rows || [])];
    } catch (e) {
      console.error("Error fetching referral payouts:", e);
    }

    // Sort combined history by date
    history.sort((a, b) => {
      if (!a.created_at) return 1;
      if (!b.created_at) return -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({
      success: true,
      referralCode: code,
      referralLink,
      walletBalance,
      totalReferrals: parseInt(stats.rows[0]?.total || '0'),
      totalEarned: parseFloat(stats.rows[0]?.total_earned || '0'),
      bonusPerReferral,
      maxWalletPerTxn: parseFloat(configMap['max_wallet_per_txn'] || '10'),
      isPartner: isPartnerContext,
      history: history.slice(0, 10)
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
