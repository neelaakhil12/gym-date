import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      console.error("[GetBookings] Missing email in query params");
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    console.log(`[GetBookings] Fetching bookings for: ${email}`);

    // 1. Try to get profile ID first
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    // 2. Fetch bookings
    // We search by user_id (if profile exists) OR by customer_email directly (Case-Insensitive)
    let query = supabaseAdmin
      .from('bookings')
      .select('*, gyms(name, location)')
      .order('created_at', { ascending: false });

    if (profile) {
      // Use ilike for case-insensitive email matching
      query = query.or(`user_id.eq.${profile.id},customer_email.ilike.${email}`);
    } else {
      query = query.ilike('customer_email', email);
    }

    const { data: bookings, error: bookingError } = await query;

    if (bookingError) {
      console.error("[GetBookings] Database error:", bookingError);
      return NextResponse.json({ success: false, error: bookingError.message }, { status: 500 });
    }

    console.log(`[GetBookings] Found ${bookings?.length || 0} bookings for ${email}`);

    return NextResponse.json({ success: true, bookings: bookings || [] });
  } catch (error: any) {
    console.error("[GetBookings] Critical error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
