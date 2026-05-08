"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function OperationAdminDashboard() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status !== "loading") {
      // Operations Admin only manages gyms — redirect directly
      router.replace("/admin/gyms");
    }
  }, [status, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
    </div>
  );
}
