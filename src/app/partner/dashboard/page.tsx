"use client";

import GymLogoIcon from "@/components/GymLogoIcon";
import React, { useEffect, useState } from "react";
import { 
  MapPin, 
  DollarSign, 
  Star,
  CheckCircle2,
  Clock,
  Edit,
  QrCode,
  FileDown,
  Gift,
  LayoutDashboard,
  Wallet,
  Copy,
  Check,
  TrendingUp,
  ArrowDownCircle,
  Banknote,
  Building2,
  User,
  CreditCard,
  Send,
  X,
  Smartphone,
  RefreshCw,
  AlertCircle,
  Upload,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { getPartnerGym, getPartnerBookings, createPayoutRequest, uploadPayoutQrCode } from "@/actions/adminActions";
import { updateGymStatus, updateGymOffer } from "@/actions/gymActions";
import { generateInvoicePDF } from "@/lib/invoice";
import { supabase } from "@/lib/supabase";

export default function PartnerDashboard() {
  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updatingOffer, setUpdatingOffer] = useState(false);
  const [stats, setStats] = useState({ totalRevenue: 0, bookingCount: 0 });
  const [offerState, setOfferState] = useState({ hasOffer: false, percentage: 0 });

  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [walletData, setWalletData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  // Withdrawal States
  const [showRefWithdrawModal, setShowRefWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawType, setWithdrawType] = useState<"bank" | "upi">("bank");
  const [withdrawMessage, setWithdrawMessage] = useState<{ type: string, text: string } | null>(null);
  const [withdrawForm, setWithdrawForm] = useState({
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    mobileNumber: "",
    qrCodeFile: null as File | null,
    qrCodePreview: "" as string
  });
  const qrRefInput = useRef<HTMLInputElement>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  async function loadGym() {
    setLoading(true);
    try {
      const data = await getPartnerGym();
      setGym(data);
      
      if (data) {
        setOfferState({ 
          hasOffer: data.has_offer || false, 
          percentage: data.offer_percentage || 0 
        });
        
        const bookingData = await getPartnerBookings(data.id);
        setBookings(bookingData || []);
        
        const commissionRate = data.commission_rate || 10;
        const netTotal = bookingData?.reduce((sum: number, b: any) => {
          const amount = Number(b.amount) || Number(b.total_price) || 0;
          return sum + (amount * (1 - commissionRate / 100));
        }, 0) || 0;
        
        setStats({
          totalRevenue: netTotal,
          bookingCount: bookingData?.length || 0
        });

        // Fetch referral data
        if (data.partner_id) {
          try {
            const refRes = await fetch(`/api/referral/generate?userId=${data.partner_id}&type=partner`, { cache: "no-store" });
            const refData = await refRes.json();
            if (refData.success) {
              // Ensure live limit from settings config is used
              try {
                const setRes = await fetch("/api/admin/settings-config", { cache: "no-store" });
                const setData = await setRes.json();
                if (setData.success && Array.isArray(setData.configs)) {
                  const rLimit = setData.configs.find((c: any) => c.key === 'partner_referral_min_withdrawal');
                  if (rLimit && rLimit.value) {
                    refData.partnerReferralMinWithdrawal = parseFloat(rLimit.value);
                  }
                }
              } catch (e) {}
              setWalletData(refData);
            }
          } catch (err) {
            console.error("Failed to fetch referral data:", err);
          }
        }
      }
    } catch (err) {
      console.error("Error loading gym:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGym();
  }, []);

  const handleRefWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gym || !walletData) return;

    const minLimit = walletData.partnerReferralMinWithdrawal || 1500;

    if (walletData.walletBalance < minLimit) {
      setWithdrawMessage({ type: "error", text: `Minimum ₹${minLimit.toLocaleString()} required to withdraw.` });
      return;
    }

    setWithdrawing(true);
    setWithdrawMessage(null);

    try {
      const payload: any = {
        gym_id: gym.id,
        amount: minLimit,
        payout_method: withdrawType,
        status: 'pending',
        payout_type: 'referral'
      };

      if (withdrawType === "bank") {
        if (!withdrawForm.bankName || !withdrawForm.accountHolder || !withdrawForm.accountNumber || !withdrawForm.ifscCode) {
          throw new Error("Please fill all required bank account details.");
        }
        payload.bank_name = withdrawForm.bankName;
        payload.account_holder = withdrawForm.accountHolder;
        payload.account_number = withdrawForm.accountNumber;
        payload.ifsc_code = withdrawForm.ifscCode;
      } else {
        let qrCodeUrl = "";
        if (withdrawForm.qrCodeFile) {
          const uploadData = new FormData();
          uploadData.append("file", withdrawForm.qrCodeFile);
          const upRes = await uploadPayoutQrCode(uploadData);
          if (upRes.error) throw new Error(upRes.error);
          if (upRes.url) qrCodeUrl = upRes.url;
        }

        if (!withdrawForm.upiId && !withdrawForm.mobileNumber && !qrCodeUrl) {
          throw new Error("Please provide UPI ID, Mobile Number, or QR Code / Screenshot.");
        }
        payload.upi_id = withdrawForm.upiId;
        payload.mobile_number = withdrawForm.mobileNumber;
        payload.qr_code_url = qrCodeUrl;
      }

      const result = await createPayoutRequest(payload);
      if (result.error) throw new Error(result.error);

      setWithdrawMessage({ type: "success", text: "Withdrawal request submitted! Super Admin will review and approve shortly." });
      
      // Update balance locally
      setWalletData((prev: any) => ({
        ...prev,
        walletBalance: Math.max(0, prev.walletBalance - minLimit),
        history: [
          {
            amount: minLimit.toString(),
            created_at: new Date().toISOString(),
            detail: withdrawType === 'upi' ? `Withdrawal via UPI (${withdrawForm.upiId || withdrawForm.mobileNumber})` : `Withdrawal to Bank (${withdrawForm.bankName})`,
            type: 'debit',
            status: 'pending'
          },
          ...(prev.history || [])
        ]
      }));

      setTimeout(() => {
        setShowRefWithdrawModal(false);
        setWithdrawMessage(null);
      }, 3000);

    } catch (err: any) {
      setWithdrawMessage({ type: "error", text: err.message || "Failed to send request." });
    } finally {
      setWithdrawing(false);
    }
  };

  const toggleStatus = async () => {
    if (!gym || updating) return;
    const currentStatus = gym.status || "Open";
    const newStatus = currentStatus === "Open" ? "Closed" : "Open";
    setUpdating(true);
    try {
      const result = await updateGymStatus(gym.id, newStatus);
      if (result.error) throw new Error(result.error);
      setGym({ ...gym, status: newStatus });
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const saveOffer = async () => {
    if (!gym || updatingOffer) return;
    setUpdatingOffer(true);
    try {
      const result = await updateGymOffer(gym.id, offerState.hasOffer, offerState.percentage);
      if (result.error) throw new Error(result.error);
      setGym({ ...gym, has_offer: offerState.hasOffer, offer_percentage: offerState.percentage });
      alert("Offer updated successfully!");
    } catch (err: any) {
      console.error("Failed to update offer:", err);
      alert("Failed to update offer.");
    } finally {
      setUpdatingOffer(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
        <GymLogoIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">No Gym Found</h2>
        <p className="text-gray-500">Your partner account hasn't been linked to a gym yet. Please contact the Super Admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Tab Switcher */}
      <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm w-fit">
        <button 
          onClick={() => setActiveTab("overview")}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'overview' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-gray-500 hover:text-slate-900'}`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Overview</span>
        </button>
        <button 
          onClick={() => setActiveTab("referral")}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'referral' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-gray-500 hover:text-slate-900'}`}
        >
          <Gift className="w-4 h-4" />
          <span>Referral & Wallet</span>
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">My Gym Overview</h1>
              <p className="text-gray-500 mt-1">Manage your public listing and track your rating.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
              <Link href="/partner/scan" className="flex items-center justify-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20">
                <QrCode className="w-4 h-4" />
                <span>Scan Entry QR</span>
              </Link>
              <Link href="/partner/gym/edit" className="flex items-center justify-center space-x-2 bg-white border border-gray-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-sm">
                <Edit className="w-4 h-4" />
                <span>Edit Details</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Main Gym Card */}
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-48 bg-slate-100 relative">
                <img 
                  src={gym.image || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800"} 
                  alt={gym.name} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center">
                  <Star className="w-3.5 h-3.5 text-yellow-500 mr-1 fill-current" />
                  {gym.rating || "New"} ({gym.reviews || 0} reviews)
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">{gym.name}</h2>
                    <div className="flex items-center text-sm text-gray-500 mt-1.5">
                      <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                      {gym.location}
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-100 pt-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-2">Description</h3>
                  <div className="text-gray-600 text-sm leading-relaxed">
                    {gym.description ? gym.description.split('\n').map((line: string, idx: number) => {
                        const trimmed = line.trim();
                        if (!trimmed) return <div key={idx} className="h-1.5"></div>;
                        
                        if (/^([-*•]|\d+\.)/.test(trimmed)) {
                          const cleanText = trimmed.replace(/^([-*•]|\d+\.)\s*/, '');
                          return (
                            <div key={idx} className="flex items-start mt-1 ml-1">
                              <span className="mr-2 font-bold text-slate-900">•</span>
                              <span>{cleanText}</span>
                            </div>
                          );
                        }
                        
                        return <p key={idx} className="mt-2 first:mt-0">{trimmed}</p>;
                      }) : "No description provided."}
                  </div>
                </div>
              </div>
            </div>

            {/* Status & Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Operational Status</h3>
                <div className={`flex items-center justify-between p-4 rounded-xl border ${
                  gym.status === "Open" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
                }`}>
                  <div className="flex items-center">
                    {gym.status === "Open" ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500 mr-3" />
                    ) : (
                      <Clock className="w-6 h-6 text-red-500 mr-3" />
                    )}
                    <div>
                      <div className={`font-bold ${gym.status === "Open" ? "text-green-800" : "text-red-800"}`}>
                        {gym.status || "Closed"}
                      </div>
                      <div className={`text-xs ${gym.status === "Open" ? "text-green-600" : "text-red-600"}`}>
                        Visible to customers
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={toggleStatus}
                    disabled={updating}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center min-w-[100px] ${
                      gym.status === "Open" 
                        ? "bg-white text-red-600 border border-red-200 hover:bg-red-50" 
                        : "bg-green-500 text-white hover:bg-green-600"
                    } disabled:opacity-50`}
                  >
                    {updating ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-current"></div>
                    ) : (
                      gym.status === "Open" ? "Close Gym" : "Open Gym"
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Promotional Offer</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-800 text-xs">Activate Discount</div>
                      <div className="text-[10px] text-slate-500">Apply to all memberships</div>
                    </div>
                    <button 
                      onClick={() => setOfferState({ ...offerState, hasOffer: !offerState.hasOffer })}
                      className={`w-12 h-6 rounded-full transition-all relative ${offerState.hasOffer ? 'bg-primary' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${offerState.hasOffer ? 'right-1' : 'left-1'}`}></div>
                    </button>
                  </div>

                  {offerState.hasOffer && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Discount Percentage (%)</label>
                      <input 
                        type="number"
                        value={offerState.percentage}
                        onChange={(e) => setOfferState({ ...offerState, percentage: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-primary/30"
                        placeholder="e.g. 20"
                        min="0"
                        max="100"
                      />
                    </div>
                  )}

                  <button 
                    onClick={saveOffer}
                    disabled={updatingOffer}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    {updatingOffer ? "Saving..." : "Save Offer Settings"}
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-gray-500 text-sm">Total Bookings</span>
                    <span className="font-bold text-slate-900">{stats.bookingCount}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-500 text-sm">Net Revenue</span>
                    <h3 className="text-3xl font-black text-secondary">₹{stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}</h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Subscriptions Section */}
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Recent Subscriptions</h2>
              <p className="text-xs text-gray-400 font-medium">Activity from your members.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Member</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-10 text-center text-gray-400 font-bold">No active subscriptions.</td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 leading-none mb-1">{booking.customer_name || 'Member'}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{booking.customer_email || 'No email'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-lg uppercase tracking-wider">{booking.plan_name}</span>
                        </td>
                        <td className="px-6 py-4 font-black text-slate-900">₹{booking.amount || booking.total_price || 0}</td>
                        <td className="px-6 py-4 text-gray-500 font-medium">{new Date(booking.created_at).toLocaleDateString()}</td>
                        <td className="px-8 py-4 text-right">
                          <button 
                            onClick={() => generateInvoicePDF(booking)}
                            className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Wallet Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/20">
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6 opacity-80">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">Referral Wallet</span>
                </div>
                <div className="text-5xl font-black mb-2">₹{(walletData?.walletBalance || 0).toLocaleString()}</div>
                <p className="text-white/60 text-xs font-medium mb-6">
                  Earned from partner referrals • Min limit: ₹{(walletData?.partnerReferralMinWithdrawal || 1500).toLocaleString()}
                </p>
                
                <button 
                  onClick={() => setShowRefWithdrawModal(true)}
                  disabled={!walletData || walletData.walletBalance < (walletData?.partnerReferralMinWithdrawal || 1500)}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-primary hover:bg-red-700 disabled:bg-white/10 disabled:text-white/30 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-primary/20"
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  <span>
                    {walletData?.walletBalance >= (walletData?.partnerReferralMinWithdrawal || 1500) 
                      ? `Withdraw ₹${(walletData?.partnerReferralMinWithdrawal || 1500).toLocaleString()}` 
                      : `Min ₹${(walletData?.partnerReferralMinWithdrawal || 1500).toLocaleString()} to Withdraw`}
                  </span>
                </button>
              </div>
              {/* Decorative Circle */}
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-green-50 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total Referrals</span>
              </div>
              <div className="text-4xl font-black text-slate-900 mb-2">{walletData?.totalReferrals || 0}</div>
              <p className="text-gray-400 text-xs font-medium">Gyms joined via your link</p>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-purple-50 rounded-xl">
                  <Gift className="w-5 h-5 text-purple-500" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total Earned</span>
              </div>
              <div className="text-4xl font-black text-slate-900 mb-2">₹{(walletData?.totalEarned || 0).toLocaleString()}</div>
              <p className="text-gray-400 text-xs font-medium">₹{gym?.partner_referral_amount || walletData?.bonusPerReferral || 100} per partner</p>
            </div>
          </div>

          {/* Referral Link Box */}
          <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="max-w-2xl">
              <h3 className="text-2xl font-black text-slate-900 mb-4">Partner Referral Program</h3>
              <p className="text-gray-500 leading-relaxed mb-8">
                Refer other gym owners to <span className="text-primary font-bold">GymDate</span>. When they apply via your unique partner link and get approved by Super Admin, you earn <span className="text-slate-900 font-black">₹{gym?.partner_referral_amount || walletData?.bonusPerReferral || 500}</span> directly in your wallet!
              </p>

              <div className="relative group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Your Unique Partner Link</label>
                <div className="flex items-center bg-gray-50 border border-gray-100 p-2 rounded-2xl group-hover:border-primary/20 transition-all">
                  <input 
                    readOnly
                    value={walletData?.referralLink || "Generating link..."}
                    className="bg-transparent border-none outline-none flex-1 px-4 text-sm font-bold text-slate-600 truncate"
                  />
                  <button 
                    onClick={() => copyToClipboard(walletData?.referralLink)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? "Copied!" : "Copy Link"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Referral Activity</h3>
                <p className="text-[10px] text-gray-400 font-medium">Earnings and withdrawal history.</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-[10px] font-bold text-gray-500">Earning</span>
                </div>
                <div className="flex items-center space-x-1 ml-4">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-[10px] font-bold text-gray-500">Withdrawal</span>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Details</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {!walletData?.history || walletData.history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-8 py-10 text-center text-gray-400 font-bold italic">No recent referral activity.</td>
                    </tr>
                  ) : (
                    walletData.history.map((item: any, idx: number) => {
                      const isDebit = item.type === 'debit' || item.status === 'debited' || parseFloat(item.amount) < 0;
                      const absAmount = Math.abs(parseFloat(item.amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                isDebit ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'
                              }`}>
                                {isDebit ? <ArrowDownCircle className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                              </div>
                              <span className={`font-black uppercase text-[10px] tracking-wider ${
                                isDebit ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {isDebit ? 'Withdrawal' : 'Earning'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{item.detail || (isDebit ? 'Withdrawal' : 'Partner Referral Bonus')}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                {isDebit && item.status && (
                                  <span className={`text-[9px] font-black uppercase ${
                                    item.status === 'completed' ? 'text-green-600' : 'text-amber-600'
                                  }`}>
                                    Status: {item.status}
                                  </span>
                                )}
                                {item.payment_proof_url && (
                                  <button
                                    onClick={() => setSelectedProofUrl(item.payment_proof_url)}
                                    className="px-2 py-0.5 text-[9px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors flex items-center space-x-1"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View Receipt</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black ${
                              isDebit 
                                ? 'text-red-600 bg-red-50 border border-red-100' 
                                : 'text-green-600 bg-green-50 border border-green-100'
                            }`}>
                              {isDebit ? `-₹${absAmount}` : `+₹${absAmount}`}
                            </span>
                          </td>
                          <td className="px-8 py-4 text-right text-gray-400 font-medium text-xs">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Proof Preview Modal */}
      {selectedProofUrl && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-secondary">Payment Proof / Receipt</h3>
              </div>
              <button onClick={() => setSelectedProofUrl(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex justify-center p-2 bg-gray-50 rounded-2xl border border-gray-100">
              <img src={selectedProofUrl} alt="Payment Proof" className="max-h-[60vh] object-contain rounded-xl" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-gray-400 font-medium">Uploaded by Super Admin</span>
              <a href={selectedProofUrl} target="_blank" rel="noreferrer" className="text-xs font-black text-primary hover:underline">
                Open Full Image
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showRefWithdrawModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Banknote className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Withdraw Referral Bonus</h3>
              </div>
              <button onClick={() => setShowRefWithdrawModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleRefWithdraw} className="overflow-y-auto">
              <div className="p-8 space-y-6">
                {/* Fixed Amount Info */}
                <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
                  <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Withdrawal Amount</p>
                      <div className="text-4xl font-black">₹{(walletData?.partnerReferralMinWithdrawal || 1500).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Current Balance</p>
                      <div className="text-xl font-bold text-primary">₹{walletData?.walletBalance?.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                </div>

                {withdrawMessage && (
                  <div className={`p-4 rounded-xl flex items-center space-x-3 text-sm font-bold ${
                    withdrawMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}>
                    {withdrawMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <span>{withdrawMessage.text}</span>
                  </div>
                )}

                {/* Tab Switcher */}
                <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setWithdrawType("bank")}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      withdrawType === "bank" ? "bg-white text-slate-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    Bank Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawType("upi")}
                    className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      withdrawType === "upi" ? "bg-white text-slate-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    UPI / PhonePe
                  </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  {withdrawType === "bank" ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bank Name</label>
                        <div className="relative">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                          <input
                            required
                            placeholder="e.g. HDFC Bank"
                            value={withdrawForm.bankName}
                            onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/30 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Holder Name</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                          <input
                            required
                            placeholder="Full Name as per Bank"
                            value={withdrawForm.accountHolder}
                            onChange={(e) => setWithdrawForm({ ...withdrawForm, accountHolder: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/30 transition-all"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Number</label>
                          <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input
                              required
                              placeholder="Account Number"
                              value={withdrawForm.accountNumber}
                              onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/30 transition-all"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">IFSC Code</label>
                          <div className="relative">
                            <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                            <input
                              required
                              placeholder="IFSC Code"
                              value={withdrawForm.ifscCode}
                              onChange={(e) => setWithdrawForm({ ...withdrawForm, ifscCode: e.target.value.toUpperCase() })}
                              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/30 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">UPI ID</label>
                        <div className="relative">
                          <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                          <input
                            placeholder="username@okaxis (Optional if QR uploaded)"
                            value={withdrawForm.upiId}
                            onChange={(e) => setWithdrawForm({ ...withdrawForm, upiId: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/30 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mobile Number</label>
                        <div className="relative">
                          <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                          <input
                            placeholder="Registered Mobile Number"
                            value={withdrawForm.mobileNumber}
                            onChange={(e) => setWithdrawForm({ ...withdrawForm, mobileNumber: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-primary/30 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Upload QR Code / Screenshot (Optional)</label>
                        <div 
                          onClick={() => qrRefInput.current?.click()}
                          className="border-2 border-dashed border-gray-200 hover:border-primary/50 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-red-50/20"
                        >
                          <input 
                            type="file" 
                            ref={qrRefInput} 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                setWithdrawForm({
                                  ...withdrawForm,
                                  qrCodeFile: file,
                                  qrCodePreview: URL.createObjectURL(file)
                                });
                              }
                            }} 
                            accept="image/*" 
                            className="hidden" 
                          />
                          {withdrawForm.qrCodePreview ? (
                            <div className="flex flex-col items-center space-y-2">
                              <img src={withdrawForm.qrCodePreview} alt="QR Code Preview" className="w-24 h-24 object-contain rounded-lg border border-gray-200" />
                              <span className="text-xs font-bold text-primary">Click to change QR code</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center space-y-1 py-1">
                              <Upload className="w-6 h-6 text-gray-400" />
                              <span className="text-xs font-bold text-gray-600">Upload UPI QR / Screenshot</span>
                              <span className="text-[10px] text-gray-400 font-medium">PNG, JPG up to 5MB</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={withdrawing}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-primary/20 flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {withdrawing ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Submit Withdrawal Request</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-gray-400 text-center mt-4 font-medium italic">
                    * Request will be sent to super admin for verification.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
