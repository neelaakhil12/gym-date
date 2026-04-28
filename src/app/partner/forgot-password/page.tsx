"use client";

import React, { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { sendPasswordResetEmail } from "@/actions/emailActions";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await sendPasswordResetEmail(email);

      if (result.error) throw new Error(result.error);

      setMessage("Password reset link has been sent to your email!");
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-black text-secondary">
          Reset Password
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-xl border border-red-100 text-sm font-semibold text-center">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 bg-green-50 text-green-600 p-3 rounded-xl border border-green-100 text-sm font-semibold text-center">
              {message}
            </div>
          )}

          {!message ? (
            <form className="space-y-6" onSubmit={handleReset}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-70"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center">
               <p className="text-sm text-gray-500 mb-6">Didn't receive the email? Check your spam folder or try again.</p>
               <button 
                 onClick={() => setMessage("")}
                 className="text-primary font-bold hover:underline"
               >
                 Try another email
               </button>
            </div>
          )}
          
          <div className="mt-6 text-center">
             <Link href="/partner/login" className="text-sm font-medium text-gray-500 hover:text-primary flex items-center justify-center">
               <ArrowLeft className="w-4 h-4 mr-1" /> Back to login
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
