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
    let gym = null;
    if (partnerId) {
      const gymRes = await query("SELECT * FROM gyms WHERE partner_id::text = $1::text LIMIT 1", [partnerId]);
      gym = gymRes.rows[0] || null;
    }
    if (!gym) {
      const firstGym = await query("SELECT * FROM gyms LIMIT 1");
      gym = firstGym.rows[0] || null;
    }

    // 3. Referral code
    let referralCode = "GYMDATE50";
    if (partnerId) {
      const refRes = await query("SELECT code FROM referral_codes WHERE user_id::text = $1::text LIMIT 1", [partnerId]);
      if (refRes.rows.length > 0) {
        referralCode = refRes.rows[0].code;
      } else {
        referralCode = `PARTNER${partnerId.substring(0, 4).toUpperCase()}`;
      }
    }

    // 4. Referral bonuses & stats
    let totalReferredGyms = 0;
    let referralEarnings = 0;
    try {
      const refCount = await query("SELECT COUNT(*) as cnt FROM gym_referrals WHERE referrer_id::text = $1::text AND status = 'approved'", [partnerId || 'none']);
      totalReferredGyms = parseInt(refCount.rows[0]?.cnt || '0');
      referralEarnings = totalReferredGyms * 200;
    } catch (_) {}

    // 5. Payout requests history
    let payoutRequests: any[] = [];
    if (gym?.id) {
      try {
        const pRes = await query("SELECT * FROM payout_requests WHERE gym_id::text = $1::text ORDER BY created_at DESC", [gym.id]);
        payoutRequests = pRes.rows || [];
      } catch (_) {}
    }

    // Calculate total withdrawn
    const totalWithdrawn = payoutRequests.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const availableBalance = Math.max(0, referralEarnings - totalWithdrawn);

    return NextResponse.json({
      success: true,
      referral_code: referralCode,
      referral_link: `https://gymdate.in/partner?ref=${referralCode}`,
      wallet_balance: availableBalance,
      referral_earnings: referralEarnings,
      total_referred_gyms: totalReferredGyms,
      min_withdrawal: 1500,
      payouts: payoutRequests
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error("[API Error] wallet-data:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, amount, payout_method, bank_name, account_holder, account_number, ifsc_code, upi_id, mobile_number } = body;

    // Resolve gym
    let userRes = await query("SELECT id FROM partner_users WHERE LOWER(email) = $1 UNION SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1", [email.toLowerCase()]);
    const partnerId = userRes.rows[0]?.id;
    let gymRes = await query("SELECT id FROM gyms WHERE partner_id::text = $1::text LIMIT 1", [partnerId]);
    const gymId = gymRes.rows[0]?.id;

    if (!gymId) {
      return NextResponse.json({ success: false, error: "Partner gym not found." }, { status: 404, headers: corsHeaders });
    }

    const insRes = await query(
      `INSERT INTO payout_requests (
        gym_id, amount, payout_method, status, payout_type, bank_name, account_holder, account_number, ifsc_code, upi_id, mobile_number, created_at
      ) VALUES ($1, $2, $3, 'pending', 'referral', $4, $5, $6, $7, $8, $9, NOW()) RETURNING *`,
      [gymId, amount, payout_method, bank_name || null, account_holder || null, account_number || null, ifsc_code || null, upi_id || null, mobile_number || null]
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
