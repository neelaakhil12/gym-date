"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  ShieldCheck, 
  Users, 
  Building2, 
  ArrowLeft, 
  Printer, 
  Calendar,
  CheckCircle2
} from "lucide-react";
import { DEFAULT_PARTNER_TERMS } from "@/lib/termsData";

export default function PartnerTermsPage() {
  const [partnerTerms, setPartnerTerms] = useState(DEFAULT_PARTNER_TERMS);
  const [updatedAt, setUpdatedAt] = useState("24 August 2026");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/terms")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.partnerTerms) setPartnerTerms(data.partnerTerms);
          if (data.updatedAt) setUpdatedAt(data.updatedAt);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-36 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-500 hover:text-primary transition-colors bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/terms/user"
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-primary bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              <span>User Terms & Conditions →</span>
            </Link>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-secondary bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>Effective: {updatedAt}</span>
            </div>
          </div>
        </div>

        {/* Hero Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-black uppercase tracking-widest mb-4">
            <Building2 className="w-4 h-4 text-primary" />
            Partner Network Agreement
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-secondary tracking-tight">
            Gym Partner Terms & <span className="text-primary">Conditions</span>
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base mt-3 font-medium">
            Legally binding terms governing gym, fitness center, and studio onboarding, listing, attendance verification, and payouts on GymDate by SantoEdge Private Limited.
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between pb-6 mb-8 border-b border-gray-100">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-secondary">
                GYMDATE – GYM / FITNESS PARTNER TERMS & CONDITIONS
              </h2>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wider">
                SantoEdge Private Limited • Partner Agreement
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-xl text-xs font-black border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
              <span>Official Document</span>
            </div>
          </div>

          <div className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans space-y-6">
            {partnerTerms}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-gray-400">
            <span>© 2026 SantoEdge Private Limited. All rights reserved.</span>
            <span>Partner Support: partner@gymdate.in | +91 8143186677</span>
          </div>
        </div>
      </div>
    </div>
  );
}
