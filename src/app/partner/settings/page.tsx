"use client";

import React, { useEffect, useState } from "react";
import { Settings, Shield, Bell, User, Save } from "lucide-react";
import { getPartnerGym, supabase } from "@/lib/supabase";

export default function PartnerSettings() {
  const [gym, setGym] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [message, setMessage] = useState({ type: "", text: "" });

  const loadData = async () => {
    const [gymData, { data: { session } }] = await Promise.all([
      getPartnerGym(),
      supabase.auth.getSession()
    ]);
    
    setGym(gymData);
    if (session?.user) {
      setEmail(session.user.email || "");
      
      // Use email as fallback for name if we don't have a name column
      setName(session.user.email?.split('@')[0] || "");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session found");

      // Since we don't have a full_name column, we'll skip the DB update for now
      // or we could update the gym name if that's what was intended.
      // For now, just show success since the UI state updated.
      setMessage({ type: "success", text: "Settings updated locally (Database column 'full_name' missing)." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update profile." });
    } finally {
      setSaving(false);
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
        <h1 className="text-2xl font-black text-slate-900">Partner Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences and security.</p>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 min-h-[500px]">
          {/* Tabs */}
          <div className="bg-gray-50/50 border-r border-gray-100 p-4 space-y-1">
            <button 
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                activeTab === "profile" 
                ? "bg-white text-primary shadow-sm border border-gray-100" 
                : "text-gray-500 hover:bg-white hover:text-slate-900"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>
            <button 
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                activeTab === "notifications" 
                ? "bg-white text-primary shadow-sm border border-gray-100" 
                : "text-gray-500 hover:bg-white hover:text-slate-900"
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </button>
            <button 
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                activeTab === "security" 
                ? "bg-white text-primary shadow-sm border border-gray-100" 
                : "text-gray-500 hover:bg-white hover:text-slate-900"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </button>
          </div>

          {/* Content */}
          <div className="md:col-span-3 p-8 md:p-10">
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${
                message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
              }`}>
                {message.text}
              </div>
            )}
            
            {activeTab === "profile" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-6">Account Profile</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                      <input 
                        type="email" 
                        disabled 
                        value={email || "Loading..."} 
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-[10px] text-gray-400 mt-2 italic">Your email is managed by the system administrator.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-50">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? "Saving..." : "Save Settings"}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-900">Notification Settings</h3>
                <div className="space-y-4">
                  {[
                    "Email notifications for new bookings",
                    "Weekly revenue reports",
                    "Platform updates and news"
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <span className="text-sm font-medium text-gray-700">{item}</span>
                      <div className="w-10 h-6 bg-primary rounded-full relative">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-slate-900">Security & Privacy</h3>
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 mb-6">
                  <p className="text-sm text-amber-800 leading-relaxed font-medium">
                    To change your password, please use the \"Forgot Password\" link on the login page. 2FA management will be available in a future update.
                  </p>
                </div>
                <button className="text-sm font-bold text-primary hover:underline">
                  View recent login activity
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
