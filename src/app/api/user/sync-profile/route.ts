import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, name, phone, lat, lng, address, image, avatar } = await req.json();
    const normEmail = email.trim().toLowerCase();
    const profileImg = image !== undefined ? image : (avatar !== undefined ? avatar : undefined);

    if (!normEmail) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const formattedPhone = phone && phone.startsWith('+91') ? phone : (phone ? `+91${phone}` : null);

    // 1. Dedicated user_profiles table to guarantee profile photo and details persistence
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
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS image TEXT;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar TEXT;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
        ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
      `);

      if (profileImg !== undefined || name || formattedPhone) {
        await query(`
          INSERT INTO user_profiles (email, image, avatar, full_name, phone, updated_at)
          VALUES ($1, $2, $2, $3, $4, CURRENT_TIMESTAMP)
          ON CONFLICT (email) DO UPDATE SET
            image = CASE WHEN $2 IS NOT NULL THEN $2 ELSE user_profiles.image END,
            avatar = CASE WHEN $2 IS NOT NULL THEN $2 ELSE user_profiles.avatar END,
            full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
            phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
            updated_at = CURRENT_TIMESTAMP
        `, [
          normEmail, 
          profileImg !== undefined ? (profileImg || '') : null, 
          name || null, 
          formattedPhone || null
        ]);
      }
    } catch (profErr) {
      console.warn("user_profiles table error:", profErr);
    }

    // Ensure image and avatar columns exist on users table
    try {
      await query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
      `);
    } catch (e) {}

    // Dynamically check columns on users table
    const userColsRes = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    const userCols = new Set((userColsRes.rows || []).map((r: any) => r.column_name.toLowerCase()));

    // Check if user already exists
    const existing = await query("SELECT * FROM users WHERE LOWER(email) = $1", [normEmail]);

    let user;
    if (existing.rows.length > 0) {
      const updateParts: string[] = [];
      const updateVals: any[] = [];

      if (name) {
        updateVals.push(name);
        updateParts.push(`full_name = $${updateVals.length}`);
      }
      if (profileImg !== undefined) {
        if (userCols.has("image")) {
          updateVals.push(profileImg || null);
          updateParts.push(`image = $${updateVals.length}`);
        }
        if (userCols.has("avatar")) {
          updateVals.push(profileImg || null);
          updateParts.push(`avatar = $${updateVals.length}`);
        }
      }
      if (formattedPhone && userCols.has("phone")) {
        updateVals.push(formattedPhone);
        updateParts.push(`phone = $${updateVals.length}`);
      }
      if (lat) {
        if (userCols.has("latitude")) {
          updateVals.push(lat);
          updateParts.push(`latitude = $${updateVals.length}`);
        } else if (userCols.has("lat")) {
          updateVals.push(lat);
          updateParts.push(`lat = $${updateVals.length}`);
        }
      }
      if (lng) {
        if (userCols.has("longitude")) {
          updateVals.push(lng);
          updateParts.push(`longitude = $${updateVals.length}`);
        } else if (userCols.has("lng")) {
          updateVals.push(lng);
          updateParts.push(`lng = $${updateVals.length}`);
        }
      }
      if (address) {
        if (userCols.has("address")) {
          updateVals.push(address);
          updateParts.push(`address = $${updateVals.length}`);
        } else if (userCols.has("location")) {
          updateVals.push(address);
          updateParts.push(`location = $${updateVals.length}`);
        }
      }

      if (updateParts.length > 0) {
        updateVals.push(email);
        const updateSql = `UPDATE users SET ${updateParts.join(", ")} WHERE email = $${updateVals.length} RETURNING *`;
        const updateRes = await query(updateSql, updateVals);
        user = updateRes.rows[0];
      } else {
        user = existing.rows[0];
      }
    } else {
      const insertCols = ["email", "full_name", "role_id"];
      const insertVals: any[] = [email, name || "Gym Member", "user"];

      if (profileImg) {
        if (userCols.has("image")) {
          insertVals.push(profileImg);
          insertCols.push("image");
        }
        if (userCols.has("avatar")) {
          insertVals.push(profileImg);
          insertCols.push("avatar");
        }
      }
      if (formattedPhone && userCols.has("phone")) {
        insertVals.push(formattedPhone);
        insertCols.push("phone");
      }
      if (lat) {
        if (userCols.has("latitude")) {
          insertVals.push(lat);
          insertCols.push("latitude");
        } else if (userCols.has("lat")) {
          insertVals.push(lat);
          insertCols.push("lat");
        }
      }
      if (lng) {
        if (userCols.has("longitude")) {
          insertVals.push(lng);
          insertCols.push("longitude");
        } else if (userCols.has("lng")) {
          insertVals.push(lng);
          insertCols.push("lng");
        }
      }
      if (address) {
        if (userCols.has("address")) {
          insertVals.push(address);
          insertCols.push("address");
        } else if (userCols.has("location")) {
          insertVals.push(address);
          insertCols.push("location");
        }
      }

      const placeholders = insertVals.map((_, i) => `$${i + 1}`).join(", ");
      const insertSql = `INSERT INTO users (${insertCols.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const insertRes = await query(insertSql, insertVals);
      user = insertRes.rows[0];
    }

    // Also persist in users_extra table to guarantee address, GPS coordinates and photo are always stored
    if (user?.id) {
      try {
        await query(`
          CREATE TABLE IF NOT EXISTS users_extra (
            user_id UUID PRIMARY KEY,
            address TEXT,
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            image TEXT,
            avatar TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          ALTER TABLE users_extra ADD COLUMN IF NOT EXISTS image TEXT;
          ALTER TABLE users_extra ADD COLUMN IF NOT EXISTS avatar TEXT;
        `);
        if (address || lat || lng || profileImg !== undefined) {
          await query(`
            INSERT INTO users_extra (user_id, address, latitude, longitude, image, avatar, updated_at)
            VALUES ($1, $2, $3, $4, $5, $5, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO UPDATE SET
              address = COALESCE(EXCLUDED.address, users_extra.address),
              latitude = COALESCE(EXCLUDED.latitude, users_extra.latitude),
              longitude = COALESCE(EXCLUDED.longitude, users_extra.longitude),
              image = CASE WHEN EXCLUDED.image IS NOT NULL THEN EXCLUDED.image ELSE users_extra.image END,
              avatar = CASE WHEN EXCLUDED.avatar IS NOT NULL THEN EXCLUDED.avatar ELSE users_extra.avatar END,
              updated_at = CURRENT_TIMESTAMP
          `, [user.id, address || null, lat || null, lng || null, profileImg || null]);
        }
      } catch (extraErr) {
        console.warn("users_extra error:", extraErr);
      }
    }

    if (address && !user.address) {
      user.address = address;
    }
    if (lat && !user.latitude) {
      user.latitude = lat;
    }
    if (lng && !user.longitude) {
      user.longitude = lng;
    }

    return NextResponse.json({ success: true, user }, {
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
