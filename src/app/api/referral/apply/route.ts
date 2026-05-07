import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/referral/apply - called after login to save referred_by
export async function POST(req: NextRequest) {
  try {
    const { email, referralCode } = await req.json();
    if (!email || !referralCode) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Don't apply if user already has a referral set (only first-time)
    const user = await query('SELECT id, referred_by, referral_code FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const userData = user.rows[0];

    // Prevent self-referral
    if (userData.referral_code === referralCode) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    // Only set if not already referred
    if (!userData.referred_by) {
      // Verify the referral code exists
      const referrer = await query('SELECT id FROM users WHERE referral_code = $1', [referralCode]);
      if (referrer.rows.length > 0) {
        await query('UPDATE users SET referred_by = $1 WHERE id = $2', [referralCode, userData.id]);
        console.log(`[Referral] User ${email} referred by code ${referralCode}`);
        return NextResponse.json({ success: true, message: 'Referral applied!' });
      }
    }

    return NextResponse.json({ success: true, message: 'No action needed' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
