"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

export default function AppCallbackPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const email = encodeURIComponent(session.user.email || "");
      const name = encodeURIComponent(session.user.name || "Gym Member");
      const deepLink = `gymdate://auth?email=${email}&name=${name}&status=success`;
      
      // Redirect back to the mobile app
      window.location.href = deepLink;
    } else if (status === "unauthenticated") {
      window.location.href = "/api/auth/signin/google?callbackUrl=/auth/app-callback";
    }
  }, [status, session]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 flex flex-col items-center text-center max-w-sm w-full">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <h2 className="text-xl font-black text-secondary">Completing Google Sign-In</h2>
        <p className="text-xs text-gray-400 mt-2">Redirecting you securely back to the GymDate App...</p>
      </div>
    </div>
  );
}
