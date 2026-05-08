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
} from "lucide-react";
import Link from "next/link";
import { getPartnerGym, getPartnerBookings } from "@/actions/adminActions";
import { updateGymStatus, updateGymOffer } from "@/actions/gymActions";
import { generateInvoicePDF } from "@/lib/invoice";

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
          totalRevenue: Math.floor(netTotal),
          bookingCount: bookingData?.length || 0
        });

        // Fetch referral data
        if (data.partner_id) {
          try {
            const refRes = await fetch(`/api/referral/generate?userId=${data.partner_id}`);
            const refData = await refRes.json();
            if (refData.success) setWalletData(refData);
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
                    <span className="font-bold text-slate-900">₹{stats.totalRevenue.toLocaleString()}</span>
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
                <p className="text-white/60 text-xs font-medium">Earned from partner referrals</p>
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
                Refer other gym owners to <span className="text-primary font-bold">GymDate</span>. When they join India's largest fitness network using your unique link, you earn <span className="text-slate-900 font-black">₹{gym?.partner_referral_amount || walletData?.bonusPerReferral || 100}</span> as a referral bonus!
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

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 pt-12 border-t border-gray-50">
              {[
                { step: "1", title: "Share link", desc: "Send your link to other gym owners" },
                { step: "2", title: "They Register", desc: "They fill the partner form" },
                { step: "3", title: "You Earn", desc: `Get ₹${gym?.partner_referral_amount || 100} when they join` }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-black text-sm mb-4">{item.step}</div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h4>
                  <p className="text-gray-400 text-[11px] leading-tight">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
