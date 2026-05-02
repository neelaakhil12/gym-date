"use client";

import React, { useEffect, useState, useRef } from "react";
import { Wallet, ArrowDownCircle, Banknote, Building2, User, CreditCard, Send, X, Smartphone, QrCode, Upload } from "lucide-react";
import { getPartnerGym, getPartnerBookings, createPayoutRequest } from "@/actions/adminActions";
import { supabase } from "@/lib/supabase";

export default function PartnerWallet() {
  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState<"bank" | "upi">("bank");
  const qrInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    amount: "",
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    mobileNumber: "",
    qrCodeFile: null as File | null,
    qrCodePreview: ""
  });

  useEffect(() => {
    async function loadWalletData() {
      setLoading(true);
      const gymData = await getPartnerGym();
      setGym(gymData);
      
      if (gymData) {
        // Fetch real bookings to calculate balance
        const bookings = await getPartnerBookings(gymData.id);
        const commissionRate = gymData.commission_rate || 10;
        
        const total = bookings?.reduce((sum: number, b: any) => {
          const amount = parseFloat(b.amount) || parseFloat(b.total_price) || 0;
          const commission = amount * (commissionRate / 100);
          return sum + (amount - commission);
        }, 0) || 0;
        
        setBalance(Math.floor(total));
      }
      setLoading(false);
    }
    loadWalletData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        qrCodeFile: file,
        qrCodePreview: URL.createObjectURL(file)
      });
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gym) return;
    
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage({ type: "error", text: "Please enter a valid amount." });
      return;
    }

    if (amountNum > balance) {
      setMessage({ type: "error", text: "Insufficient balance." });
      return;
    }

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      let qrCodeUrl = "";
      
      // Upload QR Code if provided
      if (activeTab === "upi" && formData.qrCodeFile) {
        const fileExt = formData.qrCodeFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `payouts/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("gym-images") // Reusing gym-images bucket for simplicity
          .upload(filePath, formData.qrCodeFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from("gym-images").getPublicUrl(filePath);
        qrCodeUrl = publicUrl;
      }

      const payload: any = {
        gym_id: gym.id,
        amount: amountNum,
        payout_method: activeTab,
        status: 'pending'
      };

      if (activeTab === "bank") {
        payload.bank_name = formData.bankName;
        payload.account_holder = formData.accountHolder;
        payload.account_number = formData.accountNumber;
        payload.ifsc_code = formData.ifscCode;
      } else {
        payload.upi_id = formData.upiId;
        payload.mobile_number = formData.mobileNumber;
        payload.qr_code_url = qrCodeUrl;
      }

      const result = await createPayoutRequest(payload);

      if (result.error) throw new Error(result.error);

      setMessage({ type: "success", text: "Withdrawal request sent successfully!" });
      setTimeout(() => {
        setShowWithdrawForm(false);
        setMessage({ type: "", text: "" });
      }, 2000);
      
      setFormData({ 
        amount: "", bankName: "", accountHolder: "", accountNumber: "", 
        ifscCode: "", upiId: "", mobileNumber: "", qrCodeFile: null, qrCodePreview: "" 
      });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Failed to send request." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Virtual Wallet</h1>
        <p className="text-gray-500 mt-1">Manage your earnings and request payouts.</p>
      </div>

      {/* Balance Card */}
      <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-slate-400 mb-2">
            <Wallet className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-widest">Available Balance (Net)</span>
          </div>
          <h2 className="text-5xl font-black mb-1 text-white">₹{balance.toLocaleString()}</h2>
          <p className="text-slate-400 text-xs mb-8 font-medium italic">After platform commission of {gym?.commission_rate || 10}%</p>
          
          <button 
            onClick={() => setShowWithdrawForm(true)}
            className="bg-primary hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-lg hover:shadow-primary/20 flex items-center space-x-2 group"
          >
            <ArrowDownCircle className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            <span>Withdraw Money</span>
          </button>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Withdrawal Form Modal */}
      {showWithdrawForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
              <h3 className="text-xl font-black text-slate-900">Withdrawal Details</h3>
              <button onClick={() => setShowWithdrawForm(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleWithdraw} className="p-8 space-y-6">
                {message.text && (
                  <div className={`p-3 rounded-xl text-xs font-bold border ${
                    message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"
                  }`}>
                    {message.text}
                  </div>
                )}

                {/* Tab Switcher */}
                <div className="bg-gray-100 p-1 rounded-2xl flex">
                  <button
                    type="button"
                    onClick={() => setActiveTab("bank")}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center space-x-2 ${
                      activeTab === "bank" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Bank Transfer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("upi")}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center space-x-2 ${
                      activeTab === "upi" ? "bg-white text-slate-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>UPI / QR Code</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Common: Amount */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Amount to Redeem (₹)</label>
                    <div className="relative">
                      <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        required
                        type="number"
                        placeholder="Enter amount"
                        value={formData.amount || ""}
                        onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-bold"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400">Available Balance: ₹{balance.toLocaleString()}</p>
                  </div>

                  {activeTab === "bank" ? (
                    /* Bank Tab Fields */
                    <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Bank Name</label>
                        <input 
                          required
                          type="text"
                          placeholder="e.g. HDFC Bank"
                          value={formData.bankName || ""}
                          onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Account Holder Name</label>
                        <input 
                          required
                          type="text"
                          placeholder="Name as per bank"
                          value={formData.accountHolder || ""}
                          onChange={(e) => setFormData({...formData, accountHolder: e.target.value})}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Account No.</label>
                          <input 
                            required
                            type="text"
                            placeholder="0000000000"
                            value={formData.accountNumber || ""}
                            onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">IFSC Code</label>
                          <input 
                            required
                            type="text"
                            placeholder="HDFC0000123"
                            value={formData.ifscCode || ""}
                            onChange={(e) => setFormData({...formData, ifscCode: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none uppercase"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* UPI Tab Fields */
                    <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">UPI ID</label>
                        <div className="relative">
                          <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input 
                            required
                            type="text"
                            placeholder="e.g., user@paytm, user@phonepe"
                            value={formData.upiId || ""}
                            onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Mobile Number</label>
                        <div className="relative">
                          <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input 
                            required
                            type="text"
                            placeholder="Enter mobile number"
                            value={formData.mobileNumber || ""}
                            onChange={(e) => setFormData({...formData, mobileNumber: e.target.value})}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          />
                        </div>
                      </div>

                      {/* QR Code Upload */}
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Upload QR Code</label>
                        <div 
                          onClick={() => qrInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-gray-50/50"
                        >
                          {formData.qrCodePreview ? (
                            <img src={formData.qrCodePreview} alt="QR Preview" className="w-32 h-32 object-contain rounded-lg shadow-sm" />
                          ) : (
                            <>
                              <Upload className="w-10 h-10 text-gray-300 mb-2" />
                              <p className="text-sm font-bold text-gray-500">Click to upload or drag and drop</p>
                              <p className="text-[10px] text-gray-400 mt-1">PNG, JPG or GIF (MAX. 2MB)</p>
                            </>
                          )}
                          <input 
                            type="file"
                            ref={qrInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 pb-8">
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Redeem</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* History Placeholder */}
      <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
        <h3 className="font-black text-slate-900 mb-6">Recent Transactions</h3>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Banknote className="w-16 h-16 text-gray-100 mb-4" />
          <p className="text-gray-400 font-medium">No payout history found yet.</p>
        </div>
      </div>
    </div>
  );
}
