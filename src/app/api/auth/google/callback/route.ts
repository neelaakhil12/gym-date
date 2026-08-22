import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      console.warn('[Google OAuth Callback] Error or missing code:', error);
      return NextResponse.redirect('gymdate://auth?status=error');
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || '341891746262-9phgg3534a11a05d16iuoejh6h48kgnq.apps.googleusercontent.com';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const redirectUri = 'https://gymdate.in/api/auth/google/callback';

    // Exchange authorization code for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('[Google OAuth Token Error]:', tokenData);
      return NextResponse.redirect('gymdate://auth?status=token_error');
    }

    // Fetch user profile from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();

    const email = (googleUser.email || '').trim().toLowerCase();
    const name = (googleUser.name || 'Gym Member').trim();

    if (email) {
      // Sync or insert user in PostgreSQL
      try {
        const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length === 0) {
          await query(
            "INSERT INTO users (email, full_name, role_id) VALUES ($1, $2, 'user')",
            [email, name]
          );
        } else {
          await query(
            "UPDATE users SET full_name = COALESCE($1, full_name) WHERE email = $2",
            [name, email]
          );
        }
      } catch (dbErr) {
        console.warn('[Google OAuth DB Sync Error]:', dbErr);
      }
    }

    // Return deep link to mobile app
    const deepLink = `gymdate://auth?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}&status=success`;
    return NextResponse.redirect(deepLink);
  } catch (err: any) {
    console.error('[Google OAuth Callback Catch]:', err);
    return NextResponse.redirect('gymdate://auth?status=server_error');
  }
}
