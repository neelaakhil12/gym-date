"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { sendPartnerWelcomeEmail } from "./emailActions";

// Initialize the Supabase Admin Client using the Service Role Key
// This client bypasses RLS and can securely create users
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper to upload a File to Supabase Storage and get public URL
async function uploadImage(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `gyms/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("gym-images")
      .upload(filePath, file);

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return null;
    }

    const { data } = supabaseAdmin.storage.from("gym-images").getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
}

export async function createGymAndPartner(formData: FormData) {
  try {
    const gymName = formData.get("name") as string;
    const location = formData.get("location") as string;
    const description = formData.get("description") as string;
    const amenities = formData.getAll("amenities") as string[];
    
    // File uploads
    const primaryImageFile = formData.get("primaryImage") as File;
    const galleryImageFiles = formData.getAll("galleryImages") as File[];
    
    const planNames = formData.getAll("planNames") as string[];
    const planPrices = formData.getAll("planPrices") as string[];
    const commissionRate = formData.get("commissionRate") as string;
    
    const partnerEmail = formData.get("partnerEmail") as string;
    const partnerPassword = formData.get("partnerPassword") as string;

    if (!gymName || !location || !partnerEmail || !partnerPassword) {
      return { error: "Missing required fields." };
    }

    // 1. Securely create the user in auth.users
    let partnerId: string;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: partnerEmail,
      password: partnerPassword,
      email_confirm: true, // Auto-confirm the email
    });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        // User already exists, let's find their ID from profiles
        const { data: existingProfile, error: fetchError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", partnerEmail)
          .single();
        
        if (fetchError || !existingProfile) {
          console.error("User exists in auth but not in profiles:", fetchError);
          return { error: "Partner email is already registered, but profile could not be found." };
        }
        partnerId = existingProfile.id;
      } else {
        console.error("Auth creation error:", authError);
        return { error: `Failed to create partner account: ${authError.message}` };
      }
    } else {
      partnerId = authData.user.id;
    }

    // 2. Ensure the profile exists and has the 'partner' role
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: partnerId,
        email: partnerEmail,
        role_id: "partner",
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      return { error: "Failed to assign partner role." };
    }

    // 3. Upload Images
    let primaryImageUrl = null;
    if (primaryImageFile && primaryImageFile.size > 0) {
      primaryImageUrl = await uploadImage(primaryImageFile);
    }

    const galleryUrls: string[] = [];
    for (const file of galleryImageFiles) {
      if (file && file.size > 0) {
        const url = await uploadImage(file);
        if (url) galleryUrls.push(url);
      }
    }

    // 4. Create the gym linked to the new partner
    const { data: gymData, error: gymError } = await supabaseAdmin
      .from("gyms")
      .insert({
        partner_id: partnerId,
        name: gymName,
        location: location,
        price_per_day: planPrices[0] ? parseFloat(planPrices[0]) : 99,
        description: description,
        amenities: amenities,
        image: primaryImageUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800", // Fallback
        gallery: galleryUrls.length > 0 ? galleryUrls : [primaryImageUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800"],
        status: "Open", // Automatically open for simplicity
        commission_rate: commissionRate ? parseFloat(commissionRate) : 10,
        rating: 0,
        reviews: 0,
        lat: formData.get("lat") && !isNaN(parseFloat(formData.get("lat") as string)) ? parseFloat(formData.get("lat") as string) : null,
        lng: formData.get("lng") && !isNaN(parseFloat(formData.get("lng") as string)) ? parseFloat(formData.get("lng") as string) : null
      })
      .select("id")
      .single();

    if (gymError || !gymData) {
      console.error("Gym creation error:", gymError);
      return { error: "Partner account created, but failed to create the gym." };
    }

    const gymId = gymData.id;

    // 5. Create the specific pricing plans for this gym
    const plansToInsert = planNames.map((name, idx) => ({
      gym_id: gymId,
      name: name,
      price: planPrices[idx].startsWith('₹') ? planPrices[idx] : `₹${planPrices[idx]}`,
      features: ["Access to Gym", "Locker Access", "Basic Amenities"],
      button_text: "Book Now",
      popular: idx === 2 // Keep 3rd one popular by default
    }));

    const { error: plansError } = await supabaseAdmin
      .from("pricing_plans")
      .insert(plansToInsert);

    if (plansError) {
      console.error("Pricing plans creation error:", plansError);
      return { error: "Gym created, but failed to attach custom pricing plans." };
    }

    revalidatePath("/admin/gyms");

    // 6. Send welcome email to partner (non-blocking)
    sendPartnerWelcomeEmail(partnerEmail, gymName, partnerPassword).catch(err => {
      console.error("Delayed welcome email error:", err);
    });

    return { success: true };
    
  } catch (err: any) {
    console.error("Unexpected error in createGymAndPartner:", err);
    return { error: "An unexpected error occurred." };
  }
}

export async function registerPartnerRequest(data: {
  gymName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
}) {
  try {
    const { error } = await supabaseAdmin
      .from("partner_requests")
      .insert([data]);

    if (error) {
      console.error("Partner request error:", error);
      return { error: "Failed to submit request. Please try again." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in registerPartnerRequest:", error);
    return { error: "An unexpected error occurred." };
  }
}

export async function updateGym(gymId: string, formData: FormData) {
  try {
    const gymName = formData.get("name") as string;
    const location = formData.get("location") as string;
    const description = formData.get("description") as string;
    const amenities = formData.getAll("amenities") as string[];
    
    // Existing vs New File uploads
    const existingPrimaryImage = formData.get("existingPrimaryImage") as string;
    const primaryImageFile = formData.get("primaryImage") as File;
    const existingGalleryUrls = formData.getAll("existingGalleryUrls") as string[];
    const newGalleryImageFiles = formData.getAll("galleryImages") as File[];
    
    const planNames = formData.getAll("planNames") as string[];
    const planPrices = formData.getAll("planPrices") as string[];
    const commissionRate = formData.get("commissionRate") as string;

    if (!gymId || !gymName || !location) {
      return { error: "Missing required fields." };
    }

    // 1. Upload new images if they exist
    let finalPrimaryImageUrl = existingPrimaryImage;
    if (primaryImageFile && primaryImageFile.size > 0) {
      const uploadedUrl = await uploadImage(primaryImageFile);
      if (uploadedUrl) finalPrimaryImageUrl = uploadedUrl;
    }

    const finalGalleryUrls = [...existingGalleryUrls];
    for (const file of newGalleryImageFiles) {
      if (file && file.size > 0) {
        const url = await uploadImage(file);
        if (url) finalGalleryUrls.push(url);
      }
    }

    // 2. Update the gym
    const { error: gymError } = await supabaseAdmin
      .from("gyms")
      .update({
        name: gymName,
        location: location,
        price_per_day: planPrices[0] ? parseFloat(planPrices[0]) : 99,
        description: description,
        amenities: amenities,
        image: finalPrimaryImageUrl,
        gallery: finalGalleryUrls,
        commission_rate: commissionRate ? parseFloat(commissionRate) : 10,
        lat: formData.get("lat") && !isNaN(parseFloat(formData.get("lat") as string)) ? parseFloat(formData.get("lat") as string) : null,
        lng: formData.get("lng") && !isNaN(parseFloat(formData.get("lng") as string)) ? parseFloat(formData.get("lng") as string) : null
      })
      .eq("id", gymId);

    if (gymError) {
      console.error("Gym update error:", gymError);
      return { error: "Failed to update the gym." };
    }

    // 3. Clear old pricing plans for this gym
    await supabaseAdmin.from("pricing_plans").delete().eq("gym_id", gymId);

    // 4. Insert the new pricing plans
    const plansToInsert = planNames.map((name, idx) => ({
      gym_id: gymId,
      name: name,
      price: planPrices[idx].startsWith('₹') ? planPrices[idx] : `₹${planPrices[idx]}`,
      features: ["Access to Gym", "Locker Access", "Basic Amenities"],
      button_text: "Book Now",
      popular: idx === 2
    }));

    const { error: plansError } = await supabaseAdmin
      .from("pricing_plans")
      .insert(plansToInsert);

    if (plansError) {
      console.error("Pricing plans update error:", plansError);
      return { error: "Gym updated, but failed to update pricing plans." };
    }

    revalidatePath("/admin/gyms");
    return { success: true };
    
  } catch (err: any) {
    console.error("Unexpected error in updateGym:", err);
    return { error: "An unexpected error occurred." };
  }
}

export async function deleteGym(gymId: string) {
  try {
    if (!gymId) return { error: "No gym ID provided." };
    
    // 1. Get the partner_id before deleting the gym
    const { data: gym, error: fetchError } = await supabaseAdmin
      .from("gyms")
      .select("partner_id")
      .eq("id", gymId)
      .single();
    
    if (fetchError || !gym) {
      console.error("Error fetching gym for deletion:", fetchError);
      return { error: "Gym not found." };
    }
    
    const partnerId = gym.partner_id;

    // 2. Delete the gym (cascading should handle pricing_plans)
    const { error: deleteGymError } = await supabaseAdmin
      .from("gyms")
      .delete()
      .eq("id", gymId);

    if (deleteGymError) {
      console.error("Error deleting gym:", deleteGymError);
      return { error: "Failed to delete the gym listing." };
    }

    // 3. Delete the partner user from auth.users (this will cascade to profiles)
    if (partnerId) {
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(partnerId);
      if (deleteUserError) {
        console.error("Error deleting partner user:", deleteUserError);
        // We don't return error here because the gym is already gone, 
        // but we log it for admin awareness.
      }
    }
    
    revalidatePath("/admin/gyms");
    revalidatePath("/explore");
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteGym process:", err);
    return { error: "Failed to permanently remove the gym and partner." };
  }
}

export async function updateGymStatus(gymId: string, status: string) {
  try {
    const { error } = await supabaseAdmin
      .from("gyms")
      .update({ status })
      .eq("id", gymId);

    if (error) throw error;
    
    revalidatePath("/explore");
    revalidatePath(`/gym/${gymId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error updating gym status:", err);
    return { error: "Failed to update gym status." };
  }
}

