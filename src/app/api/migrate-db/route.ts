import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    // Create users table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        full_name TEXT,
        phone TEXT,
        role_id TEXT DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create bookings table if it doesn't exist
    await query(`DROP TABLE IF EXISTS bookings;`);
    await query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT,
        gym_id TEXT,
        plan_name TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        status TEXT DEFAULT 'pending',
        payment_id TEXT,
        razorpay_order_id TEXT,
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Check if columns exist in gyms
    const checkColumns = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='gyms' and column_name='lat';
    `);

    if (checkColumns.rows.length === 0) {
      // Add columns if they don't exist
      await query(`ALTER TABLE gyms ADD COLUMN lat NUMERIC;`);
      await query(`ALTER TABLE gyms ADD COLUMN lng NUMERIC;`);
    }

    return NextResponse.json({ success: true, message: "Database schema updated successfully." });
  } catch (err: any) {
    console.error("Migration error:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
