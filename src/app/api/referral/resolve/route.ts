import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

    const cleanCode = code.trim().toUpperCase();

    const result = await query(`
      SELECT COALESCE(g.name, u.full_name, 'A Partner') as name 
      FROM users u
      LEFT JOIN gyms g ON u.id::text = g.partner_id::text
      WHERE TRIM(UPPER(u.referral_code)) = $1
      LIMIT 1
    `, [cleanCode]);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, name: null });
    }

    return NextResponse.json({ success: true, name: result.rows[0].name });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
