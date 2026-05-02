"use client";

import React, { useEffect, useState } from "react";
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight,
  Receipt,
  Search
} from "lucide-react";
import { getAllBookings, getAdminStats } from "@/actions/adminActions";

export default function AdminRevenue() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState({ walletBalance: 0, totalGyms: 0, totalUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [bookingsData, adminStats] = await Promise.all([
        getAllBookings(),
        getAdminStats()
      ]);
      setBookings(bookingsData);
      setStats(adminStats);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredBookings = bookings.filter(booking => 
    booking.plan_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.gym_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.customer_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-secondary">Revenue & Bookings</h1>
          <p className="text-gray-500 mt-1">Track platform earnings and user transactions.</p>
        </div>
        <button className="flex items-center justify-center space-x-2 bg-white border border-gray-200 text-secondary px-4 py-2.5 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-sm">
          <span>Download Report</span>
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-primary rounded-2xl p-8 shadow-sm text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Wallet className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <p className="text-primary-light font-medium mb-1">Total Platform Balance</p>
            <h2 className="text-4xl font-black">₹{stats.walletBalance.toLocaleString()}</h2>
            <div className="mt-4 inline-flex items-center space-x-1 bg-white/20 px-3 py-1.5 rounded-lg text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>Available for payout</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col justify-center">
          <p className="text-gray-500 font-medium mb-1">Total Transactions</p>
          <h2 className="text-4xl font-black text-secondary">{bookings.length}</h2>
          <div className="mt-4 flex items-center text-sm text-green-500 font-medium">
            <ArrowUpRight className="w-4 h-4 mr-1" />
            <span>Active Bookings</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all"
            placeholder="Search by gym, plan, or user email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Gym / Plan
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Receipt className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchQuery ? "Try adjusting your search query." : "When users book gyms, their transactions will appear here."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {booking.id?.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-secondary">{booking.customer_name}</div>
                        <div className="text-xs text-gray-400">{booking.customer_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-secondary">{booking.gym_name || 'Global Plan'}</div>
                        <div className="text-xs text-gray-500">{booking.plan_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ₹{booking.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(booking.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          booking.status === 'completed' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {booking.status || 'completed'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
