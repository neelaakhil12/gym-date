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

    // 1. Ensure bookings table exists with core columns
    await query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT,
        gym_id TEXT,
        plan_name TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Add new columns if missing
    const bookingColumns = await query(`
      SELECT column_name FROM information_schema.columns WHERE table_name='bookings';
    `);
    const cols = bookingColumns.rows.map(r => r.column_name);

    if (!cols.includes('customer_name')) await query(`ALTER TABLE bookings ADD COLUMN customer_name TEXT;`);
    if (!cols.includes('customer_email')) await query(`ALTER TABLE bookings ADD COLUMN customer_email TEXT;`);
    if (!cols.includes('ticket_code')) await query(`ALTER TABLE bookings ADD COLUMN ticket_code TEXT;`);
    if (!cols.includes('payment_id')) await query(`ALTER TABLE bookings ADD COLUMN payment_id TEXT;`);
    if (!cols.includes('razorpay_order_id')) await query(`ALTER TABLE bookings ADD COLUMN razorpay_order_id TEXT;`);
    if (!cols.includes('start_date')) await query(`ALTER TABLE bookings ADD COLUMN start_date TIMESTAMP WITH TIME ZONE;`);
    if (!cols.includes('end_date')) await query(`ALTER TABLE bookings ADD COLUMN end_date TIMESTAMP WITH TIME ZONE;`);

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

    const usersCount = await query("SELECT COUNT(*) FROM users");
    const bookingsCount = await query("SELECT COUNT(*) FROM bookings");
    const gymsCount = await query("SELECT COUNT(*) FROM gyms");
    const lastBookings = await query("SELECT * FROM bookings ORDER BY created_at DESC LIMIT 5");

    return NextResponse.json({ 
      success: true, 
      message: "Database schema updated successfully.",
      counts: {
        users: usersCount.rows[0].count,
        bookings: bookingsCount.rows[0].count,
        gyms: gymsCount.rows[0].count
      },
      lastBookings: lastBookings.rows
    });
  } catch (err: any) {
    console.error("Migration error:", err);
    return NextResponse.json({ success: false, error: err.message });
  }
}
