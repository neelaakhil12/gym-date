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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { ticket_code, email, partner_id } = body;

    let rawCode = (ticket_code || "").trim();
    if (!rawCode) {
      return NextResponse.json({ success: false, error: "Please enter or scan a valid QR ticket code." }, { status: 400, headers: corsHeaders });
    }

    if (rawCode.includes('/verify/')) {
      rawCode = rawCode.split('/verify/')[1].split('?')[0];
    } else if (rawCode.includes('://')) {
      const parts = rawCode.split('/');
      rawCode = parts[parts.length - 1].split('?')[0];
    }

    // 1. Resolve partner ID from email if not passed
    if (!partner_id && email) {
      const uRes = await query("SELECT id FROM partner_users WHERE LOWER(email) = $1 UNION SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1", [email.toLowerCase()]);
      partner_id = uRes.rows[0]?.id;
    }

    // 2. Fetch booking columns
    const colsRes = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'bookings'
    `);
    const bookingCols = new Set((colsRes.rows || []).map((r: any) => r.column_name.toLowerCase()));

    const whereParts = [`id::text ILIKE $1`, `id::text ILIKE $2`];
    if (bookingCols.has("ticket_code")) {
      whereParts.push(`ticket_code ILIKE $1`);
      whereParts.push(`ticket_code ILIKE $2`);
    }

    const codeResult = await query(
      `SELECT * FROM bookings 
       WHERE ${whereParts.join(" OR ")}
       ORDER BY created_at DESC LIMIT 1`,
      [rawCode, `${rawCode}%`]
    );

    let bookingData = codeResult.rows[0] || null;

    if (!bookingData) {
      return NextResponse.json({ success: false, error: `Ticket "${rawCode}" not found in system.` }, { status: 404, headers: corsHeaders });
    }

    // 3. Gym details
    const gymRes = await query("SELECT id, name, partner_id FROM gyms WHERE id::text = $1::text", [String(bookingData.gym_id)]);
    const gym = gymRes.rows[0] || { id: bookingData.gym_id, name: "Partner Gym", partner_id: null };

    // 4. Partner gym ownership check
    if (partner_id && gym.partner_id && String(gym.partner_id) !== String(partner_id)) {
      const pGyms = await query("SELECT id FROM gyms WHERE partner_id::text = $1::text", [String(partner_id)]);
      const owns = pGyms.rows.some((g: any) => String(g.id) === String(bookingData.gym_id));
      if (!owns) {
        return NextResponse.json({ 
          success: false, 
          error: `Access Denied: This pass is for ${gym.name}, not your gym.`,
          booking: bookingData 
        }, { status: 403, headers: corsHeaders });
      }
    }

    // 5. Expiration Check
    if (bookingData.end_date) {
      const now = new Date();
      const endDate = new Date(bookingData.end_date);
      if (now > endDate) {
        return NextResponse.json({ 
          success: false, 
          error: `Pass Expired on ${endDate.toLocaleDateString('en-IN')}`, 
          booking: bookingData 
        }, { status: 400, headers: corsHeaders });
      }
    }

    // 6. Retrieve member name
    let displayName = bookingData.customer_name;
    if (!displayName || displayName === "Member") {
      if (bookingData.user_id) {
        const uRes = await query("SELECT full_name, email FROM users WHERE id::text = $1::text", [String(bookingData.user_id)]);
        if (uRes.rows.length > 0 && uRes.rows[0].full_name) {
          displayName = uRes.rows[0].full_name;
        }
      }
    }
    displayName = displayName || "Member";

    return NextResponse.json({
      success: true,
      message: `Verified successfully! Entry approved for ${displayName}.`,
      memberName: displayName,
      booking: {
        ...bookingData,
        customer_name: displayName,
        gym_name: gym.name
      }
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error("[API Error] verify-ticket:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders });
  }
}
