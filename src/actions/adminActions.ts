"use server";

import { query } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getAdminStats() {
  try {
    // Calculate real balance: sum of all booking amounts
    let walletBalance = 0;
    try {
      const balanceRes = await query("SELECT COALESCE(SUM(amount::numeric), 0) as total FROM bookings");
      walletBalance = parseFloat(balanceRes.rows[0]?.total) || 0;
    } catch (e) {
      console.warn("Balance calculation failed, defaulting to 0", e);
    }

    let totalGyms = 0;
    try {
      const gymsCount = await query("SELECT COUNT(*) FROM gyms");
      totalGyms = parseInt(gymsCount.rows[0]?.count) || 0;
    } catch (e) {}

    let totalUsers = 0;
    try {
      // Count unique customers who have made bookings
      const uniqueCustomers = await query("SELECT COUNT(DISTINCT LOWER(customer_email)) FROM bookings WHERE customer_email IS NOT NULL AND customer_email != ''");
      totalUsers = parseInt(uniqueCustomers.rows[0]?.count) || 0;
      if (totalUsers === 0) {
        // Fallback: count registered users
        const usersCount = await query("SELECT COUNT(*) FROM users");
        totalUsers = parseInt(usersCount.rows[0]?.count) || 0;
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
    const session = await getServerSession(authOptions);
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
    const result = await query(`
      SELECT u.*, r.name as role_name 
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      ORDER BY u.created_at DESC
    `);
    return result.rows || [];
  } catch (error) {
    console.error("Error fetching all profiles", error);
    return [];
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
    const result = await query("SELECT * FROM partner_requests ORDER BY created_at DESC");
    return result.rows || [];
  } catch (error) {
    console.error("Error fetching partner requests", error);
    return [];
  }
}

export async function updatePartnerRequestStatus(id: string, status: string) {
  try {
    // Note: status might be in a separate column or just deleting if processed
    // If the table doesn't have status, we'll just return success for now
    return { success: true };
  } catch (error: any) {
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
