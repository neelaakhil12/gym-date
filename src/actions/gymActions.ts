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
    console.log(`UPLOADER: Ensuring directory exists: ${uploadDir}`);
    await mkdir(uploadDir, { recursive: true });
    
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    
    console.log(`UPLOADER: Writing file to: ${filePath}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    console.log(`UPLOADER: File written successfully: ${fileName}`);

    // Return the URL that Nginx will serve
    return `/uploads/gyms/${fileName}`;
  } catch (error) {
    console.error("UPLOADER ERROR:", error);
    return null;
  }
}

export async function createGymAndPartner(formData: FormData) {
  try {
    console.log("STARTING: createGymAndPartner");
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
    const partnerReferralAmount = parseFloat(formData.get("partnerReferralAmount") as string) || 100;

    console.log("Validating fields for:", gymName);
    if (!gymName || !location || !partnerEmail || !partnerPassword) {
      return { error: "Missing required fields." };
    }

    // 1. Hash password and create/update partner in users table (and partner_users)
    console.log("STEP 1: Creating/Updating Partner User:", partnerEmail);
    let partnerId: string;
    const hashedPassword = await bcrypt.hash(partnerPassword, 10);
    
    // Ensure partner_users table exists
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS partner_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          full_name VARCHAR(255),
          phone VARCHAR(20),
          password_hash VARCHAR(255),
          gym_id UUID,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (e) {}

    // First check/insert into users table (required by foreign key constraint gyms_partner_id_fkey)
    const checkUser = await query("SELECT id FROM users WHERE email = $1", [partnerEmail]);
    if (checkUser.rows.length > 0) {
      partnerId = checkUser.rows[0].id;
      await query("UPDATE users SET role_id = 'partner', full_name = COALESCE(full_name, $1) WHERE id = $2", [gymName, partnerId]);
    } else {
      const insertUser = await query(
        "INSERT INTO users (email, full_name, role_id) VALUES ($1, $2, 'partner') RETURNING id",
        [partnerEmail, gymName]
      );
      partnerId = insertUser.rows[0].id;
    }

    // Also mirror to partner_users for dedicated partner credentials
    try {
      await query(`
        INSERT INTO partner_users (id, email, full_name, password_hash)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO UPDATE
          SET password_hash = EXCLUDED.password_hash,
              full_name = EXCLUDED.full_name,
              updated_at = CURRENT_TIMESTAMP
      `, [partnerId, partnerEmail, gymName, hashedPassword]);
    } catch (e) {
      console.warn("partner_users mirror warning:", e);
    }

    // 2. Upload Images
    console.log("STEP 2: Uploading Images...");
    let primaryImageUrl = null;
    if (primaryImageFile && primaryImageFile.size > 0) {
      console.log("Uploading primary image:", primaryImageFile.name);
      primaryImageUrl = await uploadImage(primaryImageFile);
    }

    const galleryUrls: string[] = [];
    if (galleryImageFiles.length > 0) {
      console.log(`Uploading ${galleryImageFiles.length} gallery images...`);
      for (const file of galleryImageFiles) {
        if (file && file.size > 0) {
          const url = await uploadImage(file);
          if (url) galleryUrls.push(url);
        }
      }
    }

    // 2.5 Ensure gyms table has all required columns
    try {
      await query("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION");
      await query("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION");
      await query("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0");
      await query("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS reviews INTEGER DEFAULT 0");
      await query("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS has_offer BOOLEAN DEFAULT FALSE");
      await query("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS offer_percentage INTEGER DEFAULT 0");
      await query("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS partner_referral_amount DECIMAL(10,2) DEFAULT 100");
      await query("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 10");
      await query("ALTER TABLE gyms ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}'");
    } catch (e) {
      console.warn("Gym columns migration warning:", e);
    }

    const latStr = formData.get("lat") as string;
    const lngStr = formData.get("lng") as string;
    const lat = latStr && !isNaN(parseFloat(latStr)) ? parseFloat(latStr) : null;
    const lng = lngStr && !isNaN(parseFloat(lngStr)) ? parseFloat(lngStr) : null;

    const ratingStr = formData.get("rating") as string;
    const reviewsStr = formData.get("reviews") as string;
    const rating = ratingStr && !isNaN(parseFloat(ratingStr)) ? parseFloat(ratingStr) : 0.0;
    const reviews = reviewsStr && !isNaN(parseInt(reviewsStr)) ? parseInt(reviewsStr) : 0;
    const hasOffer = formData.get("hasOffer") === "true";
    const offerPercentage = parseInt(formData.get("offerPercentage") as string) || 0;

    // 3. Create the gym dynamically based on columns that exist in the gyms table
    console.log("STEP 3: Checking columns & inserting gym into Database...");
    const finalGallery = galleryUrls.length > 0 ? galleryUrls : [primaryImageUrl || "https://images.unsplash.com/photo-1534438327276"];
    
    // Check available columns in gyms table
    const columnsRes = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gyms'
    `);
    const availableCols = new Set((columnsRes.rows || []).map((r: any) => r.column_name.toLowerCase()));
    console.log("Available gyms columns:", Array.from(availableCols).join(", "));

    const colNames: string[] = ["partner_id", "name", "location", "price_per_day", "description", "amenities", "image", "status"];
    const values: any[] = [
      partnerId,
      gymName,
      location,
      planPrices[0] ? parseFloat(planPrices[0]) : 99,
      description,
      amenities,
      primaryImageUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48",
      'Open'
    ];

    if (availableCols.has("gallery")) {
      colNames.push("gallery");
      values.push(finalGallery);
    }
    if (availableCols.has("lat")) {
      colNames.push("lat");
      values.push(lat);
    }
    if (availableCols.has("lng")) {
      colNames.push("lng");
      values.push(lng);
    }
    if (availableCols.has("rating")) {
      colNames.push("rating");
      values.push(rating);
    }
    if (availableCols.has("reviews")) {
      colNames.push("reviews");
      values.push(reviews);
    }
    if (availableCols.has("has_offer")) {
      colNames.push("has_offer");
      values.push(hasOffer);
    }
    if (availableCols.has("offer_percentage")) {
      colNames.push("offer_percentage");
      values.push(offerPercentage);
    }
    if (availableCols.has("partner_referral_amount")) {
      colNames.push("partner_referral_amount");
      values.push(partnerReferralAmount);
    }
    if (availableCols.has("commission_rate")) {
      colNames.push("commission_rate");
      values.push(parseFloat(commissionRate) || 10);
    }

    const placeholders = colNames.map((col, idx) => col === "amenities" || col === "gallery" ? `$${idx + 1}::text[]` : `$${idx + 1}`).join(", ");
    const insertQuery = `INSERT INTO gyms (${colNames.join(", ")}) VALUES (${placeholders}) RETURNING id`;
    
    console.log("Executing insertQuery:", insertQuery);
    const gymInsert = await query(insertQuery, values);

    const gymId = gymInsert.rows[0].id;
    console.log("Gym created successfully with ID:", gymId);

    // 4. Create pricing plans
    console.log("STEP 4: Creating Pricing Plans...");
    for (let idx = 0; idx < planNames.length; idx++) {
      if (!planNames[idx] || !planPrices[idx]) continue;
      
      await query(
        "INSERT INTO pricing_plans (gym_id, name, price, features, button_text, popular) VALUES ($1, $2, $3, $4, 'Book Now', $5)",
        [
          gymId, planNames[idx], 
          planPrices[idx].toString().startsWith('₹') ? planPrices[idx] : `₹${planPrices[idx]}`,
          ["Access to Gym", "Locker Access", "Basic Amenities"],
          idx === 2
        ]
      );
    }

    revalidatePath("/superadmin/gyms");
    revalidatePath("/superadmin/dashboard");
    revalidatePath("/operation-admin/gyms");
    revalidatePath("/operation-admin/dashboard");
    revalidatePath("/explore");
    revalidatePath("/");

    // 5. Send welcome email to partner (non-blocking)
    console.log("STEP 5: Sending welcome email to:", partnerEmail);
    sendPartnerWelcomeEmail(partnerEmail, gymName, partnerPassword).catch(err => {
      console.error("Delayed welcome email error:", err);
    });

    console.log("COMPLETED: createGymAndPartner");
    return { success: true };
    
  } catch (err: any) {
    console.error("CRITICAL ERROR in createGymAndPartner:", err);
    return { error: `Server Error: ${err.message || "An unexpected error occurred."}` };
  }
}

