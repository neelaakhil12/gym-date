import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, phone, lat, lng, address, image, avatar } = body;
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const normEmail = email.trim().toLowerCase();
    if (!normEmail) {
      return NextResponse.json({ success: false, error: "Valid email is required" }, { status: 400 });
    }

    // 1. Sanitize Full Name (Reject 'undefined', 'null', 'User', 'Gym Member')
    let cleanName: string | undefined = undefined;
    if (typeof name === 'string') {
      const trimmed = name.trim();
      if (
        trimmed && 
        trimmed !== 'undefined' && 
        trimmed !== 'null' && 
        trimmed.toLowerCase() !== 'undefined' && 
        trimmed.toLowerCase() !== 'null' && 
        trimmed !== 'User' && 
        trimmed !== 'Gym Member'
      ) {
        cleanName = trimmed;
      }
    }

    // 2. Sanitize Phone Number (Extract digits, must be at least 10 digits)
    let cleanPhone: string | undefined = undefined;
    if (typeof phone === 'string') {
      const stripped = phone.replace('undefined', '').replace('null', '').trim();
      const digits = stripped.replace(/\D/g, '');
      if (digits.length >= 10) {
        const last10 = digits.slice(-10);
        cleanPhone = `+91${last10}`;
      }
    }

    // 3. Sanitize Image/Avatar
    const profileImg = image !== undefined ? image : (avatar !== undefined ? avatar : undefined);

    // 4. Sanitize Address
    let cleanAddress: string | undefined = undefined;
    if (typeof address === 'string') {
      const trimmed = address.trim();
      if (trimmed && trimmed !== 'undefined' && trimmed !== 'null' && trimmed.toLowerCase() !== 'undefined') {
        cleanAddress = trimmed;
      }
    }

    // 5. Sanitize Latitude & Longitude
    const cleanLat = (lat !== undefined && lat !== null && !isNaN(Number(lat)) && Number(lat) !== 0) ? Number(lat) : undefined;
    const cleanLng = (lng !== undefined && lng !== null && !isNaN(Number(lng)) && Number(lng) !== 0) ? Number(lng) : undefined;

    // Auto-heal / clean existing corrupted 'undefined' or 'null' values for this email in database
    try {
      await query(`
        UPDATE users 
        SET full_name = CASE WHEN full_name ILIKE 'undefined' OR full_name ILIKE 'null' THEN NULL ELSE full_name END,
            phone = CASE WHEN phone ILIKE '%undefined%' OR phone ILIKE '%null%' THEN NULL ELSE phone END
        WHERE LOWER(email) = $1;
      `, [normEmail]);
    } catch (e) {}

    // Ensure dedicated user_profiles table exists
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

      if (profileImg !== undefined || cleanName !== undefined || cleanPhone !== undefined) {
        await query(`
          INSERT INTO user_profiles (email, image, avatar, full_name, phone, updated_at)
          VALUES ($1, $2, $2, $3, $4, CURRENT_TIMESTAMP)
          ON CONFLICT (email) DO UPDATE SET
            image = CASE WHEN $2 IS NOT NULL THEN $2 ELSE user_profiles.image END,
            avatar = CASE WHEN $2 IS NOT NULL THEN $2 ELSE user_profiles.avatar END,
            full_name = CASE WHEN $3 IS NOT NULL THEN $3 ELSE user_profiles.full_name END,
            phone = CASE WHEN $4 IS NOT NULL THEN $4 ELSE user_profiles.phone END,
            updated_at = CURRENT_TIMESTAMP
        `, [
          normEmail, 
          profileImg !== undefined ? (profileImg || '') : null, 
          cleanName !== undefined ? cleanName : null, 
          cleanPhone !== undefined ? cleanPhone : null
        ]);
      }
    } catch (profErr) {
      console.warn("user_profiles table sync warn:", profErr);
    }

    // Ensure users columns
    try {
      await query(`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
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

      if (cleanName !== undefined) {
        updateVals.push(cleanName);
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
      if (cleanPhone !== undefined && userCols.has("phone")) {
        updateVals.push(cleanPhone);
        updateParts.push(`phone = $${updateVals.length}`);
      }
      if (cleanLat !== undefined) {
        if (userCols.has("latitude")) {
          updateVals.push(cleanLat);
          updateParts.push(`latitude = $${updateVals.length}`);
        } else if (userCols.has("lat")) {
          updateVals.push(cleanLat);
          updateParts.push(`lat = $${updateVals.length}`);
        }
      }
      if (cleanLng !== undefined) {
        if (userCols.has("longitude")) {
          updateVals.push(cleanLng);
          updateParts.push(`longitude = $${updateVals.length}`);
        } else if (userCols.has("lng")) {
          updateVals.push(cleanLng);
          updateParts.push(`lng = $${updateVals.length}`);
        }
      }
      if (cleanAddress !== undefined) {
        if (userCols.has("address")) {
          updateVals.push(cleanAddress);
          updateParts.push(`address = $${updateVals.length}`);
        } else if (userCols.has("location")) {
          updateVals.push(cleanAddress);
          updateParts.push(`location = $${updateVals.length}`);
        }
      }

      if (updateParts.length > 0) {
        updateVals.push(normEmail);
        const updateSql = `UPDATE users SET ${updateParts.join(", ")} WHERE LOWER(email) = $${updateVals.length} RETURNING *`;
        const updateRes = await query(updateSql, updateVals);
        user = updateRes.rows[0];
      } else {
        user = existing.rows[0];
      }
    } else {
      const insertCols = ["email", "full_name", "role_id"];
      const insertVals: any[] = [normEmail, cleanName || "Gym Member", "user"];

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
      if (cleanPhone && userCols.has("phone")) {
        insertVals.push(cleanPhone);
        insertCols.push("phone");
      }
      if (cleanLat !== undefined) {
        if (userCols.has("latitude")) {
          insertVals.push(cleanLat);
          insertCols.push("latitude");
        } else if (userCols.has("lat")) {
          insertVals.push(cleanLat);
          insertCols.push("lat");
        }
      }
      if (cleanLng !== undefined) {
        if (userCols.has("longitude")) {
          insertVals.push(cleanLng);
          insertCols.push("longitude");
        } else if (userCols.has("lng")) {
          insertVals.push(cleanLng);
          insertCols.push("lng");
        }
      }
      if (cleanAddress) {
        if (userCols.has("address")) {
          insertVals.push(cleanAddress);
          insertCols.push("address");
        } else if (userCols.has("location")) {
          insertVals.push(cleanAddress);
          insertCols.push("location");
        }
      }

      const placeholders = insertVals.map((_, i) => `$${i + 1}`).join(", ");
      const insertSql = `INSERT INTO users (${insertCols.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const insertRes = await query(insertSql, insertVals);
      user = insertRes.rows[0];
    }

    // Also persist in users_extra table
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
        `);
        if (cleanAddress !== undefined || cleanLat !== undefined || cleanLng !== undefined || profileImg !== undefined) {
          await query(`
            INSERT INTO users_extra (user_id, address, latitude, longitude, image, avatar, updated_at)
            VALUES ($1, $2, $3, $4, $5, $5, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO UPDATE SET
              address = CASE WHEN $2 IS NOT NULL THEN $2 ELSE users_extra.address END,
              latitude = CASE WHEN $3 IS NOT NULL THEN $3 ELSE users_extra.latitude END,
              longitude = CASE WHEN $4 IS NOT NULL THEN $4 ELSE users_extra.longitude END,
              image = CASE WHEN $5 IS NOT NULL THEN $5 ELSE users_extra.image END,
              avatar = CASE WHEN $5 IS NOT NULL THEN $5 ELSE users_extra.avatar END,
              updated_at = CURRENT_TIMESTAMP
          `, [user.id, cleanAddress || null, cleanLat || null, cleanLng || null, profileImg || null]);
        }
      } catch (extraErr) {
        console.warn("users_extra error:", extraErr);
      }
    }

    // Consolidate final returned user object
    if (cleanName && (!user.full_name || user.full_name === 'undefined' || user.full_name === 'Gym Member')) {
      user.full_name = cleanName;
    }
    if (cleanPhone && (!user.phone || user.phone.includes('undefined'))) {
      user.phone = cleanPhone;
    }
    if (cleanAddress && !user.address) {
      user.address = cleanAddress;
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
