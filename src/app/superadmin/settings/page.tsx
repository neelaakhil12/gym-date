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
  SlidersHorizontal,
  Banknote,
  FileText,
  Users,
  Building2,
  Eye,
  Edit3,
  RotateCcw,
  Clock,
  Receipt,
  Percent
} from "lucide-react";
import { getPlatformConfig, updatePlatformConfig } from "@/actions/adminActions";
import { DEFAULT_USER_TERMS, DEFAULT_PARTNER_TERMS } from "@/lib/termsData";

interface ConfigItem {
  key: string;
  value: string;
  description: string;
}

export default function AdminSettings() {
  const [mainTab, setMainTab] = useState<"general" | "terms">("general");
  const [config, setConfig] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Terms & Conditions state
  const [selectedTermsType, setSelectedTermsType] = useState<"user" | "partner">("user");
  const [termsViewMode, setTermsViewMode] = useState<"edit" | "preview">("edit");
  const [userTermsText, setUserTermsText] = useState(DEFAULT_USER_TERMS);
  const [partnerTermsText, setPartnerTermsText] = useState(DEFAULT_PARTNER_TERMS);
  const [termsUpdatedAt, setTermsUpdatedAt] = useState("24 August 2026");
  const [savingTerms, setSavingTerms] = useState(false);

  useEffect(() => {
    loadConfig();
    loadTerms();
  }, []);

  async function loadConfig() {
    const isEligible = (item: any) => 
      item && 
      item.key && 
      !['referral_bonus_user', 'signup_bonus', 'terms_user', 'terms_partner', 'user_terms_conditions', 'partner_terms_conditions', 'terms_updated_at'].includes(item.key) &&
      !String(item.key).includes('terms');

    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings-config", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.configs)) {
        setConfig(json.configs.filter(isEligible));
      } else {
        const data = await getPlatformConfig();
        if (Array.isArray(data)) {
          setConfig(data.filter(isEligible));
        }
      }
    } catch (e) {
      try {
        const data = await getPlatformConfig();
        if (Array.isArray(data)) {
          setConfig(data.filter(isEligible));
        }
      } catch (err) {
        console.error("Failed to load settings config:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadTerms() {
    try {
      const res = await fetch("/api/terms", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        if (data.userTerms) setUserTermsText(data.userTerms);
        if (data.partnerTerms) setPartnerTermsText(data.partnerTerms);
        if (data.updatedAt) setTermsUpdatedAt(data.updatedAt);
      }
    } catch (err) {
      console.error("Failed to load terms:", err);
    }
  }

  const handleSave = async (key: string, value: string) => {
    setSavingKey(key);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: `Successfully updated ${key.replace(/_/g, ' ')}` });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error(json.error || "Failed to update");
      }
    } catch (e: any) {
      const fallback = await updatePlatformConfig(key, value);
      if (fallback.success) {
        setMessage({ type: 'success', text: `Successfully updated ${key.replace(/_/g, ' ')}` });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: fallback.error || e.message || "Update failed" });
      }
    } finally {
      setSavingKey(null);
    }
  };

  const handleSaveTerms = async (type: "user" | "partner") => {
    setSavingTerms(true);
    setMessage(null);
    try {
      const payload = type === "user" ? { userTerms: userTermsText } : { partnerTerms: partnerTermsText };
      const res = await fetch("/api/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        if (data.updatedAt) setTermsUpdatedAt(data.updatedAt);
        setMessage({
          type: 'success',
          text: `Successfully updated ${type === "user" ? "User" : "Gym Partner"} Terms & Conditions!`
        });
        setTimeout(() => setMessage(null), 3500);
      } else {
        throw new Error(data.error || "Failed to save terms");
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Failed to update terms and conditions." });
    } finally {
      setSavingTerms(false);
    }
  };

  const handleRestoreDefaultTerms = (type: "user" | "partner") => {
    const isConfirmed = window.confirm(
      `Are you sure you want to restore the default ${type === "user" ? "User" : "Gym Partner"} Terms & Conditions? Any unsaved edits will be replaced.`
    );
    if (!isConfirmed) return;

    if (type === "user") {
      setUserTermsText(DEFAULT_USER_TERMS);
    } else {
      setPartnerTermsText(DEFAULT_PARTNER_TERMS);
    }
    setMessage({
      type: 'success',
      text: `Restored default template for ${type === "user" ? "User" : "Gym Partner"} Terms. Click "Save & Update Terms" to persist to database.`
    });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleToggleStaffSettings = async (currentVal: string) => {
    const newVal = (currentVal === 'true' || currentVal === '1') ? 'false' : 'true';
    setConfig(prev => prev.map(item => item && item.key === 'allow_staff_settings' ? { ...item, value: newVal } : item));
    await handleSave('allow_staff_settings', newVal);
  };

  const handleValueChange = (key: string, newValue: string) => {
    setConfig(prev => prev.map(item => 
      item && item.key === key ? { ...item, value: newValue } : item
    ));
  };

  const getConfigTitle = (key?: string) => {
    if (!key) return '';
    switch (key) {
      case 'platform_commission': return 'Global Platform Commission (%)';
      case 'gst_percentage': return 'User Subscription GST Percentage (%)';
      case 'user_referral_bonus': return 'User Referral Bonus (₹)';
      case 'partner_referral_bonus': return 'Partner Referral Bonus (Refer a Gym) (₹)';
      case 'max_wallet_per_txn': return 'Max User Wallet Usable Per Booking (₹)';
      case 'partner_referral_min_withdrawal': return 'Partner Referral Wallet Min Withdrawal Limit (₹)';
      case 'partner_virtual_min_withdrawal': return 'Partner Virtual Wallet (Revenue) Min Withdrawal Limit (₹)';
      default: return key.replace(/_/g, ' ');
    }
  };

  const getConfigIcon = (key?: string) => {
    if (!key) return <SettingsIcon className="w-5 h-5 text-gray-500" />;
    if (key.includes('gst')) return <Receipt className="w-5 h-5 text-indigo-500" />;
    if (key.includes('referral') && key.includes('partner')) return <Gift className="w-5 h-5 text-purple-500" />;
    if (key.includes('referral')) return <UserPlus className="w-5 h-5 text-blue-500" />;
    if (key.includes('withdrawal')) return <Banknote className="w-5 h-5 text-emerald-500" />;
    if (key.includes('wallet')) return <Coins className="w-5 h-5 text-amber-500" />;
    if (key.includes('commission')) return <SlidersHorizontal className="w-5 h-5 text-red-500" />;
    return <SettingsIcon className="w-5 h-5 text-gray-500" />;
  };

  const staffSettingItem = config.find(item => item && item.key === 'allow_staff_settings');
  const hiddenKeys = ['allow_staff_settings', 'refer_a_friend', 'user_terms_conditions', 'partner_terms_conditions', 'terms_updated_at', 'terms_user', 'terms_partner', 'referral_bonus_user', 'signup_bonus'];
  const generalConfigs = config.filter(item => item && item.key && !hiddenKeys.includes(item.key) && !String(item.key).includes('terms'));
  const isStaffAccessEnabled = staffSettingItem?.value === 'true' || staffSettingItem?.value === '1';

  const currentTermsText = selectedTermsType === "user" ? userTermsText : partnerTermsText;
  const wordCount = currentTermsText.trim() ? currentTermsText.trim().split(/\s+/).length : 0;
  const charCount = currentTermsText.length;

  return (
    <div className="max-w-5xl space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-secondary">Platform Settings</h1>
          <p className="text-gray-500 mt-1 text-sm font-medium">
            Manage global commissions, referral rules, and legal terms & conditions.
          </p>
        </div>

        {/* Main Tab Selector */}
        <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-1 self-start sm:self-auto">
          <button
            onClick={() => setMainTab("general")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
              mainTab === "general"
                ? "bg-secondary text-white shadow-md shadow-secondary/20"
                : "text-gray-500 hover:text-secondary hover:bg-gray-50"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Platform Rules</span>
          </button>
          <button
            onClick={() => setMainTab("terms")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
              mainTab === "terms"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-gray-500 hover:text-secondary hover:bg-gray-50"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms & Conditions</span>
          </button>
        </div>
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

      {/* TAB 1: GENERAL PLATFORM RULES */}
      {mainTab === "general" && (
        <>
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
                const isPercent = item.key === 'platform_commission' || item.key === 'gst_percentage';
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
        </>
      )}

      {/* TAB 2: TERMS & CONDITIONS MANAGEMENT */}
      {mainTab === "terms" && (
        <div className="space-y-6">
          {/* Sub Switcher: User vs Gym Partner Terms */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-black text-secondary uppercase tracking-wider">
                  Terms & Conditions Editor
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mt-0.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Effective Date: {termsUpdatedAt}</span>
                </div>
              </div>
            </div>

            {/* Type selector */}
            <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedTermsType("user")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  selectedTermsType === "user"
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-500 hover:text-secondary"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>User Terms</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTermsType("partner")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  selectedTermsType === "partner"
                    ? "bg-white text-secondary shadow-sm"
                    : "text-gray-500 hover:text-secondary"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Gym Partner Terms</span>
              </button>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
              <span>Words: <strong className="text-secondary">{wordCount.toLocaleString()}</strong></span>
              <span>•</span>
              <span>Characters: <strong className="text-secondary">{charCount.toLocaleString()}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              {/* Edit vs Preview Toggle */}
              <div className="bg-white p-1 rounded-xl border border-gray-200 flex items-center">
                <button
                  type="button"
                  onClick={() => setTermsViewMode("edit")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    termsViewMode === "edit" ? "bg-secondary text-white" : "text-gray-500 hover:text-secondary"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTermsViewMode("preview")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    termsViewMode === "preview" ? "bg-secondary text-white" : "text-gray-500 hover:text-secondary"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Live Preview</span>
                </button>
              </div>

              {/* Restore Default Button */}
              <button
                type="button"
                onClick={() => handleRestoreDefaultTerms(selectedTermsType)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold border border-gray-200 transition-all"
                title="Reset to default terms template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Default</span>
              </button>

              {/* Save Terms Button */}
              <button
                type="button"
                onClick={() => handleSaveTerms(selectedTermsType)}
                disabled={savingTerms}
                className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-black tracking-wider uppercase transition-all shadow-md shadow-primary/20 disabled:opacity-60"
              >
                {savingTerms ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save & Update Terms</span>
              </button>
            </div>
          </div>

          {/* Editor / Preview Panel */}
          {termsViewMode === "edit" ? (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-4">
              <div className="mb-2 px-2 flex items-center justify-between text-xs font-bold text-gray-400">
                <span>Direct Legal Text Editor</span>
                <span>Auto-wraps for mobile and web views</span>
              </div>
              <textarea
                value={selectedTermsType === "user" ? userTermsText : partnerTermsText}
                onChange={(e) => {
                  if (selectedTermsType === "user") {
                    setUserTermsText(e.target.value);
                  } else {
                    setPartnerTermsText(e.target.value);
                  }
                }}
                rows={22}
                className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 font-mono text-xs sm:text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y"
                placeholder="Type or paste updated terms and conditions here..."
              />
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 max-h-[600px] overflow-y-auto">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-100">
                <span className="text-xs font-black uppercase tracking-wider text-primary">
                  Live Preview: {selectedTermsType === "user" ? "User Terms" : "Gym Partner Terms"}
                </span>
                <span className="text-xs font-bold text-gray-400">
                  Last Updated: {termsUpdatedAt}
                </span>
              </div>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                {currentTermsText}
              </div>
            </div>
          )}

          {/* Bottom Save Reminder Card */}
          <div className="bg-gradient-to-br from-primary/10 via-white to-gray-50 p-6 rounded-3xl border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-secondary uppercase tracking-wider">
                Instant Platform Sync
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Saving updates here will instantly reflect across the website, mobile app onboard checks, and partner login portals.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSaveTerms(selectedTermsType)}
              disabled={savingTerms}
              className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 shrink-0 disabled:opacity-60"
            >
              {savingTerms ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Publish Changes Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Security Info */}
      <div className="p-6 bg-secondary rounded-3xl text-white">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-black tracking-tight">Security & Global Configuration</h2>
        </div>
        <p className="text-sm text-gray-300 font-medium leading-relaxed">
          These settings are global and live. Any updates made here will immediately affect all users and partners on the platform. Referral bonuses and terms validations are processed in real-time.
        </p>
      </div>
    </div>
  );
}
