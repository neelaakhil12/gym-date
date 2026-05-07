import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Ensure partner_requests table exists with correct schema (safe upsert)
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

    // 2. Fix users who have role_id='partner' but are NOT actual gym partners
    const fixResult = await query(`
      UPDATE users
      SET role_id = 'user'
      WHERE role_id = 'partner'
        AND id NOT IN (
          SELECT DISTINCT partner_id FROM gyms WHERE partner_id IS NOT NULL
        )
    `);

    // 3. List all users with their roles
    const userList = await query(`
      SELECT u.email, u.full_name, u.role_id,
             g.name as gym_name
      FROM users u
      LEFT JOIN gyms g ON u.id = g.partner_id
      ORDER BY u.created_at DESC
    `);

    return NextResponse.json({ 
      success: true, 
      message: "Diagnostics complete. Orphaned partner roles fixed.",
      rolesFixed: fixResult.rowCount,
      totalUsers: userList.rows.length,
      allUsers: userList.rows,
    });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
