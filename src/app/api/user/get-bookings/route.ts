import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      console.error("[GetBookings] Missing email in query params");
      return NextResponse.json({ success: false, error: "Email is required" }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    console.log(`[GetBookings] Fetching bookings for: ${email}`);

    // Fetch user id first
    const userResult = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    const userId = userResult.rows[0]?.id;
    console.log(`[GetBookings] Fetching by userId: ${userId} and email: ${email}`);

    // Check available columns in bookings table
    const bookingColsRes = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'bookings'
    `);
    const bookingCols = new Set((bookingColsRes.rows || []).map((r: any) => r.column_name.toLowerCase()));

    const whereConditions: string[] = [];
    const queryParams: any[] = [];

    if (userId && bookingCols.has("user_id")) {
      queryParams.push(String(userId));
      whereConditions.push(`b.user_id::text = $${queryParams.length}::text`);
    }
    if (bookingCols.has("customer_email")) {
      queryParams.push(email.toLowerCase());
      whereConditions.push(`LOWER(b.customer_email) = $${queryParams.length}`);
    } 
    if (bookingCols.has("user_email")) {
      queryParams.push(email.toLowerCase());
      whereConditions.push(`LOWER(b.user_email) = $${queryParams.length}`);
    } 
    if (bookingCols.has("email")) {
      queryParams.push(email.toLowerCase());
      whereConditions.push(`LOWER(b.email) = $${queryParams.length}`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" OR ")}` : `WHERE 1=0`;

    // Fetch bookings with gym details
    const bookingsResult = await query(
      `SELECT b.*, 
       json_build_object('name', g.name, 'location', g.location) as gyms
       FROM bookings b
       LEFT JOIN gyms g ON b.gym_id::text = g.id::text
       ${whereClause}
       ORDER BY b.created_at DESC`,
       queryParams
     );

    console.log(`[GetBookings] Found ${bookingsResult.rows.length} bookings for ${email}`);

    return NextResponse.json({ success: true, bookings: bookingsResult.rows || [] }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error: any) {
    console.error("[GetBookings] Critical error:", error);
    return NextResponse.json({ success: false, error: error.message }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

