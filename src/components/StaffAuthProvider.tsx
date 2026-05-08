"use client";

import { SessionProvider } from "next-auth/react";

export default function StaffAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider basePath="/api/auth/staff">{children}</SessionProvider>
  );
}
