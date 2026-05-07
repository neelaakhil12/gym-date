"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Shield,
  User,
  Store,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Trash2,
  Loader2,
  Plus,
  X,
  ShieldCheck,
  Key
} from "lucide-react";
import { getAllProfiles, deleteAccount, createOperationAdmin } from "@/actions/adminActions";

type Tab = "users" | "partners" | "admins";

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: "", password: "", full_name: "" });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function loadProfiles() {
      setLoading(true);
      const data = await getAllProfiles();
      setProfiles(data);
      setLoading(false);
    }
    loadProfiles();
  }, []);

  const handleDelete = async (id: string, role: string) => {
    if (!window.confirm(`Are you sure you want to delete this ${role}? This action is permanent and will delete all associated data.`)) {
      return;
    }

    setDeletingId(id);
    const res = await deleteAccount(id, role);
    if (res.success) {
      setProfiles(prev => prev.filter(p => p.id !== id));
    } else {
      alert(res.error || "Failed to delete account");
    }
    setDeletingId(null);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    const res = await createOperationAdmin(newAdmin);
    if (res.success) {
      const data = await getAllProfiles();
      setProfiles(data);
      setIsAddModalOpen(false);
      setNewAdmin({ email: "", password: "", full_name: "" });
      alert("Operations Admin created successfully!");
    } else {
      alert(res.error || "Failed to create admin");
    }
    setIsCreating(false);
  };

  const users = profiles.filter((p) => p.role_id === "user" || (!p.role_id && p.role_id !== "partner" && p.role_id !== "super_admin" && p.role_id !== "operation_admin"));
  const partners = profiles.filter((p) => p.role_id === "partner");
  const admins = profiles.filter((p) => p.role_id === "super_admin" || p.role_id === "operation_admin");

  const getCurrentList = () => {
    let list = activeTab === "users" ? users : activeTab === "partners" ? partners : admins;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.email?.toLowerCase().includes(q) ||
          p.full_name?.toLowerCase().includes(q) ||
          p.phone?.toLowerCase().includes(q)
      );
    }
    return list;
  };

  const tabs = [
    {
      id: "users" as Tab,
      label: "Users",
      count: users.length,
      icon: User,
      color: "text-green-600",
      activeBg: "bg-green-600",
      badgeBg: "bg-green-100 text-green-700",
      borderColor: "border-green-600",
    },
    {
      id: "partners" as Tab,
      label: "Partners",
      count: partners.length,
      icon: Store,
      color: "text-blue-600",
      activeBg: "bg-blue-600",
      badgeBg: "bg-blue-100 text-blue-700",
      borderColor: "border-blue-600",
    },
    {
      id: "admins" as Tab,
      label: "Administrators",
      count: admins.length,
      icon: Shield,
      color: "text-primary",
      activeBg: "bg-primary",
      badgeBg: "bg-primary/10 text-primary",
      borderColor: "border-primary",
    },
  ];

  const activeTabConfig = tabs.find((t) => t.id === activeTab)!;
  const currentList = getCurrentList();

  const getRoleBadge = (roleId: string) => {
    switch (roleId) {
      case "super_admin":
        return "bg-black text-white border border-black";
      case "operation_admin":
        return "bg-primary/10 text-primary border border-primary/20";
      case "partner":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      default:
        return "bg-green-50 text-green-700 border border-green-200";
    }
  };

  const getRoleLabel = (roleId: string) => {
    switch (roleId) {
      case "super_admin": return "Super Admin";
      case "operation_admin": return "Operations Admin";
      case "partner": return "Partner";
      default: return "User";
    }
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name && name.trim() && name !== "undefined" && name !== "null") {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    if (email && email.trim() && email !== "undefined" && email !== "null") {
      return email.trim()[0].toUpperCase();
    }
    return "??";
  };

  const getAvatarBg = (roleId: string) => {
    switch (roleId) {
      case "super_admin": return "bg-black text-white";
      case "operation_admin": return "bg-primary text-white";
      case "partner": return "bg-blue-600 text-white";
      default: return "bg-green-600 text-white";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-secondary">Account Management</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">
            View and manage all platform accounts, partners, and administrators.
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg shadow-secondary/10"
        >
          <Plus className="w-5 h-5" />
          <span>Add Operations Staff</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
              className={`p-5 bg-white rounded-2xl border-2 text-left transition-all shadow-sm hover:shadow-md ${
                activeTab === tab.id ? `${tab.borderColor} shadow-md` : "border-gray-100"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${activeTab === tab.id ? tab.activeBg + " bg-opacity-10" : "bg-gray-50"}`}>
                  <Icon className={`w-5 h-5 ${tab.color}`} />
                </div>
                <span className={`text-2xl font-black ${tab.color}`}>{tab.count}</span>
              </div>
              <p className="font-bold text-secondary text-sm">{tab.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {tab.id === "users" ? "Platform users / customers" : tab.id === "partners" ? "Gym owners / partners" : "Admin & Operations staff"}
              </p>
            </button>
          );
        })}
      </div>

      {/* Tab Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchQuery(""); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold transition-all border-b-2 ${
                  isActive
                    ? `${tab.borderColor} ${tab.color}`
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-black ${isActive ? tab.badgeBg : "bg-gray-100 text-gray-500"}`}>
                  {tab.id === "users" ? users.length : tab.id === "partners" ? partners.length : admins.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              placeholder={`Search ${activeTabConfig.label.toLowerCase()} by name, email or phone...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-gray-400 font-bold animate-pulse">Loading accounts...</p>
            </div>
          </div>
        ) : currentList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${activeTabConfig.badgeBg}`}>
              {React.createElement(activeTabConfig.icon, { className: `w-8 h-8 ${activeTabConfig.color}` })}
            </div>
            <h3 className="text-base font-black text-secondary mb-1">
              No {activeTabConfig.label} Found
            </h3>
            <p className="text-sm text-gray-400 font-medium">
              {searchQuery ? "Try a different search term." : `No ${activeTabConfig.label.toLowerCase()} registered yet.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-50">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {currentList.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${getAvatarBg(profile.role_id)}`}>
                          {getInitials(profile.full_name, profile.email)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-secondary">
                            {profile.role_id === "partner" && profile.gym_name 
                              ? profile.gym_name 
                              : (profile.full_name || "—")}
                          </div>
                          <div className="text-xs text-gray-400 font-medium">{profile.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${getRoleBadge(profile.role_id)}`}>
                        {getRoleLabel(profile.role_id)}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {profile.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="font-medium">{profile.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>Joined {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {profile.role_id !== 'super_admin' && (
                        <button
                          onClick={() => handleDelete(profile.id, profile.role_id)}
                          disabled={deletingId === profile.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-30"
                        >
                          {deletingId === profile.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-secondary flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-black tracking-tight">Add Operations Staff</h2>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newAdmin.full_name}
                  onChange={(e) => setNewAdmin({...newAdmin, full_name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Work Email</label>
                <input
                  required
                  type="email"
                  placeholder="operations@gymdate.in"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Access Password</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-red-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Create Account</span>}
                </button>
                <p className="text-center text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-wider">
                  They will be able to manage gyms and leads but not revenue
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
