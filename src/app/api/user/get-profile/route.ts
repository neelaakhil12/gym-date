import { NextResponse } from "next/server";
import { query } from "@/lib/db";
export const dynamic = 'force-dynamic';

function cleanStr(v: any): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (
    !trimmed || 
    trimmed === 'undefined' || 
    trimmed === 'null' || 
    trimmed.toLowerCase() === 'undefined' || 
    trimmed.toLowerCase() === 'null'
  ) {
    return null;
  }
  return trimmed;
}

function cleanPhoneStr(p: any): string | null {
  if (typeof p !== 'string') return null;
  const stripped = p.replace('undefined', '').replace('null', '').trim();
  const digits = stripped.replace(/\D/g, '');
  if (digits.length >= 10) {
    return `+91${digits.slice(-10)}`;
  }
  return null;
}

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
        nameFromProfiles = cleanStr(profileRow.rows[0].full_name);
        phoneFromProfiles = cleanPhoneStr(profileRow.rows[0].phone);
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
              wallet_balance: extra.wallet_balance !== undefined && extra.wallet_balance !== null ? parseFloat(extra.wallet_balance) : (profile.wallet_balance ? parseFloat(profile.wallet_balance) : 0),
              referral_code: extra.referral_code || profile.referral_code || null,
              referred_by: extra.referred_by || profile.referred_by || null,
              address: cleanStr(extra.address) || cleanStr(profile.address) || cleanStr(profile.location),
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

      const validDbName = cleanStr(profile.full_name);
      profile.full_name = validDbName || nameFromProfiles || "Gym Member";

      const validDbPhone = cleanPhoneStr(profile.phone);
      profile.phone = validDbPhone || phoneFromProfiles || null;

      if (!profile.address && profile.location) {
        profile.address = cleanStr(profile.location);
      }
      if (!profile.latitude && profile.lat) {
        profile.latitude = profile.lat;
      }
      if (!profile.longitude && profile.lng) {
        profile.longitude = profile.lng;
      }

      // Auto-heal DB if it had corrupted values
      if (profile.full_name && profile.full_name !== 'undefined' && profile.id) {
        try {
          if (validDbName && validDbName !== result.rows[0]?.full_name) {
            await query('UPDATE users SET full_name = $1 WHERE id = $2', [validDbName, profile.id]);
          }
          if (profile.phone && profile.phone !== result.rows[0]?.phone) {
            await query('UPDATE users SET phone = $1 WHERE id = $2', [profile.phone, profile.id]);
          }
        } catch (_) {}
      }
    }

    return NextResponse.json({ 
      success: true, 
      profile: profile || null,
      hasLocation: Boolean(profile?.latitude && profile?.longitude)
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
