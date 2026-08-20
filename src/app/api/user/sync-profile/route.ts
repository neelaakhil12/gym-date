import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, name, phone, lat, lng, address } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    const formattedPhone = phone && phone.startsWith('+91') ? phone : (phone ? `+91${phone}` : null);

    // Dynamically check columns on users table
    const userColsRes = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    const userCols = new Set((userColsRes.rows || []).map((r: any) => r.column_name.toLowerCase()));

    // Check if user already exists
    const existing = await query("SELECT * FROM users WHERE email = $1", [email]);

    let user;
    if (existing.rows.length > 0) {
      const updateParts: string[] = [];
      const updateVals: any[] = [];

      if (name) {
        updateVals.push(name);
        updateParts.push(`full_name = $${updateVals.length}`);
      }
      if (formattedPhone && userCols.has("phone")) {
        updateVals.push(formattedPhone);
        updateParts.push(`phone = $${updateVals.length}`);
      }
      if (lat && userCols.has("latitude")) {
        updateVals.push(lat);
        updateParts.push(`latitude = $${updateVals.length}`);
      }
      if (lng && userCols.has("longitude")) {
        updateVals.push(lng);
        updateParts.push(`longitude = $${updateVals.length}`);
      }
      if (address && userCols.has("address")) {
        updateVals.push(address);
        updateParts.push(`address = $${updateVals.length}`);
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

      if (formattedPhone && userCols.has("phone")) {
        insertVals.push(formattedPhone);
        insertCols.push("phone");
      }
      if (lat && userCols.has("latitude")) {
        insertVals.push(lat);
        insertCols.push("latitude");
      }
      if (lng && userCols.has("longitude")) {
        insertVals.push(lng);
        insertCols.push("longitude");
      }
      if (address && userCols.has("address")) {
        insertVals.push(address);
        insertCols.push("address");
      }

      const placeholders = insertVals.map((_, i) => `$${i + 1}`).join(", ");
      const insertRes = await query(
        `INSERT INTO users (${insertCols.join(", ")}) VALUES (${placeholders}) RETURNING *`,
        insertVals
      );
      user = insertRes.rows[0];
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
