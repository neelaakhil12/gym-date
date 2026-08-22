import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '341891746262-9phgg3534a11a05d16iuoejh6h48kgnq.apps.googleusercontent.com';
  const redirectUri = 'https://gymdate.in/api/auth/google/callback';
  const scope = 'openid email profile';
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&prompt=select_account`;
  
  return NextResponse.redirect(googleAuthUrl);
}
