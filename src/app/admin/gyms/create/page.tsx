"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Dumbbell, MapPin, DollarSign, Mail, Lock, AlignLeft, Plus, X, Image as ImageIcon, Percent, Star } from "lucide-react";
import { createGymAndPartner, getCoordinatesFromGoogle, getGlobalAmenities, deleteGlobalAmenity } from "@/actions/gymActions";

export default function CreateGymPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState("");
  const [defaultAmenitiesList, setDefaultAmenitiesList] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locating, setLocating] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  React.useEffect(() => {
    async function fetchAmenities() {
      const data = await getGlobalAmenities();
      setDefaultAmenitiesList(data.map((a: any) => a.name));
    }
    fetchAmenities();
  }, []);

  const handleGlobalAmenityDelete = async (amenityName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm(`Are you sure you want to permanently delete "${amenityName}" from the global system?`)) {
      const result = await deleteGlobalAmenity(amenityName);
      if (result.success) {
        setDefaultAmenitiesList(prev => prev.filter(a => a !== amenityName));
      } else {
        alert(result.error || "Failed to delete amenity");
      }
    }
  };

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
  React.useEffect(() => {
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
          // Optional: You could show a toast or small error text here
        }
        setLookupLoading(false);
      }
    };

    const timer = setTimeout(lookupLocation, 1000); // Debounce
    return () => clearTimeout(timer);
  }, [location]);
  
  const [primaryImagePreview, setPrimaryImagePreview] = useState<string | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<{file: File, url: string}[]>([]);
  const [plans, setPlans] = useState([
    { name: "Daily Pass", price: "99" },
    { name: "Weekly Pass", price: "499" },
    { name: "10-Day Pack", price: "699" },
    { name: "Monthly", price: "1499" },
    { name: "Yearly", price: "9999" }
  ]);

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

  const handlePrimaryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPrimaryImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        url: URL.createObjectURL(file)
      }));
      setGalleryPreviews([...galleryPreviews, ...newFiles]);
    }
    // Clear the input so the same files can be selected again if needed
    e.target.value = '';
  };

  const removeGalleryPreview = (indexToRemove: number) => {
    setGalleryPreviews(galleryPreviews.filter((_, index) => index !== indexToRemove));
  };

  const handleAddCustomAmenity = () => {
    if (newAmenity.trim() && !customAmenities.includes(newAmenity.trim())) {
      setCustomAmenities([...customAmenities, newAmenity.trim()]);
      setNewAmenity("");
    }
  };

  const handleRemoveCustomAmenity = (amenityToRemove: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCustomAmenities(customAmenities.filter(a => a !== amenityToRemove));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    // Append the gallery files that are in our state to the form data
    // because standard file inputs lose their selected files if manipulated
    formData.delete("galleryImages"); // Remove any standard ones
    galleryPreviews.forEach((preview) => {
      formData.append("galleryImages", preview.file);
    });

    // Server action
    const result = await createGymAndPartner(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/admin/gyms");
    }
  };

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
          <h1 className="text-2xl font-black text-secondary">Onboard New Gym</h1>
          <p className="text-gray-500 mt-1">Create a gym listing and generate partner credentials.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Gym Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-secondary">Gym Profile</h2>
            <p className="text-sm text-gray-500">Public information displayed to users.</p>
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
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="e.g. Titan Fitness"
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
                    defaultValue="10"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="e.g. 10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Latitude */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Latitude (e.g. 17.3850)</label>
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
                    placeholder={lookupLoading ? "Searching..." : "17.3850"}
                  />
                </div>
              </div>

              {/* Longitude */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Longitude (e.g. 78.4867)</label>
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
                    placeholder={lookupLoading ? "Searching..." : "78.4867"}
                  />
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Starting Rating (e.g. 4.5)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Star className="h-5 w-5 text-yellow-500" />
                  </div>
                  <input
                    name="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    defaultValue="4.5"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Reviews */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Initial Review Count</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <AlignLeft className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="reviews"
                    type="number"
                    min="0"
                    defaultValue="0"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>
            </div>

              {/* Location Address */}
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

            {/* Pricing Plans */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-700">Pricing Plans (₹)</h3>
                  <p className="text-xs text-gray-500">Set the custom price for each pass at this gym.</p>
                </div>
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
                  rows={8}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Describe the gym facilities and atmosphere..."
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-700">Images</h3>
                <p className="text-xs text-gray-500">Upload high-quality images for the gym.</p>
              </div>
              
              <div className="space-y-4">
                {/* Primary Image */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600">Primary Cover Image</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ImageIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      name="primaryImage"
                      type="file"
                      accept="image/*"
                      required
                      onChange={handlePrimaryImageChange}
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                  </div>
                  {primaryImagePreview && (
                    <div className="mt-2 relative rounded-xl overflow-hidden border border-gray-200 aspect-video max-w-sm bg-gray-100">
                      <img src={primaryImagePreview} alt="Primary preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Gallery Images */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-600">Gallery Images</label>
                  
                  {galleryPreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      {galleryPreviews.map((preview, index) => (
                        <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-100">
                          <img src={preview.url} alt={`Gallery preview ${index}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeGalleryPreview(index)}
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
                <p className="text-xs text-gray-500">Select all the facilities available at this gym.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {defaultAmenitiesList.map((amenity) => (
                  <label key={amenity} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors group has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                    <div className="flex items-center space-x-3">
                      <input 
                        type="checkbox" 
                        name="amenities" 
                        value={amenity}
                        className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-2"
                      />
                      <span className="text-sm font-medium text-gray-700 group-has-[:checked]:text-primary">{amenity}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleGlobalAmenityDelete(amenity, e)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
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

        {/* Section 2: Partner Credentials */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-secondary">Partner Credentials</h2>
            <p className="text-sm text-gray-500">The login details for the gym owner to access their Partner Dashboard.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Partner Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="partnerEmail"
                    type="email"
                    required
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="partner@gym.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Temporary Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="partnerPassword"
                    type="password"
                    required
                    minLength={6}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="••••••••"
                  />
                </div>
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
              <span>Create Gym & Partner</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
