import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

    const result = await query(`
      SELECT g.name 
      FROM users u
      JOIN gyms g ON u.id::text = g.partner_id::text
      WHERE u.referral_code = $1
      LIMIT 1
    `, [code]);

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, name: null });
    }

    return NextResponse.json({ success: true, name: result.rows[0].name });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
