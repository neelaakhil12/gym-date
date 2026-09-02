"use client";

import GymLogoIcon from "@/components/GymLogoIcon";
import React, { useEffect, useState } from "react";
import { 
  MapPin, 
  Star,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileDown,
  LayoutDashboard,
  CreditCard,
  Wallet,
  Building2,
  User,
  Smartphone,
  QrCode,
  ArrowUpRight,
  DollarSign,
  Users,
  Eye,
  X,
  FileText,
  Store,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { getPartnerBookings, getPartnerPayoutRequests, updatePayoutStatus } from "@/actions/adminActions";
import { getGymById } from "@/actions/publicActions";
import { generateInvoicePDF } from "@/lib/invoice";

type TabType = "overview" | "transactions" | "finance";

export default function AdminGymDashboard() {
  const params = useParams();
  const router = useRouter();
  const gymId = params.id as string;
  
  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [openingPartner, setOpeningPartner] = useState(false);
  
  // Data states
  const [bookings, setBookings] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [stats, setStats] = useState({ 
    totalGross: 0, 
    totalNet: 0, 
    bookingCount: 0, 
    uniqueUsers: 0,
    availableBalance: 0
  });

  // Payout management states
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<any>(null);

  const handleOpenPartnerPanel = async () => {
    setOpeningPartner(true);
    try {
      const res = await fetch("/api/admin/impersonate-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymId }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.open(data.redirectUrl, "_blank");
      } else {
        alert(data.error || "Failed to open partner panel.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to switch to partner panel.");
    } finally {
      setOpeningPartner(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      if (!gymId) return;
      setLoading(true);
      
      try {
        const [gymData, bookingData, payoutData] = await Promise.all([
          getGymById(gymId),
          getPartnerBookings(gymId),
          getPartnerPayoutRequests(gymId)
        ]);
        
        if (gymData) {
          setGym(gymData);
          setBookings(bookingData || []);
          setPayouts(payoutData || []);
          
          // Calculate summary stats
          let gross = 0;
          let net = 0;
          const userSet = new Set();
          
          bookingData?.forEach((b: any) => {
            const amount = parseFloat(b.final_amount || b.amount || b.total_price || 0);
            gross += amount;
            
            // Calc net (Gross minus commission)
            const commRate = gymData.commission_rate ?? 10;
            const comm = (amount * commRate) / 100;
            net += (amount - comm);
            
            if (b.user_email || b.user_id) userSet.add(b.user_email || b.user_id);
          });

          // Calculate completed payouts for available balance
          const totalWithdrawn = payoutData
            ?.filter((p: any) => p.status === 'completed')
            ?.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0) || 0;
          
          setStats({
            totalGross: Math.floor(gross),
            totalNet: Math.floor(net),
            bookingCount: bookingData?.length || 0,
            uniqueUsers: userSet.size,
            availableBalance: Math.max(0, Math.floor(net - totalWithdrawn))
          });
        }
      } catch (err) {
        console.error("Failed to load gym data:", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [gymId]);

  const handlePayoutStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    const result = await updatePayoutStatus(id, newStatus);
    if (result.success) {
      setPayouts(payouts.map(p => p.id === id ? { ...p, status: newStatus } : p));
      if (selectedPayout?.id === id) setSelectedPayout({ ...selectedPayout, status: newStatus });
    }
    setUpdatingId(null);
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
        <h2 className="text-2xl font-black text-slate-900 mb-2">Gym Not Found</h2>
        <button onClick={() => router.back()} className="text-primary font-bold hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      {/* Top Navigation & Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.push('/superadmin/gyms')}
            className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-secondary hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-slate-900">{gym.name}</h1>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${gym.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {gym.status}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5 flex items-center">
              <MapPin className="w-3 h-3 mr-1" /> {gym.location}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          {/* Direct Partner Portal Button */}
          <button
            type="button"
            onClick={handleOpenPartnerPanel}
            disabled={openingPartner}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
            title="Open Partner Admin Panel in New Tab"
          >
            {openingPartner ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
            ) : (
              <Store className="w-4 h-4 mr-1" />
            )}
            <span>Open Partner Portal</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>

          {/* Tab Switcher */}
          <div className="bg-gray-100 p-1 rounded-2xl flex">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${
                activeTab === "overview" ? "bg-white text-slate-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${
                activeTab === "transactions" ? "bg-white text-slate-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Transactions</span>
            </button>
            <button
              onClick={() => setActiveTab("finance")}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${
                activeTab === "finance" ? "bg-white text-slate-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Finance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Row (Global for all tabs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Gross Revenue</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">₹{stats.totalGross.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Partner Share</p>
          <h3 className="text-2xl font-black text-secondary mt-1">₹{stats.totalNet.toLocaleString()}</h3>
        </div>
        <div className="bg-slate-900 p-6 rounded-3xl border border-white/5 shadow-xl text-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Wallet Balance</p>
          <h3 className="text-2xl font-black text-white mt-1">₹{stats.availableBalance.toLocaleString()}</h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Bookings</p>
          <h3 className="text-2xl font-black text-slate-900 mt-1">{stats.bookingCount}</h3>
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Image & Description */}
              <div className="bg-white rounded-[32px] overflow-hidden border border-gray-100 shadow-sm">
                <div className="h-64 relative">
                  <img src={gym.image} className="w-full h-full object-cover" alt={gym.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-6 left-6 text-white">
                    <div className="flex items-center space-x-2 mb-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-bold">{gym.rating || "New"}</span>
                    </div>
                    <p className="text-sm opacity-80">{gym.reviews || 0} Platform Reviews</p>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-lg font-black text-slate-900 mb-4">Gym Description</h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{gym.description}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Commission Info */}
              <div className="bg-primary/5 rounded-[32px] p-8 border border-primary/10">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-slate-900">Commission Rate</h3>
                </div>
                <p className="text-3xl font-black text-primary">{gym.commission_rate || 10}%</p>
                <p className="text-xs text-gray-400 mt-2 font-medium">Platform fee deducted from each booking.</p>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                <h3 className="font-black text-slate-900 mb-6">Partner Controls</h3>
                <div className="space-y-3">
                  <Link 
                    href={`/superadmin/gyms/${gymId}/edit`}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Edit Gym Details</span>
                  </Link>
                  <button 
                    onClick={() => setActiveTab("finance")}
                    className="w-full flex items-center justify-center space-x-2 py-3 bg-gray-50 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Process Payouts</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-8 py-8 border-b border-gray-50 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900 text-xl">Booking History</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Full transaction log for {gym.name}</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gross Total</p>
                  <p className="text-lg font-black text-slate-900">₹{stats.totalGross.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Amount</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-black text-slate-900 text-sm leading-tight">{booking.customer_name || 'Member'}</div>
                        <div className="text-[10px] text-gray-400 font-bold mt-0.5">{booking.customer_email || 'No email provided'}</div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="px-2.5 py-1 bg-primary/5 text-primary rounded-lg text-[10px] font-black uppercase tracking-wider border border-primary/10">
                          {booking.plan_name || "Plan"}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className="font-black text-slate-900 text-sm">₹{booking.amount || booking.total_price || 0}</div>
                        <div className="text-[9px] text-gray-400 font-bold">Gross</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-sm font-bold text-gray-600">{new Date(booking.created_at).toLocaleDateString()}</div>
                        <div className="text-[10px] text-gray-400">{new Date(booking.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => generateInvoicePDF(booking)}
                          className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FINANCE TAB */}
        {activeTab === "finance" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Financial Summary & Payout History */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-8 border-b border-gray-50">
                  <h3 className="font-black text-slate-900 text-xl">Withdrawal History</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Manage and track gym partner payouts.</p>
                </div>
                
                <div className="p-8">
                  {payouts.length > 0 ? (
                    <div className="space-y-4">
                      {payouts.map((payout) => (
                        <div key={payout.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-gray-50 rounded-3xl border border-gray-100 gap-4">
                          <div className="flex items-center space-x-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                              payout.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                              {payout.status === 'completed' ? <CheckCircle2 className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
                            </div>
                            <div>
                              <h4 className="text-xl font-black text-slate-900">₹{parseFloat(payout.amount).toLocaleString()}</h4>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                {new Date(payout.created_at).toLocaleDateString()} • {payout.payout_method === 'upi' ? 'UPI' : 'Bank Transfer'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => setSelectedPayout(payout)}
                              className="px-4 py-2 bg-white text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                            >
                              View Details
                            </button>
                            {payout.status === 'pending' && (
                              <button 
                                onClick={() => handlePayoutStatusUpdate(payout.id, 'completed')}
                                disabled={updatingId === payout.id}
                                className="px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all shadow-md shadow-green-200 disabled:opacity-50"
                              >
                                {updatingId === payout.id ? '...' : 'Mark Paid'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <Wallet className="w-20 h-20 text-gray-100 mx-auto mb-6" />
                      <h4 className="text-lg font-bold text-slate-300">No Withdrawal History</h4>
                      <p className="text-gray-400 mt-2">When this gym requests a payout, it will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Wallet Stats & Method Info */}
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                  <div className="flex items-center space-x-2 text-slate-400 mb-2">
                    <Wallet className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Ready to Pay</span>
                  </div>
                  <h2 className="text-4xl font-black mb-1">₹{stats.availableBalance.toLocaleString()}</h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-8">Current Balance Owed</p>
                  
                  <div className="space-y-4 pt-6 border-t border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Earned</span>
                      <span className="font-black">₹{stats.totalNet.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paid Out</span>
                      <span className="font-black text-green-400">₹{(stats.totalNet - stats.availableBalance).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {/* Decorative blobs */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
              </div>

              <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm">
                <h3 className="font-black text-slate-900 mb-4">Financial Insight</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Members</p>
                      <p className="text-lg font-black text-slate-900">{stats.uniqueUsers}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0">
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform Profit</p>
                      <p className="text-lg font-black text-secondary">₹{(stats.totalGross - stats.totalNet).toLocaleString()}</p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">From {gym.commission_rate || 10}% Commission</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payout Details Modal (Replicated from AdminPayouts) */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Withdrawal Details</h3>
              </div>
              <button onClick={() => setSelectedPayout(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto">
              {/* Gym Header */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold">
                  {gym.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-black text-slate-900">{gym.name}</h4>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{selectedPayout.payout_method === 'upi' ? 'UPI / QR Code Transfer' : 'Bank Account Transfer'}</p>
                </div>
              </div>

              {/* Amount Box */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-gray-100 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Requested Amount</p>
                <div className="text-4xl font-black text-slate-900">₹{parseFloat(selectedPayout.amount).toLocaleString()}</div>
              </div>

              {/* Payout Details Grid */}
              <div className="space-y-4">
                <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest">Payment Destination</h5>
                <div className="grid grid-cols-1 gap-3">
                  {selectedPayout.payout_method === 'bank' ? (
                    <>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">Bank Name</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">{selectedPayout.bank_name}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">Account Holder</span>
                        </div>
                        <span className="text-sm font-black text-slate-900 uppercase">{selectedPayout.account_holder}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">Account Number</span>
                        </div>
                        <span className="text-sm font-black text-primary font-mono tracking-wider">{selectedPayout.account_number}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">IFSC Code</span>
                        </div>
                        <span className="text-sm font-black text-slate-900 uppercase">{selectedPayout.ifsc_code}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">UPI ID</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">{selectedPayout.upi_id}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">Mobile Number</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">{selectedPayout.mobile_number}</span>
                      </div>
                      {selectedPayout.qr_code_url && (
                        <div className="space-y-3 pt-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">QR Code Provided</p>
                          <div className="flex justify-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                            <img 
                              src={selectedPayout.qr_code_url} 
                              alt="QR Code" 
                              className="w-48 h-48 object-contain cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(selectedPayout.qr_code_url, '_blank')}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Action in Modal */}
              <div className="pt-4 pb-4">
                {selectedPayout.status === 'pending' ? (
                  <button 
                    onClick={() => handlePayoutStatusUpdate(selectedPayout.id, 'completed')}
                    disabled={updatingId === selectedPayout.id}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl flex items-center justify-center space-x-2"
                  >
                    {updatingId === selectedPayout.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Confirm & Mark as Paid</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full bg-green-50 text-green-600 py-4 rounded-2xl font-black text-center border border-green-100 flex items-center justify-center space-x-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Payout Completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
