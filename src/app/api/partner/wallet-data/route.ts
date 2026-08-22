import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = 'force-dynamic';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ success: false, error: "Partner email required" }, { status: 400, headers: corsHeaders });
    }

    // 1. Locate partner user
    let userRes = await query("SELECT id, email, full_name FROM partner_users WHERE LOWER(email) = $1", [email]);
    if (userRes.rows.length === 0) {
      userRes = await query("SELECT id, email, full_name FROM users WHERE LOWER(email) = $1", [email]);
    }
    const partnerUser = userRes.rows[0] || null;
    const partnerId = partnerUser?.id;

    // 2. Locate gym
    let gym: any = null;
    if (partnerId) {
      const gymRes = await query("SELECT * FROM gyms WHERE partner_id::text = $1::text LIMIT 1", [partnerId]);
      gym = gymRes.rows[0] || null;
    }
    if (!gym) {
      const firstGym = await query("SELECT * FROM gyms LIMIT 1");
      gym = firstGym.rows[0] || null;
    }

    // 3. Platform Config limits
    let partnerReferralMinWithdrawal = 1500;
    let partnerVirtualMinWithdrawal = 500;
    let partnerReferralBonus = 100;
    let commissionRate = gym?.commission_rate ?? 10;

    try {
      const configRes = await query("SELECT key, value FROM platform_config");
      const configMap = new Map((configRes.rows || []).map((r: any) => [r.key, r.value]));
      if (configMap.has('partner_referral_min_withdrawal')) partnerReferralMinWithdrawal = parseFloat(configMap.get('partner_referral_min_withdrawal')) || 1500;
      if (configMap.has('partner_virtual_min_withdrawal')) partnerVirtualMinWithdrawal = parseFloat(configMap.get('partner_virtual_min_withdrawal')) || 500;
      if (configMap.has('partner_referral_bonus')) partnerReferralBonus = parseFloat(configMap.get('partner_referral_bonus')) || 100;
      if (configMap.has('platform_commission') && gym && (gym.commission_rate === null || gym.commission_rate === undefined)) {
        commissionRate = parseFloat(configMap.get('platform_commission')) || 10;
      }
    } catch (_) {}

    // ==========================================
    // 4. VIRTUAL WALLET (GYM SUBSCRIPTION REVENUE)
    // ==========================================
    let netRevenue = 0;
    let revenuePayouts: any[] = [];
    if (gym?.id) {
      try {
        const bookingsRes = await query("SELECT amount FROM bookings WHERE gym_id::text = $1::text", [gym.id]);
        const grossRevenue = (bookingsRes.rows || []).reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);
        netRevenue = grossRevenue * (1 - (commissionRate / 100));

        const pRes = await query(
          "SELECT * FROM payout_requests WHERE gym_id::text = $1::text AND (payout_type = 'revenue' OR payout_type IS NULL) ORDER BY created_at DESC",
          [gym.id]
        );
        revenuePayouts = pRes.rows || [];
      } catch (e) {
        console.error("Error computing virtual wallet:", e);
      }
    }

    const totalRevenueWithdrawn = revenuePayouts.reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
    const virtualWalletBalance = Math.max(0, netRevenue - totalRevenueWithdrawn);

    // ==========================================
    // 5. REFERRAL WALLET (PARTNER REFERRAL BONUS)
    // ==========================================
    let referralCode = "CULTFIT50";
    let referralWalletBalance = 0;
    if (partnerId) {
      try {
        const extraRes = await query("SELECT referral_code, wallet_balance FROM users_extra WHERE user_id::text = $1::text LIMIT 1", [partnerId]);
        if (extraRes.rows.length > 0) {
          if (extraRes.rows[0].referral_code) referralCode = extraRes.rows[0].referral_code;
          if (extraRes.rows[0].wallet_balance !== null && extraRes.rows[0].wallet_balance !== undefined) {
            referralWalletBalance = parseFloat(extraRes.rows[0].wallet_balance);
          }
        } else {
          referralCode = `PARTNER${partnerId.substring(0, 4).toUpperCase()}`;
        }
      } catch (_) {}
    }

    let totalReferredGyms = 0;
    let referralEarnings = 0;
    let referralHistory: any[] = [];

    if (partnerId) {
      try {
        const transRes = await query(
          `SELECT amount, created_at, 'Earning' as detail, 'credit' as type, status
           FROM referral_transactions 
           WHERE referrer_id::text = $1::text AND status = 'credited' AND type != 'debit'
           ORDER BY created_at DESC LIMIT 20`,
          [partnerId]
        );
        const transRows = transRes.rows || [];
        totalReferredGyms = transRows.length;
        referralEarnings = transRows.reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0);

        let referralPayouts: any[] = [];
        if (gym?.id) {
          const refPRes = await query(
            `SELECT amount, created_at, 
                    CASE 
                      WHEN payout_method = 'bank' THEN 'Withdrawal to Bank (' || COALESCE(bank_name, 'Account') || ')'
                      WHEN payout_method = 'upi' THEN 'Withdrawal via UPI (' || COALESCE(upi_id, '') || ')'
                      ELSE 'Withdrawal Request'
                    END as detail, 
                    'debit' as type, 
                    status,
                    payment_proof_url,
                    qr_code_url
             FROM payout_requests 
             WHERE gym_id::text = $1::text AND payout_type = 'referral'
             ORDER BY created_at DESC LIMIT 20`,
            [gym.id]
          );
          referralPayouts = refPRes.rows || [];
        }

        referralHistory = [...transRows, ...referralPayouts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } catch (e) {
        console.error("Error computing referral history:", e);
      }
    }

    return NextResponse.json({
      success: true,
      gym: gym ? { id: gym.id, name: gym.name, commission_rate: commissionRate } : null,
      
      // Virtual Wallet (Gym Revenue)
      virtual_wallet: {
        balance: virtualWalletBalance,
        total_revenue: netRevenue,
        total_withdrawn: totalRevenueWithdrawn,
        min_withdrawal: partnerVirtualMinWithdrawal,
        history: revenuePayouts
      },

      // Partner Referral Wallet
      referral_wallet: {
        balance: referralWalletBalance,
        total_earned: referralEarnings,
        total_referred_gyms: totalReferredGyms,
        bonus_per_referral: partnerReferralBonus,
        min_withdrawal: partnerReferralMinWithdrawal,
        referral_code: referralCode,
        referral_link: `https://gymdate.in/partner?ref=${referralCode}`,
        history: referralHistory
      },

      // Backward compatible flat fields
      wallet_balance: referralWalletBalance,
      virtual_balance: virtualWalletBalance,
      referral_earnings: referralEarnings,
      total_referred_gyms: totalReferredGyms,
      referral_code: referralCode,
      referral_link: `https://gymdate.in/partner?ref=${referralCode}`,
      min_withdrawal: partnerReferralMinWithdrawal,
      payouts: revenuePayouts
    }, { 
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store, max-age=0'
      } 
    });

  } catch (error: any) {
    console.error("[API Error] wallet-data:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, amount, payout_method, payout_type, bank_name, account_holder, account_number, ifsc_code, upi_id, mobile_number, qr_code_url } = body;

    // Resolve gym
    let userRes = await query("SELECT id FROM partner_users WHERE LOWER(email) = $1 UNION SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1", [email.toLowerCase()]);
    const partnerId = userRes.rows[0]?.id;
    let gymRes = await query("SELECT id FROM gyms WHERE partner_id::text = $1::text LIMIT 1", [partnerId]);
    const gymId = gymRes.rows[0]?.id;

    if (!gymId) {
      return NextResponse.json({ success: false, error: "Partner gym not found." }, { status: 404, headers: corsHeaders });
    }

    const type = payout_type === 'revenue' ? 'revenue' : 'referral';

    const insRes = await query(
      `INSERT INTO payout_requests (
        gym_id, amount, payout_method, status, payout_type, bank_name, account_holder, account_number, ifsc_code, upi_id, mobile_number, qr_code_url, created_at
      ) VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING *`,
      [gymId, amount, payout_method, type, bank_name || null, account_holder || null, account_number || null, ifsc_code || null, upi_id || null, mobile_number || null, qr_code_url || null]
    );

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully! Super Admin will review and approve shortly.",
      payout: insRes.rows[0]
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error("[API Error] create payout request:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}
