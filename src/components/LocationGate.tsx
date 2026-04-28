"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Crosshair, Search, Loader2, Navigation } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";

export default function LocationGate({ children }: { children: React.ReactNode }) {
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const checkLocation = async () => {
    try {
      // 1. Fast check: See if we recently verified this in this session
      const isVerified = localStorage.getItem('gymdate_location_verified');
      if (isVerified === 'true') {
        setShowModal(false);
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email || nextAuthSession?.user?.email;

      if (!userEmail) {
        setLoading(false);
        setShowModal(false);
        return;
      }

      // 2. Database check: Verify with the secure API
      const response = await fetch(`/api/user/get-profile?email=${userEmail}`);
      const result = await response.json();

      if (result.success && result.hasLocation) {
        localStorage.setItem('gymdate_location_verified', 'true');
        setShowModal(false);
      } else {
        setShowModal(true);
      }
    } catch (err) {
      console.error("Location check error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Safety fallback: Never keep the user on a white screen for more than 5 seconds
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    if (nextAuthStatus !== "loading") {
      checkLocation();
    }

    return () => clearTimeout(safetyTimer);
  }, [nextAuthSession, nextAuthStatus]);

  const handleGetLocation = () => {
    setLocating(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const email = nextAuthSession?.user?.email || (await supabase.auth.getSession()).data.session?.user?.email;
          
          // Reverse geocode to get a readable address
          let readableAddress = "Current Location";
          try {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
            const geoData = await geoRes.json();
            if (geoData.status === "OK" && geoData.results.length > 0) {
              readableAddress = geoData.results[0].formatted_address;
            }
          } catch (e) {
            console.error("Reverse geocoding failed:", e);
          }

          const response = await fetch('/api/user/sync-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              lat: latitude,
              lng: longitude,
              address: readableAddress
            }),
          });

          const result = await response.json();
          if (result.success) {
            localStorage.setItem('gymdate_location_verified', 'true');
            setShowModal(false);
            window.location.reload(); 
          } else {
            setError(result.error || "Failed to save location");
          }
        } catch (err: any) {
          setError("Network error. Please try again.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        let msg = "Please enable location access";
        if (err.code === 1) msg = "Location access denied. Please enable in settings.";
        if (err.code === 2) msg = "Location unavailable. Try searching manually.";
        if (err.code === 3) msg = "Request timed out. Try again or search manually.";
        setError(msg);
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleManualLocation = async (cityName: string) => {
    // Mock coordinates for major cities
    const cityCoords: any = {
      "hyderabad": { lat: 17.3850, lng: 78.4867 },
      "bangalore": { lat: 12.9716, lng: 77.5946 },
      "mumbai": { lat: 19.0760, lng: 72.8777 },
      "delhi": { lat: 28.6139, lng: 77.2090 },
    };

    const lowerCity = cityName.toLowerCase().trim();
    const coords = cityCoords[lowerCity] || { lat: 17.3850, lng: 78.4867 }; // Default to Hyd

    setLocating(true);
    try {
      const email = nextAuthSession?.user?.email || (await supabase.auth.getSession()).data.session?.user?.email;
      const response = await fetch('/api/user/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          lat: coords.lat,
          lng: coords.lng,
          address: cityName
        }),
      });

      const result = await response.json();
      if (result.success) {
        localStorage.setItem('gymdate_location_verified', 'true');
        setShowModal(false);
        window.location.reload();
      }
    } catch (err) {
      setError("Failed to save location");
    } finally {
      setLocating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-black text-secondary tracking-widest uppercase animate-pulse">Initializing GymDate...</p>
    </div>
  );

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-[200] bg-secondary/80 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-bounce">
                <MapPin className="w-10 h-10 text-primary" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-secondary tracking-tighter">Where are you?</h2>
                <p className="text-gray-400 text-sm font-medium">
                  We need your location to show you the best gyms near you. This is mandatory to ensure a great experience.
                </p>
              </div>

              <div className="w-full space-y-4 pt-4">
                <button
                  onClick={handleGetLocation}
                  disabled={locating}
                  className="w-full py-5 bg-primary text-white rounded-[24px] font-black flex items-center justify-center space-x-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70"
                >
                  {locating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Crosshair className="w-5 h-5" />
                  )}
                  <span>{locating ? "Locating..." : "Use Current Location"}</span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-100"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-4 text-gray-400 font-black tracking-widest">or</span>
                  </div>
                </div>

                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search your city (e.g. Hyderabad)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleManualLocation((e.target as HTMLInputElement).value);
                    }}
                    className="w-full pl-14 pr-5 py-5 rounded-[24px] bg-gray-50 border border-gray-100 outline-none focus:bg-white focus:border-primary transition-all font-bold"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                    <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-md">PRESS ENTER</span>
                  </div>
                </div>
                
                {error && (
                  <p className="text-red-500 text-xs font-bold bg-red-50 py-3 px-4 rounded-xl flex items-center justify-center space-x-2">
                    <Navigation className="w-4 h-4" />
                    <span>{error}</span>
                  </p>
                )}
              </div>

              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-4">
                🔒 Your location is safe and secure
              </p>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
