"use client";

import React, { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { 
  Dumbbell, 
  Mail, 
  ArrowRight, 
  Chrome, 
  Fingerprint,
  CheckCircle2,
  AlertCircle,
  User
} from "lucide-react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, phone }),
      });

      const result = await response.json();

      if (!result.success) throw new Error(result.error);

      setStep("otp");
      setMessage({ type: "success", text: "OTP sent to your email!" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to send OTP." });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, name, phone }),
      });

      const result = await response.json();

      if (!result.success) throw new Error(result.error);

      // Successfully verified! Follow the login link to set the session.
      window.location.href = result.loginLink;
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Invalid OTP." });
    } finally {
      setLoading(false);
    }
  };


  const handleGoogleLogin = async () => {
    if (!name || !phone || !email) {
      setMessage({ type: "error", text: "Please fill in all details (Name, Phone, and Email) before continuing." });
      return;
    }
    
    if (phone.length < 10) {
      setMessage({ type: "error", text: "Please enter a valid 10-digit phone number." });
      return;
    }

    try {
      // Save name and phone to localStorage so we can pick them up after redirect
      localStorage.setItem('pending_name', name);
      localStorage.setItem('pending_phone', phone);
      
      await signIn('google', { callbackUrl: '/account' });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gray-50 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full z-0 opacity-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white rounded-[48px] p-10 md:p-14 shadow-2xl border border-white relative">
          <Link href="/" className="flex items-center justify-center space-x-2 mb-12">
            <div className="bg-primary p-2 rounded-2xl shadow-lg shadow-primary/20">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-black tracking-tighter text-secondary">
              Gym<span className="text-primary">Date</span>
            </span>
          </Link>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-secondary tracking-tight">
              {step === "email" ? "Login / Join" : "Verify Email"}
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-medium">
              {step === "email" 
                ? "Enter your email to receive a secure login code." 
                : `We've sent a 6-digit code to ${email}`}
            </p>
          </div>

          {message.text && (
            <div className={`mb-8 p-4 rounded-2xl flex items-center space-x-3 border animate-in fade-in duration-300 ${
              message.type === "success" 
                ? "bg-green-50 border-green-100 text-green-700" 
                : "bg-red-50 border-red-100 text-red-700"
            }`}>
              {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="text-xs font-bold">{message.text}</span>
            </div>
          )}

          <form onSubmit={step === "email" ? handleSendOTP : handleVerifyOTP} className="space-y-6">
            {step === "email" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-14 pr-5 py-5 rounded-[24px] bg-gray-50 border border-gray-100 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold text-secondary"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Phone Number</label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center space-x-2 border-r pr-3 border-gray-200">
                      <span className="text-xs font-bold text-gray-500">+91</span>
                    </div>
                    <input
                      required
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-20 pr-5 py-5 rounded-[24px] bg-gray-50 border border-gray-100 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold text-secondary"
                      placeholder="9876543210"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-14 pr-5 py-5 rounded-[24px] bg-gray-50 border border-gray-100 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 font-bold text-secondary"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">6-Digit OTP</label>
                <div className="relative group">
                  <Fingerprint className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    required
                    maxLength={6}
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-14 pr-5 py-5 rounded-[24px] bg-gray-50 border border-gray-100 outline-none transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 font-black text-2xl tracking-[0.5em] text-center"
                    placeholder="000000"
                  />
                </div>
              </div>
            )}

            <button
              disabled={loading || !name || !phone || !email}
              className="w-full py-5 bg-secondary text-white rounded-[24px] font-black text-lg hover:bg-slate-800 transition-all transform active:scale-95 flex items-center justify-center space-x-3 shadow-xl shadow-secondary/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>{step === "email" ? "Send Code" : "Verify & Login"}</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {step === "email" && (
            <>
              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white px-4 text-gray-400">Or continue with</span></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-5 bg-white border-2 border-gray-100 text-secondary rounded-[24px] font-black text-lg hover:bg-gray-50 transition-all transform active:scale-95 flex items-center justify-center space-x-3 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Chrome className="h-6 w-6 text-primary" />
                <span>Google Account</span>
              </button>
            </>
          )}

          {step === "otp" && (
            <button 
              onClick={() => setStep("email")}
              className="w-full mt-6 text-sm font-bold text-gray-400 hover:text-primary transition-colors"
            >
              Back to Email
            </button>
          )}
        </div>

        <p className="mt-10 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
          By continuing, you agree to our <Link href="/terms" className="text-secondary hover:underline">Terms of Service</Link>
        </p>
      </div>
    </div>
  );
}
