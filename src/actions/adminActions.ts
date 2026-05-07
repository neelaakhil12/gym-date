"use server";

import { query } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { partnerAuthOptions } from "@/app/api/auth/partner/[...nextauth]/route";
import { revalidatePath } from "next/cache";
import { sendPartnerLeadStatusEmail } from "@/lib/email";



export async function getAllBookings() {
  try {
    const result = await query(
      `SELECT 
        b.*, 
        COALESCE(b.customer_name, u.full_name, 'Member') as customer_name, 
        COALESCE(b.customer_email, u.email, 'No email') as customer_email,
        g.name as gym_name
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id::text
       LEFT JOIN gyms g ON b.gym_id::text = g.id::text
       ORDER BY b.created_at DESC`
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error fetching all bookings", error);
    return [];
  }
}

export async function getGyms() {
  try {
    const result = await query("SELECT * FROM gyms ORDER BY created_at DESC");
    return result.rows || [];
  } catch (error) {
    console.error("Error fetching gyms", error);
    return [];
  }
}

export async function getPartnerGym() {
  try {
    const session = await getServerSession(partnerAuthOptions);
    if (!session?.user) return null;
    
    const userId = (session.user as any).id;
    const result = await query("SELECT * FROM gyms WHERE partner_id::text = $1::text LIMIT 1", [userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching partner gym", error);
    return null;
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
       WHERE b.gym_id::text = $1::text
       ORDER BY b.created_at DESC`,
      [gymId]
    );
    return result.rows || [];
  } catch (error) {
    console.error("Error fetching partner bookings", error);
    return [];
  }
}

// RESTORED FUNCTIONS
export async function getAllProfiles() {
  try {
    // Check if address column exists in users table to avoid SQL errors
    const checkUserCol = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='users' AND column_name='address'
    `);
    const hasAddress = checkUserCol.rows.length > 0;

    const result = await query(`
      SELECT 
        u.id, u.email, u.full_name, u.phone, u.role_id, 
        CASE 
          WHEN u.role_id = 'super_admin' THEN 'Super Admin'
          WHEN u.role_id = 'partner' THEN 'Partner'
          ELSE 'User'
        END as role_name,
        u.created_at, 
        g.name as gym_name, 
        ${hasAddress ? 'COALESCE(u.address, g.location)' : 'g.location'} as address
      FROM users u
      LEFT JOIN gyms g ON u.id::text = g.partner_id::text
      ORDER BY u.created_at DESC
    `);

    console.log(`[AdminActions] getAllProfiles: Found ${result.rows.length} profiles`);
    return result.rows || [];
  } catch (error) {
    console.error("Error fetching all profiles", error);
    return [];
  }
}

export async function getAdminStats() {
  try {
    // 1. Balance
    const balanceRes = await query("SELECT COALESCE(SUM(amount::numeric), 0) as total FROM bookings");
    const walletBalance = parseFloat(balanceRes.rows[0]?.total) || 0;

    // 2. Gyms
    const gymsCount = await query("SELECT COUNT(*) FROM gyms");
    const totalGyms = parseInt(gymsCount.rows[0]?.count) || 0;

    // 3. Users (Count unique customers who have made bookings)
    const usersCount = await query(`
      SELECT COUNT(DISTINCT LOWER(customer_email)) as count 
      FROM bookings 
      WHERE customer_email IS NOT NULL AND customer_email != ''
    `);
    let totalUsers = parseInt(usersCount.rows[0]?.count) || 0;

    // Fallback: If no bookings, count from users table
    if (totalUsers === 0) {
      const fallbackCount = await query(`
        SELECT COUNT(*) FROM users 
        WHERE role_id NOT IN ('partner', 'super_admin') 
        OR role_id IS NULL
      `);
      totalUsers = parseInt(fallbackCount.rows[0]?.count) || 0;
    }

    return { walletBalance, totalGyms, totalUsers };
  } catch (error) {
    console.error("Error fetching admin stats", error);
    return { walletBalance: 0, totalGyms: 0, totalUsers: 0 };
  }
}

export async function deleteUser(id: string) {
  try {
    await query("DELETE FROM users WHERE id = $1", [id]);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateUser(id: string, data: any) {
  try {
    await query(
      "UPDATE users SET full_name = $1, email = $2, phone = $3, role_id = $4 WHERE id = $5",
      [data.full_name, data.email, data.phone, data.role_id, id]
    );
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getPartnerRequests() {
  try {
    // Migration: Ensure table exists
    await query(`
      CREATE TABLE IF NOT EXISTS partner_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        gym_name VARCHAR(255) NOT NULL,
        owner_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        city VARCHAR(100) NOT NULL,
        address TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration: Ensure status column exists (for older versions)
    await query("ALTER TABLE partner_requests ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending'");
    
    const result = await query("SELECT * FROM partner_requests ORDER BY created_at DESC");
    return result.rows || [];
  } catch (error) {
    console.error("Error fetching partner requests", error);
    return [];
  }
}

export async function updatePartnerRequestStatus(id: string, status: string) {
  try {
    // 1. Update the status in the database
    const updateRes = await query(
      "UPDATE partner_requests SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (updateRes.rows.length === 0) {
      throw new Error("Lead not found.");
    }

    const lead = updateRes.rows[0];

    // 2. If it's approved or rejected, send the professional email
    if (status === "approved" || status === "rejected") {
      await sendPartnerLeadStatusEmail(lead, status as 'approved' | 'rejected');
    }

    revalidatePath("/admin/partner-requests");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating partner request status:", error);
    return { error: error.message };
  }
}

export async function getCities() {
  try {
    const result = await query("SELECT * FROM cities ORDER BY name ASC");
    return result.rows || [];
  } catch (error) {
    return [];
  }
}

export async function addCity(data: any) {
  try {
    await query("INSERT INTO cities (name, image, is_featured) VALUES ($1, $2, $3)", 
      [data.name, data.image, data.is_featured]);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateCity(id: string, data: any) {
  try {
    await query("UPDATE cities SET name = $1, image = $2, is_featured = $3 WHERE id = $4",
      [data.name, data.image, data.is_featured, id]);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteCity(id: string) {
  try {
    await query("DELETE FROM cities WHERE id = $1", [id]);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getPlatformStats() {
  try {
    const result = await query("SELECT * FROM platform_stats ORDER BY display_order ASC");
    return result.rows || [];
  } catch (error) {
    return [];
  }
}

export async function updatePlatformStats(id: string, value: string) {
  try {
    await query("UPDATE platform_stats SET value = $1 WHERE id = $2", [value, id]);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deletePlatformStat(id: string) {
  try {
    await query("DELETE FROM platform_stats WHERE id = $1", [id]);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getSectionVisibility() {
  try {
    const result = await query("SELECT * FROM platform_stats WHERE label = 'Visibility'");
    return result.rows[0]?.value === 'true';
  } catch (error) {
    return true;
  }
}

export async function updateSectionVisibility(section: string, visible: boolean) {
  try {
    await query("UPDATE platform_stats SET value = $1 WHERE label = 'Visibility'", [visible ? 'true' : 'false']);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
export async function getUniqueUsersCount() {
  try {
    const result = await query("SELECT COUNT(DISTINCT id) FROM users WHERE role_id = 'user'");
    return parseInt(result.rows[0]?.count) || 0;
  } catch (error) {
    return 0;
  }
}

export async function addPlatformStat(data: any) {
  try {
    await query("INSERT INTO platform_stats (id, label, value, display_order) VALUES ($1, $2, $3, $4)",
      [crypto.randomUUID(), data.label, data.value, data.display_order || 0]);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteBooking(id: string) {
  try {
    await query("DELETE FROM bookings WHERE id = $1", [id]);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getGlobalAmenities() {
  try {
    const result = await query("SELECT * FROM amenities ORDER BY name ASC");
    return result.rows || [];
  } catch (error) {
    return [];
  }
}

export async function addGlobalAmenity(name: string) {
  try {
    await query("INSERT INTO amenities (name) VALUES ($1)", [name]);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteGlobalAmenity(id: string) {
  try {
    await query("DELETE FROM amenities WHERE id = $1", [id]);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getGymPricingPlans(gymId: string) {
  try {
    const result = await query("SELECT * FROM pricing_plans WHERE gym_id = $1 ORDER BY price ASC", [gymId]);
    return result.rows || [];
  } catch (error) {
    console.error("Error fetching gym pricing plans", error);
    return [];
  }
}

export async function getPayoutRequests() {
  try {
    const result = await query(`
      SELECT p.*, g.name as gym_name, g.location as gym_location
      FROM payout_requests p
      LEFT JOIN gyms g ON p.gym_id = g.id
      ORDER BY p.created_at DESC
    `);
    
    // Map the flat result into the nested structure expected by the frontend
    return result.rows.map((row: any) => ({
      ...row,
      gyms: {
        name: row.gym_name || 'Unknown Gym',
        location: row.gym_location || 'Unknown Location'
      }
    }));
  } catch (error) {
    console.error("Error fetching payout requests", error);
    return [];
  }
}

export async function updatePayoutStatus(id: string, newStatus: string) {
  try {
    await query("UPDATE payout_requests SET status = $1 WHERE id = $2", [newStatus, id]);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating payout status", error);
    return { error: error.message };
  }
}

export async function createPayoutRequest(payload: any) {
  try {
    // Ensure table exists on local postgres
    await query(`
      CREATE TABLE IF NOT EXISTS payout_requests (
        id VARCHAR(50) PRIMARY KEY,
        gym_id VARCHAR(50) REFERENCES gyms(id),
        amount NUMERIC NOT NULL,
        payout_method VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        bank_name VARCHAR(100),
        account_holder VARCHAR(100),
        account_number VARCHAR(50),
        ifsc_code VARCHAR(20),
        upi_id VARCHAR(100),
        mobile_number VARCHAR(20),
        qr_code_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Use crypto.randomUUID or a simple random string for ID
    const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    await query(`
      INSERT INTO payout_requests (
        id, gym_id, amount, payout_method, status,
        bank_name, account_holder, account_number, ifsc_code,
        upi_id, mobile_number, qr_code_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      id, payload.gym_id, payload.amount, payload.payout_method, payload.status || 'pending',
      payload.bank_name || null, payload.account_holder || null, payload.account_number || null, payload.ifsc_code || null,
      payload.upi_id || null, payload.mobile_number || null, payload.qr_code_url || null
    ]);

    return { success: true };
  } catch (error: any) {
    console.error("Error creating payout request", error);
    return { error: error.message };
  }
}

export async function getPartnerPayoutRequests(gymId: string) {
  try {
    const result = await query(`
      SELECT * FROM payout_requests
      WHERE gym_id = $1
      ORDER BY created_at DESC
    `, [gymId]);
    
    return result.rows || [];
  } catch (error) {
    console.error("Error fetching partner payout requests", error);
    return [];
  }
}

export async function deleteAccount(id: string, role: string) {
  try {
    if (!id) return { error: "ID is required" };

    if (role === "partner") {
      // For partners, we find their gym and use the existing deleteGym logic (which handles cascading)
      const gymRes = await query("SELECT id FROM gyms WHERE partner_id::text = $1::text", [id]);
      if (gymRes.rows.length > 0) {
        const gymId = gymRes.rows[0].id;
        // Import deleteGym here to avoid circular dependencies if any, 
        // or just implement the logic here for safety.
        
        await query("DELETE FROM pricing_plans WHERE gym_id = $1", [gymId]);
        await query("DELETE FROM payout_requests WHERE gym_id = $1", [gymId]);
        await query("DELETE FROM bookings WHERE gym_id = $1", [gymId]);
        await query("DELETE FROM gyms WHERE id = $1", [gymId]);
      }
      await query("DELETE FROM partner_users WHERE id = $1", [id]);
    } else if (role === "super_admin") {
      await query("DELETE FROM admin_users WHERE id = $1", [id]);
    } else {
      // Default: Customer
      // Clean up bookings for this user first
      await query("DELETE FROM bookings WHERE user_id = $1::text", [id]);
      await query("DELETE FROM users WHERE id = $1", [id]);
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Account Error:", error);
    return { error: error.message || "Failed to delete account" };
  }
}
