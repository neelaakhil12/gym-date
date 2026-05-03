import { NextResponse } from "next/server";

/**
 * Force sign-out route — clears the NextAuth JWT session cookie immediately.
 * Visit /api/auth/force-signout in a browser to destroy any stale/dummy session.
 * Redirects to /login after clearing.
 */
export async function GET() {
  const response = NextResponse.redirect(
    new URL("/login", process.env.NEXTAUTH_URL || "https://gymdate.in")
  );

  // Clear the custom NextAuth session cookie by setting it to expire in the past
  response.cookies.set("gymdate.session-token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0), // Epoch = immediately expired
    secure: process.env.NODE_ENV === "production",
  });

  // Also clear the default next-auth cookie names as fallback
  response.cookies.set("next-auth.session-token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    secure: process.env.NODE_ENV === "production",
  });

  response.cookies.set("__Secure-next-auth.session-token", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
    secure: true,
  });

  return response;
}
