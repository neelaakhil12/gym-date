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

    const normEmail = email.trim().toLowerCase();

    // 1. Query dedicated user_profiles table
    let photoFromProfiles: string | null = null;
    let nameFromProfiles: string | null = null;
    let phoneFromProfiles: string | null = null;
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          email VARCHAR(255) PRIMARY KEY,
          image TEXT,
          avatar TEXT,
          full_name TEXT,
          phone TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      const profileRow = await query('SELECT * FROM user_profiles WHERE LOWER(email) = $1', [normEmail]);
      if (profileRow.rows.length > 0) {
        photoFromProfiles = profileRow.rows[0].image || profileRow.rows[0].avatar || null;
        nameFromProfiles = profileRow.rows[0].full_name || null;
        phoneFromProfiles = profileRow.rows[0].phone || null;
      }
    } catch (e) {}

    const result = await query(
      'SELECT * FROM users WHERE LOWER(email) = $1',
      [normEmail]
    );

    let profile = result.rows[0] || null;

    if (!profile && (photoFromProfiles || nameFromProfiles || phoneFromProfiles)) {
      profile = {
        email: normEmail,
        full_name: nameFromProfiles || "Gym Member",
        phone: phoneFromProfiles,
        image: photoFromProfiles,
        avatar: photoFromProfiles
      };
    }

    if (profile) {
      try {
        if (profile.id) {
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
              longitude: extra.longitude ?? profile.longitude ?? profile.lng,
              image: photoFromProfiles || profile.image || extra.image || profile.avatar || extra.avatar || null,
              avatar: photoFromProfiles || profile.avatar || extra.avatar || profile.image || extra.image || null
            };
          }
        }
      } catch (e) {}

      const userImage = photoFromProfiles || profile.image || profile.avatar || null;
      profile.image = userImage;
      profile.avatar = userImage;
      if (nameFromProfiles && !profile.full_name) profile.full_name = nameFromProfiles;
      if (phoneFromProfiles && !profile.phone) profile.phone = phoneFromProfiles;

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
