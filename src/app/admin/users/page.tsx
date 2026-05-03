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
} from "lucide-react";
import { getAllProfiles } from "@/actions/adminActions";

type Tab = "customers" | "partners" | "admins";

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("customers");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadProfiles() {
      setLoading(true);
      const data = await getAllProfiles();
      setProfiles(data);
      setLoading(false);
    }
    loadProfiles();
  }, []);

  const customers = profiles.filter((p) => p.role_id === "user" || (!p.role_id && p.role_id !== "partner" && p.role_id !== "super_admin"));
  const partners = profiles.filter((p) => p.role_id === "partner");
  const admins = profiles.filter((p) => p.role_id === "super_admin");

  const getCurrentList = () => {
    let list = activeTab === "customers" ? customers : activeTab === "partners" ? partners : admins;
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
      id: "customers" as Tab,
      label: "Customers",
      count: customers.length,
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
      label: "Super Admins",
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
      case "partner": return "Partner";
      default: return "Customer";
    }
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      const parts = name.split(" ");
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
    }
    return email ? email.slice(0, 2).toUpperCase() : "??";
  };

  const getAvatarBg = (roleId: string) => {
    switch (roleId) {
      case "super_admin": return "bg-primary text-white";
      case "partner": return "bg-blue-600 text-white";
      default: return "bg-green-600 text-white";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-secondary">Account Management</h1>
        <p className="text-gray-500 mt-1">
          View and manage all platform accounts, partners, and super admins.
        </p>
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
                {tab.id === "customers" ? "Registered gym users" : tab.id === "partners" ? "Gym owners / partners" : "Platform administrators"}
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
                  {tab.id === "customers" ? customers.length : tab.id === "partners" ? partners.length : admins.length}
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
              <p className="text-sm text-gray-400 font-bold animate-pulse">Loading users...</p>
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
            <p className="text-sm text-gray-400">
              {searchQuery ? "Try a different search term." : `No ${activeTabConfig.label.toLowerCase()} registered yet.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-50">
              <thead className="bg-gray-50/50">
                <tr>
                  {activeTab !== "admins" && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                    </>
                  )}
                  {activeTab === "admins" && (
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Admin Email</th>
                  )}
                  {activeTab === "customers" && (
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  {activeTab !== "admins" && (
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {currentList.map((profile) => (
                  <tr key={profile.id} className="hover:bg-gray-50/50 transition-colors group">
                    {/* User / Email Column */}
                    {activeTab !== "admins" ? (
                      <>
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
                              {profile.role_id === "partner" && profile.full_name && (
                                <div className="text-xs text-gray-500 font-medium mt-0.5">
                                  Owner: {profile.full_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span className="font-medium">{profile.email || "—"}</span>
                            </div>
                            {profile.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Phone className="w-3 h-3 flex-shrink-0" />
                                <span>{profile.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </>
                    ) : (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${getAvatarBg(profile.role_id)}`}>
                            {getInitials("", profile.email)}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm font-bold text-secondary">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {profile.email}
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Location (customers only) */}
                    {activeTab === "customers" && (
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="font-medium text-secondary">
                              {profile.address || "Address not provided"}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Role */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${getRoleBadge(profile.role_id)}`}>
                        {getRoleLabel(profile.role_id)}
                      </span>
                    </td>

                    {/* Joined */}
                    {activeTab !== "admins" && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span>
                            {profile.created_at
                              ? new Date(profile.created_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </span>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer count */}
            <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400 font-bold">
                Showing <span className="text-secondary">{currentList.length}</span> of{" "}
                <span className="text-secondary">
                  {activeTab === "customers" ? customers.length : activeTab === "partners" ? partners.length : admins.length}
                </span>{" "}
                {activeTabConfig.label.toLowerCase()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
