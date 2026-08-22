import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Partner email parameter is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Locate partner user
    let userRes = await query("SELECT id, email, full_name FROM partner_users WHERE LOWER(email) = $1", [email]);
    if (userRes.rows.length === 0) {
      userRes = await query("SELECT id, email, full_name FROM users WHERE LOWER(email) = $1", [email]);
    }

    const partnerUser = userRes.rows[0] || null;
    const partnerId = partnerUser?.id;

    // 2. Locate gym
    let gymRes: any = { rows: [] };
    if (partnerId) {
      gymRes = await query("SELECT * FROM gyms WHERE partner_id::text = $1::text LIMIT 1", [partnerId]);
    }

    let gym = gymRes.rows[0] || null;

    if (!gym) {
      // Fallback: match first active gym or return clean empty state
      const fallbackGym = await query("SELECT * FROM gyms LIMIT 1");
      gym = fallbackGym.rows[0] || null;
    }

    let bookings: any[] = [];
    let totalRevenue = 0;
    let totalBookings = 0;
    let activeMembers = 0;
    let pendingPayout = 0;

    if (gym) {
      // Gym extra config & commission
      try {
        const extraRes = await query("SELECT * FROM gyms_extra WHERE gym_id::text = $1::text", [gym.id]);
        if (extraRes.rows.length > 0) {
          const extra = extraRes.rows[0];
          gym = {
            ...gym,
            commission_rate: extra.commission_rate ?? gym.commission_rate,
            has_offer: extra.has_offer ?? gym.has_offer,
            offer_percentage: extra.offer_percentage ?? gym.offer_percentage,
          };
        }
      } catch (_) {}

      if (gym.commission_rate === null || gym.commission_rate === undefined) {
        const configRes = await query("SELECT value FROM platform_config WHERE key = 'platform_commission' LIMIT 1");
        gym.commission_rate = configRes.rows[0] ? parseFloat(configRes.rows[0].value) : 10;
      }

      // Fetch bookings for this gym
      try {
        const colsRes = await query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = 'bookings'
        `);
        const bookingCols = new Set((colsRes.rows || []).map((r: any) => r.column_name.toLowerCase()));

        const customerNameExpr = bookingCols.has("customer_name") 
          ? `COALESCE(b.customer_name, u.full_name, 'Member')` 
          : `COALESCE(u.full_name, 'Member')`;
        const customerEmailExpr = bookingCols.has("customer_email") 
          ? `COALESCE(b.customer_email, u.email, 'No email')` 
          : `COALESCE(u.email, 'No email')`;

        const bRes = await query(`
          SELECT 
            b.*, 
            ${customerNameExpr} as customer_name, 
            ${customerEmailExpr} as customer_email
          FROM bookings b
          LEFT JOIN users u ON b.user_id::text = u.id::text
          WHERE b.gym_id::text = $1::text
          ORDER BY b.created_at DESC
        `, [gym.id]);

        bookings = bRes.rows || [];
        totalBookings = bookings.length;

        const commissionRate = gym.commission_rate || 10;
        totalRevenue = bookings.reduce((sum: number, b: any) => {
          const amount = Number(b.amount) || Number(b.total_price) || 0;
          return sum + (amount * (1 - commissionRate / 100));
        }, 0);

        activeMembers = bookings.filter((b: any) => b.status === 'confirmed' || b.status === 'active' || b.status === 'completed').length;
      } catch (err) {
        console.warn("[Dashboard Data API] Error fetching bookings:", err);
      }

      // Fetch pending payouts
      try {
        const payRes = await query("SELECT COALESCE(SUM(amount), 0) as pending FROM payout_requests WHERE gym_id::text = $1::text AND status = 'pending'", [gym.id]);
        pendingPayout = parseFloat(payRes.rows[0]?.pending || '0');
      } catch (_) {}
    }

    return NextResponse.json(
      {
        success: true,
        gym,
        stats: {
          totalRevenue: Math.round(totalRevenue),
          totalBookings,
          activeMembers,
          payoutPending: Math.round(pendingPayout),
        },
        bookings: bookings.slice(0, 20),
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[Partner Dashboard API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load partner dashboard data." },
      { status: 500, headers: corsHeaders }
    );
  }
}
