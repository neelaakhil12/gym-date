import { createClient } from '@supabase/supabase-js';
import { gyms as mockGyms, cities as mockCities, pricingPlans as mockPricingPlans } from '@/data/mockData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Safe Data Fetchers
// These functions try to fetch from Supabase. If the table is empty or errors out,
// they fall back to the mock data to ensure the UI NEVER breaks.

function logSupabaseError(context: string, error: unknown) {
  if (error && typeof error === 'object') {
    const e = error as { message?: string; code?: string; details?: string; hint?: string };
    console.error(`[Supabase] ${context}:`, {
      message: e.message,
      code: e.code,
      details: e.details,
      hint: e.hint,
    });
  } else {
    console.error(`[Supabase] ${context}:`, error);
  }
}

export async function getGyms() {
  try {
    const { data, error } = await supabase.from('gyms').select('*');
    if (error) throw error;
    if (!data || data.length === 0) return mockGyms;
    return data;
  } catch (error) {
    logSupabaseError('Error fetching gyms — using mock fallback', error);
    return mockGyms;
  }
}

export async function getGymById(id: string) {
  try {
    const { data, error } = await supabase.from('gyms').select('*').eq('id', id).single();
    if (error) throw error;
    if (!data) return mockGyms.find(g => g.id === id) || null;
    return data;
  } catch (error) {
    logSupabaseError('Error fetching gym by id — using mock fallback', error);
    return mockGyms.find(g => g.id === id) || null;
  }
}

export async function getCities() {
  try {
    const { data, error } = await supabase.from('cities').select('*');
    if (error) throw error;
    if (!data || data.length === 0) return mockCities;
    return data;
  } catch (error) {
    logSupabaseError('Error fetching cities — using mock fallback', error);
    return mockCities;
  }
}

export async function getPricingPlans() {
  try {
    const { data, error } = await supabase.from('pricing_plans').select('*');
    if (error) throw error;
    if (!data || data.length === 0) return mockPricingPlans;
    return data;
  } catch (error) {
    logSupabaseError('Error fetching pricing plans — using mock fallback', error);
    return mockPricingPlans;
  }
}

export async function getPricingPlansByGymId(gymId: string) {
  try {
    const { data, error } = await supabase
      .from('pricing_plans')
      .select('*')
      .eq('gym_id', gymId)
      .order('price', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    logSupabaseError('Error fetching plans by gym id', error);
    return [];
  }
}

// Admin Fetchers
export async function getAdminStats() {
  try {
    // 1. Wallet Balance
    const { data: wallet } = await supabase.from('wallet').select('balance').eq('id', 'platform_wallet').single();
    
    // 2. Total Gyms
    const { count: gymsCount } = await supabase.from('gyms').select('*', { count: 'exact', head: true });
    
    // 3. Total Users
    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role_id', 'user');

    return {
      walletBalance: wallet?.balance || 0,
      totalGyms: gymsCount || 0,
      totalUsers: usersCount || 0,
    };
  } catch (error) {
    logSupabaseError('Error fetching admin stats', error);
    return { walletBalance: 0, totalGyms: 0, totalUsers: 0 };
  }
}

export async function getAllProfiles() {
  try {
    const { data, error } = await supabase.from('profiles').select('*, roles(name)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    logSupabaseError('Error fetching profiles', error);
    return [];
  }
}

export async function getAllBookings() {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, profiles(email), gyms(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    logSupabaseError('Error fetching bookings', error);
    return [];
  }
}

export async function getPartnerGym() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .eq('partner_id', session.user.id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    logSupabaseError('Error fetching partner gym', error);
    return null;
  }
}

export async function getUniqueUsersCount() {
  try {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', 'user');
    return count || 0;
  } catch (error) {
    logSupabaseError('Error fetching unique users count', error);
    return 0;
  }
}
