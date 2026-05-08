"use server";

import { query } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { partnerAuthOptions } from "@/app/api/auth/partner/[...nextauth]/route";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { sendPartnerLeadStatusEmail } from "@/lib/email";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

async function uploadCityImage(file: File): Promise<string | null> {
  if (!file || !(file instanceof File) || file.size === 0) return null;
  try {
    const uploadDir = '/var/www/gymdate_uploads/cities';
    await mkdir(uploadDir, { recursive: true });
    
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    return `/uploads/cities/${fileName}`;
  } catch (error) {
    console.error("CITY UPLOADER ERROR:", error);
    return null;
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
    const configRes = await query("SELECT value FROM platform_config WHERE key = 'platform_commission' LIMIT 1");
    const platformComm = configRes.rows[0] ? parseFloat(configRes.rows[0].value) : 10;

    const result = await query("SELECT * FROM gyms ORDER BY created_at DESC");
    const gyms = result.rows || [];

    return gyms.map((gym: any) => ({
      ...gym,
      commission_rate: (gym.commission_rate === null || gym.commission_rate === undefined) ? platformComm : gym.commission_rate
    }));
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
    const gymResult = await query("SELECT * FROM gyms WHERE partner_id::text = $1::text LIMIT 1", [userId]);
    const gym = gymResult.rows[0] || null;

    if (gym && (gym.commission_rate === null || gym.commission_rate === undefined)) {
      const configRes = await query("SELECT value FROM platform_config WHERE key = 'platform_commission' LIMIT 1");
      gym.commission_rate = configRes.rows[0] ? parseFloat(configRes.rows[0].value) : 10;
    }

    return gym;
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
    const profiles: any[] = [];

    // 1. Fetch Admin Users
    try {
      const adminRes = await query("SELECT id, email, full_name, 'super_admin' as role_id FROM admin_users");
      if (adminRes.rows) profiles.push(...adminRes.rows);
    } catch (e: any) {
      profiles.push({ id: 'err1', full_name: 'Admin Fetch Error', email: e.message, role_id: 'super_admin' });
    }

    // 2. Fetch Staff (Operation Admins)
    try {
      const staffRes = await query("SELECT id, email, full_name, 'operation_admin' as role_id FROM staff_users");
      if (staffRes.rows) profiles.push(...staffRes.rows);
    } catch (e: any) {
      // Don't push error if table doesn't exist yet, just log it
      console.error("Staff Fetch Error:", e.message);
    }

    // 3. Fetch Partners
    try {
      const partnerRes = await query(`
        SELECT u.id::text, u.email, u.full_name, u.phone, u.role_id, g.name as gym_name
        FROM users u
        LEFT JOIN gyms g ON u.id::text = g.partner_id::text
        WHERE u.role_id = 'partner'
      `);
      if (partnerRes.rows) profiles.push(...partnerRes.rows);
    } catch (e: any) {
      profiles.push({ id: 'err2', full_name: 'Partner Fetch Error', email: e.message, role_id: 'partner' });
    }

    // 4. Fetch Regular Users
    try {
      const userRes = await query("SELECT id::text, email, full_name, phone, role_id FROM users WHERE role_id != 'partner' AND role_id != 'super_admin' AND role_id != 'operation_admin' OR role_id IS NULL");
      if (userRes.rows) profiles.push(...userRes.rows);
    } catch (e: any) {
      profiles.push({ id: 'err3', full_name: 'User Fetch Error', email: e.message, role_id: 'user' });
    }

    return profiles;
  } catch (error: any) {
    return [{ id: 'fatal', full_name: 'CRITICAL DATABASE ERROR', email: error.message, role_id: 'super_admin' }];
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
    // Basic query to ensure all leads are fetched
    const result = await query(`
      SELECT 
        pr.*,
        g.name as referrer_gym_name,
        u.full_name as referrer_owner_name
      FROM partner_requests pr
      LEFT JOIN users u ON TRIM(UPPER(pr.referred_by)) = TRIM(UPPER(u.referral_code))
      LEFT JOIN gyms g ON u.id::text = g.partner_id::text
      ORDER BY pr.created_at DESC
    `);
    
    // Attempt to enrich with referrer info, but don't fail if it doesn't work
    const enriched = [...(result.rows || [])];
    
    return { 
      requests: enriched, 
      debug: { count: enriched.length, timestamp: new Date().toISOString() } 
    };
  } catch (error: any) {
    console.error("Critical error fetching partner requests", error);
    return { 
      requests: [{ id: 'err', gym_name: 'ERROR LOADING LEADS', owner_name: error.message, status: 'error' }], 
      error: error.message 
    };
  }
}

