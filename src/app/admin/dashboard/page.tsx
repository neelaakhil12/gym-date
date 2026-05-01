"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminStats, getAllBookings, getUniqueUsersCount, getPlatformStats, updatePlatformStats, addPlatformStat, deletePlatformStat, addCity, updateCity, deleteCity, getSectionVisibility, updateSectionVisibility, deleteBooking, getGlobalAmenities, addGlobalAmenity, deleteGlobalAmenity } from "@/actions/adminActions";
import { getGyms, getCities } from "@/actions/publicActions";
import { generateInvoicePDF } from "@/lib/invoice";
import { Coins, Eye, TrendingUp, Wallet, Dumbbell, Users, CheckCircle2, Clock, ArrowUpRight, Percent, IndianRupee, X, FileDown, Save, BarChart3, MapPin, Plus, Trash2, Edit2, PlusCircle } from "lucide-react";
import { toast } from "react-hot-toast";

// Platform Analytics Dashboard Refresh Fix

export default function AdminDashboard() {
  const [stats, setStats] = useState({ walletBalance: 0, totalGyms: 0, totalUsers: 0 });
  const [gymData, setGymData] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<any[]>([]);
  const [citiesData, setCitiesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingStats, setSavingStats] = useState(false);
  const [showModal, setShowModal] = useState<'commission' | 'revenue' | 'users' | 'cities' | 'amenities' | null>(null);
  
  // City Form State
  const [cityForm, setCityForm] = useState({ id: '', name: '', is_featured: true, is_coming_soon: false });
  const [cityImageFile, setCityImageFile] = useState<File | null>(null);
  const [cityImagePreview, setCityImagePreview] = useState<string>('');
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [processingCity, setProcessingCity] = useState(false);
  const [isStatsVisible, setIsStatsVisible] = useState(true);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);
  const [globalAmenities, setGlobalAmenities] = useState<any[]>([]);
  const [newGlobalAmenity, setNewGlobalAmenity] = useState("");
  const [processingAmenity, setProcessingAmenity] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        const adminStats = await getAdminStats();
        setStats(adminStats);

        const allGyms = await getGyms();
        const allBookings = await getAllBookings();
        const pStats = await getPlatformStats();
        const allCities = await getCities();
        const visibility = await getSectionVisibility();
        const amenities = await getGlobalAmenities();
        
        setGymData(allGyms);
        setBookings(allBookings);
        setPlatformStats(pStats);
        setCitiesData(allCities);
        setIsStatsVisible(visibility);
        setGlobalAmenities(amenities);
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate Breakdown Data
  const getBreakdown = () => {
    return gymData.map(gym => {
      const gymBookings = bookings.filter(b => b.gym_id === gym.id);
      // Support both 'amount' (Razorpay) and 'total_price' (legacy) fields
      const totalRevenue = gymBookings.reduce((sum, b) => {
        const amt = parseFloat(b.amount) || parseFloat(b.total_price) || 0;
        return sum + amt;
      }, 0);
      const commissionRate = gym.commission_rate || 10;
      const totalCommission = totalRevenue * (commissionRate / 100);
      const uniqueUsers = new Set(gymBookings.map(b => b.customer_id || b.user_id || b.email)).size;

      return {
        id: gym.id,
        name: gym.name,
        revenue: totalRevenue,
        commission: totalCommission,
        users: uniqueUsers,
        image: gym.image
      };
    }).sort((a, b) => b.revenue - a.revenue);
  };

  const breakdown = getBreakdown();
  // Gross revenue = sum of all bookings (not wallet table)
  const totalGrossRevenue = breakdown.reduce((sum, item) => sum + item.revenue, 0);
  const totalPlatformCommission = breakdown.reduce((sum, item) => sum + item.commission, 0);
  const recentGyms = [...gymData].sort((a, b) => 
    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  ).slice(0, 5);

  const handleUpdateStats = async () => {
    setSavingStats(true);
    const result = await updatePlatformStats(platformStats);
    if (result.success) {
      toast.success("Platform stats updated successfully!");
    } else {
      toast.error(result.error || "Failed to update stats");
    }
    setSavingStats(false);
  };

  const handleAddStat = async () => {
    setSavingStats(true);
    const result = await addPlatformStat("New Stat", "0");
    if (result.success) {
      const updated = await getPlatformStats();
      setPlatformStats(updated);
      toast.success("New stat slot added!");
    } else {
      toast.error(result.error);
    }
    setSavingStats(false);
  };

  const handleDeleteStat = async (id: string) => {
    if (!confirm("Delete this stat card?")) return;
    setSavingStats(true);
    const result = await deletePlatformStat(id);
    if (result.success) {
      setPlatformStats(platformStats.filter(s => s.id !== id));
      toast.success("Stat deleted!");
    } else {
      toast.error(result.error);
    }
    setSavingStats(false);
  };
  
  const handleToggleVisibility = async (val: boolean) => {
    setUpdatingVisibility(true);
    const result = await updateSectionVisibility(val);
    if (result.success) {
      setIsStatsVisible(val);
      toast.success(val ? "Stats section is now VISIBLE on website" : "Stats section is now HIDDEN from website");
    } else {
      toast.error(result.error || "Failed to update visibility");
    }
    setUpdatingVisibility(false);
  };

  const handleCityAction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProcessingCity(true);
    
    const formData = new FormData(e.currentTarget);
    formData.set("is_featured", cityForm.is_featured ? "true" : "false");
    formData.set("is_coming_soon", cityForm.is_coming_soon ? "true" : "false");
    // Pass the existing image URL as fallback if no new file picked
    formData.set("existingImageUrl", cityImagePreview);
    if (cityImageFile) {
      formData.set("image", cityImageFile);
    }

    let result;
    if (editingCityId) {
      result = await updateCity(editingCityId, formData);
    } else {
      result = await addCity(formData);
    }

    if (result.success) {
      toast.success(editingCityId ? "City updated!" : "City added!");
      setCityForm({ id: '', name: '', is_featured: true, is_coming_soon: false });
      setCityImageFile(null);
      setCityImagePreview('');
      setEditingCityId(null);
      const updatedCities = await getCities();
      setCitiesData(updatedCities);
    } else {
      toast.error(result.error);
    }
    setProcessingCity(false);
  };

  const handleDeleteCity = async (id: string) => {
    if (!confirm("Are you sure you want to delete this city?")) return;
    
    const result = await deleteCity(id);
    if (result.success) {
      toast.success("City deleted!");
      const updatedCities = await getCities();
      setCitiesData(updatedCities);
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction record?")) return;
    
    const result = await deleteBooking(id);
    if (result.success) {
      toast.success("Transaction deleted!");
      const updatedBookings = await getAllBookings();
      setBookings(updatedBookings);
    } else {
      toast.error(result.error);
    }
  };

  const handleAddGlobalAmenity = async () => {
    if (!newGlobalAmenity.trim()) return;
    setProcessingAmenity(true);
    const result = await addGlobalAmenity(newGlobalAmenity.trim());
    if (result.success) {
      toast.success("Amenity added!");
      setNewGlobalAmenity("");
      const updated = await getGlobalAmenities();
      setGlobalAmenities(updated);
    } else {
      toast.error(result.error);
    }
    setProcessingAmenity(false);
  };

  const handleDeleteGlobalAmenity = async (id: string) => {
    if (!confirm("Delete this amenity from the global list? It won't remove it from existing gyms but will hide it from new selections.")) return;
    setProcessingAmenity(true);
    const result = await deleteGlobalAmenity(id);
    if (result.success) {
      toast.success("Amenity deleted!");
      const updated = await getGlobalAmenities();
      setGlobalAmenities(updated);
    } else {
      toast.error(result.error);
    }
    setProcessingAmenity(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-secondary">Platform Overview</h1>
        <p className="text-gray-500 mt-1">Here's what's happening on GymDate today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Commission Wallet Card (Platform Owner Profit) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 shadow-xl border border-white/10 relative overflow-hidden group transition-all hover:scale-[1.02]">
          <div className="absolute -top-10 -right-10 opacity-10 transform group-hover:scale-110 transition-transform duration-700">
            <Coins className="w-48 h-48 text-white" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
              <Coins className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-sm font-bold text-gray-400">Total Profit (Commissions)</p>
            <div className="mt-2">
              <h3 className="text-3xl font-black text-white">
                ₹{totalPlatformCommission.toLocaleString()}
              </h3>
            </div>
            <button 
              onClick={() => setShowModal('commission')}
              className="mt-6 flex items-center justify-center space-x-2 bg-white text-slate-900 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-yellow-400 transition-colors shadow-lg"
            >
              <Eye className="w-4 h-4" />
              <span>View Breakdown</span>
            </button>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 p-6 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
            <Wallet className="w-24 h-24 text-secondary" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-bold text-gray-500">Gross Platform Revenue</p>
            <div className="mt-2">
              <h3 className="text-3xl font-black text-secondary">
                ₹{totalGrossRevenue.toLocaleString()}
              </h3>
            </div>
            <button 
              onClick={() => setShowModal('revenue')}
              className="mt-6 w-full flex items-center justify-center space-x-2 bg-gray-50 text-secondary py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>View Revenue per Gym</span>
            </button>
          </div>
        </div>

        {/* Gyms Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
            <Dumbbell className="w-24 h-24 text-secondary" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center mb-4">
              <Dumbbell className="w-6 h-6 text-secondary" />
            </div>
            <p className="text-sm font-bold text-gray-500">Live Partners</p>
            <div className="mt-2">
              <h3 className="text-3xl font-black text-secondary">
                {stats.totalGyms}
              </h3>
            </div>
            <Link 
              href="/admin/gyms"
              className="mt-6 w-full flex items-center justify-center space-x-2 bg-gray-50 text-secondary py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Manage Gyms</span>
            </Link>
          </div>
        </div>

        {/* Users Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
            <Users className="w-24 h-24 text-secondary" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm font-bold text-gray-500">Global Customers</p>
            <div className="mt-2">
              <h3 className="text-3xl font-black text-secondary">
                {stats.totalUsers}
              </h3>
            </div>
            <button 
              onClick={() => setShowModal('users')}
              className="mt-6 w-full flex items-center justify-center space-x-2 bg-gray-50 text-secondary py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Users per Gym</span>
            </button>
          </div>
        </div>

        {/* Cities Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
            <MapPin className="w-24 h-24 text-secondary" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm font-bold text-gray-500">Active Cities</p>
            <div className="mt-2">
              <h3 className="text-3xl font-black text-secondary">
                {citiesData.length}
              </h3>
            </div>
            <button 
              onClick={() => setShowModal('cities')}
              className="mt-6 w-full flex items-center justify-center space-x-2 bg-gray-50 text-secondary py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              <span>Manage Cities</span>
            </button>
          </div>
        </div>

        {/* Amenities Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden group transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 p-6 opacity-5 transform group-hover:scale-110 transition-transform duration-500">
            <Plus className="w-24 h-24 text-secondary" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-sm font-bold text-gray-500">Global Amenities</p>
            <div className="mt-2">
              <h3 className="text-3xl font-black text-secondary">
                {globalAmenities.length}
              </h3>
            </div>
            <button 
              onClick={() => setShowModal('amenities')}
              className="mt-6 w-full flex items-center justify-center space-x-2 bg-gray-50 text-secondary py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Manage Amenities</span>
            </button>
          </div>
        </div>
      </div>

      {/* Platform Stats Management */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-xl font-black text-secondary flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-primary" />
              Homepage Stats Management
            </h2>
            <p className="text-sm text-gray-500">Edit the numbers shown in the red stats section of the home page.</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Show Section</span>
              <button 
                onClick={() => handleToggleVisibility(!isStatsVisible)}
                disabled={updatingVisibility}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isStatsVisible ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <span className={`${isStatsVisible ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
              </button>
            </div>

            <button 
              onClick={handleUpdateStats}
              disabled={savingStats}
              className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all disabled:opacity-50"
            >
              {savingStats ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{savingStats ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platformStats.map((stat, idx) => (
            <div key={stat.id} className="group relative space-y-3 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary/30 transition-all">
              <button 
                onClick={() => handleDeleteStat(stat.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Label</label>
                <input 
                  type="text"
                  value={stat.label}
                  onChange={(e) => {
                    const newStats = [...platformStats];
                    newStats[idx].label = e.target.value;
                    setPlatformStats(newStats);
                  }}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-primary"
                  placeholder="e.g. Gyms"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Value</label>
                <input 
                  type="text"
                  value={stat.value}
                  onChange={(e) => {
                    const newStats = [...platformStats];
                    newStats[idx].value = e.target.value;
                    setPlatformStats(newStats);
                  }}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-black text-primary focus:outline-none focus:border-primary"
                  placeholder="e.g. 500+"
                />
              </div>
            </div>
          ))}
          
          {/* Add New Stat Card */}
          <button 
            onClick={handleAddStat}
            disabled={savingStats}
            className="flex flex-col items-center justify-center space-y-2 p-5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all group min-h-[140px]"
          >
            <PlusCircle className="w-8 h-8 text-gray-300 group-hover:text-primary transition-colors" />
            <span className="text-xs font-bold text-gray-400 group-hover:text-primary">Add New Stat</span>
          </button>
        </div>
      </div>

      {/* Modal for Breakdowns */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(null)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-black text-secondary capitalize">
                {showModal === 'commission' ? '💰 Platform Profit Breakdown' : 
                 showModal === 'revenue' ? '📈 Revenue Breakdown' : 
                 '👥 User Distribution'}
              </h2>
              <button onClick={() => setShowModal(null)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {breakdown.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-primary/30 transition-all group">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-secondary group-hover:text-primary transition-colors">{item.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Gym Partner</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-secondary">
                        {showModal === 'commission' ? `₹${item.commission.toLocaleString()}` : 
                         showModal === 'revenue' ? `₹${item.revenue.toLocaleString()}` : 
                         `${item.users} Users`}
                      </p>
                      <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${showModal === 'commission' ? 'bg-yellow-400' : showModal === 'revenue' ? 'bg-primary' : 'bg-blue-500'}`}
                          style={{ width: `${Math.min(100, (item[showModal as keyof typeof item] as number / (showModal === 'users' ? stats.totalUsers : showModal === 'commission' ? totalPlatformCommission : totalGrossRevenue) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <div className="text-sm font-bold text-gray-500">Total Counted</div>
              <div className="text-xl font-black text-secondary">
                {showModal === 'commission' ? `₹${totalPlatformCommission.toLocaleString()}` : 
                 showModal === 'revenue' ? `₹${totalGrossRevenue.toLocaleString()}` : 
                 `${stats.totalUsers} Total`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cities Management Modal */}
      {showModal === 'cities' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(null)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col md:flex-row h-[80vh]">
            {/* Left: Form */}
            <div className="w-full md:w-1/3 p-8 border-r border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-black text-secondary mb-6">{editingCityId ? 'Edit City' : 'Add New City'}</h3>
              <form onSubmit={handleCityAction} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">City Name</label>
                  <input 
                    type="text"
                    name="name"
                    required
                    value={cityForm.name}
                    onChange={(e) => setCityForm({...cityForm, name: e.target.value})}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold focus:border-primary outline-none"
                    placeholder="e.g. Hyderabad"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">City Image</label>
                  
                  {/* Image Preview */}
                  {cityImagePreview && (
                    <div className="aspect-video rounded-xl overflow-hidden border-2 border-white shadow-sm bg-gray-200">
                      <img src={cityImagePreview} className="w-full h-full object-cover" alt="Preview" />
                    </div>
                  )}

                  <label className="flex flex-col items-center justify-center w-full py-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer bg-white hover:border-primary hover:bg-primary/5 transition-all group">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <MapPin className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                      </div>
                      <span className="text-xs font-bold text-gray-500 group-hover:text-primary transition-colors">
                        {cityImageFile ? cityImageFile.name : 'Click to upload image'}
                      </span>
                      <span className="text-[10px] text-gray-400">PNG, JPG up to 5MB</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCityImageFile(file);
                          setCityImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <input 
                      type="checkbox"
                      id="is_featured"
                      checked={cityForm.is_featured}
                      onChange={(e) => setCityForm({...cityForm, is_featured: e.target.checked})}
                      className="w-5 h-5 accent-primary"
                    />
                    <label htmlFor="is_featured" className="text-sm font-bold text-secondary">Feature on Homepage</label>
                  </div>
                  <div className="flex items-center space-x-3 bg-orange-50 p-4 rounded-xl border border-orange-200 shadow-sm">
                    <input 
                      type="checkbox"
                      id="is_coming_soon"
                      checked={cityForm.is_coming_soon}
                      onChange={(e) => setCityForm({...cityForm, is_coming_soon: e.target.checked})}
                      className="w-5 h-5 accent-orange-500"
                    />
                    <div>
                      <label htmlFor="is_coming_soon" className="text-sm font-bold text-secondary cursor-pointer">Coming Soon</label>
                      <p className="text-[10px] text-gray-400 mt-0.5">Shows blurred image with badge</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="submit"
                    disabled={processingCity}
                    className="flex-1 bg-primary text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all disabled:opacity-50"
                  >
                    {processingCity ? "..." : editingCityId ? "Update City" : "Add City"}
                  </button>
                  {editingCityId && (
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingCityId(null);
                        setCityForm({ id: '', name: '', is_featured: true, is_coming_soon: false });
                        setCityImageFile(null);
                        setCityImagePreview('');
                      }}
                      className="px-4 bg-gray-200 text-gray-600 rounded-xl font-black text-xs uppercase"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Right: List */}
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-secondary">Active Cities</h3>
                <button onClick={() => setShowModal(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {citiesData.map((city) => (
                  <div key={city.id} className="group relative aspect-[16/10] rounded-2xl overflow-hidden border-2 border-white shadow-sm hover:shadow-xl transition-all">
                    <img src={city.image} className="absolute inset-0 w-full h-full object-cover" alt={city.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-4">
                      <p className="text-white font-black text-lg">{city.name}</p>
                      {city.is_featured && <span className="text-[8px] font-black uppercase bg-primary text-white px-2 py-0.5 rounded-full tracking-widest">Featured</span>}
                    </div>
                    
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingCityId(city.id);
                          setCityForm({ id: city.id, name: city.name, is_featured: !!city.is_featured, is_coming_soon: !!city.is_coming_soon });
                          setCityImageFile(null);
                          setCityImagePreview(city.image || '');
                        }}
                        className="p-2 bg-white/90 backdrop-blur-md rounded-lg text-secondary hover:bg-primary hover:text-white transition-all shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteCity(city.id)}
                        className="p-2 bg-white/90 backdrop-blur-md rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Amenities Management Modal */}
      {showModal === 'amenities' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(null)}></div>
          <div className="relative bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h2 className="text-xl font-black text-secondary">Manage Platform Amenities</h2>
              <button onClick={() => setShowModal(null)} className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-8 space-y-8">
              {/* Add New Amenity */}
              <div className="flex space-x-3">
                <input 
                  type="text"
                  value={newGlobalAmenity}
                  onChange={(e) => setNewGlobalAmenity(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGlobalAmenity()}
                  placeholder="Enter new amenity name (e.g. Swimming Pool)"
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:border-primary outline-none"
                />
                <button 
                  onClick={handleAddGlobalAmenity}
                  disabled={processingAmenity || !newGlobalAmenity.trim()}
                  className="bg-primary text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {processingAmenity ? '...' : 'Add'}
                </button>
              </div>

              {/* Grid of existing amenities with delete option */}
              <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-2">
                {globalAmenities.map((amenity) => (
                  <div key={amenity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                    <span className="font-bold text-secondary">{amenity.name}</span>
                    <button 
                      onClick={() => handleDeleteGlobalAmenity(amenity.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      title="Delete Global Amenity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Amenities: {globalAmenities.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Gyms Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-secondary">Recent Gym Partners</h2>
          <button className="text-sm font-semibold text-primary hover:text-primary-dark flex items-center">
            View All <ArrowUpRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gym Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentGyms.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No gyms found.
                  </td>
                </tr>
              ) : (
                recentGyms.map((gym) => (
                  <tr key={gym.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {gym.image ? (
                            <img className="h-10 w-10 rounded-lg object-cover" src={gym.image} alt="" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Dumbbell className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-secondary">{gym.name}</div>
                          <div className="text-xs text-gray-500">{gym.price_per_day ? `₹${gym.price_per_day}/day` : 'No price set'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{gym.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        gym.status === 'Open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {gym.status === 'Open' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                        {gym.status || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {gym.rating ? `${gym.rating} ⭐` : 'New'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Recent Subscriptions Section */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden mb-12">
        <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div>
            <h2 className="text-xl font-black text-secondary tracking-tighter">Recent Subscriptions</h2>
            <p className="text-xs text-gray-400 font-medium">Real-time membership activity across the platform.</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Live Activity</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gym & Plan</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-10 py-12 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <Clock className="w-8 h-8 text-gray-200" />
                      <p className="text-sm font-bold text-gray-400">No subscriptions found yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                bookings.slice(0, 10).map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-secondary leading-none mb-1">{booking.customer_name || 'Anonymous'}</span>
                        <span className="text-[10px] font-medium text-gray-400">{booking.customer_email || 'No email'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-secondary leading-none mb-1">{booking.gyms?.name || 'Unknown Gym'}</span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-wider">{booking.plan_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-sm font-black text-secondary">₹{booking.amount}</span>
                    </td>
                    <td className="px-6 py-6 text-sm text-gray-500 font-medium">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => generateInvoicePDF(booking)}
                          className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm group-hover:shadow-md"
                          title="Download Invoice PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm group-hover:shadow-md"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
