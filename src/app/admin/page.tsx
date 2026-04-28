"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Lock } from "lucide-react";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: nextAuthSession } = useSession();

  useEffect(() => {
    const checkExistingAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userEmail = session?.user?.email || nextAuthSession?.user?.email;

        if (userEmail) {
          const response = await fetch(`/api/user/get-profile?email=${userEmail}`);
          const result = await response.json();
          
          if (result.success && result.profile?.role_id === "super_admin") {
            router.push("/admin/dashboard");
          }
        }
      } catch (err) {
        console.error("Error checking existing admin session:", err);
      }
    };
    checkExistingAdmin();
  }, [nextAuthSession, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Login failed");
      }

      // 2. Verify Super Admin Role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role_id")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        // Fallback check if profiles are not strictly enforced yet, 
        // but normally we should throw here. For now let's enforce it.
        throw new Error("Could not verify admin role. Please contact support.");
      }

      if (profile.role_id !== "super_admin") {
        // Sign them out immediately if they are not a super admin
        await supabase.auth.signOut();
        throw new Error("Access Denied: You do not have super admin privileges.");
      }

      // 3. Success -> Redirect
      router.push("/admin/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-primary mb-6">
          <Lock className="w-12 h-12" />
        </div>
        <h2 className="text-center text-3xl font-black text-secondary">
          Super Admin Panel
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to manage the GymDate platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
              <div className="flex justify-end mt-2">
                <a 
                  href="/admin/forgot-password" 
                  className="text-sm font-semibold text-primary hover:text-red-700 transition-colors cursor-pointer"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-secondary hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign In to Dashboard"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
