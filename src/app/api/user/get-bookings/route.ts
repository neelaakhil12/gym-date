import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      console.error("[GetBookings] Missing email in query params");
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    console.log(`[GetBookings] Fetching bookings for: ${email}`);

    // Fetch user id first
    const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    const userId = userResult.rows[0]?.id;
    console.log(`[GetBookings] Fetching by userId: ${userId} and email: ${email}`);

    // Fetch bookings with gym details
    const bookingsResult = await query(
      `SELECT b.*, 
       json_build_object('name', g.name, 'location', g.location) as gyms
       FROM bookings b
       LEFT JOIN gyms g ON b.gym_id = g.id
       WHERE b.user_id = $1 OR b.customer_email = $2
       ORDER BY b.created_at DESC`,
      [userId || 'NON_EXISTENT_ID', email]
    );

    console.log(`[GetBookings] Found ${bookingsResult.rows.length} bookings for ${email}`);

    return NextResponse.json({ success: true, bookings: bookingsResult.rows || [] });
  } catch (error: any) {
    console.error("[GetBookings] Critical error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