export async function getCoordinatesFromGoogle(input: string) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return { error: "Maps API key not configured." };

    let searchInput = input;

    // 1. If it's a short link, resolve it to get the full URL
    if (input.includes("goo.gl") || input.includes("maps.app.goo.gl") || input.includes("google.com/maps")) {
      try {
        let finalUrl = input;
        
        // Resolve short links
        if (input.includes("goo.gl")) {
          const res = await fetch(input, { 
            method: 'GET', 
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          finalUrl = res.url;
        }

        // Try multiple coordinate patterns
        // Pattern 1: @lat,lng (most common in web URLs)
        const atMatch = finalUrl.match(/@([-+]?\d+\.\d+),([-+]?\d+\.\d+)/);
        if (atMatch) {
          return { success: true, lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
        }

        // Pattern 2: q=lat,lng (common in simple search links)
        const qMatch = finalUrl.match(/[?&]q=([-+]?\d+\.\d+),([-+]?\d+\.\d+)/);
        if (qMatch) {
          return { success: true, lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
        }

        // Pattern 3: ll=lat,lng (legacy links)
        const llMatch = finalUrl.match(/[?&]ll=([-+]?\d+\.\d+),([-+]?\d+\.\d+)/);
        if (llMatch) {
          return { success: true, lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
        }

        // If we have a resolved URL but no coordinates, try to extract the address part
        // E.g. https://www.google.com/maps/place/Address+Name/data=...
        const placeMatch = finalUrl.match(/\/place\/([^\/@?#]+)/);
        if (placeMatch) {
          searchInput = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
        } else {
          // Fallback 1: If it's a directions link, extract the destination (usually the second segment after /dir/)
          const dirMatch = finalUrl.match(/\/dir\/[^\/]+\/([^\/@?#]+)/);
          if (dirMatch) {
            searchInput = decodeURIComponent(dirMatch[1].replace(/\+/g, ' '));
          } else {
            // Fallback 2: If it's a search link, extract the search query
            const searchMatch = finalUrl.match(/\/search\/([^\/@?#]+)/);
            if (searchMatch) {
              searchInput = decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
            } else if (finalUrl.includes("google.com/maps")) {
               // If it's still a map URL but we can't find a place name, it's useless for geocoding
               return { error: "Could not extract location from this link. Please enter a full address or coordinates." };
            } else {
               searchInput = finalUrl;
            }
          }
        }
      } catch (err) {
        console.error("Error resolving map link:", err);
      }
    }

    // 2. Use Google Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchInput)}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { success: true, lat, lng };
    }
    
    return { error: `Google API Error: ${data.status}` };
  } catch (err) {
    console.error("Geocoding error:", err);
    return { error: "Location lookup failed." };
  }
}

export async function updateGymOffer(gymId: string, hasOffer: boolean, offerPercentage: number) {
  try {
    const { error } = await supabaseAdmin
      .from("gyms")
      .update({ 
        has_offer: hasOffer,
        offer_percentage: offerPercentage
      })
      .eq("id", gymId);

    if (error) throw error;
    
    revalidatePath("/explore");
    revalidatePath(`/gym/${gymId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error updating gym offer:", err);
    return { error: "Failed to update gym offer." };
  }
}
