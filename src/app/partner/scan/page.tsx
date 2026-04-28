"use client";

import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase, getPartnerGym } from "@/lib/supabase";
import { verifyTicketAction } from "@/actions/ticketActions";
import { 
  X, 
  Camera, 
  User, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Dumbbell,
  ShieldCheck,
  CreditCard
} from "lucide-react";
import Link from "next/link";

export default function PartnerScanner() {
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let scanner: Html5QrcodeScanner | null = null;

    if (isScanning) {
      scanner = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => console.error("Failed to clear scanner", error));
      }
    };
  }, [isScanning]);

  const [gymName, setGymName] = useState<string>("");

  useEffect(() => {
    getPartnerGym().then(gym => {
      if (gym) setGymName(gym.name);
    });
  }, []);

  async function onScanSuccess(decodedText: string) {
    // Store raw text for debugging
    if (typeof window !== 'undefined') {
      (window as any).lastScannedText = decodedText;
    }

    // Stop scanning once we have a result
    setIsScanning(false);
    setLoading(true);
    setError(null);

    try {
      // 1. Get current partner ID
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please log in to scan tickets.");

      // 2. Extract booking_id from decodedText (it might be a full URL or just the ID)
      let bookingId = decodedText.trim();
      
      // Handle URL formats if present
      if (bookingId.includes('/verify/')) {
        bookingId = bookingId.split('/verify/')[1].split('?')[0];
      } else if (bookingId.includes('://')) {
        const urlParts = bookingId.split('/');
        bookingId = urlParts[urlParts.length - 1].split('?')[0];
      }

      // 3. Call secure server action
      const result = await verifyTicketAction(bookingId, session.user.id);

      if (result.error) {
        throw new Error(result.error);
      }

      setScanResult(result.booking);
      if (result.gymName) setGymName(result.gymName);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function onScanFailure(error: any) {
    // This is called for every frame that doesn't have a QR code
    // We don't really need to do anything here unless we want to log it
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 pb-24">
      {/* Header */}
      <div className="max-w-md mx-auto mb-8 flex items-center justify-between">
        <Link href="/partner/dashboard" className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-black uppercase tracking-tighter">
          {gymName ? `${gymName} Scanner` : "Entry Scanner"}
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-md mx-auto space-y-8 text-center">
        {!isScanning && !scanResult && !loading && (
          <div className="space-y-6 py-12">
            <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto border-2 border-primary/30 border-dashed animate-pulse">
              <Camera className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Scan QR Ticket</h2>
              <p className="text-slate-400 mt-2">Point your camera at the customer's digital ticket to verify entry.</p>
            </div>
            <button 
              onClick={() => setIsScanning(true)}
              className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg hover:bg-red-700 transition-all shadow-xl shadow-primary/20"
            >
              Start Scanning Now
            </button>
          </div>
        )}

        {isScanning && (
          <div className="space-y-6">
            <div id="reader" className="overflow-hidden rounded-3xl border-4 border-white/10 bg-black"></div>
            <button 
              onClick={() => setIsScanning(false)}
              className="px-6 py-3 bg-white/10 rounded-xl font-bold hover:bg-white/20 transition-colors"
            >
              Cancel Scan
            </button>
          </div>
        )}

        {loading && (
          <div className="py-24 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="font-bold text-slate-400">Verifying Ticket...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border-2 border-red-500/20 rounded-[32px] p-8 space-y-4">
            <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-red-500 uppercase tracking-tight">Access Denied</h3>
              <p className="text-slate-400 mt-1">{error}</p>
              <div className="mt-4 p-3 bg-black/20 rounded-xl">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Scanned Data:</p>
                <p className="text-[10px] font-mono text-slate-300 break-all">{(window as any).lastScannedText || 'Unknown'}</p>
              </div>
            </div>
            <button 
              onClick={() => { setError(null); setIsScanning(true); }}
              className="w-full bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
            >
              Try Another Scan
            </button>
          </div>
        )}

        {scanResult && (
          <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            {/* Success Header */}
            <div className="bg-green-500 p-8 flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-4 shadow-xl">
                <ShieldCheck className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Access Granted</h3>
              <p className="text-green-100 text-sm font-bold uppercase tracking-widest mt-1">Verified Entry</p>
            </div>

            {/* User Info */}
            <div className="p-8 space-y-6 text-left">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border-2 border-slate-50 shadow-sm">
                  {scanResult.profiles?.avatar_url ? (
                    <img src={scanResult.profiles.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Name</p>
                  <h4 className="text-xl font-black text-slate-900 leading-none">{scanResult.profiles?.full_name || 'Anonymous User'}</h4>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Plan</p>
                  <div className="flex items-center text-slate-900 font-black">
                    <Dumbbell className="w-4 h-4 mr-2 text-primary" />
                    {scanResult.plan_name}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                  <div className="flex items-center text-green-600 font-black">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Active
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/5 p-5 rounded-3xl space-y-3 border border-slate-900/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500 font-bold flex items-center"><Calendar className="w-4 h-4 mr-2" /> Start Date</span>
                  <span className="text-slate-900 font-black">{new Date(scanResult.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-900/10">
                  <span className="text-slate-500 font-bold flex items-center"><Calendar className="w-4 h-4 mr-2" /> End Date</span>
                  <span className="text-slate-900 font-black">{new Date(scanResult.end_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-900/10">
                  <span className="text-slate-500 font-bold flex items-center"><CreditCard className="w-4 h-4 mr-2" /> Amount Paid</span>
                  <span className="text-primary font-black">₹{scanResult.amount}</span>
                </div>
              </div>

              <button 
                onClick={() => { setScanResult(null); setIsScanning(true); }}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center justify-center space-x-2"
              >
                <span>Done & Scan Next</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Static Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-900/80 backdrop-blur-md border-t border-white/5">
        <div className="max-w-md mx-auto text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
          GymDate Security Verification System v2.0
        </div>
      </div>
    </div>
  );
}
