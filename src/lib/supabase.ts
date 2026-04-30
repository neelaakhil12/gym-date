export { getGyms, getCities, getPricingPlans, getPricingPlansByGymId, getGymById } from "@/actions/publicActions";
export { getAdminStats, getAllBookings, getAllProfiles, getUniqueUsersCount, getPartnerGym } from "@/actions/adminActions";

// Mock supabase client to prevent build errors in files we haven't refactored yet
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    getUser: async () => ({ data: { user: null } }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
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

