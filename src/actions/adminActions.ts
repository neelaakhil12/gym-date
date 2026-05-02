"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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

export async function addPlatformStat(label: string, value: string) {
  try {
    await query(
      "INSERT INTO platform_stats (label, value) VALUES ($1, $2)",
      [label, value]
    );
    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error adding platform stat:", err);
    return { error: "Failed to add stat." };
  }
}

export async function deletePlatformStat(id: string) {
  try {
    await query(
      "DELETE FROM platform_stats WHERE id = $1",
      [id]
    );
    revalidatePath("/");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting platform stat:", err);
    return { error: "Failed to delete stat." };
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
    const uploadDir = '/var/www/gymdate_uploads/cities';
    await mkdir(uploadDir, { recursive: true });
    
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return `/uploads/cities/${fileName}`;
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
    let walletBalance = 0;
    try {
      const wallet = await query("SELECT balance FROM wallet WHERE id = 'platform_wallet'");
      walletBalance = wallet.rows[0]?.balance || 0;
    } catch (e) {}

    let totalGyms = 0;
    try {
      const gymsCount = await query("SELECT COUNT(*) FROM gyms");
      totalGyms = parseInt(gymsCount.rows[0]?.count) || 0;
    } catch (e) {}

    let totalUsers = 0;
    try {
      const usersCount = await query("SELECT COUNT(*) FROM users WHERE role_id = 'user'");
      totalUsers = parseInt(usersCount.rows[0]?.count) || 0;
      if (totalUsers === 0) {
        const uniqueBookingsUsers = await query("SELECT COUNT(DISTINCT customer_email) FROM bookings");
        totalUsers = parseInt(uniqueBookingsUsers.rows[0]?.count) || 0;
      }
    } catch (e) {}

    return {
      walletBalance,
      totalGyms,
      totalUsers,
    };
  } catch (error) {
    console.error("Error fetching admin stats", error);
    return { walletBalance: 0, totalGyms: 0, totalUsers: 0 };
  }
}

export async function getAllBookings() {
  try {
    const result = await query(
      `SELECT 
        b.*, 
        COALESCE(b.customer_name, u.full_name, 'Member') as customer_name, 
        COALESCE(b.customer_email, u.email, 'No email') as customer_email,
        json_build_object('name', g.name) as gyms
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id::text
       LEFT JOIN gyms g ON b.gym_id = g.id::text
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

export async function getPartnerGym(partnerId?: string) {
  try {
    let id = partnerId;
    
    // If no ID provided, get it from the current session
    if (!id) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) return null;
      id = session.user.id;
    }

    const result = await query(
      "SELECT * FROM gyms WHERE partner_id = $1 LIMIT 1",
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching partner gym", error);
    return null;
  }
}
export async function getPartnerRequests() {
  try {
    const result = await query(
      "SELECT * FROM partner_requests ORDER BY created_at DESC"
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error fetching partner requests", error);
    return [];
  }
}

export async function updatePartnerRequestStatus(id: string, status: string) {
  try {
    await query(
      "UPDATE partner_requests SET status = $1 WHERE id = $2",
      [status, id]
    );
    revalidatePath("/admin/partner-requests");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating partner request status", error);
    return { error: error.message || "Failed to update status." };
  }
}

export async function getPartnerBookings(gymId: string) {
  try {
    const result = await query(
      `SELECT 
        b.*, 
        COALESCE(b.customer_name, u.full_name, 'Member') as customer_name, 
        COALESCE(b.customer_email, u.email, 'No email') as customer_email
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id::text
       WHERE b.gym_id = $1
       ORDER BY b.created_at DESC`,
      [gymId]
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error fetching partner bookings:", error);
    return [];
  }
}

export async function getGymPricingPlans(gymId: string) {
  try {
    const result = await query(
      "SELECT id, name, price FROM pricing_plans WHERE gym_id = $1 ORDER BY price ASC",
      [gymId]
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error fetching gym pricing plans:", error);
    return [];
  }
}
