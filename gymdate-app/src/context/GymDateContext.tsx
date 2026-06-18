import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, ApiGym, ApiPlan, ApiBooking } from '../services/apiService';

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
  
  // Theme state shared with simulator shell
  themeMode: 'light' | 'dark';
  setThemeMode: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
  
  // Auth State
  isLoggedIn: boolean;
  setIsLoggedIn: (val: boolean) => void;
  loginInput: string; // Email or phone
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

// Static Mock Gym Database
const INITIAL_GYMS: Gym[] = [
  {
    id: 'gym-1',
    name: 'Gold\'s Gym Elite',
    rating: 4.8,
    reviewsCount: 245,
    distance: 1.4,
    pricePerDay: 350,
    location: 'Bandra West, Mumbai',
    coordinates: { lat: 19.0596, lng: 72.8295 },
    facilities: ['Locker Room', 'Steam Room', 'Personal Training', 'Air Conditioned', 'Juice Bar', 'Valet Parking'],
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600',
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=600',
      'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=600'
    ],
    timings: '05:00 AM - 11:00 PM',
    description: 'Gold\'s Gym Elite offers the standard premium workout experience with top-of-the-line mechanical gear, comprehensive cardio grids, and high-intensity strength environments tailored for champions.',
    trainers: [
      { id: 't-1', name: 'Vikram Singh', specialization: 'Strength & Conditioning', rating: 4.9, avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=150', availability: ['07:00 AM - 09:00 AM', '05:00 PM - 07:00 PM'], bio: 'Over 8 years training professional competitive athletes and weightlifting enthusiasts.' },
      { id: 't-2', name: 'Riya Sharma', specialization: 'HIIT & Weight Management', rating: 4.7, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150', availability: ['08:00 AM - 10:00 AM', '06:00 PM - 08:00 PM'], bio: 'Specialist in dynamic caloric burners, structural tone improvement, and active nutrition integration.' }
    ],
    plans: [
      { name: '1-Day Pass', price: 350, duration: '1 Day', features: ['Full Gym Access', 'Locker Room', 'Group Cardio Intro'] },
      { name: '7-Day Pass', price: 1800, duration: '7 Days', features: ['Full Gym Access', '1x Personal Trainer Checkin', 'All Group Classes Access'] },
      { name: 'Monthly Premium', price: 4500, duration: '30 Days', features: ['Unrestricted Gym Access', '3x Personal Trainer Sessions', 'Complimentary Steam Room', '15% Off Juice Bar'] }
    ]
  },
  {
    id: 'gym-2',
    name: 'UFC Gym & Octagon Club',
    rating: 4.9,
    reviewsCount: 312,
    distance: 2.7,
    pricePerDay: 450,
    location: 'Indiranagar, Bangalore',
    coordinates: { lat: 12.9719, lng: 77.6412 },
    facilities: ['MMA Cage', 'Boxing Ring', 'Crossfit Rig', 'Shower Room', 'Locker Room', 'Physiotherapy Center'],
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600',
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=600',
      'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=600'
    ],
    timings: '06:00 AM - 10:30 PM',
    description: 'Train like an ultimate fighter. UFC Gym brings elite martial arts routines, heavy bag circuits, structural strength grids, and official octagon cages directly to high-intensity fitness lovers.',
    trainers: [
      { id: 't-3', name: 'Kabir Fernandes', specialization: 'MMA & Kickboxing', rating: 5.0, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150', availability: ['06:00 AM - 08:00 AM', '04:00 PM - 06:00 PM'], bio: 'Former professional lightweight fighter. Specializes in strike accuracy and core agility.' }
    ],
    plans: [
      { name: '1-Day Pass', price: 450, duration: '1 Day', features: ['Access to MMA Area', 'Cardio Grid Access', 'Heavy Bag Intro'] },
      { name: 'Monthly Fighter', price: 5500, duration: '30 Days', features: ['Unlimited UFC Gym Access', 'All Octagon Boxing Classes', '1-on-1 Strike Assessment', 'Lockers & Saunas'] }
    ]
  },
  {
    id: 'gym-3',
    name: 'Cult.fit Premium Center',
    rating: 4.6,
    reviewsCount: 189,
    distance: 0.8,
    pricePerDay: 290,
    location: 'Gachibowli, Hyderabad',
    coordinates: { lat: 17.4483, lng: 78.3488 },
    facilities: ['Group Workouts', 'HRX Training', 'Yoga Shala', 'Locker Room', 'Smart Entry System'],
    image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=600&auto=format&fit=crop',
    gallery: [
      'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=600',
      'https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=600'
    ],
    timings: '06:00 AM - 10:00 PM',
    description: 'Cult.fit makes fitness simple and extremely fun. Known globally for interactive, highly social group classes incorporating HRX strength, functional cross-training, yoga, dance fitness, and boxing.',
    trainers: [
      { id: 't-4', name: 'Ananya Roy', specialization: 'Yoga & Pilates', rating: 4.8, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150', availability: ['07:00 AM - 09:00 AM', '05:00 PM - 06:30 PM'], bio: 'Specialist in mindful recovery, core balance stability, and physical stress relief.' }
    ],
    plans: [
      { name: '1-Day Pass', price: 290, duration: '1 Day', features: ['1x Scheduled Group Class', 'Cardio Ring Access', 'Smart Locker Access'] },
      { name: 'Monthly Unlimited', price: 3800, duration: '30 Days', features: ['Unlimited Group Classes', 'Multi-center Access', 'Cult.fit App Trackers', 'Dedicated Diet Consultation'] }
    ]
  }
];

export const GymDateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isRestored = React.useRef(false);
  // KVM Connection & Loading states
  const [loading, setLoading] = useState(false);

  // Navigation & Role State
  const [currentRole, setCurrentRole] = useState<UserRole>('member');
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('onboarding');
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);

  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginInput, setLoginInput] = useState('');

  // Gym Member Profile state
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'NEELA AKHIL KUMAR',
    phone: '',
    email: 'neelaakhil12@gmail.com',
    height: 178,
    weight: 76.5,
    bmi: 24.1,
    goal: 'Build Muscle',
    avatar: '',
    savedGyms: ['gym-1', 'gym-3'],
    membershipType: 'none',
    membershipExpiry: null,
    qrCodeValue: 'GD-MEMBER-9988-77'
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

  // Fetch user's saved lat/lng from backend once after login
  const resolveUserCoords = React.useCallback(async (email: string) => {
    try {
      const res = await fetch(`https://gymdate.in/api/user/get-profile?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success && data.profile?.latitude) {
        const lat = parseFloat(data.profile.latitude);
        const lng = parseFloat(data.profile.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          setUserCoords({ lat, lng });
          return;
        }
      }
    } catch (_) {}
    // Fallback: browser geolocation
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
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
              lat: (gym as any).lat ? parseFloat((gym as any).lat) : 0, 
              lng: (gym as any).lng ? parseFloat((gym as any).lng) : 0 
            },
            facilities: gym.amenities || ['Locker Room', 'Air Conditioned', 'Free Weights'],
            image: gym.image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48',
            gallery: gym.gallery && gym.gallery.length > 0 ? gym.gallery : ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48'],
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
          name: 'NEELA AKHIL KUMAR',
          phone: ''
        });
      }

      if (profile) {
        setUserProfile(prev => ({
          ...prev,
          name: profile.full_name || prev.name,
          phone: profile.phone || prev.phone,
          email: profile.email || prev.email,
          avatar: (profile as any).image || prev.avatar,
          address: (profile as any).address || prev.address
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

        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined' && window.localStorage) {
            savedIsLoggedIn = localStorage.getItem('gymdate_is_logged_in');
            savedLoginInput = localStorage.getItem('gymdate_login_input');
            savedProfile = localStorage.getItem('gymdate_user_profile');
            savedBookings = localStorage.getItem('gymdate_bookings');
            savedThemeMode = localStorage.getItem('gymdate_theme_mode_v3');
          }
        } else {
          savedIsLoggedIn = await AsyncStorage.getItem('gymdate_is_logged_in');
          savedLoginInput = await AsyncStorage.getItem('gymdate_login_input');
          savedProfile = await AsyncStorage.getItem('gymdate_user_profile');
          savedBookings = await AsyncStorage.getItem('gymdate_bookings');
          savedThemeMode = await AsyncStorage.getItem('gymdate_theme_mode_v3');
        }

        if (savedIsLoggedIn === 'true') {
          setIsLoggedIn(true);
          setActiveScreen('home');
        }
        if (savedLoginInput) {
          const processedInput = savedLoginInput.includes('akash') ? 'neelaakhil12@gmail.com' : savedLoginInput;
          setLoginInput(processedInput);
        }
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (parsed && (parsed.name === 'Akash Kumar' || parsed.email?.includes('akash'))) {
            parsed.name = 'NEELA AKHIL KUMAR';
            parsed.email = 'neelaakhil12@gmail.com';
          }
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
          }
        } else {
          await AsyncStorage.setItem('gymdate_is_logged_in', isLoggedIn ? 'true' : 'false');
          await AsyncStorage.setItem('gymdate_login_input', loginInput || '');
          await AsyncStorage.setItem('gymdate_user_profile', JSON.stringify(userProfile));
          await AsyncStorage.setItem('gymdate_bookings', JSON.stringify(bookings));
          await AsyncStorage.setItem('gymdate_theme_mode_v3', themeMode);
        }
      } catch (e) {
        console.warn("[Context] Session save failed:", e);
      }
    };

    saveSession();
  }, [isLoggedIn, loginInput, userProfile, bookings, themeMode]);



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

  // Notifications State
  const [notifications, setNotifications] = useState<GymDateNotification[]>([
    {
      id: 'n-1',
      title: 'Booking Confirmed!',
      message: 'Your personal training session with Vikram Singh at Gold\'s Gym Elite is scheduled for tomorrow at 08:00 AM.',
      timestamp: '3 hours ago',
      unread: true,
      type: 'booking'
    },
    {
      id: 'n-2',
      title: 'Active Promo Offer!',
      message: 'Unlock 20% off all Gold\'s Gym Weekly & Monthly passes. Valid only until this Sunday! Use code GDGOLD20.',
      timestamp: '1 day ago',
      unread: true,
      type: 'promo'
    }
  ]);

  // Gym Owner Profile & Operations State
  const [ownerProfile, setOwnerProfile] = useState<GymOwnerProfile>({
    gymName: 'Gold\'s Gym Elite',
    ownerName: 'Harish Jagtiani',
    revenue: 124500,
    totalCheckIns: 489,
    activeMembers: 142,
    payoutPending: 28400
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
