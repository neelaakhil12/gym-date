"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Search, 
  SlidersHorizontal,
  Navigation,
  MapPin,
  Star,
  Percent
} from "lucide-react";
import { getGyms } from "@/actions/publicActions";
import { gyms as mockGyms } from "@/data/mockData";
import GymCard from "@/components/GymCard";
import BookingModal from "@/components/BookingModal";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

const filters = {
  distance: ["1km", "3km", "5km", "10km", "20km"],
  amenities: ["AC", "Trainer", "Yoga", "Zumba", "Steam Room", "Parking"]
};

export default function ExplorePage() {
  const [gyms, setGyms] = useState<any[]>([]);
  const [activeDistance, setActiveDistance] = useState("all");
  const [activeAmenities, setActiveAmenities] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedBookingGym, setSelectedBookingGym] = useState<any | null>(null);
  const { data: nextAuthSession } = useSession();

  useEffect(() => {
    async function loadGyms() {
      const dbGyms = await getGyms();
      setGyms(dbGyms);
    }
    loadGyms();

    const fetchUserLocation = async () => {
      // 1. Try to get from Profile first
      try {
        const email = nextAuthSession?.user?.email;
        if (email) {
          const response = await fetch(`/api/user/get-profile?email=${email}`);
          const result = await response.json();
          if (result.success && result.profile?.latitude) {
            setUserLocation({ 
              lat: parseFloat(result.profile.latitude), 
              lng: parseFloat(result.profile.longitude) 
            });
            return; // Found in profile, we're good
          }
        }
      } catch (err) {
        console.error("Error fetching profile location:", err);
      }

      // 2. Fallback to Browser Geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (err) => console.log("Browser geolocation denied or failed", err),
          { timeout: 5000 }
        );
      }
    };
    fetchUserLocation();
  }, [nextAuthSession]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const gymsWithDistance = gyms.map(gym => ({
    ...gym,
    calculatedDistance: (userLocation && gym.lat && gym.lng)
      ? calculateDistance(userLocation.lat, userLocation.lng, gym.lat, gym.lng)
      : null
  }));

  const filteredGyms = gymsWithDistance.filter(gym => {
    // Distance Filter
    if (activeDistance !== "all") {
      const maxDistance = parseInt(activeDistance);
      if (!gym.calculatedDistance || gym.calculatedDistance > maxDistance) return false;
    }

    // Name Search
    if (searchQuery && !gym.name.toLowerCase().includes(searchQuery.toLowerCase()) && !gym.location.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Amenities Filter
    if (activeAmenities.length > 0) {
      const gymAmenities = gym.amenities || [];
      if (!activeAmenities.every(a => gymAmenities.includes(a))) return false;
    }

    return true;
  }).sort((a, b) => (a.calculatedDistance || Infinity) - (b.calculatedDistance || Infinity));

  const toggleAmenity = (amenity: string) => {
    setActiveAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity) 
        : [...prev, amenity]
    );
  };

  return (
    <div className="min-h-screen pt-52 pb-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search by gym name or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-3xl border border-gray-100 outline-none focus:border-primary focus:shadow-lg focus:shadow-primary/5 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <aside className="w-full lg:w-64 space-y-8 lg:sticky lg:top-36">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-secondary uppercase tracking-tighter italic">Filters</h3>
              </div>

              <div className="mb-8">
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 block">Distance</label>
                <div className="grid grid-cols-2 gap-2">
                  {["1km", "3km", "5km", "10km"].map((dist) => (
                    <button 
                      key={dist}
                      onClick={() => setActiveDistance(activeDistance === dist ? "all" : dist)}
                      className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                        activeDistance === dist 
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                        : "bg-white text-gray-400 border-gray-100 hover:border-primary/30"
                      }`}
                    >
                      {dist}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4 block">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {filters.amenities.map((a) => (
                    <button
                      key={a}
                      onClick={() => toggleAmenity(a)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        activeAmenities.includes(a)
                          ? "bg-secondary text-white border-secondary"
                          : "bg-white border-gray-100 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Find Nearby Gyms Button */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <button
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                          setActiveDistance("20km"); // show all gyms within 20km
                        },
                        () => alert("Location access denied. Please allow location access to find nearby gyms.")
                      );
                    } else {
                      alert("Geolocation is not supported by your browser.");
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-secondary text-white rounded-2xl font-black text-xs hover:bg-primary transition-all shadow-lg shadow-secondary/10"
                >
                  <Navigation className="w-4 h-4" />
                  Find Nearby Gyms
                </button>
                {userLocation && (
                  <p className="text-[10px] text-green-600 font-bold text-center mt-2">
                    ✓ Showing gyms within 20km, sorted by distance
                  </p>
                )}
              </div>
            </div>

          </aside>

          <main className="flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGyms.length > 0 ? filteredGyms.map((gym) => (
                    <div key={gym.id} className="relative group bg-white rounded-[40px] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-black/5 transition-all duration-500 flex flex-col">
                      <Link href={`/gym/${gym.id}`} className="block">
                        <div className="relative h-64 overflow-hidden">
                          <img 
                            src={gym.image} 
                            alt={gym.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                          
                          <div className="absolute top-5 left-5 flex flex-col gap-2 z-10">
                            <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-2xl text-[10px] font-black text-secondary shadow-sm self-start">
                              ₹{gym.price_per_day} / DAY
                            </span>
                            {gym.calculatedDistance && (
                              <span className="px-4 py-2 bg-primary text-white rounded-2xl text-[10px] font-black flex items-center shadow-lg shadow-primary/20 self-start">
                                <Navigation className="w-3 h-3 mr-1.5" />
                                {gym.calculatedDistance.toFixed(1)} KM AWAY
                              </span>
                            )}
                          </div>
                          <div className="absolute top-5 right-5">
                            <span className="px-4 py-2 bg-green-500 text-white rounded-2xl text-[10px] font-black shadow-lg shadow-green-500/20">
                              OPEN
                            </span>
                          </div>
                        </div>
                        <div className="p-8 pb-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-black text-secondary tracking-tighter leading-none">{gym.name}</h3>
                                {gym.has_offer && (
                                  <div className="bg-secondary text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-lg shadow-secondary/10 flex items-center space-x-1 animate-pulse shrink-0">
                                    <Percent className="w-2.5 h-2.5" />
                                    <span className="uppercase tracking-widest">{gym.offer_percentage}% OFF</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center text-gray-400 text-xs font-medium">
                                <MapPin className="w-3 h-3 mr-1" />
                                {gym.location}
                              </div>
                            </div>
                            <div className="flex items-center bg-orange-50 px-3 py-1.5 rounded-xl">
                              <Star className="w-3 h-3 text-orange-500 fill-orange-500 mr-1" />
                              <span className="text-xs font-black text-orange-600">{gym.rating}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {gym.tags?.map((tag: string, i: number) => (
                              <span key={i} className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-gray-400 rounded-lg">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </Link>
                      
                      <div className="p-8 pt-0 mt-auto">
                        <button 
                          onClick={() => {
                            setSelectedBookingGym(gym);
                            setIsBookingModalOpen(true);
                          }}
                          className="w-full py-4 bg-secondary text-white rounded-2xl font-black text-xs hover:bg-primary transition-all shadow-xl shadow-secondary/10"
                        >
                          BUY NOW
                        </button>
                      </div>
                    </div>
                  )) : (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                       <Search className="w-10 h-10 text-gray-200" />
                    </div>
                    <h3 className="text-xl font-black text-secondary">No Gyms Found</h3>
                    <p className="text-gray-400 text-sm max-w-xs">
                      {activeDistance !== "all" && !userLocation 
                        ? "We need your location to show gyms within a specific distance." 
                        : "We couldn't find any gyms matching your criteria. Try adjusting your filters."}
                    </p>
                    {activeDistance !== "all" && !userLocation && (
                      <button 
                        onClick={() => {
                          if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                              setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                            });
                          }
                        }}
                        className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20"
                      >
                        Share My Location
                      </button>
                    )}
                  </div>
                )}
            </div>
          </main>
        </div>
      </div>

      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        gym={selectedBookingGym}
      />
    </div>
  );
}
