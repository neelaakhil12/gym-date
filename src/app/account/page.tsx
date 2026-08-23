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
  CheckCircle2,
  Gift,
  Copy,
  Check,
  TrendingUp,
  Camera
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { generateInvoicePDF } from "@/lib/invoice";
import { gyms as mockGyms } from "@/data/mockData";
import { getGyms } from "@/lib/supabase";
import { reverseGeocode, searchLocation, LocationResult } from "@/lib/location";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [isSearchingLoc, setIsSearchingLoc] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveMsg, setProfileSaveMsg] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { data: nextAuthSession, status } = useSession();
  const router = useRouter();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load profile photo from localStorage and database
  useEffect(() => {
    const email = nextAuthSession?.user?.email;
    if (email) {
      const stored = localStorage.getItem(`gymdate_photo_${email}`);
      if (stored) setProfilePhoto(stored);
    }
  }, [nextAuthSession?.user?.email]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Url = reader.result as string;
      if (!base64Url) return;

      setProfilePhoto(base64Url);
      const email = nextAuthSession?.user?.email || supabaseUser?.email;
      if (email) {
        localStorage.setItem(`gymdate_photo_${email}`, base64Url);
        try {
          await fetch('/api/user/sync-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, image: base64Url, avatar: base64Url })
          });
        } catch (err) {
          console.error("Failed to sync photo to database:", err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = async () => {
    setProfilePhoto(null);
    const email = nextAuthSession?.user?.email || supabaseUser?.email;
    if (email) {
      localStorage.removeItem(`gymdate_photo_${email}`);
      try {
        await fetch('/api/user/sync-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, image: '', avatar: '' })
        });
      } catch (err) {
        console.error("Failed to remove photo:", err);
      }
    }
  };

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
            const dbImg = profileResult.profile.image || profileResult.profile.avatar;
            if (dbImg) {
              setProfilePhoto(dbImg);
              localStorage.setItem(`gymdate_photo_${email}`, dbImg);
            }
            setEditName(profileResult.profile.full_name || nextAuthSession?.user?.name || "");
            const rawP = profileResult.profile.phone || "";
            setEditPhone(rawP.replace(/^\+91/, '').trim());

            // If phone number is missing, prompt user to complete profile
            if (!profileResult.profile.phone) {
              setIsEditProfileOpen(true);
            }

            // Apply referral code if stored in storage or cookie (works for Google + OTP login)
            const cookieMatch = document.cookie.match(/gymdate_ref=([^;]+)/);
            const pendingRef = localStorage.getItem('referral_code') || 
                               sessionStorage.getItem('referral_code') || 
                               (cookieMatch ? decodeURIComponent(cookieMatch[1]) : null);
            if (pendingRef) {
              try {
                await fetch('/api/referral/apply', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, referralCode: pendingRef }),
                });
              } catch (e) {}
              localStorage.removeItem('referral_code');
              sessionStorage.removeItem('referral_code');
              document.cookie = "gymdate_ref=; path=/; max-age=0";
            }

            // Fetch referral/wallet data
            if (profileResult.profile.id) {
              const refRes = await fetch(`/api/referral/generate?userId=${profileResult.profile.id}&type=user`);
              const refData = await refRes.json();
              if (refData.success) setWalletData(refData);
            }
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

  // Prioritize real database name over NextAuth session default "User"
  const displayName = (supabaseUser?.full_name && supabaseUser.full_name !== "User" && supabaseUser.full_name !== "Gym Member") 
    ? supabaseUser.full_name 
    : (nextAuthSession?.user?.name && nextAuthSession.user.name !== "User" && nextAuthSession.user.name !== "Gym Member")
      ? nextAuthSession.user.name
      : (supabaseUser?.full_name || "Gym Lover");
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
    { id: "wallet", label: "Wallet & Referral", icon: <Gift className="w-5 h-5" /> },
    { id: "subscriptions", label: "My Subscriptions", icon: <CreditCard className="w-5 h-5" /> },
    { id: "payments", label: "Payment History", icon: <History className="w-5 h-5" /> },
    { id: "bookings", label: "My QR Tickets", icon: <Ticket className="w-5 h-5" /> },
    { id: "addresses", label: "Saved Addresses", icon: <MapPin className="w-5 h-5" /> },
  ];

  const handleCopyReferral = () => {
    if (walletData?.referralLink) {
      navigator.clipboard.writeText(walletData.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

  // Search location effect
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingLoc(true);
      const results = await searchLocation(searchQuery);
      setSearchResults(results);
      setIsSearchingLoc(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectLocation = async (item: LocationResult) => {
    try {
      setLocating(true);
      setLocError("");
      const response = await fetch('/api/user/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: displayEmail,
          lat: item.lat,
          lng: item.lng,
          address: item.address
        }),
      });
      const result = await response.json();
      if (result.success) {
        setSupabaseUser(result.user);
        setIsLocationModalOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      } else {
        setLocError(result.error || "Failed to save location");
      }
    } catch (err) {
      setLocError("Failed to save location");
    } finally {
      setLocating(false);
    }
  };

  const handleUpdateLocation = () => {
    setLocating(true);
    setLocError("");

    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const detectedAddress = await reverseGeocode(latitude, longitude);

          const response = await fetch('/api/user/sync-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: displayEmail,
              lat: latitude,
              lng: longitude,
              address: detectedAddress
            }),
          });
          const result = await response.json();
          if (result.success) {
            setSupabaseUser(result.user);
            setIsLocationModalOpen(false);
          } else {
            setLocError(result.error || "Failed to save location");
          }
        } catch (err) {
          setLocError("Failed to save location");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocError("Location access denied. Please search your area manually below.");
        setLocating(false);
      }
    );
  };

  // Show spinner while session is loading; show nothing while redirecting to /login
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-black text-secondary tracking-widest uppercase animate-pulse">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null; // Router is already pushing to /login via useEffect
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-44 lg:pt-32 pb-12">
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
                <div className="relative w-14 h-14 shrink-0">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" className="w-14 h-14 rounded-2xl object-cover shadow-lg" />
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <span className="text-lg font-black">{initials}</span>
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-md hover:bg-primary-dark transition-all cursor-pointer"
                    title="Change Profile Photo"
                  >
                    <Camera className="w-2.5 h-2.5 text-white" />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
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
            <div className="bg-white rounded-[24px] sm:rounded-[32px] lg:rounded-[40px] p-4 sm:p-6 lg:p-10 min-h-[500px] lg:min-h-[700px] shadow-sm border border-gray-100">
              
              {/* Header inside content */}
              <div className="flex justify-between items-center mb-6 sm:mb-10 pb-6 sm:pb-8 border-b border-gray-50">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-secondary tracking-tighter">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </h2>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">Manage your {activeTab} information and preferences.</p>
                </div>
              </div>

              {/* Tab Contents */}
              {activeTab === "wallet" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Wallet Balance Card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-primary to-red-700 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 text-white sm:col-span-1">
                      <div className="flex items-center space-x-3 mb-3 sm:mb-4">
                        <div className="p-2 bg-white/20 rounded-xl">
                          <Wallet className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest opacity-80">Wallet Balance</span>
                      </div>
                      <p className="text-3xl sm:text-4xl font-black mb-1">₹{walletData?.walletBalance?.toFixed(2) || "0.00"}</p>
                      <p className="text-xs opacity-70">Up to ₹{walletData?.maxWalletPerTxn || 10} usable per renewal</p>
                    </div>

                    <div className="bg-white rounded-[24px] sm:rounded-[28px] border border-gray-100 p-5 sm:p-6 shadow-sm">
                      <div className="flex items-center space-x-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total Referrals</span>
                      </div>
                      <p className="text-3xl font-black text-secondary">{walletData?.totalReferrals || 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Friends joined via your link</p>
                    </div>

                    <div className="bg-white rounded-[24px] sm:rounded-[28px] border border-gray-100 p-5 sm:p-6 shadow-sm">
                      <div className="flex items-center space-x-2 mb-3">
                        <Gift className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-black uppercase tracking-widest text-gray-400">Total Earned</span>
                      </div>
                      <p className="text-3xl font-black text-secondary">₹{walletData?.totalEarned?.toFixed(0) || 0}</p>
                      <p className="text-xs text-gray-400 mt-1">Get ₹{walletData?.bonusPerReferral || 10} per referral</p>
                    </div>
                  </div>

                  {/* Referral Code & Link */}
                  <div className="bg-white rounded-[24px] sm:rounded-[28px] border border-gray-100 shadow-sm p-5 sm:p-6 space-y-5">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-black text-secondary text-base sm:text-lg">Your Referral Code</h3>
                        {walletData?.referralCode && (
                          <span className="px-3 py-1 bg-red-50 text-primary border border-red-100 rounded-full text-xs font-black tracking-widest uppercase">
                            {walletData.referralCode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-400 mt-1">Share this code or link with friends. When they join and purchase any gym pass, you automatically earn ₹{walletData?.bonusPerReferral || 10} in your wallet!</p>
                    </div>

                    {walletData?.referralCode ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50/80 to-orange-50/50 rounded-2xl border border-red-100">
                          <div className="flex-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">Referral Code</span>
                            <span className="text-xl sm:text-2xl font-black text-secondary tracking-widest font-mono">{walletData.referralCode}</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(walletData.referralCode);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }}
                            className={`shrink-0 flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                              copied
                                ? "bg-green-500 text-white"
                                : "bg-primary text-white hover:bg-red-700 shadow-md shadow-primary/10"
                            }`}
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copied ? "Code Copied!" : "Copy Code"}</span>
                          </button>
                        </div>

                        {walletData?.referralLink && (
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                            <span className="font-bold text-gray-400 shrink-0">Link:</span>
                            <span className="font-mono text-gray-600 truncate flex-1">{walletData.referralLink}</span>
                            <button
                              onClick={handleCopyReferral}
                              className="text-primary hover:text-red-700 font-bold shrink-0 ml-2"
                            >
                              Copy Link
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3 bg-gray-50 rounded-xl p-4">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span className="text-xs sm:text-sm text-gray-400">Generating your referral code...</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-2">
                      {[
                        { step: "1", label: "Share your link", desc: "Send link to friends" },
                        { step: "2", label: "Friend subscribes", desc: "Purchases a gym plan" },
                        { step: "3", label: `You earn ₹${walletData?.bonusPerReferral || 10}`, desc: "Instant wallet credit" },
                      ].map(({ step, label, desc }) => (
                        <div key={step} className="flex sm:flex-col items-center sm:text-center p-3.5 sm:p-4 bg-gray-50 rounded-2xl gap-3 sm:gap-0">
                          <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-black text-sm shrink-0 sm:mx-auto sm:mb-2">{step}</div>
                          <div className="text-left sm:text-center min-w-0 flex-1">
                            <p className="font-bold text-secondary text-xs truncate">{label}</p>
                            <p className="text-gray-400 text-[10px] mt-0.5 sm:mt-1 truncate">{desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Wallet Usage Info */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6">
                    <h4 className="font-black text-secondary text-sm sm:text-base mb-2 flex items-center">
                      <Wallet className="w-4 h-4 mr-2 text-blue-500 shrink-0" />
                      How to use your wallet
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      When you renew a subscription, up to <strong>₹{walletData?.maxWalletPerTxn || 10}</strong> from your wallet 
                      will automatically be deducted from your payment. The remaining amount is charged via Razorpay.
                    </p>
                  </div>

                  {/* Referral History / Breakdown */}
                  <div className="bg-white border border-gray-100 rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 shadow-sm overflow-hidden">
                    <h4 className="font-black text-secondary mb-4 flex items-center justify-between gap-2">
                      <span className="flex items-center text-sm sm:text-base truncate">
                        <TrendingUp className="w-4 h-4 mr-2 text-green-500 shrink-0" />
                        Referral Activity & Wallet Transactions
                      </span>
                      <span className="text-xs text-gray-400 font-bold shrink-0">
                        {walletData?.history?.length || 0} activities
                      </span>
                    </h4>

                    {(!walletData?.history || walletData.history.length === 0) ? (
                      <div className="text-center py-6 text-gray-400 text-xs font-bold">
                        No wallet activity yet. Share your link to start earning!
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {walletData.history.map((item: any, idx: number) => {
                          const isDebit = item.type === 'debit' || item.status === 'debited' || parseFloat(item.amount) < 0;
                          const absAmount = Math.abs(parseFloat(item.amount || 10)).toFixed(2);
                          return (
                            <div key={idx} className="py-3 sm:py-3.5 flex items-center justify-between gap-2.5 sm:gap-4">
                              <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                  isDebit 
                                    ? "bg-red-50 text-red-600 border border-red-100" 
                                    : "bg-green-50 text-green-600 border border-green-100"
                                }`}>
                                  {isDebit ? "↓" : "₹"}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-secondary truncate">
                                    {isDebit ? (item.detail?.startsWith('Used') || item.detail?.startsWith('Wallet') ? item.detail : "Wallet Discount Applied") : (item.detail || "Friend Sign Up")}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-semibold truncate">
                                    {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                                  </p>
                                </div>
                              </div>
                              <span className={`text-xs font-black px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap ${
                                isDebit 
                                  ? "text-red-600 bg-red-50 border border-red-100" 
                                  : "text-green-600 bg-green-50 border border-green-100"
                              }`}>
                                {isDebit ? `-₹${absAmount}` : `+₹${absAmount}`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "profile" && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">

                  {/* Profile Photo Upload */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="relative shrink-0">
                      {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="w-24 h-24 rounded-3xl object-cover shadow-lg border-4 border-white" />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center text-white shadow-lg border-4 border-white">
                          <span className="text-3xl font-black">{initials}</span>
                        </div>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary hover:bg-red-700 rounded-full flex items-center justify-center shadow-lg transition-all"
                      >
                        <Camera className="w-4 h-4 text-white" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-secondary">{displayName}</h3>
                      <p className="text-xs text-gray-400 font-bold mt-0.5 uppercase tracking-widest">Active Member</p>
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-black hover:bg-red-700 transition-all shadow-md shadow-primary/20 flex items-center gap-2"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {profilePhoto ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        {profilePhoto && (
                          <button
                            onClick={handleRemovePhoto}
                            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-all"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1.5">JPG, PNG or GIF · Max 5MB</p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-secondary">Personal Information</h3>
                      <p className="text-xs text-gray-400 font-bold mt-0.5">Keep your name and phone number updated for bookings and QR passes.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditProfileOpen(true)}
                      className="px-6 py-2.5 bg-secondary text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all shadow-md shadow-secondary/10"
                    >
                      Edit Profile
                    </button>
                  </div>

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
                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 font-bold text-secondary flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0 pr-2">
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-sm break-words">{supabaseUser?.address || "Location not set"}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsLocationModalOpen(true)}
                          className="px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-black transition-all flex items-center space-x-1 shrink-0 ml-2"
                        >
                          <span>Edit</span>
                        </button>
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
                      <Link href="/explore" className="px-10 py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-105 transition-all">Explore Gyms</Link>
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
                                  onClick={() => generateInvoicePDF({
                                    ...booking,
                                    customer_name: booking.customer_name || displayName || "Member",
                                    customer_email: booking.customer_email || displayEmail,
                                    customer_phone: booking.customer_phone || displayPhone
                                  })}
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
                      { type: "Primary Location", addr: supabaseUser?.address || "No address saved", icon: <Home className="w-6 h-6 text-orange-500" /> },
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
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 sm:p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-secondary tracking-tighter">Update Location</h3>
                <p className="text-gray-400 text-xs font-medium">Use GPS or search your area to set your gym location.</p>
              </div>

              <div className="w-full space-y-4 pt-2">
                <button
                  onClick={handleUpdateLocation}
                  disabled={locating}
                  className="w-full py-4 bg-primary text-white rounded-[24px] font-black flex items-center justify-center space-x-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 text-sm"
                >
                  {locating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Crosshair className="w-5 h-5" />
                  )}
                  <span>{locating ? "Detecting location..." : "Use Current GPS Location"}</span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-100"></span>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-white px-3 text-gray-400 font-black tracking-widest">or search area</span>
                  </div>
                </div>

                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search city or area (e.g. Alwal, Hyderabad)"
                    className="w-full pl-14 pr-10 py-4 rounded-[24px] bg-gray-50 border border-gray-100 outline-none focus:bg-white focus:border-primary transition-all font-bold text-xs"
                  />
                  {isSearchingLoc && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
                  )}
                </div>

                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="w-full bg-white border border-gray-100 rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-gray-50 text-left">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectLocation(item)}
                        className="w-full p-3.5 hover:bg-primary/5 flex items-center space-x-3 text-xs font-bold text-secondary transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">{item.address}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {locError && (
                  <p className="text-red-500 text-[10px] font-black uppercase bg-red-50 py-3 px-4 rounded-xl">{locError}</p>
                )}

                <button 
                  onClick={() => {
                    setIsLocationModalOpen(false);
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="w-full py-3 text-gray-400 font-bold text-xs hover:text-secondary transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal (Name & Phone) */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] max-w-md w-full p-8 shadow-2xl relative border border-white animate-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-secondary">Complete Your Profile</h3>
              <p className="text-gray-400 text-xs font-medium mt-1">
                Please provide your full name and 10-digit mobile number for gym entry and booking confirmation.
              </p>
            </div>

            {profileSaveMsg && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold text-center border border-red-100">
                {profileSaveMsg}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editName.trim()) {
                  setProfileSaveMsg("Full name is required");
                  return;
                }
                const cleanPhone = editPhone.replace(/\D/g, '');
                if (cleanPhone.length < 10) {
                  setProfileSaveMsg("Please enter a valid 10-digit phone number");
                  return;
                }

                setIsSavingProfile(true);
                setProfileSaveMsg("");

                try {
                  const res = await fetch("/api/user/sync-profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      email: displayEmail,
                      name: editName.trim(),
                      phone: cleanPhone
                    })
                  });
                  const data = await res.json();
                  if (data.success) {
                    setSupabaseUser(data.user);
                    setIsEditProfileOpen(false);
                  } else {
                    setProfileSaveMsg(data.error || "Failed to update profile");
                  }
                } catch (err: any) {
                  setProfileSaveMsg(err.message || "Something went wrong");
                } finally {
                  setIsSavingProfile(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Full Name <span className="text-red-500">*</span></label>
                <input
                  required
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-primary focus:bg-white transition-all font-bold text-secondary text-sm"
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Phone Number <span className="text-red-500">*</span></label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">+91</span>
                  <input
                    required
                    type="tel"
                    maxLength={10}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 outline-none focus:border-primary focus:bg-white transition-all font-bold text-secondary text-sm tracking-wide"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingProfile || !editName.trim() || editPhone.replace(/\D/g, '').length < 10}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed mt-2 flex items-center justify-center space-x-2"
              >
                {isSavingProfile ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span>Save Profile</span>
                )}
              </button>

              {supabaseUser?.phone && (
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="w-full py-2 text-xs font-bold text-gray-400 hover:text-secondary transition-colors"
                >
                  Cancel
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