export async function registerPartnerRequest(data: {
  gymName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  referredBy?: string;
}) {
  try {
    // 1. Try with referral info
    try {
      await query(
        "INSERT INTO partner_requests (gym_name, owner_name, email, phone, city, address, referred_by) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [data.gymName, data.ownerName, data.email, data.phone, data.city, data.address, data.referredBy || null]
      );
    } catch (dbErr: any) {
      // 2. Fallback: Try without referred_by if column doesn't exist
      if (dbErr.message?.includes("referred_by") || dbErr.message?.includes("does not exist")) {
        console.warn("Retrying registration without referred_by column...");
        await query(
          "INSERT INTO partner_requests (gym_name, owner_name, email, phone, city, address) VALUES ($1, $2, $3, $4, $5, $6)",
          [data.gymName, data.ownerName, data.email, data.phone, data.city, data.address]
        );
      } else {
        throw dbErr;
      }
    }
    
    revalidatePath("/admin/partner-requests");
    return { success: true };
  } catch (error: any) {
    console.error("Error in registerPartnerRequest:", error);
    return { error: `Database Error: ${error.message || "Unknown error"}` };
  }
}

export async function updateGym(gymId: string, formData: FormData) {
  try {
    const gymName = formData.get("name") as string;
    const location = formData.get("location") as string;
    const description = formData.get("description") as string;
    const amenitiesJson = formData.get("amenities_json") as string;
    let amenities: string[] = [];
    if (amenitiesJson) {
      try {
        amenities = JSON.parse(amenitiesJson);
      } catch (e) {
        amenities = formData.getAll("amenities") as string[];
      }
    } else {
      amenities = formData.getAll("amenities") as string[];
    }
    
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

    const ratingStr = formData.get("rating") as string;
    const reviewsStr = formData.get("reviews") as string;
    const rating = ratingStr && !isNaN(parseFloat(ratingStr)) ? parseFloat(ratingStr) : 0.0;
    const reviews = reviewsStr && !isNaN(parseInt(reviewsStr)) ? parseInt(reviewsStr) : 0;
    const hasOffer = formData.get("hasOffer") === "true";
    const offerPercentage = parseInt(formData.get("offerPercentage") as string) || 0;
    const partnerReferralAmount = parseFloat(formData.get("partnerReferralAmount") as string) || 100;
    const commissionRate = parseFloat(formData.get("commissionRate") as string) || 10;

    // Check available columns in gyms table
    const columnsRes = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'gyms'
    `);
    const availableCols = new Set((columnsRes.rows || []).map((r: any) => r.column_name.toLowerCase()));

    const updateFields: string[] = [
      "name = $1",
      "location = $2",
      "price_per_day = $3",
      "description = $4",
      "amenities = $5::text[]",
      "image = $6"
    ];
    const updateValues: any[] = [
      gymName,
      location,
      planPrices[0] ? parseFloat(planPrices[0]) : 99,
      description,
      amenities,
      finalPrimaryImageUrl
    ];

    if (availableCols.has("gallery")) {
      updateValues.push(finalGalleryUrls);
      updateFields.push(`gallery = $${updateValues.length}::text[]`);
    }
    if (availableCols.has("lat")) {
      updateValues.push(lat);
      updateFields.push(`lat = $${updateValues.length}`);
    }
    if (availableCols.has("lng")) {
      updateValues.push(lng);
      updateFields.push(`lng = $${updateValues.length}`);
    }
    if (availableCols.has("rating")) {
      updateValues.push(rating);
      updateFields.push(`rating = $${updateValues.length}`);
    }
    if (availableCols.has("reviews")) {
      updateValues.push(reviews);
      updateFields.push(`reviews = $${updateValues.length}`);
    }
    if (availableCols.has("has_offer")) {
      updateValues.push(hasOffer);
      updateFields.push(`has_offer = $${updateValues.length}`);
    }
    if (availableCols.has("offer_percentage")) {
      updateValues.push(offerPercentage);
      updateFields.push(`offer_percentage = $${updateValues.length}`);
    }
    if (availableCols.has("partner_referral_amount")) {
      updateValues.push(partnerReferralAmount);
      updateFields.push(`partner_referral_amount = $${updateValues.length}`);
    }
    if (availableCols.has("commission_rate")) {
      updateValues.push(commissionRate);
      updateFields.push(`commission_rate = $${updateValues.length}`);
    }

    updateValues.push(gymId);
    const sql = `UPDATE gyms SET ${updateFields.join(", ")} WHERE id = $${updateValues.length}`;
    await query(sql, updateValues);

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

    revalidatePath("/superadmin/gyms");
    revalidatePath(`/superadmin/gyms/${gymId}/edit`);
    revalidatePath(`/superadmin/gyms/${gymId}/dashboard`);
    revalidatePath("/operation-admin/gyms");
    revalidatePath(`/operation-admin/gyms/${gymId}/edit`);
    revalidatePath("/partner/gym/edit");
    revalidatePath("/partner/dashboard");
    revalidatePath(`/gym/${gymId}`);
    revalidatePath("/explore");
    revalidatePath("/");
    return { success: true };
    
  } catch (err: any) {
    console.error("Unexpected error in updateGym:", err);
    return { error: `Server Error: ${err.message || "An unexpected error occurred."}` };
  }
}

export async function deleteGym(gymId: string) {
  try {
    if (!gymId) return { error: "No gym ID provided." };
    
    const gymResult = await query("SELECT partner_id FROM gyms WHERE id = $1", [gymId]);
    if (gymResult.rows.length === 0) return { error: "Gym not found." };
    
    const partnerId = gymResult.rows[0].partner_id;

    // 1. Delete dependent records safely
    console.log(`Cleaning up dependent records for gym: ${gymId}`);
    
    try {
      await query("DELETE FROM pricing_plans WHERE gym_id = $1", [gymId]);
    } catch (e) {
      console.warn("pricing_plans delete skipped:", e);
    }

    try {
      await query("DELETE FROM payout_requests WHERE gym_id = $1", [gymId]);
    } catch (e) {
      console.warn("payout_requests delete skipped or table absent:", e);
    }

    try {
      await query("DELETE FROM bookings WHERE gym_id = $1", [gymId]);
    } catch (e) {
      console.warn("bookings delete skipped or table absent:", e);
    }

    // 2. Delete the gym
    await query("DELETE FROM gyms WHERE id = $1", [gymId]);

    // 3. Delete the partner account from both tables if it exists
    if (partnerId) {
      try {
        await query("DELETE FROM partner_users WHERE id = $1", [partnerId]);
      } catch (e) {}

      try {
        await query("DELETE FROM users WHERE id = $1", [partnerId]);
      } catch (e) {}
    }
    
    revalidatePath("/superadmin/gyms");
    revalidatePath("/operation-admin/gyms");
    revalidatePath("/admin/gyms");
    revalidatePath("/explore");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Error in deleteGym process:", err);
    return { error: `Failed to permanently remove the gym: ${err.message}` };
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
