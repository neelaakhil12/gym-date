"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, DollarSign, Calendar, Users, ArrowUpRight } from "lucide-react";
import { getPartnerGym, getPartnerBookings } from "@/actions/adminActions";

export default function PartnerBookings() {
  const [gym, setGym] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const gymData = await getPartnerGym();
      setGym(gymData);
      
      if (gymData) {
        const data = await getPartnerBookings(gymData.id);
        setBookings(data || []);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.amount) || Number(b.total_price) || 0), 0);
  const uniqueCustomers = new Set(bookings.map((b: any) => b.user_id)).size;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Bookings & Revenue</h1>
        <p className="text-gray-500 mt-1">Track your earnings and manage gym entries.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1" />
              +0%
            </span>
          </div>
          <p className="text-sm font-medium text-gray-500">Total Revenue</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">₹{totalRevenue.toLocaleString()}</h3>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500">Total Bookings</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{bookings.length}</h3>
        </div>

        <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-500">Unique Customers</p>
          <h3 className="text-3xl font-black text-slate-900 mt-1">{uniqueCustomers}</h3>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-lg">Recent Transactions</h3>
          <button className="text-sm font-bold text-primary hover:underline">View All</button>
        </div>
        
        <div className="overflow-x-auto">
          {bookings.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Plan</th>
                  <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                  <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-8 py-4">
                      <div className="font-bold text-slate-900 text-sm">{booking.customer_name || 'Member'}</div>
                      <div className="text-[10px] text-gray-400">{booking.customer_email || 'No email'}</div>
                    </td>
                    <td className="px-8 py-4 text-sm text-gray-600">{booking.plan_name || "Daily Pass"}</td>
                    <td className="px-8 py-4 text-sm text-gray-600">{new Date(booking.created_at).toLocaleDateString()}</td>
                    <td className="px-8 py-4 font-bold text-slate-900 text-sm">₹{booking.amount || booking.total_price || 0}</td>
                    <td className="px-8 py-4">
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider">Success</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center">
              <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">No bookings found yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
