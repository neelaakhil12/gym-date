"use client";

import React, { useEffect, useState } from "react";
import { Banknote, CheckCircle2, Clock, MapPin, Building2, User, CreditCard, Eye, X, FileText, Smartphone, QrCode } from "lucide-react";
import { getPayoutRequests, updatePayoutStatus } from "@/actions/adminActions";

export default function AdminPayouts() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  useEffect(() => {
    async function loadRequests() {
      setLoading(true);
      const data = await getPayoutRequests();
      setRequests(data || []);
      setLoading(false);
    }
    loadRequests();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    const result = await updatePayoutStatus(id, newStatus);

    if (result.success) {
      setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus } : r));
      if (selectedRequest?.id === id) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
    }
    setUpdatingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-secondary">Payout Requests</h1>
        <p className="text-gray-500 mt-1">Review and process withdrawal requests from gym partners.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {requests.length > 0 ? (
          requests.map((req) => (
            <div key={req.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left: Gym & Amount Info */}
                  <div className="flex items-start space-x-5 flex-1">
                    <div className="w-16 h-16 bg-blue-50 rounded-[20px] flex items-center justify-center text-blue-600 flex-shrink-0">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-xl font-black text-secondary truncate">{req.gyms?.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                          req.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      <a 
                        href={req.gyms?.location}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-gray-400 mt-1 break-all line-clamp-1 hover:text-blue-600 transition-colors group cursor-pointer"
                      >
                        <MapPin className="w-3 h-3 mr-1 flex-shrink-0 group-hover:text-blue-600" />
                        <span className="group-hover:underline">{req.gyms?.location}</span>
                      </a>
                      <div className="flex items-center mt-3 space-x-4">
                        <div className="text-3xl font-black text-slate-900">₹{req.amount.toLocaleString()}</div>
                        <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                          req.payout_method === 'upi' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {req.payout_method === 'upi' ? 'UPI / QR' : 'Bank Transfer'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Actions & View */}
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setSelectedRequest(req)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center space-x-2 border border-slate-200"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>

                    {req.status === 'pending' ? (
                      <button 
                        onClick={() => handleStatusUpdate(req.id, 'completed')}
                        disabled={updatingId === req.id}
                        className="bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
                      >
                        {updatingId === req.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Mark Paid</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center justify-center space-x-2 text-green-600 font-bold text-sm bg-green-50 px-5 py-3 rounded-xl border border-green-100">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Paid</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[40px] p-20 text-center border border-gray-100 shadow-sm">
            <Clock className="w-20 h-20 text-gray-100 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-300">No Payout Requests</h3>
            <p className="text-gray-400 mt-2">When partners request a withdrawal, they will appear here.</p>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Withdrawal Details</h3>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto">
              {/* Gym Header */}
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold">
                  {selectedRequest.gyms?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-black text-slate-900">{selectedRequest.gyms?.name}</h4>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{selectedRequest.payout_method === 'upi' ? 'UPI / QR Code Transfer' : 'Bank Account Transfer'}</p>
                </div>
              </div>

              {/* Amount Box */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-gray-100 text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Requested Amount</p>
                <div className="text-4xl font-black text-slate-900">₹{selectedRequest.amount.toLocaleString()}</div>
              </div>

              {/* Payout Details Grid */}
              <div className="space-y-4">
                <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest">Payment Destination</h5>
                <div className="grid grid-cols-1 gap-3">
                  {selectedRequest.payout_method === 'bank' ? (
                    <>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">Bank Name</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">{selectedRequest.bank_name}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">Account Holder</span>
                        </div>
                        <span className="text-sm font-black text-slate-900 uppercase">{selectedRequest.account_holder}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">Account Number</span>
                        </div>
                        <span className="text-sm font-black text-primary font-mono tracking-wider">{selectedRequest.account_number}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <Banknote className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">IFSC Code</span>
                        </div>
                        <span className="text-sm font-black text-slate-900 uppercase">{selectedRequest.ifsc_code}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">UPI ID</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">{selectedRequest.upi_id}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-500">Mobile Number</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">{selectedRequest.mobile_number}</span>
                      </div>
                      {selectedRequest.qr_code_url && (
                        <div className="space-y-3 pt-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">QR Code Provided</p>
                          <div className="flex justify-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                            <img 
                              src={selectedRequest.qr_code_url} 
                              alt="QR Code" 
                              className="w-48 h-48 object-contain cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(selectedRequest.qr_code_url, '_blank')}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Action in Modal */}
              <div className="pt-4 pb-4">
                {selectedRequest.status === 'pending' ? (
                  <button 
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'completed')}
                    disabled={updatingId === selectedRequest.id}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl flex items-center justify-center space-x-2"
                  >
                    {updatingId === selectedRequest.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Confirm & Mark as Paid</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full bg-green-50 text-green-600 py-4 rounded-2xl font-black text-center border border-green-100 flex items-center justify-center space-x-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Payout Completed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
