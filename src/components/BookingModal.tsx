"use client";

import React, { useState, useEffect } from "react";
import { X, CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useSession } from "next-auth/react";
import { computeEndDate } from "@/lib/planDuration";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  gym: any;
}

export default function BookingModal({ isOpen, onClose, gym }: BookingModalProps) {
  const { data: session } = useSession();
  const { initiatePayment } = useRazorpay();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    planId: "",
    startDate: new Date().toISOString().split('T')[0], // today as default
  });

  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && gym) {
      // Pre-fill form if session exists
      setFormData({
        name: session?.user?.name || "",
        email: session?.user?.email || "",
        phone: "",
        planId: "",
        startDate: new Date().toISOString().split('T')[0],
      });

      // Fetch gym plans
      const fetchPlans = async () => {
        try {
          const res = await fetch(`/api/gyms/get-plans?gymId=${gym.id}`);
          const data = await res.json();
          if (data.success) {
            setPlans(data.plans);
            if (data.plans.length > 0) {
              setFormData(prev => ({ ...prev, planId: data.plans[0].id }));
            }
          } else {
            // Fallback plan if no plans in DB
            setPlans([{ id: 'default', name: 'Daily Pass', price: gym.price_per_day.toString() }]);
            setFormData(prev => ({ ...prev, planId: 'default' }));
          }
        } catch (err) {
          setPlans([{ id: 'default', name: 'Daily Pass', price: gym.price_per_day.toString() }]);
          setFormData(prev => ({ ...prev, planId: 'default' }));
        }
      };
      fetchPlans();
    }
  }, [isOpen, gym, session]);

  if (!isOpen || !gym) return null;

  const handleProceed = async () => {
    if (!formData.name || !formData.phone || !formData.email || !formData.planId) {
      setError("Please fill all details");
      return;
    }

    const selectedPlan = plans.find(p => p.id === formData.planId);
    if (!selectedPlan) return;

    // Calculate discounted price if gym has offer
    // Clean price string from symbols
    const rawPrice = selectedPlan.price.toString().replace(/[^0-9.]/g, '');
    let finalAmount = rawPrice;
    
    if (gym.has_offer && gym.offer_percentage) {
      const discount = (parseFloat(rawPrice) * gym.offer_percentage) / 100;
      finalAmount = Math.floor(parseFloat(rawPrice) - discount).toString();
    }

    setLoading(true);
    setError("");

    initiatePayment({
      gymId: gym.id,
      gymName: gym.name,
      planName: selectedPlan.name,
      amount: finalAmount,
      startDate: formData.startDate,
      customerName: formData.name,
      customerPhone: formData.phone,
      customerEmail: formData.email,
      onSuccess: (bookingId, paymentId) => {
        setLoading(false);
        setSuccess(true);
      },
      onFailure: (err) => {
        setLoading(false);
        setError(err);
      }
    });
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-[300] bg-secondary/80 backdrop-blur-xl flex items-center justify-center p-6">
        <div className="bg-white w-full max-w-md rounded-[40px] p-10 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-secondary tracking-tighter">Congratulations!</h2>
            <p className="text-gray-400 text-sm font-medium">Your subscription payment was successfully completed.</p>
          </div>
          <button 
            onClick={() => {
              setSuccess(false);
              onClose();
              window.location.href = "/account";
            }}
            className="w-full py-5 bg-secondary text-white rounded-2xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[300] bg-secondary/60 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl animate-in fade-in zoom-in-95 duration-300 relative my-auto">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-6 top-6 p-2 hover:bg-gray-100 rounded-full transition-all"
        >
          <X className="w-6 h-6 text-gray-400" />
        </button>

        <div className="p-10 space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-secondary tracking-tighter">Book Membership</h2>
            <p className="text-gray-400 text-sm font-medium">Subscribe to <span className="text-primary font-bold">{gym.name}</span></p>
          </div>

          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
              <input 
                type="text" 
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition-all font-bold"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
              <input 
                type="email" 
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition-all font-bold"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</label>
              <input 
                type="tel" 
                placeholder="91XXXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition-all font-bold"
              />
            </div>

            {/* Plan Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Select Subscription Plan</label>
              <div className="grid grid-cols-1 gap-3">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setFormData({...formData, planId: plan.id})}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                      formData.planId === plan.id 
                        ? "border-primary bg-primary/5" 
                        : "border-gray-50 bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-secondary">{plan.name}</h4>
                        {gym.has_offer && (
                          <span className="bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded-full uppercase">-{gym.offer_percentage}% OFF</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{plan.validity || 'Access'}</p>
                    </div>
                    <div className="text-right">
                      {gym.has_offer ? (
                        <div className="flex flex-col items-end leading-none">
                          <span className="text-[10px] text-gray-400 line-through font-bold mb-1">
                            {plan.price.toString().startsWith('₹') ? plan.price : `₹${plan.price}`}
                          </span>
                          <span className="text-lg font-black text-primary">
                            ₹{Math.floor(parseFloat(plan.price.toString().replace(/[^0-9.]/g, '')) * (1 - gym.offer_percentage / 100))}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-black text-primary">
                          {plan.price.toString().startsWith('₹') ? plan.price : `₹${plan.price}`}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {/* Start Date Picker */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Membership Start Date</label>
              <input 
                type="date" 
                value={formData.startDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:border-primary focus:bg-white transition-all font-bold"
              />
              {(() => {
                const sel = plans.find(p => p.id === formData.planId);
                if (!sel || !formData.startDate) return null;
                const start = new Date(formData.startDate);
                const end = computeEndDate(start, sel.name);
                return (
                  <p className="text-[10px] font-bold text-green-600 ml-1">
                    ✓ Valid until {end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                );
              })()}
            </div>
          </div>
          </div>

          {error && <p className="text-red-500 text-xs font-bold text-center bg-red-50 py-3 rounded-xl">{error}</p>}

          <button
            onClick={handleProceed}
            disabled={loading}
            className="w-full py-5 bg-primary text-white rounded-[24px] font-black flex items-center justify-center space-x-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CreditCard className="w-5 h-5" />
            )}
            <span>{loading ? "Initializing..." : "Proceed to Pay"}</span>
          </button>

          <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
            🔒 Secure Payment via Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
