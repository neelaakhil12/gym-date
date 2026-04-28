"use client";

import React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dumbbell, Mail, Lock, User, ArrowRight } from "lucide-react";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema)
  });

  const onSubmit = async (data: SignupFormValues) => {
    console.log("Signup submitted:", data);
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert("Account created successfully!");
  };

  return (
    <div className="min-h-screen pt-32 pb-20 bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-2xl border border-gray-100 relative overflow-hidden">
          {/* Abstract Background */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <Link href="/" className="flex items-center justify-center space-x-2 mb-10">
              <div className="bg-primary p-1.5 rounded-lg">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-secondary">
                Gym<span className="text-primary">Date</span>
              </span>
            </Link>

            <h1 className="text-2xl font-black text-secondary text-center mb-2">Create Account</h1>
            <p className="text-gray-400 text-center text-sm mb-10">Join 50,000+ members on their fitness journey.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register("fullName")}
                    className={`w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border outline-none transition-all ${errors.fullName ? "border-red-500" : "border-gray-100 focus:border-primary focus:bg-white"}`}
                    placeholder="John Doe"
                  />
                </div>
                {errors.fullName && <p className="text-red-500 text-[10px] font-bold">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register("email")}
                    className={`w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border outline-none transition-all ${errors.email ? "border-red-500" : "border-gray-100 focus:border-primary focus:bg-white"}`}
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-[10px] font-bold">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register("password")}
                    type="password"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border outline-none transition-all ${errors.password ? "border-red-500" : "border-gray-100 focus:border-primary focus:bg-white"}`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && <p className="text-red-500 text-[10px] font-bold">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    {...register("confirmPassword")}
                    type="password"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-2xl bg-gray-50 border outline-none transition-all ${errors.confirmPassword ? "border-red-500" : "border-gray-100 focus:border-primary focus:bg-white"}`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-[10px] font-bold">{errors.confirmPassword.message}</p>}
              </div>

              <button
                disabled={isSubmitting}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary-dark transition-all transform active:scale-95 flex items-center justify-center space-x-3 shadow-lg shadow-primary/20 mt-4"
              >
                <span>{isSubmitting ? "Creating account..." : "Create Account"}</span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-bold hover:underline">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
