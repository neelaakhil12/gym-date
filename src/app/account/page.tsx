"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  User, 
  MapPin, 
  CreditCard, 
  History, 
  ChevronRight, 
  LogOut, 
  HelpCircle, 
  Settings, 
  ShieldCheck,
  Search,
  Crosshair,
  Plus,
  MoreVertical,
  Home,
  Briefcase,
  Ticket,
  Wallet,
  Bell,
  Clock,
  Navigation,
  Loader2,
  QrCode,
  FileDown,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { generateInvoicePDF } from "@/lib/invoice";
import { gyms as mockGyms } from "@/data/mockData";
import { getGyms } from "@/lib/supabase";
import { useSession, signOut } from "next-auth/react";

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [gyms, setGyms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const { data: nextAuthSession } = useSession();

  useEffect(() => {
    const fetchUserAndGyms = async () => {
      try {
        let email = nextAuthSession?.user?.email;

        // Fetch real gyms using the helper (which has mock fallback)
        const dbGyms = await getGyms();
        if (dbGyms) setGyms(dbGyms);

        if (email) {
          // Check for pending profile data (from Google login)
          const pendingName = localStorage.getItem('pending_name');
          const pendingPhone = localStorage.getItem('pending_phone');
          
          if (pendingName || pendingPhone) {
            await fetch('/api/user/sync-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                email, 
                name: pendingName, 
                phone: pendingPhone 
              })
            });
            localStorage.removeItem('pending_name');
            localStorage.removeItem('pending_phone');
          }
          // 1. Fetch profile
          const profileRes = await fetch(`/api/user/get-profile?email=${email}`);
          const profileResult = await profileRes.json();
          if (profileResult.success && profileResult.profile) {
            setSupabaseUser(profileResult.profile);
          }
          
          // 2. Fetch real bookings via server API (Always fetch if we have email)
          setBookingLoading(true);
          setBookingError(null);
          try {
            const bookingsRes = await fetch(`/api/user/get-bookings?email=${email}`);
            const bookingsResult = await bookingsRes.json();
            if (bookingsResult.success) {
              setBookings(bookingsResult.bookings);
            } else {
              setBookingError(bookingsResult.error);
            }
          } catch (err) {
            setBookingError("Failed to load bookings");
          } finally {
            setBookingLoading(false);
          }
        }
      } catch (err) {
        console.error("Error fetching data for dashboard:", err);
      }
    };
    fetchUserAndGyms();
  }, [nextAuthSession]);

  // Distance Calculation Helper (Haversine Formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const nearbyGyms = gyms.map(gym => ({
    ...gym,
    calculatedDistance: (supabaseUser?.latitude && supabaseUser?.longitude && gym.lat && gym.lng)
      ? calculateDistance(supabaseUser.latitude, supabaseUser.longitude, gym.lat, gym.lng)
      : Infinity
  })).sort((a, b) => a.calculatedDistance - b.calculatedDistance);

  const displayName = nextAuthSession?.user?.name || supabaseUser?.full_name || "Gym Lover";
  const displayEmail = nextAuthSession?.user?.email || supabaseUser?.email;
  const rawPhone = supabaseUser?.phone || "";
  
  // Format phone to avoid double +91 if database already has it
  const formattedPhone = rawPhone.startsWith('+91') ? rawPhone : `+91 - ${rawPhone}`;
  const displayPhone = rawPhone ? formattedPhone : "Not provided";

  const getInitials = (name: string) => {
    if (!name) return "GY";
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };
  const initials = getInitials(displayName);

  const tabs = [
    { id: "profile", label: "My Profile", icon: <User className="w-5 h-5" /> },
    { id: "subscriptions", label: "My Subscriptions", icon: <CreditCard className="w-5 h-5" /> },
    { id: "payments", label: "Payment History", icon: <History className="w-5 h-5" /> },
    { id: "bookings", label: "My QR Tickets", icon: <Ticket className="w-5 h-5" /> },
    { id: "addresses", label: "Saved Addresses", icon: <MapPin className="w-5 h-5" /> },
  ];

  const handleLogout = async () => {
    try {
      // Clear NextAuth session
      await signOut({ redirect: false });
      // Redirect to home
      window.location.href = "/";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/";
    }
  };

  const handleUpdateLocation = () => {
    setLocating(true);
    setLocError("");

    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch('/api/user/sync-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: displayEmail,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              address: "Current Location"
            }),
          });
          const result = await response.json();
          if (result.success) {
            setSupabaseUser(result.user);
            setIsLocationModalOpen(false);
          }
        } catch (err) {
          setLocError("Failed to save location");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocError("Location access denied");
        setLocating(false);
      }
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-32 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Mobile Sidebar Toggle Button */}
          <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                {tabs.find(t => t.id === activeTab)?.icon}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account Menu</p>
                <h4 className="font-black text-secondary leading-none">{tabs.find(t => t.id === activeTab)?.label}</h4>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-3 bg-secondary text-white rounded-xl shadow-lg shadow-secondary/20"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar */}
          <aside className={`fixed inset-0 z-[150] lg:relative lg:inset-auto lg:z-0 lg:w-80 shrink-0 transition-all duration-300 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}>
            {/* Backdrop for mobile */}
            <div 
              className={`absolute inset-0 bg-secondary/80 backdrop-blur-sm lg:hidden transition-opacity ${
                isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              onClick={() => setIsSidebarOpen(false)}
            />
            
            <div className="relative h-full bg-white lg:bg-transparent w-72 lg:w-full p-8 shadow-2xl lg:shadow-none border-r lg:border-none border-gray-100 overflow-y-auto lg:overflow-visible lg:p-0">
              <div className="bg-white lg:rounded-[32px] lg:p-8 lg:shadow-sm lg:border lg:border-gray-100 sticky top-28">
                {/* Close button for mobile */}
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden absolute top-4 right-4 p-2 bg-gray-50 rounded-lg text-gray-400"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              {/* Profile Card Mini */}
              <div className="flex items-center space-x-4 mb-10 border-b pb-8 border-gray-50">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <span className="text-lg font-black">{initials}</span>
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-black text-secondary truncate">{displayName.split(' ')[0]}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Member</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsSidebarOpen(false); // Close sidebar on mobile after selection
                    }}
                    className={`w-full flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
                      activeTab === tab.id 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-secondary"
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
                
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-4 px-6 py-4 rounded-2xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all mt-4"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </nav>

              <div className="mt-10 p-6 bg-secondary rounded-[24px] text-white">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Support</p>
                <h4 className="text-sm font-bold mb-4">Need help with your account?</h4>
                <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>Contact Support</span>
                </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1 w-full overflow-hidden">
            <div className="bg-white rounded-[32px] lg:rounded-[40px] p-6 lg:p-10 min-h-[500px] lg:min-h-[700px] shadow-sm border border-gray-100">
              
              {/* Header inside content */}
              <div className="flex justify-between items-center mb-10 pb-8 border-b border-gray-50">
                <div>
                  <h2 className="text-3xl font-black text-secondary tracking-tighter">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">Manage your {activeTab} information and preferences.</p>
                </div>
              </div>

              {/* Tab Contents */}
              {activeTab === "profile" && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Full Name</label>
                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-secondary">{displayName}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Phone Number</label>
                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-secondary">{displayPhone}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Email Address</label>
                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-secondary">{displayEmail}</div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Location</label>
                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-secondary flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-primary" />
                        <span>Hyderabad, Telangana</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}


              {activeTab === "subscriptions" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {bookings.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center text-center py-20">
                      <div className="p-6 bg-gray-50 rounded-full mb-6">
                        <CreditCard className="w-12 h-12 text-gray-300" />
                      </div>
                      <h3 className="text-xl font-black text-secondary mb-2">No Active Subscriptions</h3>
                      <p className="text-gray-400 text-sm mb-8">You haven&apos;t subscribed to any gym plans yet.</p>
                      <Link href="/gyms" className="px-10 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all">Explore Gyms</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {bookings.map((booking) => {
                        const now = new Date();
                        const end = new Date(booking.end_date);
                        const isActive = now <= end && booking.status !== 'cancelled';
                        return (
                          <div key={booking.id} className="bg-white rounded-[28px] border border-gray-100 shadow-sm hover:shadow-md transition-all p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-black text-secondary text-lg truncate">{booking.gyms?.name}</h4>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mt-1">{booking.plan_name}</p>
                              </div>
                              <span className={`ml-3 flex-shrink-0 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wide ${
                                isActive ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {isActive ? 'Active' : 'Expired'}
                              </span>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-400 font-bold">Start</span>
                                <span className="text-secondary font-black">{new Date(booking.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400 font-bold">End</span>
                                <span className="text-secondary font-black">{new Date(booking.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-gray-50">
                                <span className="text-gray-400 font-bold">Amount Paid</span>
                                <span className="text-primary font-black">₹{booking.amount || booking.total_price}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "payments" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {bookings.length === 0 ? (
                    <div className="p-12 text-center">
                      <History className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold">No payment records found.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-50">
                            <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                            <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Plan / Gym</th>
                            <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Transaction ID</th>
                            <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                            <th className="text-left py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                            <th className="text-right py-4 px-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {bookings.map((booking) => (
                            <tr key={booking.id} className="group hover:bg-gray-50 transition-all">
                              <td className="py-5 px-4 font-bold text-sm text-secondary whitespace-nowrap">
                                {new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="py-5 px-4">
                                <p className="font-bold text-sm text-secondary">{booking.plan_name}</p>
                                <p className="text-xs text-gray-400">{booking.gyms?.name}</p>
                              </td>
                              <td className="py-5 px-4 font-mono text-xs text-gray-400">
                                {booking.payment_id ? `#${booking.payment_id.slice(-8).toUpperCase()}` : `#${booking.id.slice(0,8).toUpperCase()}`}
                              </td>
                              <td className="py-5 px-4 font-black text-sm text-secondary">
                                ₹{Number(booking.amount || booking.total_price).toLocaleString('en-IN')}
                              </td>
                              <td className="py-5 px-4">
                                <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase border ${
                                  booking.status === 'completed' || booking.status === 'active'
                                    ? 'bg-green-50 text-green-600 border-green-100'
                                    : 'bg-gray-100 text-gray-400 border-gray-200'
                                }`}>
                                  {booking.status === 'completed' ? 'Success' : booking.status}
                                </span>
                              </td>
                              <td className="py-5 px-4 text-right">
                                <button
                                  onClick={() => generateInvoicePDF(booking)}
                                  className="text-primary font-black text-xs hover:underline"
                                >
                                  Download PDF
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "addresses" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div 
                      onClick={() => setIsLocationModalOpen(true)}
                      className="p-8 border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/40 transition-all hover:bg-gray-50 group"
                    >
                      <div className="p-4 bg-gray-50 group-hover:bg-primary/10 rounded-2xl mb-4 transition-all">
                        <Plus className="w-8 h-8 text-gray-300 group-hover:text-primary transition-all" />
                      </div>
                      <span className="font-bold text-gray-400 group-hover:text-primary transition-all">Add New Address</span>
                    </div>
                    {[
                      { type: "Primary Location", addr: supabaseUser?.address_name || "Plot No 81, Chaitanya Hill, Hyderabad", icon: <Home className="w-6 h-6 text-orange-500" /> },
                    ].map((addr, idx) => (
                      <div key={idx} className="p-8 bg-white rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all relative group">
                        <div className="flex items-start justify-between mb-6">
                          <div className="p-4 bg-gray-50 rounded-2xl">
                            {addr.icon}
                          </div>
                          <button 
                            onClick={() => setIsLocationModalOpen(true)}
                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-50 rounded-lg transition-all"
                          >
                            <span className="text-[10px] font-black text-primary uppercase mr-2">Edit</span>
                            <MoreVertical className="w-4 h-4 text-gray-400 inline" />
                          </button>
                        </div>
                        <h4 className="font-black text-secondary mb-2">{addr.type}</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">{addr.addr}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "bookings" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {bookingLoading ? (
                    <div className="py-24 text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-slate-400 font-bold">Loading your tickets...</p>
                    </div>
                  ) : bookingError ? (
                    <div className="py-24 text-center bg-red-50 rounded-[40px] border-2 border-red-100 p-8">
                      <p className="text-red-500 font-black text-xl mb-2">Error Loading Bookings</p>
                      <p className="text-red-400 font-bold mb-6">{bookingError}</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-all"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : bookings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="relative group">
                          {/* Ticket Shape */}
                          <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col">
                            {/* Top Section - Gym Info */}
                            <div className="bg-secondary p-6 text-white">
                              <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-xl font-black tracking-tight leading-none mb-2 truncate">{booking.gyms?.name}</h4>
                                  <div className="flex items-center text-white/60 text-xs font-medium">
                                    <MapPin className="w-3 h-3 mr-1 shrink-0" />
                                    <span className="truncate">{booking.gyms?.location}</span>
                                  </div>
                                </div>
                                <span className="bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wide shadow-lg shadow-primary/20 whitespace-nowrap flex-shrink-0">
                                  {booking.plan_name}
                                </span>
                              </div>
                            </div>

                            {/* Middle Section - QR Code */}
                            <div className="p-8 flex flex-col items-center justify-center space-y-6 border-b border-dashed border-gray-100">
                              <div className="p-6 bg-white rounded-[32px] shadow-2xl shadow-secondary/5 border-2 border-slate-50 ring-8 ring-slate-50/50">
                                <QRCodeSVG 
                                  value={booking.ticket_code || booking.id}
                                  size={160} 
                                  level="H"
                                  includeMargin={false}
                                />
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Ticket ID</p>
                                <p className="text-sm font-black text-slate-900 font-mono tracking-wider">{booking.ticket_code || booking.id.substring(0, 8).toUpperCase()}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-2">Scan Code at Entry</p>
                                <p className="text-xs font-bold text-secondary bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 uppercase tracking-widest">#{booking.id.slice(0, 8)}</p>
                              </div>
                            </div>

                            {/* Bottom Section - Validity */}
                            <div className="p-8 flex justify-between items-center bg-gray-50/50">
                              <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Validity</p>
                                <div className="flex items-center text-secondary font-black text-xs">
                                  <Calendar className="w-4 h-4 mr-2 text-primary" />
                                  {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end gap-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</p>
                                <span className="text-green-600 font-black text-xs flex items-center mb-2">
                                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                  ACTIVE
                                </span>
                                <button 
                                  onClick={() => generateInvoicePDF(booking)}
                                  className="text-[10px] font-black text-primary hover:text-secondary transition-colors uppercase tracking-widest flex items-center"
                                >
                                  <FileDown className="w-3 h-3 mr-1" />
                                  Invoice PDF
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Ticket Perforation Holes */}
                          <div className="absolute left-0 top-[115px] -translate-x-1/2 w-8 h-8 bg-[#F8F9FA] rounded-full border-r border-gray-100"></div>
                          <div className="absolute right-0 top-[115px] translate-x-1/2 w-8 h-8 bg-[#F8F9FA] rounded-full border-l border-gray-100"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[500px] text-center space-y-6">
                      <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
                        <QrCode className="w-12 h-12 text-gray-200" />
                      </div>
                      <h3 className="text-xl font-black text-secondary uppercase tracking-widest">No Active Tickets</h3>
                      <p className="text-gray-400 text-sm">Once you book a gym, your entry tickets will appear here.</p>
                      <Link href="/explore" className="px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Explore Gyms</Link>
                    </div>
                  )}
                </div>
              )}

            </div>
          </main>

        </div>
      </div>

      {/* Add Address Modal */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-[200] bg-secondary/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-secondary tracking-tighter">Add Address</h3>
                <p className="text-gray-400 text-xs font-medium">Select how you want to add your new gym location.</p>
              </div>

              <div className="w-full space-y-4 pt-4">
                <button
                  onClick={handleUpdateLocation}
                  disabled={locating}
                  className="w-full py-5 bg-primary text-white rounded-[24px] font-black flex items-center justify-center space-x-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70"
                >
                  {locating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Crosshair className="w-5 h-5" />
                  )}
                  <span>{locating ? "Locating..." : "Use Current Location"}</span>
                </button>

                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search city or area"
                    className="w-full pl-14 pr-5 py-5 rounded-[24px] bg-gray-50 border border-gray-100 outline-none focus:bg-white focus:border-primary transition-all font-bold text-sm"
                  />
                </div>
                
                {locError && (
                  <p className="text-red-500 text-[10px] font-black uppercase bg-red-50 py-3 px-4 rounded-xl">{locError}</p>
                )}

                <button 
                  onClick={() => setIsLocationModalOpen(false)}
                  className="w-full py-4 text-gray-400 font-bold text-xs hover:text-secondary transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
