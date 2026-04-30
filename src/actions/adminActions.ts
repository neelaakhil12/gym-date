"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function updatePlatformStats(stats: { id: string; label: string; value: string }[]) {
  try {
    for (const stat of stats) {
      await query(
        "UPDATE platform_stats SET label = $1, value = $2 WHERE id = $3",
        [stat.label, stat.value, stat.id]
      );
    }
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating platform stats:", err);
    return { error: "Failed to update stats." };
  }
}

export async function getPlatformStats() {
  try {
    const result = await query(
      "SELECT * FROM platform_stats WHERE id != '00000000-0000-0000-0000-000000000000' ORDER BY display_order ASC"
    );
    return result.rows;
  } catch (err) {
    console.error("Error fetching stats:", err);
    return [];
  }
}

export async function getSectionVisibility() {
  try {
    const result = await query(
      "SELECT value FROM platform_stats WHERE id = '00000000-0000-0000-0000-000000000000'"
    );
    return result.rows[0]?.value === "true";
  } catch (err) {
    console.error("Error fetching visibility:", err);
    return true; // Default to true
  }
}

export async function updateSectionVisibility(isVisible: boolean) {
  try {
    await query(
      "UPDATE platform_stats SET value = $1 WHERE id = '00000000-0000-0000-0000-000000000000'",
      [isVisible ? "true" : "false"]
    );
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating visibility:", err);
    return { error: "Failed to update visibility." };
  }
}

// Helper to upload city image to local disk
async function uploadCityImage(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  try {
    // In production, this directory must exist on the VPS
    const uploadDir = process.env.UPLOAD_DIR || './public/uploads/cities';
    await mkdir(uploadDir, { recursive: true });
    
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const baseUrl = process.env.NEXT_PUBLIC_UPLOAD_URL || '/uploads';
    return `${baseUrl}/cities/${fileName}`;
  } catch (err) {
    console.error("Error uploading city image:", err);
    return null;
  }
}

export async function addCity(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const is_featured = formData.get("is_featured") === "true";
    const is_coming_soon = formData.get("is_coming_soon") === "true";
    const imageFile = formData.get("image") as File;
    const existingUrl = formData.get("existingImageUrl") as string;

    let imageUrl = existingUrl || "";
    if (imageFile && imageFile.size > 0) {
      const uploaded = await uploadCityImage(imageFile);
      if (uploaded) imageUrl = uploaded;
    }

    await query(
      "INSERT INTO cities (name, image, is_featured, is_coming_soon) VALUES ($1, $2, $3, $4)",
      [name, imageUrl, is_featured, is_coming_soon]
    );

    revalidatePath("/");
    revalidatePath("/explore");
    return { success: true };
  } catch (err: any) {
    console.error("Error adding city:", err);
    return { error: err.message || "Failed to add city." };
  }
}

export async function updateCity(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const is_featured = formData.get("is_featured") === "true";
    const is_coming_soon = formData.get("is_coming_soon") === "true";
    const imageFile = formData.get("image") as File;
    const existingUrl = formData.get("existingImageUrl") as string;

    let imageUrl = existingUrl || "";
    if (imageFile && imageFile.size > 0) {
      const uploaded = await uploadCityImage(imageFile);
      if (uploaded) imageUrl = uploaded;
    }

    await query(
      "UPDATE cities SET name = $1, image = $2, is_featured = $3, is_coming_soon = $4 WHERE id = $5",
      [name, imageUrl, is_featured, is_coming_soon, id]
    );

    revalidatePath("/");
    revalidatePath("/explore");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating city:", err);
    return { error: err.message || "Failed to update city." };
  }
}

export async function deleteCity(id: string) {
  try {
    await query("DELETE FROM cities WHERE id = $1", [id]);
    revalidatePath("/");
    revalidatePath("/explore");
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting city:", err);
    return { error: err.message || "Failed to delete city." };
  }
}

export async function deleteBooking(id: string) {
  try {
    await query("DELETE FROM bookings WHERE id = $1", [id]);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting booking:", err);
    return { error: err.message || "Failed to delete transaction." };
  }
}

export async function getGlobalAmenities() {
  try {
    const result = await query("SELECT * FROM amenities ORDER BY name ASC");
    return result.rows;
  } catch (err) {
    console.error("Error fetching global amenities:", err);
    return [];
  }
}

export async function addGlobalAmenity(name: string) {
  try {
    await query("INSERT INTO amenities (name) VALUES ($1)", [name]);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error adding global amenity:", err);
    return { error: err.message || "Failed to add amenity." };
  }
}

export async function deleteGlobalAmenity(id: string) {
  try {
    await query("DELETE FROM amenities WHERE id = $1", [id]);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting global amenity:", err);
    return { error: err.message || "Failed to delete amenity." };
  }
}

export async function getAdminStats() {
  try {
    const wallet = await query("SELECT balance FROM wallet WHERE id = 'platform_wallet'");
    const gymsCount = await query("SELECT COUNT(*) FROM gyms");
    const usersCount = await query("SELECT COUNT(*) FROM users WHERE role_id = 'user'");
    return {
      walletBalance: wallet.rows[0]?.balance || 0,
      totalGyms: parseInt(gymsCount.rows[0]?.count) || 0,
      totalUsers: parseInt(usersCount.rows[0]?.count) || 0,
    };
  } catch (error) {
    console.error("Error fetching admin stats", error);
    return { walletBalance: 0, totalGyms: 0, totalUsers: 0 };
  }
}

export async function getAllBookings() {
  try {
    const result = await query(
      `SELECT b.*, u.email as user_email, g.name as gym_name
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN gyms g ON b.gym_id = g.id
       ORDER BY b.created_at DESC`
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error fetching bookings", error);
    return [];
  }
}

export async function getAllProfiles() {
  try {
    const result = await query(
      "SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC"
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error fetching profiles", error);
    return [];
  }
}

export async function getUniqueUsersCount() {
  try {
    const result = await query("SELECT COUNT(*) FROM users WHERE role_id = 'user'");
    return parseInt(result.rows[0]?.count) || 0;
  } catch (error) {
    console.error("Error fetching unique users count", error);
    return 0;
  }
}

export async function getPartnerGym(partnerId: string) {
  try {
    const result = await query(
      "SELECT * FROM gyms WHERE partner_id = $1 LIMIT 1",
      [partnerId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching partner gym", error);
    return null;
  }
}
