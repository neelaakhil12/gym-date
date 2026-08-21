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

    // 1. Ensure users_extra table exists with all required columns
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

    // 2. Check if user exists in users table
    const existing = await query('SELECT * FROM users WHERE id::text = $1::text', [userId]);
    if (existing.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const user = existing.rows[0];

    // 3. Fetch permanent referral code and wallet balance from users_extra
    let code: string | null = null;
    let walletBalance = 0;

    const extraRes = await query('SELECT referral_code, wallet_balance FROM users_extra WHERE user_id::text = $1::text', [userId]);
    if (extraRes.rows.length > 0) {
      if (extraRes.rows[0].referral_code) {
        code = extraRes.rows[0].referral_code;
      }
      if (extraRes.rows[0].wallet_balance !== null && extraRes.rows[0].wallet_balance !== undefined) {
        walletBalance = parseFloat(extraRes.rows[0].wallet_balance);
      }
    }

    // 4. If code is still missing, generate a PERMANENT unique code and save it in users_extra
    if (!code) {
      code = crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. "85FC345D"
      await query(`
        INSERT INTO users_extra (user_id, referral_code, wallet_balance, updated_at)
        VALUES ($1, $2, 0, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) 
        DO UPDATE SET referral_code = EXCLUDED.referral_code, updated_at = CURRENT_TIMESTAMP
      `, [userId, code]);
      console.log(`[Referral Generate] Generated and saved permanent referral code ${code} for user ${userId}`);
    }

    // Determine role context: use 'type' param if provided, otherwise fallback to database role
    const isPartnerContext = type ? (type === 'partner') : (user.role_id === 'partner');

    // 5. Ensure referral_transactions table exists
    try {
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

    // 6. Get referral stats from referral_transactions (count and sum only genuine earned credits)
    const stats = await query(
      `SELECT 
         COUNT(CASE WHEN status = 'credited' AND type != 'debit' THEN 1 END) as total, 
         COALESCE(SUM(CASE WHEN status = 'credited' AND type != 'debit' THEN amount ELSE 0 END), 0) as total_earned
       FROM referral_transactions WHERE referrer_id::text = $1::text`,
      [userId]
    );

    // 7. Get platform config
    const config = await query(`SELECT key, value FROM platform_config`);
    const configMap: Record<string, string> = {};
    config.rows.forEach((r: any) => { configMap[r.key] = r.value; });

    // Determine correct bonus based on context and partner custom amount
    let bonusPerReferral = isPartnerContext 
      ? parseFloat(configMap['partner_referral_bonus'] || '500')
      : parseFloat(configMap['user_referral_bonus'] || configMap['refer_a_friend'] || '10');

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

    // Get recent transactions (both credits & wallet debits)
    let history: any[] = [];
    try {
      const transQuery = isPartnerContext
        ? `SELECT 
             amount, 
             created_at, 
             referred_user_email as detail, 
             'credit' as type,
             status
           FROM referral_transactions 
           WHERE referrer_id::text = $1::text AND (type != 'debit' AND status != 'debited')
           ORDER BY created_at DESC LIMIT 20`
        : `SELECT 
             amount, 
             created_at, 
             CASE 
               WHEN status = 'debited' OR type = 'debit' THEN 'Wallet Used for Subscription'
               ELSE referred_user_email 
             END as detail, 
             CASE 
               WHEN status = 'debited' OR type = 'debit' THEN 'debit'
               ELSE 'credit' 
             END as type,
             status
           FROM referral_transactions 
           WHERE referrer_id::text = $1::text 
           ORDER BY created_at DESC LIMIT 20`;

      const transactions = await query(transQuery, [userId]);
      history = [...(transactions.rows || [])];
    } catch (e) {
      console.error("Error fetching referral transactions:", e);
    }

    // Get recent payouts (withdrawals for partners)
    if (isPartnerContext) {
      try {
        const payouts = await query(
          `SELECT p.amount, p.created_at, 
                  CASE 
                    WHEN p.payout_method = 'bank' THEN 'Withdrawal to Bank (' || COALESCE(p.bank_name, 'Account') || ')'
                    WHEN p.payout_method = 'upi' THEN 'Withdrawal via UPI (' || COALESCE(p.upi_id, '') || ')'
                    ELSE 'Withdrawal Request'
                  END as detail, 
                  'debit' as type, 
                  p.status as status 
           FROM payout_requests p
           JOIN gyms g ON p.gym_id = g.id
           WHERE g.partner_id::text = $1::text AND p.payout_type = 'referral'
           ORDER BY p.created_at DESC LIMIT 20`,
          [userId]
        );
        history = [...history, ...(payouts.rows || [])];
      } catch (e) {
        console.error("Error fetching referral payouts:", e);
      }
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
      partnerReferralMinWithdrawal: parseFloat(configMap['partner_referral_min_withdrawal'] || '1500'),
      partnerVirtualMinWithdrawal: parseFloat(configMap['partner_virtual_min_withdrawal'] || '500'),
      isPartner: isPartnerContext,
      history: history.slice(0, 10)
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
