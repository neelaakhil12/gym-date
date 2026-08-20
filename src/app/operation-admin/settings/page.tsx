"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Settings as SettingsIcon, 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Gift,
  Coins,
  ShieldCheck,
  UserPlus,
  ShieldAlert,
  ArrowLeft
} from "lucide-react";
import { useSession } from "next-auth/react";
import { getPlatformConfig, updatePlatformConfig, checkStaffSettingsAccess } from "@/actions/adminActions";

interface ConfigItem {
  key: string;
  value: string;
  description: string;
}

export default function OperationSettings() {
  const { data: session, status } = useSession();
  const [config, setConfig] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    async function loadConfig() {
      setLoading(true);
      const email = session?.user?.email || undefined;
      const isAllowed = await checkStaffSettingsAccess(email);
      setAllowed(isAllowed);
      if (isAllowed) {
        const data = await getPlatformConfig();
        setConfig(data.filter((item: any) => item.key !== 'referral_bonus_user' && item.key !== 'allow_staff_settings' && item.key !== 'signup_bonus'));
      }
      setLoading(false);
    }
    if (status !== 'loading') {
      loadConfig();
    }
  }, [session, status]);

  const handleSave = async (key: string, value: string) => {
    setSavingKey(key);
    setMessage(null);
    const res = await updatePlatformConfig(key, value);
    if (res.success) {
      setMessage({ type: 'success', text: `Successfully updated ${key.replace(/_/g, ' ')}` });
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: res.error || "Update failed" });
    }
    setSavingKey(null);
  };

  const handleValueChange = (key: string, newValue: string) => {
    setConfig(prev => prev.map(item => 
      item.key === key ? { ...item, value: newValue } : item
    ));
  };

  const getConfigIcon = (key: string) => {
    if (key.includes('referral')) return <UserPlus className="w-5 h-5 text-blue-500" />;
    if (key.includes('bonus')) return <Gift className="w-5 h-5 text-primary" />;
    if (key.includes('wallet')) return <Coins className="w-5 h-5 text-amber-500" />;
    return <SettingsIcon className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-secondary">Staff Settings</h1>
        <p className="text-gray-500 mt-1 text-sm font-medium">
          Manage referral bonuses, wallet usage limits, and core platform rules.
        </p>
      </div>

      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-100 text-green-700' 
            : 'bg-red-50 border-red-100 text-red-700'
        } animate-in slide-in-from-top duration-300`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-sm font-bold">{message.text}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <RefreshCw className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-gray-400 font-bold animate-pulse">Loading configurations...</p>
        </div>
      ) : allowed === false ? (
        <div className="bg-white p-10 rounded-3xl border border-red-100 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 bg-red-50 rounded-full text-red-500">
            <ShieldAlert className="w-12 h-12" />
          </div>
          <h2 className="text-xl font-black text-secondary">Settings Access Disabled</h2>
          <p className="text-sm text-gray-500 max-w-md">
            Super Admin has currently turned off Settings access for Operations Staff. Please contact the Super Admin if you need access enabled.
          </p>
          <Link
            href="/operation-admin/gyms"
            className="px-6 py-3 bg-secondary text-white rounded-2xl font-bold text-xs hover:bg-black transition-all flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to All Gyms</span>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {config.map((item) => (
            <div key={item.key} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-50 rounded-2xl flex-shrink-0">
                  {getConfigIcon(item.key)}
                </div>
                <div>
                  <h3 className="text-sm font-black text-secondary uppercase tracking-wider">
                    {item.key === 'refer_a_friend' ? 'User Referral Bonus' : 
                     item.key === 'partner_referral_bonus' ? 'Partner Referral Bonus (Refer a Gym)' : 
                     item.key.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    {item.description || "Platform configuration value."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</span>
                  <input
                    type="number"
                    value={item.value}
                    onChange={(e) => handleValueChange(item.key, e.target.value)}
                    className="w-32 pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-black text-secondary"
                  />
                </div>
                <button
                  onClick={() => handleSave(item.key, item.value)}
                  disabled={savingKey === item.key}
                  className="p-3 bg-secondary text-white rounded-2xl hover:bg-primary transition-all disabled:opacity-50 shadow-lg shadow-secondary/10 group"
                  title="Save Setting"
                >
                  {savingKey === item.key ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {config.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No settings found in database</p>
            </div>
          )}
        </div>
      )}

      {/* Info Card */}
      <div className="p-6 bg-secondary rounded-3xl text-white">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-black tracking-tight">Operations Authority</h2>
        </div>
        <p className="text-sm text-gray-300 font-medium leading-relaxed">
          As Operations Staff, you can update global referral settings. Please use caution as these changes affect all users immediately.
        </p>
      </div>
    </div>
  );
}
