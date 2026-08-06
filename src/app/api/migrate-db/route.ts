import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Roles & Core Tables
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        phone TEXT,
        address TEXT,
        role_id TEXT DEFAULT 'user',
        wallet_balance DECIMAL(10,2) DEFAULT 0,
        referral_code TEXT,
        referred_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS gyms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        description TEXT,
        price_per_day DECIMAL(10,2) DEFAULT 199,
        partner_referral_amount DECIMAL(10,2) DEFAULT 100,
        has_offer BOOLEAN DEFAULT false,
        offer_percentage INTEGER DEFAULT 0,
        partner_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        duration TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        gym_id UUID REFERENCES gyms(id),
        customer_name TEXT,
        customer_email TEXT,
        plan_name TEXT,
        amount DECIMAL(10,2),
        status TEXT DEFAULT 'completed',
        payment_id TEXT,
        razorpay_order_id TEXT,
        ticket_code TEXT,
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

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
      );

      CREATE TABLE IF NOT EXISTS referral_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        referrer_id UUID REFERENCES users(id),
        referred_user_email TEXT,
        type TEXT,
        amount DECIMAL(10,2),
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS platform_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS wallet (
        id TEXT PRIMARY KEY DEFAULT 'platform_wallet',
        balance DECIMAL(10,2) DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Insert Platform Config Defaults if not present
    await query(`
      INSERT INTO platform_config (key, value) VALUES 
        ('refer_a_friend', '50'),
        ('partner_referral_bonus', '500'),
        ('max_wallet_per_transaction', '10'),
        ('signup_bonus', '25')
      ON CONFLICT (key) DO NOTHING;

      INSERT INTO wallet (id, balance) VALUES ('platform_wallet', 0)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 3. Check table stats
    const users = await query("SELECT COUNT(*) FROM users");
    const gyms = await query("SELECT COUNT(*) FROM gyms");
    const leads = await query("SELECT COUNT(*) FROM partner_requests");
    
    return NextResponse.json({ 
      success: true, 
      message: "Cloud database schema initialized successfully!",
      stats: {
        users: users.rows[0].count,
        gyms: gyms.rows[0].count,
        leads: leads.rows[0].count
      }
    });
  } catch (error: any) {
    console.error("Migration Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
