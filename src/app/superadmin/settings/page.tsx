"use client";

import React, { useEffect, useState } from "react";
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
  ToggleLeft,
  ToggleRight,
  SlidersHorizontal
} from "lucide-react";
import { getPlatformConfig, updatePlatformConfig } from "@/actions/adminActions";

interface ConfigItem {
  key: string;
  value: string;
  description: string;
}

export default function AdminSettings() {
  const [config, setConfig] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    setLoading(true);
    const data = await getPlatformConfig();
    // Hide redundant keys and signup_bonus
    setConfig(data.filter((item: any) => item.key !== 'referral_bonus_user' && item.key !== 'signup_bonus'));
    setLoading(false);
  }

  const handleSave = async (key: string, value: string) => {
    setSavingKey(key);
    setMessage(null);
    const res = await updatePlatformConfig(key, value);
    if (res.success) {
      setMessage({ type: 'success', text: `Successfully updated ${key.replace(/_/g, ' ')}` });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: res.error || "Update failed" });
    }
    setSavingKey(null);
  };

  const handleToggleStaffSettings = async (currentVal: string) => {
    const newVal = (currentVal === 'true' || currentVal === '1') ? 'false' : 'true';
    setConfig(prev => prev.map(item => item.key === 'allow_staff_settings' ? { ...item, value: newVal } : item));
    await handleSave('allow_staff_settings', newVal);
  };

  const handleValueChange = (key: string, newValue: string) => {
    setConfig(prev => prev.map(item => 
      item.key === key ? { ...item, value: newValue } : item
    ));
  };

  const getConfigTitle = (key: string) => {
    switch (key) {
      case 'platform_commission': return 'Global Platform Commission (%)';
      case 'user_referral_bonus': return 'User Referral Bonus (₹)';
      case 'partner_referral_bonus': return 'Partner Referral Bonus (Refer a Gym) (₹)';
      case 'max_wallet_per_txn': return 'Max User Wallet Usable Per Booking (₹)';
      case 'partner_referral_min_withdrawal': return 'Partner Referral Wallet Min Withdrawal Limit (₹)';
      case 'partner_virtual_min_withdrawal': return 'Partner Virtual Wallet (Revenue) Min Withdrawal Limit (₹)';
      default: return key.replace(/_/g, ' ');
    }
  };

  const getConfigIcon = (key: string) => {
    if (key.includes('referral') && key.includes('partner')) return <Gift className="w-5 h-5 text-purple-500" />;
    if (key.includes('referral')) return <UserPlus className="w-5 h-5 text-blue-500" />;
    if (key.includes('withdrawal')) return <Banknote className="w-5 h-5 text-emerald-500" />;
    if (key.includes('wallet')) return <Coins className="w-5 h-5 text-amber-500" />;
    if (key.includes('commission')) return <SlidersHorizontal className="w-5 h-5 text-red-500" />;
    return <SettingsIcon className="w-5 h-5 text-gray-500" />;
  };

  const staffSettingItem = config.find(item => item.key === 'allow_staff_settings');
  const hiddenKeys = ['allow_staff_settings', 'refer_a_friend'];
  const generalConfigs = config.filter(item => !hiddenKeys.includes(item.key));
  const isStaffAccessEnabled = staffSettingItem?.value === 'true' || staffSettingItem?.value === '1';

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-secondary">Platform Settings</h1>
        <p className="text-gray-500 mt-1 text-sm font-medium">
          Manage referral bonuses, withdrawal limits, and core business rules.
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
      ) : (
        <div className="grid gap-6">
          {/* Staff Settings Access Control Toggle Card */}
          <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl shrink-0">
                <SlidersHorizontal className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-secondary uppercase tracking-wider">
                    Allow Staff Admin Settings Access
                  </h3>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                    isStaffAccessEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isStaffAccessEnabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                  When turned <strong className="text-secondary">ON</strong>, Operations Staff Admin will see and can edit the <strong>Settings</strong> tab. When turned <strong className="text-secondary">OFF</strong>, the Settings tab is hidden for staff.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleStaffSettings(staffSettingItem?.value || 'false')}
                disabled={savingKey === 'allow_staff_settings'}
                className={`relative inline-flex h-9 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isStaffAccessEnabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-8 w-8 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isStaffAccessEnabled ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* General Numeric Platform Configurations */}
          {generalConfigs.map((item) => {
            const isPercent = item.key === 'platform_commission';
            return (
              <div key={item.key} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gray-50 rounded-2xl flex-shrink-0">
                    {getConfigIcon(item.key)}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-secondary uppercase tracking-wider">
                      {getConfigTitle(item.key)}
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mt-1">
                      {item.description || "No description provided for this setting."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    {!isPercent && (
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</span>
                    )}
                    <input
                      type="number"
                      value={item.value}
                      onChange={(e) => handleValueChange(item.key, e.target.value)}
                      className={`w-32 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-black text-secondary ${
                        isPercent ? 'px-4 pr-8 text-right' : 'pl-8 pr-4'
                      }`}
                    />
                    {isPercent && (
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">%</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleSave(item.key, item.value)}
                    disabled={savingKey === item.key}
                    className="p-3 bg-secondary text-white rounded-2xl hover:bg-black transition-all disabled:opacity-50 shadow-lg shadow-secondary/10 group"
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
            );
          })}

          {config.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No settings found in database</p>
              <button 
                onClick={loadConfig}
                className="mt-4 text-primary font-black text-sm hover:underline"
              >
                Click to retry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Security Info */}
      <div className="p-6 bg-secondary rounded-3xl text-white">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-black tracking-tight">Security & Performance</h2>
        </div>
        <p className="text-sm text-gray-300 font-medium leading-relaxed">
          These settings are global. Any changes made here will immediately affect all users and partners on the platform. Referral bonuses are calculated at the time of account creation or lead approval based on these values.
        </p>
      </div>
    </div>
  );
}
