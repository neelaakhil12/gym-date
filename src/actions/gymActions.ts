"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendPartnerWelcomeEmail } from "./emailActions";
import bcrypt from "bcryptjs";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function uploadImage(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  try {
    // Save to the persistent directory handled by Nginx
    const uploadDir = '/var/www/gymdate_uploads/gyms';
    await mkdir(uploadDir, { recursive: true });
    
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    // Return the URL that Nginx will serve
    return `/uploads/gyms/${fileName}`;
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

    // 1. Hash password and create user in Postgres
    let partnerId: string;
    const hashedPassword = await bcrypt.hash(partnerPassword, 10);
    
    const checkUser = await query("SELECT id FROM users WHERE email = $1", [partnerEmail]);
    if (checkUser.rows.length > 0) {
      partnerId = checkUser.rows[0].id;
      // Ensure they have the partner role
      await query("UPDATE users SET role_id = 'partner' WHERE id = $1", [partnerId]);
    } else {
      // It's safe to add a 'password' column if it doesn't exist, we'll try updating, if error we'll add it later
      // But actually we should just insert to users
      const insertUser = await query(
        "INSERT INTO users (email, role_id) VALUES ($1, 'partner') RETURNING id",
        [partnerEmail]
      );
      partnerId = insertUser.rows[0].id;
    }

    // 2. Upload Images
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

    // 3. Create the gym
    const latStr = formData.get("lat") as string;
    const lngStr = formData.get("lng") as string;
    const lat = latStr && !isNaN(parseFloat(latStr)) ? parseFloat(latStr) : null;
    const lng = lngStr && !isNaN(parseFloat(lngStr)) ? parseFloat(lngStr) : null;

    const gymInsert = await query(
      `INSERT INTO gyms 
       (partner_id, name, location, price_per_day, description, amenities, image, gallery, status, rating, reviews, lat, lng) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Open', 0, 0, $9, $10) RETURNING id`,
      [
        partnerId, gymName, location, planPrices[0] ? parseFloat(planPrices[0]) : 99,
        description, amenities, primaryImageUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48",
        galleryUrls.length > 0 ? galleryUrls : [primaryImageUrl || "https://images.unsplash.com/photo-1534438327276"],
        lat, lng
      ]
    );

    const gymId = gymInsert.rows[0].id;

    // 4. Create pricing plans
    for (let idx = 0; idx < planNames.length; idx++) {
      await query(
        "INSERT INTO pricing_plans (gym_id, name, price, features, button_text, popular) VALUES ($1, $2, $3, $4, 'Book Now', $5)",
        [
          gymId, planNames[idx], 
          planPrices[idx].startsWith('₹') ? planPrices[idx] : `₹${planPrices[idx]}`,
          ["Access to Gym", "Locker Access", "Basic Amenities"],
          idx === 2
        ]
      );
    }

    revalidatePath("/admin/gyms");

    // 5. Send welcome email to partner (non-blocking)
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
    // Requires a partner_requests table
    await query(
      "INSERT INTO partner_requests (gym_name, owner_name, email, phone, city, address) VALUES ($1, $2, $3, $4, $5, $6)",
      [data.gymName, data.ownerName, data.email, data.phone, data.city, data.address]
    );
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
    
    const existingPrimaryImage = formData.get("existingPrimaryImage") as string;
    const primaryImageFile = formData.get("primaryImage") as File;
    const existingGalleryUrls = formData.getAll("existingGalleryUrls") as string[];
    const newGalleryImageFiles = formData.getAll("galleryImages") as File[];
    
    const planNames = formData.getAll("planNames") as string[];
    const planPrices = formData.getAll("planPrices") as string[];

    if (!gymId || !gymName || !location) {
      return { error: "Missing required fields." };
    }

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

    const latStr = formData.get("lat") as string;
    const lngStr = formData.get("lng") as string;
    const lat = latStr && !isNaN(parseFloat(latStr)) ? parseFloat(latStr) : null;
    const lng = lngStr && !isNaN(parseFloat(lngStr)) ? parseFloat(lngStr) : null;

    await query(
      "UPDATE gyms SET name = $1, location = $2, price_per_day = $3, description = $4, amenities = $5, image = $6, gallery = $7, lat = $8, lng = $9 WHERE id = $10",
      [
        gymName, location, planPrices[0] ? parseFloat(planPrices[0]) : 99,
        description, amenities, finalPrimaryImageUrl, finalGalleryUrls, lat, lng, gymId
      ]
    );

    await query("DELETE FROM pricing_plans WHERE gym_id = $1", [gymId]);

    for (let idx = 0; idx < planNames.length; idx++) {
      await query(
        "INSERT INTO pricing_plans (gym_id, name, price, features, button_text, popular) VALUES ($1, $2, $3, $4, 'Book Now', $5)",
        [
          gymId, planNames[idx], 
          planPrices[idx].startsWith('₹') ? planPrices[idx] : `₹${planPrices[idx]}`,
          ["Access to Gym", "Locker Access", "Basic Amenities"],
          idx === 2
        ]
      );
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
    
    const gymResult = await query("SELECT partner_id FROM gyms WHERE id = $1", [gymId]);
    if (gymResult.rows.length === 0) return { error: "Gym not found." };
    
    const partnerId = gymResult.rows[0].partner_id;

    await query("DELETE FROM gyms WHERE id = $1", [gymId]);

    if (partnerId) {
      await query("DELETE FROM users WHERE id = $1", [partnerId]);
    }
    
    revalidatePath("/admin/gyms");
    revalidatePath("/explore");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteGym process:", err);
    return { error: "Failed to permanently remove the gym and partner." };
  }
}

export async function updateGymStatus(gymId: string, status: string) {
  try {
    await query("UPDATE gyms SET status = $1 WHERE id = $2", [status, gymId]);
    revalidatePath("/explore");
    revalidatePath(`/gym/${gymId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error updating gym status:", err);
    return { error: "Failed to update gym status." };
  }
}

export async function updateGymOffer(gymId: string, hasOffer: boolean, offerPercentage: number) {
  try {
    // Requires has_offer and offer_percentage columns on gyms table
    await query("UPDATE gyms SET has_offer = $1, offer_percentage = $2 WHERE id = $3", [hasOffer, offerPercentage, gymId]);
    revalidatePath("/explore");
    revalidatePath(`/gym/${gymId}`);
    return { success: true };
  } catch (err: any) {
    console.error("Error updating gym offer:", err);
    return { error: "Failed to update gym offer." };
  }
}

export async function getGlobalAmenities() {
  try {
    const { query } = require('@/lib/db');
    const result = await query('SELECT name FROM amenities ORDER BY name');
    return result.rows.length > 0 ? result.rows : [
      { name: 'Cardio Equipment' }, { name: 'Free Weights' }, { name: 'AC' },
      { name: 'Parking' }, { name: 'Locker Room' }, { name: 'Showers' },
      { name: 'Personal Training' }, { name: 'Water Cooler' }
    ];
  } catch (err) {
    return [
      { name: 'Cardio Equipment' }, { name: 'Free Weights' }, { name: 'AC' },
      { name: 'Parking' }, { name: 'Locker Room' }, { name: 'Showers' },
      { name: 'Personal Training' }, { name: 'Water Cooler' }
    ];
  }
}

export async function getCoordinatesFromGoogle(locationStr: string): Promise<{ success: boolean; lat?: number; lng?: number; error?: string; }> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('SERVER ACTION: Google Maps API key is missing.');
      return { success: false, error: 'Google Maps API key is missing.' };
    }

    console.log('SERVER ACTION: Fetching coordinates for:', locationStr);

    let query = locationStr.trim();

    // 1. Handle short links (goo.gl, maps.app.goo.gl)
    if (query.includes('goo.gl') || query.includes('maps.app.goo.gl')) {
      try {
        console.log('SERVER ACTION: Resolving short link...');
        const resolveResponse = await fetch(query, { 
          method: 'HEAD', 
          redirect: 'follow',
          headers: { 'User-Agent': 'Mozilla/5.0' } 
        });
        if (resolveResponse.url) {
          query = resolveResponse.url;
          console.log('SERVER ACTION: Resolved to:', query);
        }
      } catch (e) {
        console.error('SERVER ACTION: Failed to resolve short link:', e);
      }
    }

    // 2. Try various regex patterns to extract coordinates from the URL
    
    // Pattern A: standard @lat,lng format
    const coordMatch = query.match(/@([-+]?\d+\.\d+),([-+]?\d+\.\d+)/);
    if (coordMatch) {
      console.log('SERVER ACTION: Extracted coordinates from @lat,lng regex');
      return { success: true, lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
    }

    // Pattern B: directions destination !3d and !4d tags
    const destinationMatch = query.match(/!3d([-+]?\d+\.\d+)!4d([-+]?\d+\.\d+)/);
    if (destinationMatch) {
      console.log('SERVER ACTION: Extracted destination coordinates from !3d,!4d regex');
      return { success: true, lat: parseFloat(destinationMatch[1]), lng: parseFloat(destinationMatch[2]) };
    }

    // Pattern C: /place/lat,lng format
    const placeMatch = query.match(/\/place\/([-+]?\d+\.\d+),([-+]?\d+\.\d+)/);
    if (placeMatch) {
      console.log('SERVER ACTION: Extracted coordinates from /place/lat,lng regex');
      return { success: true, lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
    }

    // Pattern D: raw lat,lng in the query string
    const rawMatch = query.match(/query=([-+]?\d+\.\d+),([-+]?\d+\.\d+)/);
    if (rawMatch) {
      console.log('SERVER ACTION: Extracted coordinates from query=lat,lng regex');
      return { success: true, lat: parseFloat(rawMatch[1]), lng: parseFloat(rawMatch[2]) };
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`
    );

    const data = await response.json();
    console.log('SERVER ACTION: Google API status:', data.status);

    if (data.status === 'OK' && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      console.log('SERVER ACTION: Found coordinates:', lat, lng);
      return { success: true, lat, lng };
    }

    if (data.status === 'ZERO_RESULTS') {
      return { success: false, error: 'Google could not find this location. Try entering the city name instead.' };
    }

    return { success: false, error: data.error_message || data.status || 'Location not found.' };
  } catch (error: any) {
    console.error("Geocoding Error:", error);
    return { success: false, error: error.message || 'Failed to connect to Google Maps API.' };
  }
}


export async function deleteGlobalAmenity(name: string) {
  try {
    // We use the 'query' imported at the top of the file
    await query('DELETE FROM amenities WHERE name = $1', [name]);
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting amenity:", err);
    return { error: "Failed to delete amenity." };
  }
}
