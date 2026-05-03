"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Partner-specific SessionProvider.
 * Points to /api/auth/partner — reads/writes only the gymdate.partner-token cookie.
 * Completely isolated from customer and admin sessions.
 */
export default function PartnerAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider basePath="/api/auth/partner">{children}</SessionProvider>
  );
}
