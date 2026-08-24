import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, ApiGym, ApiPlan, ApiBooking } from '../services/apiService';
import { getCurrentLocation } from '../utils/location';
import { sendLocalNotification, registerForPushNotificationsAsync } from '../utils/notifications';

// Types Definitions
export type UserRole = 'member' | 'owner' | 'admin';

export type ActiveScreen = 
  | 'onboarding' 
  | 'login' 
  | 'otp' 
  | 'home' 
  | 'discovery' 
  | 'gym-details' 
  | 'bookings' 
  | 'partner' 
  | 'community' 
  | 'nearby'
  | 'profile' 
  | 'notifications';

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  height: number; // in cm
  weight: number; // in kg
  bmi: number;
  goal: string;
  avatar: string;
  savedGyms: string[]; // Gym IDs
  membershipType: 'none' | 'Daily Pass' | '7-Day Pass' | 'Monthly Premium' | 'Elite Annual';
  membershipExpiry: string | null;
  qrCodeValue: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface Trainer {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  avatar: string;
  availability: string[]; // time slots
  bio: string;
}

export interface Gym {
  id: string;
  name: string;
  rating: number;
  reviewsCount: number;
  distance: number; // in km
  pricePerDay: number;
  location: string;
  coordinates: { lat: number; lng: number };
  facilities: string[];
  image: string;
  gallery: string[];
  timings: string;
  description: string;
  trainers: Trainer[];
  plans: {
    name: string;
    price: number;
    duration: string;
    features: string[];
  }[];
}

export interface Booking {
  id: string;
  gymId: string;
  gymName: string;
  dateTime: string;
  trainerName?: string;
  sessionType: 'workout' | 'trainer' | 'class';
  className?: string;
  status: 'confirmed' | 'completed' | 'cancelled';
}

export interface FitnessMetrics {
  waterIntake: number; // in ml
  waterGoal: number; // in ml
  steps: number;
  stepsGoal: number;
  caloriesBurned: number;
  caloriesGoal: number;
  weightLog: { date: string; weight: number }[];
}

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  role: string;
  content: string;
  image?: string;
  likes: number;
  likedByMe: boolean;
  comments: Comment[];
  timestamp: string;
}

export interface GymDateNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  unread: boolean;
  type: 'booking' | 'membership' | 'promo' | 'social';
}

export interface GymOwnerProfile {
  gymName: string;
  ownerName: string;
  revenue: number;
  totalCheckIns: number;
  activeMembers: number;
  payoutPending: number;
}

export interface GymDateContextType {
  // Navigation & Role States
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeScreen: ActiveScreen;
  setActiveScreen: (screen: ActiveScreen) => void;
  selectedGymId: string | null;
  setSelectedGymId: (id: string | null) => void;
  screenHistory: ActiveScreen[];
  goBack: () => boolean;
  
  // Theme state shared with simulator shell
  themeMode: 'light' | 'dark';
  setThemeMode: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
  
  // Auth State
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  loginInput: string; // User email address
  setLoginInput: (val: string) => void;
  
  // Database States
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  gyms: Gym[];
  setGyms: React.Dispatch<React.SetStateAction<Gym[]>>;
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'status'>) => void;
  cancelBooking: (id: string) => void;
  fitnessMetrics: FitnessMetrics;
  updateWaterIntake: (amount: number) => void;
  updateSteps: (amount: number) => void;
  addWeightLog: (weight: number) => void;
  
  // Social
  posts: CommunityPost[];
  addPost: (content: string, image?: string) => void;
  toggleLikePost: (postId: string) => void;
  addComment: (postId: string, content: string) => void;
  
  // Notifications
  notifications: GymDateNotification[];
  addNotification: (notification: Omit<GymDateNotification, 'id' | 'timestamp' | 'unread'> & { timestamp?: string }) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: () => void;
  markNotificationsAsRead: () => void;
  unreadNotificationsCount: number;
  
  // Gym Owner State
  ownerProfile: GymOwnerProfile;
  setOwnerProfile: React.Dispatch<React.SetStateAction<GymOwnerProfile>>;
  checkInUserByQR: (qrCode: string) => { success: boolean; message: string; memberName?: string };
  
  // Admin State
  adminBanners: { id: string; image: string; title: string; active: boolean }[];
  toggleBannerActive: (id: string) => void;
  gymRequests: { id: string; name: string; location: string; owner: string; status: 'pending' | 'approved' | 'rejected' }[];
  approveGymRequest: (id: string) => void;
  rejectGymRequest: (id: string) => void;
  loading: boolean;
  refreshData: () => Promise<void>;
  // User real GPS coordinates (fetched once, persisted globally)
  userCoords: { lat: number; lng: number } | null;
  setUserCoords: React.Dispatch<React.SetStateAction<{ lat: number; lng: number } | null>>;
}

