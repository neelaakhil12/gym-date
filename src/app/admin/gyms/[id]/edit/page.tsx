"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Dumbbell, MapPin, DollarSign, AlignLeft, Plus, X, Image as ImageIcon, Percent } from "lucide-react";
import { updateGym, getCoordinatesFromGoogle, getGlobalAmenities } from "@/actions/gymActions";
import { supabase } from "@/lib/supabase";

export default function EditGymPage() {
  const router = useRouter();
  const params = useParams();
  const gymId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  // States to pre-fill
  const [gymName, setGymName] = useState("");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [description, setDescription] = useState("");
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");
  const [locating, setLocating] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
 
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLat(latitude.toString());
        setLng(longitude.toString());
        
        // Generate a standard Google Maps query URL
        const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setLocation(googleMapsUrl);
        setLocating(false);
      },
      (error) => {
        console.error(error);
        alert("Unable to retrieve your location. Please ensure GPS is enabled.");
        setLocating(false);
      }
    );
  };

  // Auto-parse coordinates from Google Maps URLs
  useEffect(() => {
    const lookupLocation = async () => {
      // If the location is cleared, clear the coordinates too
      if (!location) {
        setLat("");
        setLng("");
        return;
      }

      if (location.length < 5) return;

      // 1. First try simple regex for long URLs
      const genericMatch = location.match(/([-+]?\d+\.\d+),\s*([-+]?\d+\.\d+)/);
      if (genericMatch) {
        setLat(genericMatch[1]);
        setLng(genericMatch[2]);
        return;
      }

      // 2. If it's a short link or just text, ask Google
      if (location.includes("maps") || location.length > 10) {
        setLookupLoading(true);
        const result = await getCoordinatesFromGoogle(location);
        if (result.success && result.lat && result.lng) {
          setLat(result.lat.toString());
          setLng(result.lng.toString());
        } else if (result.error) {
          console.error("Location lookup error:", result.error);
        }
        setLookupLoading(false);
      }
    };

    const timer = setTimeout(lookupLocation, 1000); // Debounce
    return () => clearTimeout(timer);
  }, [location]);
  
  const [existingPrimaryImage, setExistingPrimaryImage] = useState<string>("");
  const [newPrimaryImagePreview, setNewPrimaryImagePreview] = useState<string | null>(null);
  
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<{file: File, url: string}[]>([]);
  
  const [plans, setPlans] = useState<{id?: string, name: string, price: string}[]>([]);

  const [defaultAmenitiesList, setDefaultAmenitiesList] = useState<string[]>([]);
  const [checkedDefaultAmenities, setCheckedDefaultAmenities] = useState<string[]>([]);

  useEffect(() => {
    async function loadGymData() {
      try {
        const { data: gym, error: gymError } = await supabase
          .from("gyms")
          .select("*")
          .eq("id", gymId)
          .single();

        if (gymError) throw gymError;

        setGymName(gym.name || "");
        setLocation(gym.location || "");
        setLat(gym.lat?.toString() || "");
        setLng(gym.lng?.toString() || "");
        setDescription(gym.description || "");
        setExistingPrimaryImage(gym.image || "");
        setExistingGalleryUrls(gym.gallery || []);

        // Fetch global amenities
        const globalAmenitiesData = await getGlobalAmenities();
        const globalNames = globalAmenitiesData.map((a: any) => a.name);
        setDefaultAmenitiesList(globalNames);

        // Split amenities into default and custom
        const dbAmenities = gym.amenities || [];
        const checkedDefaults = dbAmenities.filter((a: string) => globalNames.includes(a));
        const customs = dbAmenities.filter((a: string) => !globalNames.includes(a));
        
        setCheckedDefaultAmenities(checkedDefaults);
        setCustomAmenities(customs);
        setCommissionRate(gym.commission_rate?.toString() || "10");

        // Fetch pricing plans
        const { data: plans, error: plansError } = await supabase
          .from("pricing_plans")
          .select("*")
          .eq("gym_id", gymId);

        if (plansError) throw plansError;

        if (plans && plans.length > 0) {
          const formattedPlans = plans.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price.replace(/[^0-9]/g, '')
          }));
          setPlans(formattedPlans);
        } else {
          setPlans([
            { name: "Daily Pass", price: "" },
            { name: "Weekly Pass", price: "" },
            { name: "10-Day Pack", price: "" },
            { name: "Monthly", price: "" },
            { name: "Yearly", price: "" }
          ]);
        }

      } catch (err: any) {
        console.error(err);
        setError("Failed to load gym data.");
      } finally {
        setInitialLoading(false);
      }
    }
    loadGymData();
  }, [gymId]);

  const handleAddCustomAmenity = () => {
    if (newAmenity.trim() && !customAmenities.includes(newAmenity.trim()) && !defaultAmenitiesList.includes(newAmenity.trim())) {
      setCustomAmenities([...customAmenities, newAmenity.trim()]);
      setNewAmenity("");
    }
  };

  const handleRemoveCustomAmenity = (amenityToRemove: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCustomAmenities(customAmenities.filter(a => a !== amenityToRemove));
  };

  const handlePrimaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPrimaryImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        url: URL.createObjectURL(file)
      }));
      setNewGalleryPreviews([...newGalleryPreviews, ...newFiles]);
    }
    e.target.value = '';
  };

  const handleRemoveExistingGalleryUrl = (urlToRemove: string) => {
    setExistingGalleryUrls(existingGalleryUrls.filter(url => url !== urlToRemove));
  };

  const handleRemoveNewGalleryPreview = (indexToRemove: number) => {
    setNewGalleryPreviews(newGalleryPreviews.filter((_, index) => index !== indexToRemove));
  };

  const handleAddPlan = () => {
    setPlans([...plans, { name: "", price: "" }]);
  };

  const handleRemovePlan = (index: number) => {
    setPlans(plans.filter((_, i) => i !== index));
  };

  const handlePlanChange = (index: number, field: 'name' | 'price', value: string) => {
    const updatedPlans = [...plans];
    updatedPlans[index][field] = value;
    setPlans(updatedPlans);
  };

  const toggleDefaultAmenity = (amenity: string) => {
    if (checkedDefaultAmenities.includes(amenity)) {
      setCheckedDefaultAmenities(checkedDefaultAmenities.filter(a => a !== amenity));
    } else {
      setCheckedDefaultAmenities([...checkedDefaultAmenities, amenity]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    formData.delete("galleryImages");
    newGalleryPreviews.forEach((preview) => {
      formData.append("galleryImages", preview.file);
    });

    // Server action
    const result = await updateGym(gymId, formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/admin/gyms");
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex items-center space-x-4">
        <Link 
          href="/admin/gyms" 
          className="p-2 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-secondary">Edit Gym</h1>
          <p className="text-gray-500 mt-1">Update gym details, pricing, and images.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-secondary">Gym Profile</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Gym Name */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Gym Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Dumbbell className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="name"
                    required
                    value={gymName}
                    onChange={(e) => setGymName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Commission Rate */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Platform Commission (%)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Percent className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="commissionRate"
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="e.g. 10"
                  />
                </div>
              </div>

              {/* Latitude */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Latitude (e.g. 17.3132)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className={`h-5 w-5 ${lookupLoading ? "text-primary animate-pulse" : "text-gray-400"}`} />
                  </div>
                  <input
                    name="lat"
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder={lookupLoading ? "Searching..." : "17.3132"}
                  />
                </div>
              </div>

              {/* Longitude */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Longitude (e.g. 78.5455)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className={`h-5 w-5 ${lookupLoading ? "text-primary animate-pulse" : "text-gray-400"}`} />
                  </div>
                  <input
                    name="lng"
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder={lookupLoading ? "Searching..." : "78.5455"}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-gray-700">Location Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="location"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Paste Google Maps link or enter address"
                    className="w-full pl-11 pr-32 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={locating}
                    className="absolute inset-y-1.5 right-1.5 px-4 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    {locating ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <MapPin className="w-3 h-3" />
                        <span>Locate Me</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Pricing Plans */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-700">Pricing Plans (₹)</h3>
                <button
                  type="button"
                  onClick={handleAddPlan}
                  className="flex items-center space-x-1.5 text-xs font-bold text-primary hover:text-red-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Plan</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan, idx) => (
                  <div key={idx} className="flex items-start space-x-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 relative group">
                    <div className="flex-grow space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Plan Name</label>
                        <input
                          name="planNames"
                          required
                          value={plan.name}
                          onChange={(e) => handlePlanChange(idx, 'name', e.target.value)}
                          placeholder="e.g. Monthly Pass"
                          className="w-full px-0 bg-transparent border-none text-sm font-bold text-secondary focus:ring-0 placeholder:text-gray-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price (₹)</label>
                        <div className="flex items-center text-sm font-bold text-secondary">
                          <span className="mr-1">₹</span>
                          <input
                            name="planPrices"
                            type="number"
                            min="0"
                            required
                            value={plan.price}
                            onChange={(e) => handlePlanChange(idx, 'price', e.target.value)}
                            placeholder="0"
                            className="w-full bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePlan(idx)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Description / About</label>
              <div className="relative">
                <div className="absolute top-3 left-4 pointer-events-none">
                  <AlignLeft className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  name="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-700">Images</h3>
                <p className="text-xs text-gray-500">Upload new images to replace existing ones.</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600">Primary Cover Image</label>
                  
                  {/* Current Image Preview */}
                  {(newPrimaryImagePreview || existingPrimaryImage) && (
                    <div className="mb-3 relative rounded-xl overflow-hidden border border-gray-200 aspect-video max-w-sm bg-gray-100">
                      <img src={newPrimaryImagePreview || existingPrimaryImage} alt="Primary preview" className="w-full h-full object-cover" />
                      {!newPrimaryImagePreview && existingPrimaryImage && (
                        <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                          Current Image
                        </div>
                      )}
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ImageIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      name="primaryImage"
                      type="file"
                      accept="image/*"
                      onChange={handlePrimaryImageChange}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                  </div>
                  {/* Hidden field to keep track of the existing image if not replaced */}
                  <input type="hidden" name="existingPrimaryImage" value={existingPrimaryImage} />
                </div>

                <div className="space-y-2 pt-4">
                  <label className="text-xs font-bold text-gray-600">Gallery Images</label>
                  
                  {(existingGalleryUrls.length > 0 || newGalleryPreviews.length > 0) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      {/* Existing Gallery Images */}
                      {existingGalleryUrls.map((url, index) => (
                        <div key={`exist-${index}`} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                          <img src={url} alt="Gallery existing" className="w-full h-full object-cover opacity-90" />
                          <div className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                            Current
                          </div>
                          <input type="hidden" name="existingGalleryUrls" value={url} />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingGalleryUrl(url)}
                            className="absolute top-2 right-2 p-1 bg-white/90 rounded-md text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {/* New Gallery Images */}
                      {newGalleryPreviews.map((preview, index) => (
                        <div key={`new-${index}`} className="relative group rounded-xl overflow-hidden border border-primary/30 aspect-video bg-gray-100 shadow-sm">
                          <img src={preview.url} alt="Gallery new" className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 bg-primary text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider shadow-sm">
                            New
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveNewGalleryPreview(index)}
                            className="absolute top-2 right-2 p-1 bg-white/90 rounded-md text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Plus className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryChange}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-700">Amenities</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {defaultAmenitiesList.map((amenity) => (
                  <label key={amenity} className="flex items-center space-x-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors group has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <input 
                      type="checkbox" 
                      name="amenities" 
                      value={amenity}
                      checked={checkedDefaultAmenities.includes(amenity)}
                      onChange={() => toggleDefaultAmenity(amenity)}
                      className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <span className="text-sm font-medium text-gray-700 group-has-[:checked]:text-primary">{amenity}</span>
                  </label>
                ))}
                {customAmenities.map((amenity) => (
                  <label key={amenity} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors group has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        name="amenities" 
                        value={amenity}
                        defaultChecked
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700 group-has-[:checked]:text-primary">{amenity}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveCustomAmenity(amenity, e)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </label>
                ))}
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="text"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomAmenity();
                    }
                  }}
                  placeholder="Type a custom amenity..."
                  className="flex-1 max-w-xs px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddCustomAmenity}
                  className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-8 py-3.5 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-md disabled:opacity-70 flex items-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
