import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, name, phone, lat, lng, address } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const formattedPhone = phone && phone.startsWith('+91') ? phone : (phone ? `+91${phone}` : null);

    // Using basic users table without lat/lng to prevent schema crashes
    const result = await query(
      `INSERT INTO users (email, full_name, phone, role_id)
       VALUES ($1, $2, $3, 'user')
       ON CONFLICT (email) DO UPDATE SET
       full_name = COALESCE(EXCLUDED.full_name, users.full_name),
       phone = COALESCE(EXCLUDED.phone, users.phone)
       RETURNING *`,
      [email, name || null, formattedPhone]
    );

    return NextResponse.json({ success: true, user: result.rows[0] });
  } catch (error: any) {
    console.error("Profile Sync Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
