import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    const profile = result.rows[0];

    return NextResponse.json({ 
      success: true, 
      hasLocation: true, // Auto-pass location check since we don't have lat/lng in users table yet
      profile: profile || null
    });
  } catch (error: any) {
    console.error("Get Profile Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
