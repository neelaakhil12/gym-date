"use client";

import React from "react";
import StaffAuthProvider from "@/components/StaffAuthProvider";

export default function OperationAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StaffAuthProvider>
      {children}
    </StaffAuthProvider>
  );
}
