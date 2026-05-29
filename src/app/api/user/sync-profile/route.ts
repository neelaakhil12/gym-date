import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, name, phone, lat, lng, address } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const formattedPhone = phone && phone.startsWith('+91') ? phone : (phone ? `+91${phone}` : null);

    // Save all profile data including location
    const result = await query(
      `INSERT INTO users (email, full_name, phone, latitude, longitude, address, role_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'user')
       ON CONFLICT (email) DO UPDATE SET
       full_name = COALESCE(EXCLUDED.full_name, users.full_name),
       phone = COALESCE(EXCLUDED.phone, users.phone),
       latitude = COALESCE(EXCLUDED.latitude, users.latitude),
       longitude = COALESCE(EXCLUDED.longitude, users.longitude),
       address = COALESCE(EXCLUDED.address, users.address)
       RETURNING *`,
      [email, name || null, formattedPhone, lat || null, lng || null, address || null]
    );

    return NextResponse.json({ success: true, user: result.rows[0] }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error: any) {
    console.error("Profile Sync Error:", error);
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
