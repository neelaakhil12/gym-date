import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    console.log("Starting manual migration...");
    
    // 1. DROP and RECREATE to fix ownership issues
    console.log("Dropping and recreating table to fix ownership...");
    await query("DROP TABLE IF EXISTS partner_requests CASCADE");
    
    await query(`
      CREATE TABLE partner_requests (
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

    // 5. Check User Count, Schema, and Roles
    const userCount = await query("SELECT COUNT(*) as count FROM users");
    const userList = await query("SELECT email, role_id, full_name FROM users");
    const userSchema = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    const partnerSchema = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'partner_requests'
    `);

    return NextResponse.json({ 
      success: true, 
      message: "Database check completed.",
      totalUsers: userCount.rows[0]?.count || 0,
      allUsers: userList.rows,
      userTableSchema: userSchema.rows,
      partnerTableSchema: partnerSchema.rows
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
