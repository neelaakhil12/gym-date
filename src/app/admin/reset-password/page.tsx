"use client";

import React, { useState, useEffect } from "react";
import { Lock, CheckCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resetPasswordWithToken } from "@/actions/authActions";
import { useSearchParams } from "next/navigation";

export default function AdminResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  useEffect(() => {
    if (!token || !email) {
      setError("Invalid reset link. Please request a new one.");
    }
  }, [token, email]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email) {
      setError("Invalid reset link.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await resetPasswordWithToken(email, token, password);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(true);
      // Wait a bit and redirect to admin login
      setTimeout(() => {
        router.push("/admin");
      }, 3000);
    } catch (err: any) {
      setError("Failed to update admin password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="h-16 w-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-8 h-8 text-secondary" />
        </div>
        <h2 className="text-3xl font-black text-secondary">
          Set Admin Password
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Create a new secure password for your Super Admin account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 text-sm font-semibold text-center">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Password Updated!</h3>
              <p className="text-sm text-gray-500 mb-6">Your admin password has been successfully reset. Redirecting to admin login...</p>
              <Link href="/admin" className="text-secondary font-bold hover:underline">
                Go to admin login now
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleUpdate}>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Admin Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-secondary focus:border-secondary sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-secondary hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors disabled:opacity-70"
                >
                  {loading ? "Updating..." : "Update Admin Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