export async function updatePartnerRequestStatus(id: string, status: string) {
  try {
    // 1. Get current status to prevent double-approval
    const checkRes = await query("SELECT status FROM partner_requests WHERE id = $1", [id]);
    if (checkRes.rows.length === 0) throw new Error("Lead not found.");
    if (checkRes.rows[0].status === "approved" && status === "approved") {
      console.warn(`[AdminActions] Lead ${id} already approved, skipping credit.`);
      return { success: true, message: "Already approved" };
    }

    // 2. Update the status in the database
    const updateRes = await query(
      "UPDATE partner_requests SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    const lead = updateRes.rows[0];

    // 2. If it's approved or rejected, send the professional email
    if (status === "approved" || status === "rejected") {
      await sendPartnerLeadStatusEmail(lead, status as 'approved' | 'rejected');
      
      // Credit Referral Bonus if approved and referred by someone
      if (status === "approved" && lead.referred_by) {
        try {
          // Get partner referral bonus from config via reusable helper
          // Get global default from config
          const { getConfigValue } = await import('@/lib/config');
          const bonusStr = await getConfigValue('partner_referral_bonus');
          let bonusAmount = parseFloat(bonusStr ?? '500');

          // Find the referrer
          const referrerRes = await query("SELECT id, email, role_id FROM users WHERE referral_code = $1", [lead.referred_by]);
          
          if (referrerRes.rows.length > 0) {
            const referrer = referrerRes.rows[0];
            
            // If the referrer is a partner, check if they have a custom referral amount set
            if (referrer.role_id === 'partner') {
              const gymRes = await query("SELECT partner_referral_amount FROM gyms WHERE partner_id = $1 LIMIT 1", [referrer.id]);
              if (gymRes.rows.length > 0 && gymRes.rows[0].partner_referral_amount) {
                bonusAmount = parseFloat(gymRes.rows[0].partner_referral_amount);
              }
            }
            
            // Start Transaction to credit wallet and record it
            await query("BEGIN");
            
            // 1. Update wallet balance
            await query("UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + $1 WHERE id = $2", [bonusAmount, referrer.id]);
            
            // 2. Record transaction
            await query(
              "INSERT INTO referral_transactions (referrer_id, referred_user_email, type, amount, status) VALUES ($1, $2, 'partner', $3, 'credited')",
              [referrer.id, lead.email, bonusAmount]
            );
            
            await query("COMMIT");
            console.log(`[AdminActions] Credited ₹${bonusAmount} to partner ${referrer.email} for referring ${lead.email}`);
          }
        } catch (creditErr) {
          await query("ROLLBACK");
          console.error("Failed to credit partner referral bonus:", creditErr);
        }
      }
    }

    revalidatePath("/admin/partner-requests");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating partner request status:", error);
    return { error: error.message };
  }
}

export async function deletePartnerRequest(id: string) {
  try {
    await query("DELETE FROM partner_requests WHERE id = $1", [id]);
    revalidatePath("/admin/partner-requests");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting partner request:", error);
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

export async function addCity(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const imageFile = formData.get("image") as File;
    const is_featured = formData.get("is_featured") === "true";
    const is_coming_soon = formData.get("is_coming_soon") === "true";

    if (!name) return { error: "City name is required" };

    let imageUrl = "/placeholder-city.jpg";
    if (imageFile && imageFile.size > 0) {
      const uploadedUrl = await uploadCityImage(imageFile);
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    await query("INSERT INTO cities (name, image, is_featured, is_coming_soon) VALUES ($1, $2, $3, $4)", 
      [name, imageUrl, is_featured, is_coming_soon]);
    return { success: true };
  } catch (error: any) {
    console.error("Add City Error:", error);
    return { error: error.message };
  }
}

export async function updateCity(id: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const imageFile = formData.get("image") as File;
    const existingImageUrl = formData.get("existingImageUrl") as string;
    const is_featured = formData.get("is_featured") === "true";
    const is_coming_soon = formData.get("is_coming_soon") === "true";

    if (!name) return { error: "City name is required" };

    let imageUrl = existingImageUrl;
    if (imageFile && imageFile.size > 0 && typeof imageFile !== 'string') {
      const uploadedUrl = await uploadCityImage(imageFile);
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    await query("UPDATE cities SET name = $1, image = $2, is_featured = $3, is_coming_soon = $4 WHERE id = $5",
      [name, imageUrl, is_featured, is_coming_soon, id]);
    return { success: true };
  } catch (error: any) {
    console.error("Update City Error:", error);
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
    if (result.rows.length === 0) return true; // Default to visible
    return result.rows[0].value === 'true';
  } catch (error) {
    return true;
  }
}

export async function updateSectionVisibility(section: string, visible: boolean) {
  try {
    const result = await query("UPDATE platform_stats SET value = $1 WHERE label = 'Visibility'", [visible ? 'true' : 'false']);
    
    if (result.rowCount === 0) {
      // If it doesn't exist, insert it
      await query("INSERT INTO platform_stats (id, label, value, display_order) VALUES ($1, 'Visibility', $2, 999)", 
        [Math.random().toString(36).substring(2, 15), visible ? 'true' : 'false']);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating visibility:", error);
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
    // 1. Fetch the request to check type
    const requestRes = await query("SELECT * FROM payout_requests WHERE id = $1", [id]);
    if (requestRes.rows.length === 0) return { error: "Request not found" };
    const request = requestRes.rows[0];

    // 2. If marking as completed and it's a referral payout, deduct from user wallet
    if (newStatus === 'completed' && request.status !== 'completed' && request.payout_type === 'referral') {
      // Find the partner_id associated with the gym
      const gymRes = await query("SELECT partner_id FROM gyms WHERE id = $1", [request.gym_id]);
      if (gymRes.rows.length > 0) {
        const partnerId = gymRes.rows[0].partner_id;
        if (partnerId) {
          // Deduct from users table
          await query(
            "UPDATE users SET wallet_balance = GREATEST(0, wallet_balance - $1) WHERE id = $2",
            [request.amount, partnerId]
          );
          console.log(`[Payout] Deducted ₹${request.amount} from partner ${partnerId} wallet for referral payout.`);
        }
      }
    }

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
        upi_id, mobile_number, qr_code_url, payout_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [
      id, payload.gym_id, payload.amount, payload.payout_method, payload.status || 'pending',
      payload.bank_name || null, payload.account_holder || null, payload.account_number || null, payload.ifsc_code || null,
      payload.upi_id || null, payload.mobile_number || null, payload.qr_code_url || null,
      payload.payout_type || 'revenue'
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
        await query("DELETE FROM pricing_plans WHERE gym_id = $1", [gymId]);
        await query("DELETE FROM payout_requests WHERE gym_id = $1", [gymId]);
        await query("DELETE FROM bookings WHERE gym_id = $1", [gymId]);
        await query("DELETE FROM gyms WHERE id = $1", [gymId]);
      }
      // Delete from both potential tables to be safe
      await query("DELETE FROM partner_users WHERE id = $1", [id]);
      await query("DELETE FROM users WHERE id = $1", [id]);
    } else if (role === "super_admin") {
      await query("DELETE FROM admin_users WHERE id = $1", [id]);
    } else if (role === "operation_admin") {
      await query("DELETE FROM staff_users WHERE id = $1", [id]);
    } else {
      // Default: Customer
      await query("DELETE FROM bookings WHERE user_id = $1::text", [id]);
      await query("DELETE FROM users WHERE id = $1", [id]);
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Delete Account Error:", error);
    return { success: false, error: error.message };
  }
}

export async function createOperationAdmin(data: { email: string; password: string; full_name: string }) {
  try {
    const { email, password, full_name } = data;
    
    // Check if user exists
    const checkUser = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (checkUser.rows.length > 0) return { error: "User with this email already exists" };

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create staff user in dedicated table
    await query(
      "INSERT INTO staff_users (email, password_hash, full_name) VALUES ($1, $2, $3)",
      [email, hashedPassword, full_name]
    );

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Create Operation Admin Error:", error);
    return { error: error.message };
  }
}

export async function getPlatformConfig() {
  try {
    const result = await query("SELECT * FROM platform_config ORDER BY key ASC");
    let configs = result.rows || [];

    // Ensure platform_commission exists so it shows in the Settings UI
    if (!configs.find((c: any) => c.key === 'platform_commission')) {
      await query(
        "INSERT INTO platform_config (key, value, description) VALUES ($1, $2, $3) ON CONFLICT (key) DO NOTHING",
        ['platform_commission', '10', 'Global platform commission percentage (fallback for all gyms).']
      );
      const updated = await query("SELECT * FROM platform_config ORDER BY key ASC");
      configs = updated.rows;
    }

    return configs;
  } catch (error) {
    console.error("Error fetching platform config", error);
    return [];
  }
}

export async function updatePlatformConfig(key: string, value: string) {
  try {
    await query(
      "INSERT INTO platform_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
      [key, value]
    );
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating platform config", error);
    return { error: error.message };
  }
}
