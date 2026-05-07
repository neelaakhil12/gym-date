import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log("Starting manual migration...");
    
    // 1. Ensure table exists
    await query(`
      CREATE TABLE IF NOT EXISTS partner_requests (
        id SERIAL PRIMARY KEY,
        gym_name VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        city VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Add columns if missing
    try { await query("ALTER TABLE partner_requests ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'"); } catch(e) {}
    try { await query("ALTER TABLE partner_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP"); } catch(e) {}

    // 3. Set defaults
    try {
      await query("ALTER TABLE partner_requests ALTER COLUMN status SET DEFAULT 'pending'");
      await query("ALTER TABLE partner_requests ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP");
    } catch (e) {}

    return NextResponse.json({ 
      success: true, 
      message: "Database migration successful! Status and Created_at columns are ready." 
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
