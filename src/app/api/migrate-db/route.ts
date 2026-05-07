import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Repair/Create partner_requests table
    await query(`
      CREATE TABLE IF NOT EXISTS partner_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_name TEXT NOT NULL,
        owner_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        city TEXT,
        address TEXT,
        status TEXT DEFAULT 'pending',
        referred_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Repair/Create Users table columns
    try {
      await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10,2) DEFAULT 0");
      await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT");
      await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT");
    } catch (e) {
      console.warn("User columns already exist or permission issue");
    }

    // 3. Repair/Create Gyms table columns
    try {
      await query("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS partner_referral_amount DECIMAL(10,2) DEFAULT 100");
      await query("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS has_offer BOOLEAN DEFAULT false");
      await query("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS offer_percentage INTEGER DEFAULT 0");
    } catch (e) {
      console.warn("Gym columns already exist or permission issue");
    }

    // 4. Create Referral Transactions table
    await query(`
      CREATE TABLE IF NOT EXISTS referral_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID REFERENCES users(id),
        referred_user_email TEXT,
        type TEXT,
        amount DECIMAL(10,2),
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Final sync of columns
    try {
      await query("ALTER TABLE partner_requests ADD COLUMN IF NOT EXISTS referred_by TEXT");
    } catch (e) {}

    const users = await query("SELECT COUNT(*) FROM users");
    const leads = await query("SELECT COUNT(*) FROM partner_requests");
    
    return NextResponse.json({ 
      success: true, 
      message: "Database schema repaired successfully",
      stats: {
        users: users.rows[0].count,
        leads: leads.rows[0].count
      }
    });
  } catch (error: any) {
    console.error("Migration Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
