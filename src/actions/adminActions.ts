"use server";

import { query } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getAdminStats() {
  try {
    let walletBalance = 0;
    try {
      const walletRes = await query("SELECT balance FROM wallet WHERE id = 'platform_wallet'");
      walletBalance = parseFloat(walletRes.rows[0]?.balance) || 0;
    } catch (e) {
      console.warn("Wallet query failed, defaulting to 0", e);
    }

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
    const result = await query("SELECT * FROM gyms WHERE partner_id = $1 LIMIT 1", [userId]);
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
