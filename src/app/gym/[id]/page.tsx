"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Star, MapPin, Clock, User, Wifi, Wind, Car, ShieldCheck, Dumbbell, Droplets, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { getGymById, getPricingPlansByGymId } from "@/actions/publicActions";
import { pricingPlans as mockPlans } from "@/data/mockData";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRazorpay } from "@/hooks/useRazorpay";

// Helper function to map string amenities to icons
const getAmenityIcon = (amenity: string) => {
  switch (amenity.toLowerCase()) {
    case "ac": return <Wind className="w-5 h-5" />;
    case "wifi": return <Wifi className="w-5 h-5" />;
    case "parking": return <Car className="w-5 h-5" />;
    case "locker room": return <ShieldCheck className="w-5 h-5" />;
    case "personal trainer": return <User className="w-5 h-5" />;
    case "shower": return <Droplets className="w-5 h-5" />;
    default: return <Dumbbell className="w-5 h-5" />;
  }
};

export default function GymDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [gym, setGym] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedPlanIdx, setSelectedPlanIdx] = useState<number | null>(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { initiatePayment } = useRazorpay();

  useEffect(() => {
    async function fetchGymAndPlans() {
      if (id) {
        const [gymData, plansData] = await Promise.all([
          getGymById(id),
          getPricingPlansByGymId(id)
        ]);
        setGym(gymData);
        setPlans(plansData.length > 0 ? plansData : []);
      }
      setLoading(false);
    }
    fetchGymAndPlans();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading details...</p>
        </div>
      </div>
    );
  }

  if (!gym) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Gym not found</h1>
          <button onClick={() => router.push('/explore')} className="text-primary font-bold hover:underline">Go back to explore</button>
        </div>
      </div>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800";
  const galleryImages = (gym.gallery && gym.gallery.length > 0) 
    ? gym.gallery.filter((img: string) => img && img.trim() !== "")
    : [gym.image || defaultImage];
  
  if (galleryImages.length === 0) galleryImages.push(defaultImage);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-28 md:pt-36 pb-20">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="flex items-center text-gray-500 hover:text-secondary mb-8 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Explore
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column (Images & Info) */}
          <div className="lg:col-span-2">
            {/* Gallery */}
            <div className="mb-10">
              <div className="relative h-[300px] md:h-[500px] rounded-[32px] overflow-hidden mb-4 shadow-sm border border-gray-100">
                <img 
                  src={galleryImages[selectedImage]} 
                  alt={gym.name}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {galleryImages.map((img: string, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-24 h-16 md:w-32 md:h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'}`}
                  >
                    <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Meta Info */}
            <div className="mb-12">
              <h1 className="text-3xl md:text-5xl font-black text-secondary mb-4">{gym.name}</h1>
              <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-sm md:text-base text-gray-600">
                <a 
                  href={gym.location} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-start max-w-lg group cursor-pointer"
                >
                  <MapPin className="w-4 h-4 mr-1.5 text-gray-400 mt-1 flex-shrink-0 group-hover:text-primary transition-colors" />
                  <div>
                    <span className="break-all group-hover:text-primary group-hover:underline transition-all">{gym.location}</span>
                    <span className="text-primary font-bold ml-2 whitespace-nowrap">{gym.distance}</span>
                  </div>
                </a>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1.5 text-primary fill-primary" />
                  <span className="font-bold text-secondary mr-1">{gym.rating}</span>
                  ({gym.reviews} reviews)
                </div>
                {gym.hours && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1.5 text-gray-400" />
                    {gym.hours}
                  </div>
                )}
                {gym.status === "Closed" && (
                  <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                    Currently Closed
                  </div>
                )}
              </div>
            </div>

            {/* About Section */}
            {gym.description && (
              <div className="mb-12">
                <h3 className="text-xl font-bold text-secondary mb-5">About</h3>
                <div className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">
                  {gym.description}
                </div>
              </div>
            )}

            {/* Amenities Section */}
            {gym.amenities && (
              <div className="mb-12">
                <h3 className="text-xl font-bold text-secondary mb-5">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {gym.amenities.map((amenity: string, idx: number) => (
                    <div key={idx} className="flex items-center bg-gray-100/50 p-4 rounded-2xl border border-gray-100 text-sm font-medium text-gray-700">
                      <div className="text-primary mr-3">
                        {getAmenityIcon(amenity)}
                      </div>
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trainers Section */}
            {(gym as any).trainers && (
              <div className="mb-12">
                <h3 className="text-xl font-bold text-secondary mb-5">Trainers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(gym as any).trainers.map((trainer: any, idx: number) => (
                    <div key={idx} className="flex items-center bg-gray-100/50 p-4 rounded-2xl border border-gray-100">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 bg-white flex items-center justify-center text-primary shadow-sm">
                        {trainer.avatar ? (
                          <Image src={trainer.avatar} alt={trainer.name} fill className="object-cover" />
                        ) : (
                          <User className="w-6 h-6" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-secondary text-sm">{trainer.name}</h4>
                        <p className="text-xs text-gray-500">{trainer.specialty}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Booking Sidebar) */}
          <div className="lg:relative">
            <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-sm lg:sticky lg:top-24 z-10">
              <h3 className="text-xl font-bold text-secondary mb-6">Select a Plan</h3>
              
              <div className="space-y-3 mb-8">
                {gym.status === "Closed" ? (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
                    <Clock className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-red-700 uppercase tracking-tight">Currently Closed</p>
                    <p className="text-[10px] text-red-600 mt-1">This gym is not accepting bookings at the moment.</p>
                  </div>
                ) : plans.length > 0 ? (
                  plans.map((plan: any, idx: number) => (
                    <label 
                      key={plan.id} 
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-colors ${selectedPlanIdx === idx ? 'border-primary bg-primary/5 text-primary' : 'border-gray-100 hover:border-gray-300 text-gray-600'}`}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 transition-colors ${selectedPlanIdx === idx ? 'border-primary' : 'border-gray-300'}`}>
                          {selectedPlanIdx === idx && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <span className={`text-sm ${selectedPlanIdx === idx ? 'font-medium' : ''}`}>{plan.name}</span>
                      </div>
                      <span className={`text-sm font-bold ${selectedPlanIdx === idx ? 'text-secondary' : 'text-gray-900'}`}>₹{plan.price.toLocaleString()}</span>
                    </label>
                  ))
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-medium">No pricing plans available</p>
                  </div>
                )}
              </div>

              {/* Payment status notification */}
              {paymentStatus && (
                <div className={`flex items-start gap-3 p-4 rounded-2xl mb-4 text-sm font-medium animate-in slide-in-from-top-2 duration-300 ${
                  paymentStatus.type === 'success' 
                    ? 'bg-green-50 border border-green-100 text-green-700'
                    : 'bg-red-50 border border-red-100 text-red-700'
                }`}>
                  {paymentStatus.type === 'success' 
                    ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                  <span>{paymentStatus.message}</span>
                </div>
              )}

              <button 
                disabled={gym.status === "Closed" || selectedPlanIdx === null || plans.length === 0 || paymentLoading}
                onClick={async () => {
                  if (selectedPlanIdx === null || !plans[selectedPlanIdx]) return;
                  const plan = plans[selectedPlanIdx];
                  const price = typeof plan.price === 'string'
                    ? parseFloat(plan.price.replace(/[^0-9.]/g, ''))
                    : Number(plan.price);

                  setPaymentStatus(null);
                  setPaymentLoading(true);

                  await initiatePayment({
                    gymId: gym.id,
                    gymName: gym.name,
                    planName: plan.name,
                    amount: price,
                    onSuccess: (bookingId, paymentId) => {
                      setPaymentLoading(false);
                      setPaymentStatus({ type: 'success', message: '🎉 Payment successful! Redirecting to your bookings...' });
                      setTimeout(() => router.push('/account'), 2000);
                    },
                    onFailure: (error) => {
                      setPaymentLoading(false);
                      if (!error.includes('cancelled')) {
                        setPaymentStatus({ type: 'error', message: error });
                      }
                    },
                  });
                }}
                className={`w-full py-4 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 ${
                  gym.status === "Closed" || selectedPlanIdx === null || plans.length === 0 || paymentLoading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-[#e50914] hover:bg-red-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95'
                }`}
              >
                {paymentLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : gym.status === "Closed" ? (
                  "Currently Closed"
                ) : selectedPlanIdx !== null && plans[selectedPlanIdx] ? (
                  `Pay ₹${ (typeof plans[selectedPlanIdx].price === 'string' ? plans[selectedPlanIdx].price : `₹${Number(plans[selectedPlanIdx].price).toLocaleString()}`).replace('₹₹', '₹') } — Book Now`
                ) : (
                  'Select a Plan'
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4">
                <img src="https://razorpay.com/favicon.ico" alt="Razorpay" className="w-3 h-3 opacity-50" />
                <p className="text-center text-[10px] text-gray-400">
                  {gym.status === "Closed" ? "Bookings will resume once open" : "Secured by Razorpay · UPI, Card, Net Banking & more"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
