import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    // Check if columns exist
    const checkColumns = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='gyms' and column_name='lat';
    `);

    if (checkColumns.rows.length === 0) {
      // Add columns if they don't exist
      await query(`ALTER TABLE gyms ADD COLUMN lat NUMERIC;`);
      await query(`ALTER TABLE gyms ADD COLUMN lng NUMERIC;`);
      return NextResponse.json({ success: true, message: "Columns lat and lng successfully added to gyms table." });
    }

    return NextResponse.json({ success: true, message: "Columns already exist." });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
