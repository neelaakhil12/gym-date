"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Admin-specific SessionProvider.
 * Points to /api/auth/admin — reads/writes only the gymdate.admin-token cookie.
 * Completely isolated from customer and partner sessions.
 */
export default function AdminAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider basePath="/api/auth/admin">{children}</SessionProvider>
  );
}
