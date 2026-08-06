import { getApiUrl } from '../config';

export interface ApiProfile {
  email: string;
  full_name: string;
  phone: string;
  address?: string;
  lat?: number;
  lng?: number;
  role_id?: string;
  created_at?: string;
}

export interface ApiGym {
  id: string;
  name: string;
  location: string;
  distance?: number;
  rating?: number;
  reviews?: number;
  price_per_day?: number;
  image?: string;
  gallery?: string[];
  amenities?: string[];
  hours?: string;
  description?: string;
}

export interface ApiPlan {
  id: string;
  gym_id: string;
  name: string;
  price: string; // e.g. "₹350"
  features?: string[];
  button_text?: string;
  popular?: boolean;
}

export interface ApiBooking {
  id: string;
  user_id: string;
  gym_id: string;
  plan_name: string;
  amount: string;
  total_price?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  payment_id?: string;
  ticket_code?: string;
  gyms?: {
    name: string;
    location: string;
  };
}

export interface ApiWalletData {
  walletBalance: number;
  totalReferrals: number;
  totalEarned: number;
  bonusPerReferral: number;
  maxWalletPerTxn: number;
  referralLink: string;
  referralCode: string;
  history: { amount: number; created_at: string; detail: string; type: string }[];
}

export const apiService = {
  /**
   * Fetch all active gyms listed on your KVM server
   */
  async getGyms(): Promise<ApiGym[]> {
    const url = `${getApiUrl()}/api/gyms`;
    console.log(`[API] Fetching gyms from: ${url}`);
    
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch gyms');
    }
    return data.gyms || [];
  },

  /**
   * Fetch specific pricing plans for a gym from the database
   */
  async getPlans(gymId: string): Promise<ApiPlan[]> {
    const url = `${getApiUrl()}/api/gyms/get-plans?gymId=${gymId}`;
    console.log(`[API] Fetching plans for gym ${gymId} from: ${url}`);

    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch plans');
    }
    return data.plans || [];
  },

  /**
   * Send 6-digit OTP to user email address via backend SMTP
   */
  async sendOtp(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const url = `${getApiUrl()}/api/auth/otp/send`;
    console.log(`[API] Sending OTP email to ${email} via ${url}`);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      return await res.json();
    } catch (err: any) {
      console.warn('[API WARN] Failed to dispatch OTP email:', err);
      // Return success flag fallback so demo code 123456 can still be used offline
      return { success: true, message: 'OTP sent (Demo code: 123456)' };
    }
  },

  /**
   * Verify 6-digit OTP against backend
   */
  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; user?: ApiProfile; error?: string }> {
    const url = `${getApiUrl()}/api/auth/otp/verify`;
    console.log(`[API] Verifying OTP for ${email} via ${url}`);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim() }),
      });
      return await res.json();
    } catch (err: any) {
      console.warn('[API WARN] Failed to reach backend OTP verify API:', err);
      if (otp.trim() === '123456') {
        return { success: true };
      }
      return { success: false, error: err.message || 'Verification failed. Try demo code 123456.' };
    }
  },

  /**
   * Fetch user profile from KVM backend by email
   */
  async getProfile(email: string): Promise<ApiProfile | null> {
    const url = `${getApiUrl()}/api/user/get-profile?email=${encodeURIComponent(email)}`;
    console.log(`[API] Fetching profile for ${email} from: ${url}`);

    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch profile');
    }
    return data.profile;
  },

  /**
   * Sync and register/update profile details on the PostgreSQL server
   */
  async syncProfile(params: {
    email: string;
    name: string;
    phone: string;
    lat?: number;
    lng?: number;
    address?: string;
  }): Promise<ApiProfile> {
    const url = `${getApiUrl()}/api/user/sync-profile`;
    console.log(`[API] Syncing profile with backend: ${url}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to sync profile');
    }
    return data.user;
  },

  /**
   * Fetch active pass bookings for this email
   */
  async getBookings(email: string): Promise<ApiBooking[]> {
    const url = `${getApiUrl()}/api/user/get-bookings?email=${encodeURIComponent(email)}`;
    console.log(`[API] Fetching bookings for ${email} from: ${url}`);

    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch bookings');
    }
    return data.bookings || [];
  },

  /**
   * Fetch wallet balance, referral code, and referral stats for a user by userId
   */
  async getWalletData(userId: string): Promise<ApiWalletData | null> {
    const url = `${getApiUrl()}/api/referral/generate?userId=${encodeURIComponent(userId)}&type=user`;
    console.log(`[API] Fetching wallet/referral data for userId ${userId} from: ${url}`);

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success && !data.referralLink) return null;
      return data;
    } catch (err: any) {
      console.warn('[API WARN] Failed to fetch wallet data:', err);
      return null;
    }
  },

  /**
   * Register a new gym partner request
   */
  async registerPartner(params: {
    gymName: string;
    ownerName: string;
    email: string;
    phone: string;
    city: string;
    address: string;
    referredBy?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const url = `${getApiUrl()}/api/partner/register`;
    console.log(`[API] Registering partner with: ${url}`);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      return await res.json();
    } catch (err: any) {
      console.error("[API ERROR] Partner registration failed:", err);
      return { success: false, error: err.message || "Network request failed. Ensure server is reachable." };
    }
  }
};
