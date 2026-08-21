import { NextResponse } from "next/server";
import { query } from "@/lib/db";
export const dynamic = 'force-dynamic';

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

    let profile = result.rows[0] || null;

    if (profile) {
      try {
        const extraRes = await query('SELECT * FROM users_extra WHERE user_id::text = $1::text', [profile.id]);
        if (extraRes.rows.length > 0) {
          const extra = extraRes.rows[0];
          profile = {
            ...profile,
            wallet_balance: extra.wallet_balance !== undefined && extra.wallet_balance !== null ? parseFloat(extra.wallet_balance) : 0,
            referral_code: extra.referral_code || null,
            referred_by: extra.referred_by || null,
            address: extra.address || profile.address || profile.location,
            latitude: extra.latitude ?? profile.latitude ?? profile.lat,
            longitude: extra.longitude ?? profile.longitude ?? profile.lng
          };
        }
      } catch (e) {}

      if (!profile.address && profile.location) {
        profile.address = profile.location;
      }
      if (!profile.latitude && profile.lat) {
        profile.latitude = profile.lat;
      }
      if (!profile.longitude && profile.lng) {
        profile.longitude = profile.lng;
      }
    }

    return NextResponse.json({ 
      success: true, 
      profile: profile || null
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error: any) {
    console.error("Get Profile Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
