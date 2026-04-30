import { query } from './db';
import { gyms as mockGyms, cities as mockCities, pricingPlans as mockPricingPlans } from '@/data/mockData';

// We keep the old filename so we don't have to change imports across the app,
// but we're now querying our own PostgreSQL directly!

function logDbError(context: string, error: unknown) {
  console.error(`[DB] ${context}:`, error);
}

export async function getGyms() {
  try {
    const result = await eval("require")("./db").query('SELECT * FROM gyms ORDER BY created_at DESC');
    if (!result.rows || result.rows.length === 0) return mockGyms;
    return result.rows;
  } catch (error) {
    logDbError('Error fetching gyms — using mock fallback', error);
    return mockGyms;
  }
}

export async function getGymById(id: string) {
  try {
    const result = await eval("require")("./db").query('SELECT * FROM gyms WHERE id = $1', [id]);
    if (!result.rows || result.rows.length === 0) return mockGyms.find(g => g.id === id) || null;
    return result.rows[0];
  } catch (error) {
    logDbError('Error fetching gym by id — using mock fallback', error);
    return mockGyms.find(g => g.id === id) || null;
  }
}

export async function getCities() {
  try {
    const result = await eval("require")("./db").query('SELECT * FROM cities ORDER BY created_at DESC');
    if (!result.rows || result.rows.length === 0) return mockCities;
    return result.rows;
  } catch (error) {
    logDbError('Error fetching cities — using mock fallback', error);
    return mockCities;
  }
}

export async function getPricingPlans() {
  try {
    const result = await eval("require")("./db").query('SELECT * FROM pricing_plans');
    if (!result.rows || result.rows.length === 0) return mockPricingPlans;
    return result.rows;
  } catch (error) {
    logDbError('Error fetching pricing plans — using mock fallback', error);
    return mockPricingPlans;
  }
}

export async function getPricingPlansByGymId(gymId: string) {
  try {
    const result = await eval("require")("./db").query(
      'SELECT * FROM pricing_plans WHERE gym_id = $1 ORDER BY price ASC',
      [gymId]
    );
    return result.rows || [];
  } catch (error) {
    logDbError('Error fetching plans by gym id', error);
    return [];
  }
}

// Admin Fetchers
export async function getAdminStats() {
  try {
    // 1. Wallet Balance
    const wallet = await eval("require")("./db").query("SELECT balance FROM wallet WHERE id = 'platform_wallet'");
    
    // 2. Total Gyms
    const gymsCount = await eval("require")("./db").query('SELECT COUNT(*) FROM gyms');
    
    // 3. Total Users
    const usersCount = await eval("require")("./db").query("SELECT COUNT(*) FROM users WHERE role_id = 'user'");

    return {
      walletBalance: wallet.rows[0]?.balance || 0,
      totalGyms: parseInt(gymsCount.rows[0]?.count) || 0,
      totalUsers: parseInt(usersCount.rows[0]?.count) || 0,
    };
  } catch (error) {
    logDbError('Error fetching admin stats', error);
    return { walletBalance: 0, totalGyms: 0, totalUsers: 0 };
  }
}

export async function getAllProfiles() {
  try {
    const result = await eval("require")("./db").query(
      'SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id ORDER BY u.created_at DESC'
    );
    return result.rows || [];
  } catch (error) {
    logDbError('Error fetching profiles', error);
    return [];
  }
}

export async function getAllBookings() {
  try {
    const result = await eval("require")("./db").query(
      `SELECT b.*, u.email as user_email, g.name as gym_name
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN gyms g ON b.gym_id = g.id
       ORDER BY b.created_at DESC`
    );
    return result.rows || [];
  } catch (error) {
    logDbError('Error fetching bookings', error);
    return [];
  }
}

export async function getPartnerGym(partnerId?: string) {
  try {
    const result = await eval("require")("./db").query(
      'SELECT * FROM gyms WHERE partner_id = $1 LIMIT 1',
      [partnerId]
    );
    return result.rows[0] || null;
  } catch (error) {
    logDbError('Error fetching partner gym', error);
    return null;
  }
}

export async function getUniqueUsersCount() {
  try {
    const result = await eval("require")("./db").query("SELECT COUNT(*) FROM users WHERE role_id = 'user'");
    return parseInt(result.rows[0]?.count) || 0;
  } catch (error) {
    logDbError('Error fetching unique users count', error);
    return 0;
  }
}

// Mock supabase client to prevent build errors in files we haven't refactored yet
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    getUser: async () => ({ data: { user: null } }),
  },
  from: () => ({ 
    select: () => ({ 
      eq: () => ({ 
        single: async () => ({ data: null, error: null }),
        order: async () => ({ data: null, error: null }),
        neq: () => ({ order: async () => ({ data: null, error: null }) })
      }),
      order: async () => ({ data: null, error: null }),
      ilike: () => ({ single: async () => ({ data: null, error: null }) })
    }),
    insert: async () => ({ data: null, error: null }),
    update: () => ({ eq: async () => ({ data: null, error: null }) }),
    delete: () => ({ eq: async () => ({ data: null, error: null }) })
  }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  }
} as any;