const GymDateContext = createContext<GymDateContextType | undefined>(undefined);

// Live AWS Server Gym Database
const INITIAL_GYMS: Gym[] = [
  {
    id: '16ae957c-1bd2-450c-85b7-411991dbe41b',
    name: 'cultfit gym',
    rating: 4.8,
    reviewsCount: 142,
    distance: 1.2,
    pricePerDay: 350,
    location: 'Hyderabad, Telangana',
    coordinates: { lat: 17.3208917, lng: 78.562233 },
    facilities: ['AC', 'Free Weights', 'Cardio Ring', 'Locker Room', 'Smart Entry System'],
    image: 'https://gymdate.in/uploads/gyms/1787212199835-j01we.png',
    gallery: [
      'https://gymdate.in/uploads/gyms/1787212199835-j01we.png',
      'https://gymdate.in/uploads/gyms/1787212199836-prfgq.png'
    ],
    timings: '06:00 AM - 10:00 PM',
    description: 'Cultfit gym offers premium training equipment, dedicated strength racks, high-energy group workouts, and expert conditioning coaches.',
    trainers: [
      { id: 't-1', name: 'Vikram Singh', specialization: 'Strength & Conditioning', rating: 4.9, avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=150', availability: ['07:00 AM - 09:00 AM', '05:00 PM - 07:00 PM'], bio: 'Expert strength conditioning coach.' }
    ],
    plans: [
      { name: '1-Day Pass', price: 350, duration: '1 Day', features: ['Full Gym Access', 'Locker Room', 'Cardio Grid'] },
      { name: 'Monthly Unlimited', price: 3500, duration: '30 Days', features: ['Unlimited Gym Access', 'Lockers & Saunas', 'Diet Consultation'] }
    ]
  },
  {
    id: 'a66bdb3d-cc49-45f6-a547-5df796a51db7',
    name: 'national',
    rating: 4.6,
    reviewsCount: 88,
    distance: 2.5,
    pricePerDay: 250,
    location: 'Hyderabad, Telangana',
    coordinates: { lat: 17.161922, lng: 78.658058 },
    facilities: ['Locker Room', 'Steam Room', 'Personal Training', 'Air Conditioned'],
    image: 'https://gymdate.in/uploads/gyms/1787218281420-bhigjr.png',
    gallery: [
      'https://gymdate.in/uploads/gyms/1787218281420-bhigjr.png'
    ],
    timings: '06:00 AM - 10:30 PM',
    description: 'National fitness center provides top mechanical gear, cardio zones, and heavyweight zones.',
    trainers: [
      { id: 't-2', name: 'Riya Sharma', specialization: 'HIIT & Weight Loss', rating: 4.7, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150', availability: ['08:00 AM - 10:00 AM', '06:00 PM - 08:00 PM'], bio: 'Specialist in dynamic caloric burners.' }
    ],
    plans: [
      { name: '1-Day Pass', price: 250, duration: '1 Day', features: ['Full Gym Access', 'Locker Room'] }
    ]
  }
];

export const GymDateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isRestored = React.useRef(false);
  // KVM Connection & Loading states
  const [loading, setLoading] = useState(false);

  // Navigation & Role State
  const [currentRole, setCurrentRole] = useState<UserRole>('member');
  const [activeScreen, setActiveScreenInternal] = useState<ActiveScreen>('onboarding');
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
  const [screenHistory, setScreenHistory] = useState<ActiveScreen[]>([]);

  const setActiveScreen = React.useCallback((nextScreen: ActiveScreen) => {
    setActiveScreenInternal(current => {
      if (current !== nextScreen && current !== 'onboarding' && current !== 'login' && current !== 'otp') {
        setScreenHistory(prev => {
          if (prev.length > 0 && prev[prev.length - 1] === current) return prev;
          return [...prev, current];
        });
      }
      return nextScreen;
    });
  }, []);

  const goBack = React.useCallback((): boolean => {
    // 1. If currently inside gym details view, pop to gym discovery list
    if (selectedGymId) {
      setSelectedGymId(null);
      return true;
    }

    // 2. If history stack has previous screens, pop and navigate back
    if (screenHistory.length > 0) {
      const prevScreen = screenHistory[screenHistory.length - 1];
      setScreenHistory(prev => prev.slice(0, -1));
      setActiveScreenInternal(prevScreen);
      return true;
    }

    // 3. If currently on a sub-screen like bookings, profile, partner, nearby, discovery, return to home
    if (activeScreen !== 'home' && activeScreen !== 'onboarding' && activeScreen !== 'login' && activeScreen !== 'otp') {
      setActiveScreenInternal('home');
      return true;
    }

    return false;
  }, [selectedGymId, screenHistory, activeScreen]);

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginInput, setLoginInput] = useState('');

  // Gym Member Profile state
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    phone: '',
    email: '',
    height: 178,
    weight: 76.5,
    bmi: 24.1,
    goal: 'Build Muscle',
    avatar: '',
    savedGyms: ['gym-1'],
    membershipType: 'none',
    membershipExpiry: null,
    qrCodeValue: 'GD-MEMBER-NEW'
  });

  // Bookings list state
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 'b-1',
      gymId: 'gym-1',
      gymName: 'Gold\'s Gym Elite',
      dateTime: '2026-05-29T08:00:00',
      trainerName: 'Vikram Singh',
      sessionType: 'trainer',
      status: 'confirmed'
    },
    {
      id: 'b-2',
      gymId: 'gym-3',
      gymName: 'Cult.fit Premium Center',
      dateTime: '2026-05-27T18:00:00',
      sessionType: 'class',
      className: 'HRX Strength & Conditioning',
      status: 'completed'
    }
  ]);

  // Simulator background theme Mode
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  // User's real GPS coordinates — stored globally so all screens share them
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch user's saved lat/lng from backend once after login or resolve device GPS
  const resolveUserCoords = React.useCallback(async (email?: string) => {
    try {
      if (email) {
        const res = await fetch(`https://gymdate.in/api/user/get-profile?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.success && data.profile?.latitude) {
          const lat = parseFloat(data.profile.latitude);
          const lng = parseFloat(data.profile.longitude);
          if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
            setUserCoords({ lat, lng });
            return;
          }
        }
      }
    } catch (_) {}

    // Fallback: cross-platform GPS (Expo Location on Native APK / Geolocation on Web)
    try {
      const coords = await getCurrentLocation();
      if (coords?.latitude && coords?.longitude) {
        setUserCoords({ lat: coords.latitude, lng: coords.longitude });
      }
    } catch (_) {}
  }, []);

  // Gyms Database
  const [gyms, setGyms] = useState<Gym[]>(INITIAL_GYMS);

  // Load gyms from the live KVM PostgreSQL database
  const loadBackendGyms = async () => {
    try {
      setLoading(true);
      console.log("[Context] Fetching live gym listings from KVM PostgreSQL database...");
      const apiGyms = await apiService.getGyms();
      if (apiGyms && apiGyms.length > 0) {
        const mappedGyms: Gym[] = await Promise.all(apiGyms.map(async gym => {
          let price = 290;
          if (gym.price_per_day) {
            price = typeof gym.price_per_day === 'string' ? parseFloat(gym.price_per_day) : gym.price_per_day;
          }

          // Fetch actual pricing plans from PostgreSQL database
          let gymPlans: { name: string; price: number; duration: string; features: string[] }[] = [];
          try {
            const apiPlans = await apiService.getPlans(gym.id);
            if (apiPlans && apiPlans.length > 0) {
              gymPlans = apiPlans.map(plan => {
                const planPrice = typeof plan.price === 'string'
                  ? parseFloat(plan.price.replace(/[^0-9.]/g, ''))
                  : Number(plan.price);
                
                let duration = '30 Days';
                const lowerName = plan.name.toLowerCase();
                if (lowerName.includes('day') || lowerName.includes('daily') || lowerName.includes('pack') || lowerName.includes('pass')) {
                  if (lowerName.includes('10-day')) duration = '10 Days';
                  else if (lowerName.includes('7-day') || lowerName.includes('weekly')) duration = '7 Days';
                  else duration = '1 Day';
                } else if (lowerName.includes('week')) {
                  duration = '7 Days';
                } else if (lowerName.includes('year') || lowerName.includes('annual') || lowerName.includes('yearly')) {
                  duration = '365 Days';
                }
                
                return {
                  name: plan.name,
                  price: planPrice || price,
                  duration,
                  features: plan.features || ['Full Gym Access', 'Locker Room']
                };
              });
            }
          } catch (e) {
            console.warn(`[Context] Plans load failed for gym ${gym.id}, using default plans.`, e);
          }

          if (gymPlans.length === 0) {
            gymPlans = [
              { name: 'Daily Pass', price: price, duration: '1 Day', features: ['Full Gym Access', 'Locker Room'] },
              { name: 'Weekly Pass', price: price * 5, duration: '7 Days', features: ['Full Gym Access', 'Locker Room'] },
              { name: 'Monthly Pass', price: price * 12, duration: '30 Days', features: ['Unlimited Gym Access', 'Locker Room'] }
            ];
          }
          
          return {
            id: gym.id,
            name: gym.name,
            rating: Number(gym.rating) || 4.5,
            reviewsCount: Number(gym.reviews) || 0,
            distance: 0, // not used — haversine from userCoords is always used instead
            pricePerDay: price,
            location: gym.location,
            coordinates: { 
              lat: (gym as any).lat ? parseFloat((gym as any).lat) : ((gym as any).latitude ? parseFloat((gym as any).latitude) : 0), 
              lng: (gym as any).lng ? parseFloat((gym as any).lng) : ((gym as any).longitude ? parseFloat((gym as any).longitude) : 0) 
            },
            facilities: gym.amenities || ['Locker Room', 'Air Conditioned', 'Free Weights'],
            image: gym.image ? (gym.image.startsWith('http') ? gym.image : `https://gymdate.in${gym.image.startsWith('/') ? '' : '/'}${gym.image}`) : 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48',
            gallery: gym.gallery && gym.gallery.length > 0 
              ? gym.gallery.map((g: string) => g.startsWith('http') ? g : `https://gymdate.in${g.startsWith('/') ? '' : '/'}${g}`) 
              : ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48'],
            timings: gym.hours || '06:00 AM - 10:00 PM',
            description: gym.description || 'Premium partnered gym offering top-tier training environment.',
            trainers: [
              { id: 't-1', name: 'Vikram Singh', specialization: 'Strength & Conditioning', rating: 4.9, avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=150', availability: ['07:00 AM - 09:00 AM', '05:00 PM - 07:00 PM'], bio: 'Expert strength conditioning coach.' }
            ],
            plans: gymPlans
          };
        }));
        setGyms(mappedGyms);
      }
    } catch (error) {
      console.warn("[Context] Live KVM gyms load failed, using mock data.", error);
    } finally {
      setLoading(false);
    }
  };

  // Sync and retrieve user profile & booking logs from KVM
  const syncAndFetchUser = async () => {
    if (!loginInput) return;
    try {
      setLoading(true);
      console.log(`[Context] Syncing user profile for ${loginInput} with KVM database...`);
      let profile = await apiService.getProfile(loginInput);
      
      if (!profile) {
        console.log(`[Context] First-time login detected. Registering ${loginInput} in database...`);
        profile = await apiService.syncProfile({
          email: loginInput,
          name: userProfile.name || 'Gym Member',
          phone: userProfile.phone || ''
        });
      }

      if (profile) {
        setUserProfile(prev => ({
          ...prev,
          name: profile.full_name || prev.name,
          phone: profile.phone || prev.phone,
          email: profile.email || prev.email,
          avatar: (profile as any).image || (profile as any).avatar || '',
          address: (profile as any).address || (profile as any).location || ''
        }));
      }

      // Fetch dynamic active bookings
      const apiBookings = await apiService.getBookings(loginInput);
      if (apiBookings) {
        const mappedBookings: Booking[] = apiBookings.map(b => ({
          id: b.id,
          gymId: b.gym_id,
          gymName: b.gyms?.name || 'Partner Gym',
          dateTime: b.start_date || new Date().toISOString(),
          sessionType: 'workout',
          status: b.status === 'completed' ? 'completed' : 'confirmed'
        }));
        setBookings(mappedBookings);
      }
    } catch (error) {
      console.warn("[Context] Live user sync failed. Using local storage session.", error);
    } finally {
      setLoading(false);
    }
  };

  // Mount effect to fetch initial gym databases
  useEffect(() => {
    loadBackendGyms();
  }, []);

  // Fetch when auth state triggers
  useEffect(() => {
    if (isLoggedIn) {
      syncAndFetchUser();
      // Load user's real GPS coordinates into global context once on login
      if (loginInput) {
        resolveUserCoords(loginInput);
      }
    }
  }, [isLoggedIn, loginInput]);

  const refreshData = async () => {
    await loadBackendGyms();
    if (isLoggedIn) {
      await syncAndFetchUser();
    }
  };

  // 1. Restore User Session on mount (for persistent login across refreshes)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        let savedIsLoggedIn: string | null = null;
        let savedLoginInput: string | null = null;
        let savedProfile: string | null = null;
        let savedBookings: string | null = null;
        let savedThemeMode: string | null = null;
        let savedCurrentRole: string | null = null;

        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined' && window.localStorage) {
            savedIsLoggedIn = localStorage.getItem('gymdate_is_logged_in');
            savedLoginInput = localStorage.getItem('gymdate_login_input');
            savedProfile = localStorage.getItem('gymdate_user_profile');
            savedBookings = localStorage.getItem('gymdate_bookings');
            savedThemeMode = localStorage.getItem('gymdate_theme_mode_v3');
            savedCurrentRole = localStorage.getItem('gymdate_current_role');
          }
        } else {
          savedIsLoggedIn = await AsyncStorage.getItem('gymdate_is_logged_in');
          savedLoginInput = await AsyncStorage.getItem('gymdate_login_input');
          savedProfile = await AsyncStorage.getItem('gymdate_user_profile');
          savedBookings = await AsyncStorage.getItem('gymdate_bookings');
          savedThemeMode = await AsyncStorage.getItem('gymdate_theme_mode_v3');
          savedCurrentRole = await AsyncStorage.getItem('gymdate_current_role');
        }

        if (savedCurrentRole === 'owner' || savedCurrentRole === 'admin' || savedCurrentRole === 'member') {
          setCurrentRole(savedCurrentRole as UserRole);
        }
        if (savedIsLoggedIn === 'true') {
          setIsLoggedIn(true);
          setActiveScreen('home');
        }
        if (savedLoginInput) {
          setLoginInput(savedLoginInput);
        }
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          setUserProfile(parsed);
        }
        if (savedBookings) {
          setBookings(JSON.parse(savedBookings));
        }
        if (savedThemeMode === 'dark' || savedThemeMode === 'light') {
          setThemeMode(savedThemeMode as 'light' | 'dark');
        }
      } catch (e) {
        console.warn("[Context] Session restore failed:", e);
      } finally {
        isRestored.current = true;
      }
    };

    restoreSession();
  }, []);

  // 2. Persist User Session on any state changes
  useEffect(() => {
    if (!isRestored.current) return; // Prevent overwriting during mount restoration!
    
    const saveSession = async () => {
      try {
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('gymdate_is_logged_in', isLoggedIn ? 'true' : 'false');
            localStorage.setItem('gymdate_login_input', loginInput || '');
            localStorage.setItem('gymdate_user_profile', JSON.stringify(userProfile));
            localStorage.setItem('gymdate_bookings', JSON.stringify(bookings));
            localStorage.setItem('gymdate_theme_mode_v3', themeMode);
            localStorage.setItem('gymdate_current_role', currentRole);
          }
        } else {
          await AsyncStorage.setItem('gymdate_is_logged_in', isLoggedIn ? 'true' : 'false');
          await AsyncStorage.setItem('gymdate_login_input', loginInput || '');
          await AsyncStorage.setItem('gymdate_user_profile', JSON.stringify(userProfile));
          await AsyncStorage.setItem('gymdate_bookings', JSON.stringify(bookings));
          await AsyncStorage.setItem('gymdate_theme_mode_v3', themeMode);
          await AsyncStorage.setItem('gymdate_current_role', currentRole);
        }
      } catch (e) {
        console.warn("[Context] Session save failed:", e);
      }
    };

    saveSession();
  }, [isLoggedIn, loginInput, userProfile, bookings, themeMode, currentRole]);



  // Fitness metrics log
  const [fitnessMetrics, setFitnessMetrics] = useState<FitnessMetrics>({
    waterIntake: 1250,
    waterGoal: 3500,
    steps: 6420,
    stepsGoal: 10000,
    caloriesBurned: 420,
    caloriesGoal: 800,
    weightLog: [
      { date: 'May 15', weight: 78.2 },
      { date: 'May 18', weight: 77.9 },
      { date: 'May 21', weight: 77.3 },
      { date: 'May 24', weight: 76.8 },
      { date: 'May 27', weight: 76.5 }
    ]
  });

  // Community Feed State
  const [posts, setPosts] = useState<CommunityPost[]>([
    {
      id: 'p-1',
      author: 'Sameer Sen',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150',
      role: 'UFC Gym Trainer',
      content: 'Crushed my leg day routines early morning today! Reminder to focus on structural form rather than raw weights. Keep building, team!',
      image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600',
      likes: 42,
      likedByMe: false,
      comments: [
        { id: 'c-1', author: 'Akash Kumar', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150', content: 'Incredible form Sameer! Can you suggest alternatives for squats if I have a minor ankle strain?', timestamp: '2 hours ago' }
      ],
      timestamp: '4 hours ago'
    },
    {
      id: 'p-2',
      author: 'Priya Mehra',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
      role: 'Yoga Practitioner',
      content: 'Early morning meditation and balance yoga shala completed at Cult.fit Gachibowli. A centered mind is your ultimate strength.',
      likes: 18,
      likedByMe: true,
      comments: [],
      timestamp: '6 hours ago'
    }
  ]);

  // Notifications State (real user alerts and booking updates)
  const [notifications, setNotifications] = useState<GymDateNotification[]>([]);

  // Gym Owner Profile & Operations State
  const [ownerProfile, setOwnerProfile] = useState<GymOwnerProfile>({
    gymName: 'Partner Gym',
    ownerName: 'Gym Partner',
    revenue: 0,
    totalCheckIns: 0,
    activeMembers: 0,
    payoutPending: 0
  });

  // Admin Dashboard States
  const [adminBanners, setAdminBanners] = useState([
    { id: 'b-1', image: 'https://images.unsplash.com/photo-1542766788-a2f988f40e1e?q=80&w=600', title: '20% off Gold\'s Gym', active: true },
    { id: 'b-2', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600', title: 'MMA Cage Boxing Nights', active: true },
    { id: 'b-3', image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=600', title: 'HRX Cult.fit Workouts', active: false }
  ]);

  const [gymRequests, setGymRequests] = useState<GymDateContextType['gymRequests']>([
    { id: 'r-1', name: 'Powerhouse Gym & Spa', location: 'Whitefield, Bangalore', owner: 'Ramesh Reddy', status: 'pending' },
    { id: 'r-2', name: 'Nitro Fitness Studio', location: 'Salt Lake, Kolkata', owner: 'Joydeep Sen', status: 'pending' }
  ]);

  // Computed Values
  const unreadNotificationsCount = notifications.filter(n => n.unread).length;

  // Sync BMI whenever height/weight changes
  useEffect(() => {
    const heightInMeters = userProfile.height / 100;
    const computedBmi = parseFloat((userProfile.weight / (heightInMeters * heightInMeters)).toFixed(1));
    if (userProfile.bmi !== computedBmi) {
      setUserProfile(prev => ({ ...prev, bmi: computedBmi }));
    }
  }, [userProfile.height, userProfile.weight]);

  // Actions implementations
  const addBooking = (newBooking: Omit<Booking, 'id' | 'status'>) => {
    const created: Booking = {
      ...newBooking,
      id: `b-${Date.now()}`,
      status: 'confirmed'
    };
    setBookings(prev => [created, ...prev]);

    // Push dynamic booking notification
    const newNotification: GymDateNotification = {
      id: `n-${Date.now()}`,
      title: 'Booking Successful!',
      message: `You booked a ${created.sessionType} session at ${created.gymName} scheduled for ${new Date(created.dateTime).toLocaleDateString()} at ${new Date(created.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      timestamp: 'Just now',
      unread: true,
      type: 'booking'
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const cancelBooking = (id: string) => {
    setBookings(prev => 
      prev.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b)
    );
    const target = bookings.find(b => b.id === id);
    if (target) {
      const newNotification: GymDateNotification = {
        id: `n-${Date.now()}`,
        title: 'Booking Cancelled',
        message: `Your workout slot at ${target.gymName} was successfully cancelled and refunded to pass balance.`,
        timestamp: 'Just now',
        unread: true,
        type: 'booking'
      };
      setNotifications(prev => [newNotification, ...prev]);
    }
  };

  const updateWaterIntake = (amount: number) => {
    setFitnessMetrics(prev => ({
      ...prev,
      waterIntake: Math.max(0, prev.waterIntake + amount)
    }));
  };

  const updateSteps = (amount: number) => {
    setFitnessMetrics(prev => {
      const total = prev.steps + amount;
      const caloriesAdded = Math.round(amount * 0.04);
      return {
        ...prev,
        steps: total,
        caloriesBurned: prev.caloriesBurned + caloriesAdded
      };
    });
  };

  const addWeightLog = (weight: number) => {
    const today = new Date().toLocaleDateString([], { month: 'short', day: 'numeric' });
    setFitnessMetrics(prev => {
      // check if exists today, replace or add new
      const filtered = prev.weightLog.filter(log => log.date !== today);
      return {
        ...prev,
        weightLog: [...filtered, { date: today, weight }]
      };
    });
    setUserProfile(prev => ({ ...prev, weight }));
  };

  const addPost = (content: string, image?: string) => {
    const newPost: CommunityPost = {
      id: `p-${Date.now()}`,
      author: userProfile.name,
      avatar: userProfile.avatar,
      role: `Active ${userProfile.membershipType === 'none' ? 'Fitness Explorer' : userProfile.membershipType}`,
      content,
      image,
      likes: 0,
      likedByMe: false,
      comments: [],
      timestamp: 'Just now'
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const toggleLikePost = (postId: string) => {
    setPosts(prev => 
      prev.map(p => {
        if (p.id === postId) {
          const isLiked = p.likedByMe;
          return {
            ...p,
            likedByMe: !isLiked,
            likes: isLiked ? p.likes - 1 : p.likes + 1
          };
        }
        return p;
      })
    );
  };

  const addComment = (postId: string, content: string) => {
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      author: userProfile.name,
      avatar: userProfile.avatar,
      content,
      timestamp: 'Just now'
    };
    setPosts(prev => 
      prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p)
    );
  };

  const addNotification = (notif: Omit<GymDateNotification, 'id' | 'timestamp' | 'unread'> & { timestamp?: string }) => {
    const newNotification: GymDateNotification = {
      ...notif,
      id: `n-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: notif.timestamp || 'Just now',
      unread: true,
    };
    setNotifications(prev => [newNotification, ...prev]);
    // Send external system notification on phone status bar
    sendLocalNotification(notif.title, notif.message, { notificationId: newNotification.id });
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const checkInUserByQR = (qrCode: string) => {
    // If scanning member's QR
    if (qrCode === userProfile.qrCodeValue) {
      if (userProfile.membershipType === 'none') {
        return { success: false, message: `Scan Failed. ${userProfile.name} has no active membership pass. Purchase pass first.` };
      }
      
      setOwnerProfile(prev => ({
        ...prev,
        totalCheckIns: prev.totalCheckIns + 1,
        revenue: prev.revenue + 350 // simulated check-in payout
      }));

      // Notify the member
      const newNotification: GymDateNotification = {
        id: `n-${Date.now()}`,
        title: 'Checked-In Successfully!',
        message: `Welcome to Gold's Gym Elite! Enjoy your workout session. Hydrate well!`,
        timestamp: 'Just now',
        unread: true,
        type: 'membership'
      };
      setNotifications(prev => [newNotification, ...prev]);

      return { success: true, message: 'Check-in processed successfully. Access granted.', memberName: userProfile.name };
    }
    
    // Check general sample codes
    if (qrCode.startsWith('GD-MEMBER')) {
      setOwnerProfile(prev => ({
        ...prev,
        totalCheckIns: prev.totalCheckIns + 1
      }));
      return { success: true, message: 'Pass validated successfully. Entry recorded.', memberName: 'Guest Athlete' };
    }

    return { success: false, message: 'Invalid QR Code. GymDate database could not resolve this signature.' };
  };

  const toggleBannerActive = (id: string) => {
    setAdminBanners(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
  };

  const approveGymRequest = (id: string) => {
    const request = gymRequests.find(r => r.id === id);
    if (request) {
      setGymRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' as const } : r));
      // Inject the approved gym into the list dynamically!
      const newGym: Gym = {
        id: `gym-${Date.now()}`,
        name: request.name,
        rating: 4.5,
        reviewsCount: 12,
        distance: 3.1,
        pricePerDay: 280,
        location: request.location,
        coordinates: { lat: 13.0, lng: 77.0 },
        facilities: ['Locker Room', 'Air Conditioned', 'Cardio Grid'],
        image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600',
        gallery: ['https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600'],
        timings: '06:00 AM - 10:00 PM',
        description: `${request.name} in ${request.location} offers a premium strength setup with multiple benches, cardio zones, and friendly certified trainers.`,
        trainers: [
          { id: `t-${Date.now()}`, name: 'Rohan Deshmukh', specialization: 'Weight Training', rating: 4.6, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150', availability: ['06:00 AM - 08:00 AM'], bio: 'Passionate structural fitness expert.' }
        ],
        plans: [
          { name: '1-Day Pass', price: 280, duration: '1 Day', features: ['Full Gym Access'] }
        ]
      };
      setGyms(prev => [...prev, newGym]);
    }
  };

  const rejectGymRequest = (id: string) => {
    setGymRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' as const } : r));
  };

  return (
    <GymDateContext.Provider value={{
      currentRole,
      setCurrentRole,
      activeScreen,
      setActiveScreen,
      selectedGymId,
      setSelectedGymId,
      themeMode,
      setThemeMode,
      isLoggedIn,
      setIsLoggedIn,
      loginInput,
      setLoginInput,
      userProfile,
      setUserProfile,
      gyms,
      setGyms,
      bookings,
      addBooking,
      cancelBooking,
      fitnessMetrics,
      updateWaterIntake,
      updateSteps,
      addWeightLog,
      posts,
      addPost,
      toggleLikePost,
      addComment,
      notifications,
      addNotification,
      deleteNotification,
      clearAllNotifications,
      markNotificationsAsRead,
      unreadNotificationsCount,
      ownerProfile,
      setOwnerProfile,
      checkInUserByQR,
      adminBanners,
      toggleBannerActive,
      gymRequests,
      approveGymRequest,
      rejectGymRequest,
      loading,
      refreshData,
      userCoords,
      setUserCoords,
      screenHistory,
      goBack,
    }}>
      {children}
    </GymDateContext.Provider>
  );
};

export const useGymDate = () => {
  const context = useContext(GymDateContext);
  if (context === undefined) {
    throw new Error('useGymDate must be used within a GymDateProvider');
  }
  return context;
};
