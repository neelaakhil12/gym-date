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
    const gymId = searchParams.get("gym_id");
    const email = searchParams.get("email")?.trim().toLowerCase();

    let targetGymId = gymId;

    // If only email is provided, resolve the gym ID from partner_users / users / gyms
    if (!targetGymId && email) {
      const gymRes = await query(`
        SELECT id FROM gyms 
        WHERE partner_id IN (
          SELECT id::text FROM users WHERE LOWER(email) = $1
          UNION
          SELECT id::text FROM partner_users WHERE LOWER(email) = $1
        )
        LIMIT 1
      `, [email]);
      targetGymId = gymRes.rows[0]?.id;
    }

    if (!targetGymId) {
      return NextResponse.json({ success: true, bookings: [], stats: { totalRevenue: 0, totalBookings: 0, uniqueCustomers: 0 } }, { headers: corsHeaders });
    }

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

    const result = await query(
      `SELECT 
        b.*, 
        ${customerNameExpr} as customer_name, 
        ${customerEmailExpr} as customer_email
       FROM bookings b
       LEFT JOIN users u ON b.user_id::text = u.id::text
       WHERE b.gym_id::text = $1::text
       ORDER BY b.created_at DESC`,
      [targetGymId]
    );

    const bookings = result.rows || [];
    const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (Number(b.amount) || Number(b.total_price) || 0), 0);
    const uniqueCustomers = new Set(bookings.map((b: any) => b.user_id || b.customer_email)).size;

    return NextResponse.json({
      success: true,
      gym_id: targetGymId,
      stats: {
        totalRevenue,
        totalBookings: bookings.length,
        uniqueCustomers
      },
      bookings
    }, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store, max-age=0'
      }
    });

  } catch (error: any) {
    console.error("[API Error] Failed to get partner bookings:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}
