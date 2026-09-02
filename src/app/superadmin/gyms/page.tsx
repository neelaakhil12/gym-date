"use client";

import GymLogoIcon from "@/components/GymLogoIcon";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Search, 
  Plus, 
  MoreVertical,
  CheckCircle2,
  Clock,
  MapPin,
  Star,
  Edit,
  Trash2,
  Percent,
  LayoutDashboard,
  Store,
  ExternalLink
} from "lucide-react";
import { getGyms } from "@/actions/publicActions";
import { deleteGym, updateGymOffer } from "@/actions/gymActions";
import { useSession } from "next-auth/react";

export default function AdminGyms() {
  const { data: session } = useSession();
  const isOpAdmin = (session?.user as any)?.role === "operation_admin";
  const baseUrl = isOpAdmin ? "/operation-admin/gyms" : "/superadmin/gyms";
  const createUrl = isOpAdmin ? "/operation-admin/gyms/create" : "/superadmin/gyms/create";
  const [gyms, setGyms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [openingPartnerId, setOpeningPartnerId] = useState<string | null>(null);

  useEffect(() => {
    async function loadGyms() {
      setLoading(true);
      const data = await getGyms();
      setGyms(data);
      setLoading(false);
    }
    loadGyms();
  }, []);

  const filteredGyms = gyms.filter(gym => 
    gym.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gym.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenPartnerPanel = async (gymId: string) => {
    setOpeningPartnerId(gymId);
    try {
      const res = await fetch("/api/admin/impersonate-partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gymId }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.open(data.redirectUrl, "_blank");
      } else {
        alert(data.error || "Failed to open partner panel.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to switch to partner panel.");
    } finally {
      setOpeningPartnerId(null);
    }
  };

  const handleDelete = async (gymId: string) => {
    if (window.confirm("Are you sure you want to delete this gym? This action cannot be undone and will delete all associated pricing plans.")) {
      const result = await deleteGym(gymId);
      if (result.error) {
        alert(result.error);
      } else {
        // Optimistically remove from state
        setGyms(gyms.filter(g => g.id !== gymId));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-secondary">Manage Gyms</h1>
          <p className="text-gray-500 mt-1">View and manage all partner gyms on the platform.</p>
        </div>
        <Link 
          href={createUrl} 
          className="flex items-center justify-center space-x-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-primary-dark transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Gym</span>
        </Link>
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
            placeholder="Search gyms by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Gyms Table */}
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
                    Gym Info
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Offer
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredGyms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <GymLogoIcon className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No gyms found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchQuery ? "Try adjusting your search query." : "Get started by creating a new gym partner."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredGyms.map((gym) => (
                    <tr key={gym.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 flex-shrink-0">
                            {gym.image ? (
                              <img className="h-12 w-12 rounded-xl object-cover shadow-sm" src={gym.image} alt={gym.name} />
                            ) : (
                              <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
                                <GymLogoIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-secondary">{gym.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">ID: {gym.id?.substring(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                          <span className="truncate max-w-[200px]">{gym.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          gym.status === 'Open' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {gym.status === 'Open' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <Clock className="w-3.5 h-3.5 mr-1" />}
                          {gym.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="ml-1.5 text-sm font-bold text-gray-700">{gym.rating || 'New'}</span>
                          <span className="ml-1 text-xs text-gray-400">({gym.reviews || 0})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {gym.has_offer ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-primary/10 text-primary border border-primary/20 uppercase tracking-tighter animate-pulse">
                            <Percent className="w-3 h-3 mr-1" />
                            {gym.offer_percentage}% OFF
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-300 uppercase">No Offer</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Direct Partner Admin Panel Button */}
                          {!isOpAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenPartnerPanel(gym.id)}
                              disabled={openingPartnerId === gym.id}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border border-indigo-200/70 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                              title="View Partner Admin Panel in New Tab"
                            >
                              {openingPartnerId === gym.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-1" />
                              ) : (
                                <Store className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                              )}
                              <span>Partner Panel</span>
                              <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                            </button>
                          )}

                          {!isOpAdmin && (
                            <Link 
                              href={`/superadmin/gyms/${gym.id}/dashboard`}
                              className="text-gray-400 hover:text-secondary transition-colors p-2 rounded-lg hover:bg-gray-100"
                              title="View Gym Analytics"
                            >
                              <LayoutDashboard className="w-4 h-4" />
                            </Link>
                          )}
                          <Link 
                            href={`${baseUrl}/${gym.id}/edit`}
                            className="text-gray-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-gray-100"
                            title="Edit Gym"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => handleDelete(gym.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                            title="Delete Gym"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
