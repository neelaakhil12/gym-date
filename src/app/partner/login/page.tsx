"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PartnerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Verify the user is actually a partner
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', data.user.id)
        .single();

      if (profileError || profileData?.role_id !== 'partner') {
        await supabase.auth.signOut();
        throw new Error("Access denied. You do not have partner privileges.");
      }

      router.push("/partner/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred during login.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center mb-8">
          <img 
            src="/brand-logo.png" 
            alt="GymDate Logo" 
            className="h-20 w-auto object-contain"
          />
        </Link>
        <h2 className="text-center text-3xl font-black text-secondary">
          Gym Partner Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Manage your gym, view revenue, and track enrollments.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 text-sm font-semibold text-center">
              {error}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Partner Email</label>
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
                  href="/partner/forgot-password" 
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
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-70"
              >
                {loading ? "Signing in..." : "Sign In to Partner Dashboard"}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
             <Link href="/" className="text-sm font-medium text-gray-500 hover:text-primary">
               &larr; Back to main website
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
