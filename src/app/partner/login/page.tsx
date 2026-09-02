"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Mail, Lock, ArrowLeft, ArrowRight, ShieldCheck, FileText, X, Check } from "lucide-react";
import { DEFAULT_PARTNER_TERMS } from "@/lib/termsData";

export default function PartnerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreedPartnerTerms, setAgreedPartnerTerms] = useState(false);
  const [showPartnerTermsModal, setShowPartnerTermsModal] = useState(false);
  const [partnerTermsText, setPartnerTermsText] = useState(DEFAULT_PARTNER_TERMS);
  const { data: session, status } = useSession();

  useEffect(() => {
    fetch("/api/terms")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.partnerTerms) {
          setPartnerTermsText(data.partnerTerms);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (status === "authenticated" && (session?.user as any)?.role === "partner") {
      window.location.href = "/partner/dashboard";
    }
  }, [session, status, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreedPartnerTerms) {
      setError("Please review and agree to the GymDate Partner Terms & Conditions to proceed.");
      return;
    }

    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        role: "partner",
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      window.location.href = "/partner/dashboard";
    } catch (err: any) {
      setError(err.message || "An error occurred during login.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/" className="flex justify-center mb-6">
          <img 
            src="/brand-logo.png" 
            alt="GymDate Logo" 
            className="h-16 w-auto object-contain"
          />
        </Link>
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            Partner Portal
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">
            Gym Partner Login
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Manage check-ins, view revenue, and track member attendance.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#141418] py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/10 backdrop-blur-xl">
          {error && (
            <div className="mb-6 bg-red-500/10 text-red-400 p-4 rounded-2xl border border-red-500/20 text-sm font-semibold text-center">
              {error.includes("forgot password") ? (
                <>
                  {error.split("forgot password")[0]}
                  <Link href="/partner/forgot-password" title="Go to forgot password" className="underline hover:text-red-300 font-bold">
                    forgot password
                  </Link>
                  {error.split("forgot password")[1]}
                </>
              ) : error}
            </div>
          )}
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Partner Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="partner@gymdate.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300">
                  Password
                </label>
                <Link 
                  href="/partner/forgot-password" 
                  className="text-xs font-bold text-red-500 hover:text-red-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm transition-all"
                />
              </div>
            </div>

            {/* Terms and conditions agreement checkbox */}
            <div className="flex items-start gap-3 pt-1 text-left">
              <input
                type="checkbox"
                id="partnerTermsAgreement"
                checked={agreedPartnerTerms}
                onChange={(e) => setAgreedPartnerTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-700 bg-black text-red-600 focus:ring-red-500 cursor-pointer accent-red-600 shrink-0"
                required
              />
              <label htmlFor="partnerTermsAgreement" className="text-xs font-medium text-gray-400 leading-snug cursor-pointer select-none">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowPartnerTermsModal(true)}
                  className="text-red-500 hover:text-red-400 underline font-bold"
                >
                  GymDate Partner Terms & Conditions
                </button>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !agreedPartnerTerms}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-sm font-black text-white bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all shadow-lg shadow-red-600/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{loading ? "Authenticating..." : "Sign In to Partner Dashboard"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
             <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors">
               <ArrowLeft className="w-3.5 h-3.5" />
               Back to main website
             </Link>
          </div>
        </div>
      </div>

      {/* Partner Terms and Conditions Modal */}
      {showPartnerTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#141418] text-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-white/10">
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-xl text-red-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Gym / Fitness Partner Terms & Conditions</h3>
                  <p className="text-xs text-gray-400 font-medium">SantoEdge Private Limited • GymDate Partner Network</p>
                </div>
              </div>
              <button
                onClick={() => setShowPartnerTermsModal(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap font-sans bg-[#0F0F13]">
              {partnerTermsText}
            </div>

            <div className="p-6 border-t border-white/10 bg-black/40 flex items-center justify-between gap-4">
              <span className="text-xs text-gray-400 font-semibold">Please read carefully before signing in.</span>
              <button
                onClick={() => {
                  setAgreedPartnerTerms(true);
                  setShowPartnerTermsModal(false);
                }}
                className="px-6 py-3 bg-red-600 text-white rounded-2xl font-bold text-sm hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg shadow-red-600/30"
              >
                <Check className="w-4 h-4" />
                <span>I Agree & Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
