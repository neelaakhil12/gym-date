"use client";

import React from "react";
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  CreditCard,
  Mail,
  Lock,
  Globe
} from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-black text-secondary">Platform Settings</h1>
        <p className="text-gray-500 mt-1">Configure global platform rules, notifications, and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation/Sidebar for Settings */}
        <div className="md:col-span-1 space-y-2">
          <button className="w-full flex items-center space-x-3 px-4 py-3 bg-white text-primary border border-gray-200 rounded-xl font-medium shadow-sm">
            <Globe className="w-5 h-5" />
            <span>General</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-white hover:text-secondary rounded-xl font-medium transition-colors">
            <Shield className="w-5 h-5" />
            <span>Security & Auth</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-white hover:text-secondary rounded-xl font-medium transition-colors">
            <CreditCard className="w-5 h-5" />
            <span>Payments</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-white hover:text-secondary rounded-xl font-medium transition-colors">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </button>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-secondary flex items-center">
                <SettingsIcon className="w-5 h-5 mr-2 text-gray-400" />
                General Configuration
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Site Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Platform Name</label>
                <input 
                  type="text" 
                  defaultValue="GymDate"
                  className="block w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              {/* Support Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Support Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input 
                    type="email" 
                    defaultValue="support@gymdate.com"
                    className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <h4 className="text-sm font-bold text-secondary">Maintenance Mode</h4>
                  <p className="text-xs text-gray-500 mt-1">Temporarily disable access to the user-facing website.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="pt-4 flex justify-end">
                <button className="bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-sm">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
