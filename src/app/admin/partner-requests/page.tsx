"use client";

import React, { useEffect, useState } from "react";
import { 
  ClipboardList, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  MoreVertical,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Users
} from "lucide-react";
import { getPartnerRequests, updatePartnerRequestStatus } from "@/actions/adminActions";
import { toast } from "react-hot-toast";

interface PartnerRequest {
  id: string;
  created_at: string;
  gym_name: string;
  owner_name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  status: string;
}

export default function PartnerRequestsPage() {
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const data = await getPartnerRequests();
      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const result = await updatePartnerRequestStatus(id, newStatus);
      if (result.error) throw new Error(result.error);
      
      setRequests(requests.map(req => 
        req.id === id ? { ...req, status: newStatus } : req
      ));
      toast.success(`Status updated to ${newStatus}`);
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-100 text-amber-700 border-amber-200";
      case "contacted": return "bg-blue-100 text-blue-700 border-blue-200";
      case "approved": return "bg-green-100 text-green-700 border-green-200";
      case "rejected": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary">Partner <span className="text-primary">Leads</span></h1>
          <p className="text-gray-500">Manage incoming gym registration requests and inquiries.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <span className="text-sm font-bold text-gray-400">TOTAL LEADS:</span>
          <span className="text-lg font-black text-primary">{requests.length}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200">
          <ClipboardList className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-secondary mb-2">No leads yet</h3>
          <p className="text-gray-400">When gym owners register, their details will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map((request) => (
            <div 
              key={request.id} 
              className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all group"
            >
              <div className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center gap-8">
                {/* Gym Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <ClipboardList className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-secondary leading-none mb-1">{request.gym_name}</h3>
                        <p className="text-sm text-gray-400 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(request.created_at).toLocaleDateString('en-IN', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">OWNER</p>
                        <p className="font-bold">{request.owner_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CONTACT</p>
                        <p className="font-bold">{request.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">EMAIL</p>
                        <p className="font-bold truncate">{request.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CITY</p>
                        <p className="font-bold">{request.city}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">ADDRESS</p>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">{request.address}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col items-center gap-3">
                  <a 
                    href={`https://wa.me/${request.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    className="flex-1 lg:w-full flex items-center justify-center space-x-2 px-6 py-3 bg-[#25D366] text-white rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-green-500/20"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>WhatsApp</span>
                  </a>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateStatus(request.id, "approved")}
                      className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-100 transition-colors border border-green-100"
                      title="Approve"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => updateStatus(request.id, "rejected")}
                      className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors border border-red-100"
                      title="Reject"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => updateStatus(request.id, "contacted")}
                      className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-100 transition-colors border border-blue-100"
                      title="Mark as Contacted"
                    >
                      <Phone className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
