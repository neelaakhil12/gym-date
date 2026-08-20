import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

// POST /api/admin/setup-admin-table
// Creates admin_users table and migrates existing super_admin accounts
export async function POST(request: Request) {
  try {
    // 1. Create admin_users table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Detect the password column name in users table
    const colCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name IN ('password_hash', 'password', 'hashed_password', 'passwd')
      LIMIT 1
    `);

    let migrated = { rows: [] as any[] };

    if (colCheck.rows.length > 0) {
      const pwdCol = colCheck.rows[0].column_name;
      migrated = await query(`
        INSERT INTO admin_users (id, email, full_name, password_hash, created_at)
        SELECT
          id::uuid,
          email,
          full_name,
          ${pwdCol},
          COALESCE(created_at, CURRENT_TIMESTAMP)
        FROM users
        WHERE role_id = 'super_admin'
        ON CONFLICT (email) DO UPDATE
          SET full_name     = EXCLUDED.full_name,
              password_hash = EXCLUDED.password_hash
        RETURNING id, email, full_name
      `);
    }

    // 3. Count current admin_users
    const countRes = await query("SELECT COUNT(*) as count FROM admin_users");

    return NextResponse.json({
      success: true,
      message: "admin_users table ready",
      migrated_count: migrated.rows.length,
      total_admins: parseInt(countRes.rows[0].count),
      admins: migrated.rows,
    });
  } catch (error: any) {
    console.error("Setup admin table error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/setup-admin-table
// Directly insert/update a super admin with a provided password
// Body: { email, password, full_name }
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { email, password, full_name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "email and password are required" },
        { status: 400 }
      );
    }

    // Ensure table exists
    await query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const password_hash = await bcrypt.hash(password, 12);

    const result = await query(
      `INSERT INTO admin_users (email, full_name, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             full_name     = EXCLUDED.full_name,
             updated_at    = CURRENT_TIMESTAMP
       RETURNING id, email, full_name`,
      [email, full_name || "Super Admin", password_hash]
    );

    return NextResponse.json({
      success: true,
      message: `Admin account created/updated for ${email}`,
      admin: result.rows[0],
    });
  } catch (error: any) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET /api/admin/setup-admin-table
// Check current state of admin_users table
export async function GET() {
  try {
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'admin_users'
      ) as exists
    `);

    const tableExists = tableCheck.rows[0].exists;

    if (!tableExists) {
      return NextResponse.json({
        table_exists: false,
        message: "admin_users table does NOT exist. Call POST to create it.",
      });
    }

    const admins = await query(
      "SELECT id, email, full_name, created_at FROM admin_users"
    );

    return NextResponse.json({
      table_exists: true,
      admin_count: admins.rows.length,
      admins: admins.rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
