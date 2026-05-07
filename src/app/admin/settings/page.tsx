"use client";

import React, { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, Shield, Bell, CreditCard,
  Mail, Globe, Gift, Wallet, Save, Loader2, CheckCircle2
} from "lucide-react";

export default function AdminSettings() {
  const [activeSection, setActiveSection] = useState("general");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    user_referral_bonus: "20",
    max_wallet_per_txn: "10",
    partner_referral_bonus: "100",
    signup_bonus: "0",
    max_referrals_allowed: "5",
  });

  useEffect(() => {
    fetch("/api/admin/referral-config")
      .then(r => r.json())
      .then(data => {
        if (data.config) setConfig(data.config);
      });
  }, []);

  const handleSaveReferral = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/referral-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const navItems = [
    { id: "general", label: "General", icon: Globe },
    { id: "referral", label: "Referral & Wallet", icon: Gift },
    { id: "security", label: "Security & Auth", icon: Shield },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-secondary">Platform Settings</h1>
        <p className="text-gray-500 mt-1">Configure global platform rules, referral bonuses, and more.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-2">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeSection === id
                  ? "bg-white text-primary border border-gray-200 shadow-sm"
                  : "text-gray-600 hover:bg-white hover:text-secondary"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-2 space-y-6">

          {/* General */}
          {activeSection === "general" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-secondary flex items-center">
                  <SettingsIcon className="w-5 h-5 mr-2 text-gray-400" />
                  General Configuration
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Platform Name</label>
                  <input type="text" defaultValue="GymDate"
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Support Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                    <input type="email" defaultValue="support@gymdate.com"
                      className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <h4 className="text-sm font-bold text-secondary">Maintenance Mode</h4>
                    <p className="text-xs text-gray-500 mt-1">Temporarily disable access to the user-facing website.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="pt-4 flex justify-end">
                  <button className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-all shadow-sm">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Referral & Wallet */}
          {activeSection === "referral" && (
            <div className="space-y-6">
              {/* User Referral */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                  <h2 className="text-lg font-bold text-secondary flex items-center">
                    <Gift className="w-5 h-5 mr-2 text-green-500" />
                    User Referral Settings
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Configure how much users earn for referring friends.</p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Bonus Per Referral (₹)
                      </label>
                      <p className="text-xs text-gray-400 mb-3">Credited when referred user buys a subscription.</p>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-500 font-bold">₹</span>
                        <input
                          type="number" min="0"
                          value={config.user_referral_bonus}
                          onChange={e => setConfig({ ...config, user_referral_bonus: e.target.value })}
                          className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary transition-all font-bold text-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Max Wallet Usage Per Renewal (₹)
                      </label>
                      <p className="text-xs text-gray-400 mb-3">Max wallet amount deductible per subscription purchase.</p>
                      <div className="relative">
                        <span className="absolute left-4 top-3.5 text-gray-500 font-bold">₹</span>
                        <input
                          type="number" min="0"
                          value={config.max_wallet_per_txn}
                          onChange={e => setConfig({ ...config, max_wallet_per_txn: e.target.value })}
                          className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary transition-all font-bold text-lg"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                    <strong>Example:</strong> If a user refers 5 friends who all buy subscriptions, they earn ₹{parseInt(config.user_referral_bonus) * 5}. 
                    They can use up to ₹{config.max_wallet_per_txn} per renewal to offset their cost.
                  </div>

                  <div className="pt-6 border-t border-gray-100 mt-6 space-y-6">
                    <h3 className="text-sm font-black text-secondary uppercase tracking-widest">Growth & Limits</h3>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          New User Signup Bonus (₹)
                        </label>
                        <p className="text-xs text-gray-400 mb-3">Instant wallet credit when a new user creates an account.</p>
                        <div className="relative">
                          <span className="absolute left-4 top-3.5 text-gray-500 font-bold">₹</span>
                          <input
                            type="number" min="0"
                            value={config.signup_bonus}
                            onChange={e => setConfig({ ...config, signup_bonus: e.target.value })}
                            className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary transition-all font-bold text-lg"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          Max Bonus-Eligible Referrals
                        </label>
                        <p className="text-xs text-gray-400 mb-3">Maximum number of friends a user can get paid for referring.</p>
                        <div className="relative">
                          <input
                            type="number" min="1"
                            value={config.max_referrals_allowed}
                            onChange={e => setConfig({ ...config, max_referrals_allowed: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary transition-all font-bold text-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Partner Referral */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-violet-50">
                  <h2 className="text-lg font-bold text-secondary flex items-center">
                    <Wallet className="w-5 h-5 mr-2 text-purple-500" />
                    Partner Referral Settings
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Default bonus when a partner refers another gym to join the platform.</p>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Default Bonus Per Gym Referred (₹)
                    </label>
                    <p className="text-xs text-gray-400 mb-3">
                      This is the default. You can override it per gym in the gym creation form.
                    </p>
                    <div className="relative max-w-xs">
                      <span className="absolute left-4 top-3.5 text-gray-500 font-bold">₹</span>
                      <input
                        type="number" min="0"
                        value={config.partner_referral_bonus}
                        onChange={e => setConfig({ ...config, partner_referral_bonus: e.target.value })}
                        className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary transition-all font-bold text-lg"
                      />
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-purple-700">
                    <strong>How it works:</strong> When Partner A shares their referral link and a new gym owner signs up and gets onboarded, 
                    Partner A receives ₹{config.partner_referral_bonus} in their wallet.
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveReferral}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-all shadow-md disabled:opacity-70"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : saved ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saved ? "Saved!" : saving ? "Saving..." : "Save Referral Settings"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Security placeholder */}
          {activeSection === "security" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-200" />
              <p className="font-bold">Security settings coming soon.</p>
            </div>
          )}

          {/* Payments placeholder */}
          {activeSection === "payments" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-200" />
              <p className="font-bold">Payment settings coming soon.</p>
            </div>
          )}

          {/* Notifications placeholder */}
          {activeSection === "notifications" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-200" />
              <p className="font-bold">Notification settings coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
