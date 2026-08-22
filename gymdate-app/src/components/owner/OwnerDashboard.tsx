import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Image, 
  ActivityIndicator,
  RefreshControl,
  Platform,
  Switch,
  Linking
} from 'react-native';
import { useGymDate } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { 
  QrCode, 
  DollarSign, 
  Users, 
  Clock, 
  Check, 
  AlertCircle,
  UserCheck,
  MapPin,
  TrendingUp,
  Building2,
  Calendar,
  LogOut,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  LayoutDashboard,
  Wallet,
  Gift,
  Edit,
  Star,
  Copy,
  CreditCard,
  X,
  Menu,
  Share2,
  ArrowRight,
  CheckCircle2,
  Send,
  Eye,
  ArrowDownLeft,
  Upload,
  Camera,
  ArrowLeft,
  User,
  Plus,
  Percent,
  AlignLeft
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { apiService } from '../../services/apiService';

type DashboardTab = 'overview' | 'bookings' | 'virtual_wallet' | 'referral_wallet' | 'scan' | 'edit_gym';

export const OwnerDashboard: React.FC = () => {
  const { 
    ownerProfile, 
    setOwnerProfile, 
    checkInUserByQR, 
    gyms, 
    userProfile, 
    loginInput, 
    setCurrentRole, 
    setIsLoggedIn,
    setActiveScreen
  } = useGymDate();

  // Navigation & Drawer State
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // QR Checkin Terminal State
  const [showScanModal, setShowScanModal] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; memberName?: string; booking?: any } | null>(null);
  const [isLiveCameraScanning, setIsLiveCameraScanning] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);

  // Edit Details State (Clone of /partner/gym/edit)
  const [editGymName, setEditGymName] = useState('');
  const [editGymLocation, setEditGymLocation] = useState('');
  const [editLat, setEditLat] = useState('17.161922');
  const [editLng, setEditLng] = useState('78.658058');
  const [editRating, setEditRating] = useState('4.6');
  const [editReviews, setEditReviews] = useState('1');
  const [editHasOffer, setEditHasOffer] = useState(false);
  const [editOfferPercentage, setEditOfferPercentage] = useState('10');
  const [editDescription, setEditDescription] = useState('');
  const [editPrimaryImage, setEditPrimaryImage] = useState('');
  const [editGallery, setEditGallery] = useState<string[]>([]);
  const [editPlans, setEditPlans] = useState<{ id?: string; name: string; price: string }[]>([]);
  const [editAmenities, setEditAmenities] = useState<string[]>([]);
  const [newCustomAmenity, setNewCustomAmenity] = useState('');
  const [isLocatingMe, setIsLocatingMe] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  // Operational & Promotional State
  const [isOpenStatus, setIsOpenStatus] = useState(true);
  const [hasOffer, setHasOffer] = useState(false);
  const [offerPercentage, setOfferPercentage] = useState('15');
  const [isUpdatingOffer, setIsUpdatingOffer] = useState(false);

  // Referral & Virtual Wallet State
  const [copied, setCopied] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPayoutType, setWithdrawPayoutType] = useState<'revenue' | 'referral'>('revenue');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'upi'>('bank');
  const [withdrawAmount, setWithdrawAmount] = useState('500');
  const [withdrawBankName, setWithdrawBankName] = useState('');
  const [withdrawAccountHolder, setWithdrawAccountHolder] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawIfsc, setWithdrawIfsc] = useState('');
  const [withdrawUpiId, setWithdrawUpiId] = useState('');
  const [qrCodeFile, setQrCodeFile] = useState<any>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string>('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawSuccessMsg, setWithdrawSuccessMsg] = useState('');
  const [walletData, setWalletData] = useState<any>({
    virtual_wallet: {
      balance: 0,
      total_revenue: 0,
      total_withdrawn: 0,
      min_withdrawal: 500,
      history: []
    },
    referral_wallet: {
      balance: 0,
      total_earned: 0,
      total_referred_gyms: 0,
      bonus_per_referral: 100,
      min_withdrawal: 1500,
      referral_code: 'CULTFIT50',
      referral_link: 'https://gymdate.in/partner?ref=CULTFIT50',
      history: []
    },
    wallet_balance: 0,
    referral_code: 'CULTFIT50',
    referral_link: 'https://gymdate.in/partner?ref=CULTFIT50',
    total_referred_gyms: 0,
    referral_earnings: 0,
    min_withdrawal: 1500,
    payouts: []
  });

  // QR Scanning state
  const [isScanningQR, setIsScanningQR] = useState(false);

  // Live Data State
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [liveStats, setLiveStats] = useState({
    totalRevenue: 12,
    totalBookings: 12,
    activeMembers: 4,
    payoutPending: 12
  });
  const [partnerBookings, setPartnerBookings] = useState<any[]>([]);
  const [partnerGym, setPartnerGym] = useState<any>(null);

  const currentEmail = (loginInput || userProfile.email || 'neelaakhilkumar50@gmail.com').toLowerCase();
  const activeGym = partnerGym || 
    gyms.find(g => 
      (ownerProfile.gymName && g.name.toLowerCase() === ownerProfile.gymName.toLowerCase()) ||
      (currentEmail && (g as any).owner_email?.toLowerCase() === currentEmail) ||
      (currentEmail.includes('sailakshmi') && g.name.toLowerCase().includes('national')) ||
      (currentEmail.includes('neelaakhil') && g.name.toLowerCase().includes('cult')) ||
      (currentEmail.includes('cult') && g.name.toLowerCase().includes('cult'))
    ) || (currentEmail.includes('sailakshmi') ? gyms.find(g => g.name.toLowerCase().includes('national')) : null)
    || gyms[0];

  const virtualWallet = {
    balance: walletData?.virtual_wallet?.balance ?? (liveStats.totalRevenue || 0),
    total_revenue: walletData?.virtual_wallet?.total_revenue ?? (liveStats.totalRevenue || 0),
    total_withdrawn: walletData?.virtual_wallet?.total_withdrawn ?? 0,
    min_withdrawal: walletData?.virtual_wallet?.min_withdrawal ?? 500,
    history: walletData?.virtual_wallet?.history ?? (walletData?.payouts || [])
  };

  const referralWallet = {
    balance: walletData?.referral_wallet?.balance ?? (walletData?.wallet_balance ?? 0),
    total_earned: walletData?.referral_wallet?.total_earned ?? (walletData?.referral_earnings ?? 0),
    total_referred_gyms: walletData?.referral_wallet?.total_referred_gyms ?? (walletData?.total_referred_gyms ?? 0),
    bonus_per_referral: walletData?.referral_wallet?.bonus_per_referral ?? 100,
    min_withdrawal: walletData?.referral_wallet?.min_withdrawal ?? (walletData?.min_withdrawal ?? 1500),
    referral_code: walletData?.referral_wallet?.referral_code ?? (walletData?.referral_code ?? 'CULTFIT50'),
    referral_link: walletData?.referral_wallet?.referral_link ?? (walletData?.referral_link ?? 'https://gymdate.in/partner?ref=CULTFIT50'),
    history: walletData?.referral_wallet?.history ?? []
  };

  const fetchLiveDashboard = async () => {
    setIsLoadingData(true);
    try {
      const email = loginInput || userProfile.email || 'neelaakhilkumar50@gmail.com';
      const [data, wData] = await Promise.all([
        apiService.getPartnerDashboardData(email),
        apiService.getPartnerWalletData(email)
      ]);
      
      if (data && data.success) {
        if (data.bookings && data.bookings.length > 0) {
          setPartnerBookings(data.bookings);
        }
        if (data.stats) {
          setLiveStats(data.stats);
        }
        if (data.gym) {
          setPartnerGym(data.gym);
          setIsOpenStatus(data.gym.status !== 'Closed');
          setHasOffer(Boolean(data.gym.has_offer));
          if (data.gym.offer_percentage) {
            setOfferPercentage(String(data.gym.offer_percentage));
          }
        }
      }

      if (wData && wData.success) {
        setWalletData(wData);
      }
    } catch (err) {
      console.warn('[OwnerDashboard] Failed to fetch live stats:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchLiveDashboard();
  }, [loginInput, userProfile.email, activeGym?.id]);

  useEffect(() => {
    if (activeGym) {
      setEditGymName(activeGym.name || 'cultfit gym');
      setEditGymLocation(activeGym.location || 'Hyderabad, Telangana');
      setEditDescription(activeGym.description || 'Premium fitness facility offering high-energy workouts and state-of-the-art strength gear.');
    }
  }, [activeGym]);

  const handleToggleStatus = (val: boolean) => {
    setIsOpenStatus(val);
  };

  const handleTerminalScanWithCode = async (overrideCode?: string) => {
    const codeToValidate = (overrideCode || terminalInput || '').trim();
    if (!codeToValidate) {
      setScanResult({
        success: false,
        message: 'Please point camera at a QR pass or enter code.'
      });
      return;
    }

    setIsScanningQR(true);
    try {
      const res = await apiService.verifyPartnerTicket(codeToValidate, currentEmail);
      if (res && res.success) {
        setScanResult({
          success: true,
          message: res.message || 'Pass verified successfully! Member is admitted.',
          memberName: res.memberName || 'Gym Member',
          booking: res.booking
        });
        fetchLiveDashboard();
      } else {
        setScanResult({
          success: false,
          message: res.error || 'Ticket not found or invalid for this gym.',
          booking: res.booking
        });
      }
    } catch (err: any) {
      setScanResult({
        success: false,
        message: err.message || 'Failed to verify ticket with database.'
      });
    } finally {
      setIsScanningQR(false);
    }
  };

  const handleTerminalScan = () => handleTerminalScanWithCode();

  useEffect(() => {
    let scannerInstance: any = null;

    if (activeTab === 'scan' && isLiveCameraScanning && Platform.OS === 'web') {
      const timer = setTimeout(() => {
        try {
          const element = document.getElementById('reader');
          if (element) {
            scannerInstance = new Html5QrcodeScanner(
              'reader',
              { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
              },
              false
            );

            scannerInstance.render(
              async (decodedText: string) => {
                if (scannerInstance) {
                  scannerInstance.clear().catch(() => {});
                }
                setIsLiveCameraScanning(false);
                let bookingId = decodedText.trim();
                if (bookingId.includes('/verify/')) {
                  bookingId = bookingId.split('/verify/')[1].split('?')[0];
                } else if (bookingId.includes('://')) {
                  const urlParts = bookingId.split('/');
                  bookingId = urlParts[urlParts.length - 1].split('?')[0];
                }
                setTerminalInput(bookingId);
                await handleTerminalScanWithCode(bookingId);
              },
              () => {}
            );
          }
        } catch (e) {
          console.warn('Failed to initialize html5-qrcode scanner:', e);
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        if (scannerInstance) {
          scannerInstance.clear().catch((err: any) => console.warn('Failed to clear scanner:', err));
        }
      };
    }
  }, [activeTab, isLiveCameraScanning, scannerKey]);

  const defaultAmenitiesList = [
    'AC', 'Personal Trainer', 'Parking', 'Locker Room', 
    'WiFi', 'Supplements', 'Steam Room', 'Sauna', 
    'Yoga Mats', 'Zumba Classes', 'Shower', 'Crossfit Rig'
  ];

  const formatImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('file://')) {
      return url;
    }
    return `https://gymdate.in${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const openEditGymScreen = () => {
    const gymToEdit = partnerGym || activeGym;
    if (gymToEdit) {
      setEditGymName(gymToEdit.name || 'CULTFIT GYM');
      setEditGymLocation(gymToEdit.location || 'Hyderabad, Telangana');
      setEditLat(gymToEdit.lat ? String(gymToEdit.lat) : '17.161922');
      setEditLng(gymToEdit.lng ? String(gymToEdit.lng) : '78.658058');
      setEditRating(gymToEdit.rating ? String(gymToEdit.rating) : '4.6');
      setEditReviews(gymToEdit.reviews ? String(gymToEdit.reviews) : '1');
      setEditHasOffer(Boolean(gymToEdit.has_offer));
      setEditOfferPercentage(gymToEdit.offer_percentage ? String(gymToEdit.offer_percentage) : '10');
      setEditDescription(gymToEdit.description || 'Premium fitness facility offering high-energy workouts and state-of-the-art strength gear.');

      const coverImg = formatImageUrl(gymToEdit.image) || 'https://gymdate.in/uploads/gyms/1787212199835-j01we.png';
      setEditPrimaryImage(coverImg);

      const rawGallery = gymToEdit.gallery || [];
      const formattedGallery = Array.isArray(rawGallery) && rawGallery.length > 0
        ? rawGallery.map((g: string) => formatImageUrl(g))
        : [coverImg];
      setEditGallery(formattedGallery);

      const rawAmenities = gymToEdit.amenities || [];
      setEditAmenities(Array.isArray(rawAmenities) && rawAmenities.length > 0 ? rawAmenities : ['sdfbg', 'wertyuytrew', 'AC', 'Personal Trainer', 'Parking', 'WiFi']);
      
      const gymPlans = gymToEdit.plans && gymToEdit.plans.length > 0 
        ? gymToEdit.plans.map((p: any) => ({ name: p.name, price: String(p.price).replace(/[^0-9.]/g, '') }))
        : [
            { name: 'Monthly', price: '1' },
            { name: 'Weekly Pass', price: '499' },
            { name: '10-Day Pack', price: '699' },
            { name: 'Daily Pass', price: '99' }
          ];
      setEditPlans(gymPlans);
    }
    setActiveTab('edit_gym');
  };

  const handleLocateMe = () => {
    setIsLocatingMe(true);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setEditLat(latitude.toString());
          setEditLng(longitude.toString());
          setEditGymLocation(`https://www.google.com/maps?q=${latitude},${longitude}`);
          setIsLocatingMe(false);
        },
        () => {
          setIsLocatingMe(false);
        }
      );
    } else {
      setIsLocatingMe(false);
    }
  };

  const handlePickPrimaryImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const uploadRes = await apiService.uploadPayoutQrCode(asset.base64);
          if (uploadRes.success && uploadRes.url) {
            setEditPrimaryImage(uploadRes.url);
          } else {
            setEditPrimaryImage(asset.uri);
          }
        } else {
          setEditPrimaryImage(asset.uri);
        }
      }
    } catch (e) {
      console.warn('Image pick error:', e);
    }
  };

  const handlePickGalleryImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const uploadRes = await apiService.uploadPayoutQrCode(asset.base64);
          if (uploadRes.success && uploadRes.url) {
            setEditGallery(prev => [...prev, uploadRes.url!]);
          } else {
            setEditGallery(prev => [...prev, asset.uri]);
          }
        } else {
          setEditGallery(prev => [...prev, asset.uri]);
        }
      }
    } catch (e) {
      console.warn('Gallery pick error:', e);
    }
  };

  const handleAddPlan = () => {
    setEditPlans(prev => [...prev, { name: 'New Plan', price: '499' }]);
  };

  const handleRemovePlan = (idx: number) => {
    setEditPlans(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdatePlan = (idx: number, field: 'name' | 'price', val: string) => {
    setEditPlans(prev => prev.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };

  const toggleAmenity = (amenityName: string) => {
    if (editAmenities.includes(amenityName)) {
      setEditAmenities(prev => prev.filter(a => a !== amenityName));
    } else {
      setEditAmenities(prev => [...prev, amenityName]);
    }
  };

  const handleAddCustomAmenity = () => {
    if (newCustomAmenity.trim() && !editAmenities.includes(newCustomAmenity.trim())) {
      setEditAmenities(prev => [...prev, newCustomAmenity.trim()]);
      setNewCustomAmenity('');
    }
  };

  const handleRemoveCustomAmenity = (amenityName: string) => {
    setEditAmenities(prev => prev.filter(a => a !== amenityName));
  };

  const handleSaveGymProfile = async () => {
    if (!editGymName.trim()) {
      if (Platform.OS === 'web') alert('Gym name is required');
      return;
    }
    setIsSavingEdit(true);
    setEditSuccessMsg('');

    try {
      const payload = {
        gym_id: partnerGym?.id,
        email: currentEmail,
        name: editGymName.trim(),
        location: editGymLocation.trim(),
        lat: editLat,
        lng: editLng,
        rating: editRating,
        reviews: editReviews,
        has_offer: editHasOffer,
        offer_percentage: editOfferPercentage,
        description: editDescription.trim(),
        image: editPrimaryImage,
        gallery: editGallery,
        amenities: editAmenities,
        plans: editPlans
      };

      const res = await apiService.updateGymProfile(payload);
      if (res && res.success) {
        setEditSuccessMsg('Gym profile updated successfully!');
        setOwnerProfile(prev => ({ ...prev, gymName: editGymName }));
        if (res.gym) {
          setPartnerGym(res.gym);
        }
        setTimeout(() => {
          setEditSuccessMsg('');
          setActiveTab('overview');
        }, 1200);
      } else {
        if (Platform.OS === 'web') alert(res.error || 'Failed to update gym profile');
      }
    } catch (err: any) {
      if (Platform.OS === 'web') alert(err.message || 'Error updating gym profile');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSaveOffer = () => {
    setIsUpdatingOffer(true);
    setTimeout(() => {
      setIsUpdatingOffer(false);
      if (Platform.OS === 'web') {
        alert('Promotional offer updated successfully!');
      }
    }, 600);
  };

  const handleCopyReferral = () => {
    const link = referralWallet.referral_link;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePickQrImage = async () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          setQrCodeFile(file);
          const reader = new FileReader();
          reader.onload = () => {
            setQrCodePreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Permission to access photos is required to upload QR screenshot.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets[0]) {
          const asset = result.assets[0];
          setQrCodePreview(asset.uri);
          setQrCodeFile(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri);
        }
      } catch (err) {
        console.warn('Image picker error:', err);
      }
    }
  };

  const openWithdrawModal = (type: 'revenue' | 'referral') => {
    setWithdrawPayoutType(type);
    const minVal = type === 'revenue' ? virtualWallet.min_withdrawal : referralWallet.min_withdrawal;
    setWithdrawAmount(String(minVal));
    setWithdrawSuccessMsg('');
    setQrCodeFile(null);
    setQrCodePreview('');
    setShowWithdrawModal(true);
  };

  const handleWithdrawSubmit = async () => {
    const amountNum = parseFloat(withdrawAmount) || 0;
    const minLimit = withdrawPayoutType === 'revenue' ? virtualWallet.min_withdrawal : referralWallet.min_withdrawal;
    const maxAvailable = withdrawPayoutType === 'revenue' ? virtualWallet.balance : referralWallet.balance;

    if (amountNum < minLimit) {
      setWithdrawSuccessMsg(`Minimum withdrawal amount is ₹${minLimit.toLocaleString()}`);
      return;
    }
    if (amountNum > maxAvailable) {
      setWithdrawSuccessMsg(`Requested amount exceeds available balance of ₹${maxAvailable.toLocaleString()}`);
      return;
    }

    setIsWithdrawing(true);
    try {
      let uploadedQrUrl: string | undefined = undefined;
      if (qrCodeFile) {
        const upRes = await apiService.uploadPayoutQrCode(qrCodeFile);
        if (upRes && upRes.url) {
          uploadedQrUrl = upRes.url;
        }
      }

      const payload = {
        email: currentEmail,
        amount: amountNum,
        payout_method: withdrawMethod,
        payout_type: withdrawPayoutType,
        bank_name: withdrawBankName,
        account_holder: withdrawAccountHolder,
        account_number: withdrawAccountNumber,
        ifsc_code: withdrawIfsc,
        upi_id: withdrawUpiId,
        qr_code_url: uploadedQrUrl
      };
      const res = await apiService.submitPartnerPayoutRequest(payload);
      if (res && res.success) {
        setWithdrawSuccessMsg(res.message || 'Withdrawal request submitted! Super Admin will review shortly.');
        fetchLiveDashboard();
      } else {
        setWithdrawSuccessMsg(res.error || 'Failed to submit withdrawal.');
      }
    } catch (e: any) {
      setWithdrawSuccessMsg(e.message || 'Error submitting request.');
    } finally {
      setIsWithdrawing(false);
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccessMsg('');
        setQrCodeFile(null);
        setQrCodePreview('');
      }, 2500);
    }
  };

  const handleSignOut = () => {
    setCurrentRole('member');
    setIsLoggedIn(false);
    setActiveScreen('onboarding');
  };

  return (
    <View style={styles.outerContainer}>
      {/* 📱 SIDEBAR DRAWER OVERLAY (MATCHING WEBSITE) */}
      {isSidebarOpen && (
        <View style={styles.drawerOverlay}>
          <TouchableOpacity 
            style={styles.drawerBackdrop} 
            activeOpacity={1} 
            onPress={() => setIsSidebarOpen(false)} 
          />
          <View style={styles.drawerContent}>
            {/* Sidebar Brand Header */}
            <View style={styles.drawerHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.brandIconBox}>
                  <Building2 size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={styles.brandTitle}>GymDate</Text>
                  <Text style={styles.brandSubtitle}>PARTNER PANEL</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)} style={styles.closeDrawerBtn}>
                <X size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Sidebar Navigation Items */}
            <View style={styles.drawerNavList}>
              <TouchableOpacity 
                style={[styles.drawerNavItem, activeTab === 'overview' && styles.drawerNavItemActive]}
                onPress={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
              >
                <LayoutDashboard size={18} color={activeTab === 'overview' ? '#FFFFFF' : '#94A3B8'} />
                <Text style={[styles.drawerNavText, activeTab === 'overview' && styles.drawerNavTextActive]}>
                  My Gym Overview
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.drawerNavItem, activeTab === 'bookings' && styles.drawerNavItemActive]}
                onPress={() => { setActiveTab('bookings'); setIsSidebarOpen(false); }}
              >
                <CreditCard size={18} color={activeTab === 'bookings' ? '#FFFFFF' : '#94A3B8'} />
                <Text style={[styles.drawerNavText, activeTab === 'bookings' && styles.drawerNavTextActive]}>
                  Bookings & Revenue
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.drawerNavItem, activeTab === 'virtual_wallet' && styles.drawerNavItemActive]}
                onPress={() => { setActiveTab('virtual_wallet'); setIsSidebarOpen(false); }}
              >
                <Wallet size={18} color={activeTab === 'virtual_wallet' ? '#FFFFFF' : '#94A3B8'} />
                <Text style={[styles.drawerNavText, activeTab === 'virtual_wallet' && styles.drawerNavTextActive]}>
                  Virtual Wallet (Revenue)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.drawerNavItem, activeTab === 'referral_wallet' && styles.drawerNavItemActive]}
                onPress={() => { setActiveTab('referral_wallet'); setIsSidebarOpen(false); }}
              >
                <Gift size={18} color={activeTab === 'referral_wallet' ? '#FFFFFF' : '#94A3B8'} />
                <Text style={[styles.drawerNavText, activeTab === 'referral_wallet' && styles.drawerNavTextActive]}>
                  Referral Rewards
                </Text>
              </TouchableOpacity>

              {/* 📷 Scan Entry QR Item in Sidebar */}
              <TouchableOpacity 
                style={[styles.drawerNavItem, activeTab === 'scan' && styles.drawerNavItemActive, { backgroundColor: activeTab === 'scan' ? THEME.COLORS.primary : '#1E293B' }]}
                onPress={() => { setActiveTab('scan'); setIsSidebarOpen(false); setIsLiveCameraScanning(true); setScannerKey(k => k + 1); }}
              >
                <QrCode size={18} color={activeTab === 'scan' ? '#FFFFFF' : THEME.COLORS.primary} />
                <Text style={[styles.drawerNavText, { color: '#FFFFFF', fontWeight: '800' }]}>
                  Scan Entry QR Pass
                </Text>
              </TouchableOpacity>
            </View>

            {/* Drawer Bottom Actions */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity 
                style={styles.drawerUserViewBtn}
                onPress={() => { setCurrentRole('member'); setIsSidebarOpen(false); }}
              >
                <Users size={16} color="#CBD5E1" />
                <Text style={styles.drawerUserViewText}>Switch to User View</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.drawerLogoutBtn}
                onPress={handleSignOut}
              >
                <LogOut size={16} color="#EF4444" />
                <Text style={styles.drawerLogoutText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* 🔝 TOP NAVIGATION BAR (CLEAN HEADER) */}
      <View style={styles.topNavbar}>
        <TouchableOpacity 
          style={styles.menuToggleBtn} 
          onPress={() => setIsSidebarOpen(true)}
          activeOpacity={0.8}
        >
          <Menu size={20} color="#1E293B" />
        </TouchableOpacity>

        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A', textTransform: 'uppercase', letterSpacing: -0.2 }}>
              {activeGym?.name || 'Partner Admin'}
            </Text>
            <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#64748B' }}>
              {activeTab === 'overview' ? 'Overview' : activeTab === 'bookings' ? 'Bookings & Revenue' : activeTab === 'virtual_wallet' ? 'Virtual Wallet' : activeTab === 'referral_wallet' ? 'Referral Rewards' : 'QR Scanner'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: isOpenStatus ? '#DCFCE7' : '#FEE2E2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isOpenStatus ? '#10B981' : '#EF4444' }} />
            <Text style={{ fontSize: 10, fontWeight: '800', color: isOpenStatus ? '#059669' : '#DC2626' }}>
              {isOpenStatus ? 'OPEN' : 'CLOSED'}
            </Text>
          </View>
        </View>
      </View>

      {/* 📜 MAIN SCROLLABLE CONTENT */}
      <ScrollView 
        style={styles.mainScrollView}
        contentContainerStyle={{ paddingBottom: 90, paddingHorizontal: 16, paddingTop: 10 }}
        refreshControl={
          <RefreshControl refreshing={isLoadingData} onRefresh={fetchLiveDashboard} tintColor={THEME.COLORS.primary} />
        }
      >
        {/* ============================================================== */}
        {/* TAB 1: MY GYM OVERVIEW                                          */}
        {/* ============================================================== */}
        {activeTab === 'overview' && (
          <View style={styles.tabContentWrapper}>
            {/* Header Title & Action Buttons */}
            <View style={styles.overviewHeaderRow}>
              <View>
                <Text style={styles.pageTitle}>My Gym Overview</Text>
                <Text style={styles.pageSubtitle}>Manage your public listing and track your rating.</Text>
              </View>
              
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity 
                  style={styles.btnScanEntry}
                  onPress={() => { setActiveTab('scan'); setIsLiveCameraScanning(true); setScannerKey(k => k + 1); }}
                  activeOpacity={0.85}
                >
                  <QrCode size={14} color="#FFFFFF" style={{ marginRight: 5 }} />
                  <Text style={styles.btnScanEntryText}>Scan Entry QR</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.btnEditDetails}
                  onPress={openEditGymScreen}
                  activeOpacity={0.85}
                >
                  <Edit size={13} color="#334155" style={{ marginRight: 5 }} />
                  <Text style={styles.btnEditDetailsText}>Edit Details</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 1. HERO GYM BANNER CARD */}
            <View style={styles.gymHeroCard}>
              <View style={styles.gymHeroImageContainer}>
                <Image 
                  source={{ uri: activeGym?.image || 'https://gymdate.in/uploads/gyms/1787212199835-j01we.png' }} 
                  style={styles.gymHeroImage}
                  resizeMode="cover"
                />
                <View style={styles.ratingBadge}>
                  <Star size={12} color="#EAB308" fill="#EAB308" style={{ marginRight: 3 }} />
                  <Text style={styles.ratingBadgeText}>{activeGym?.rating || '4.5'} ({activeGym?.reviews || '0'} reviews)</Text>
                </View>
              </View>

              <View style={styles.gymHeroDetails}>
                <Text style={styles.gymTitleText}>{activeGym?.name || 'cultfit gym'}</Text>
                <TouchableOpacity 
                  style={styles.locationLinkRow}
                  onPress={() => activeGym?.location && activeGym.location.startsWith('http') ? Linking.openURL(activeGym.location) : null}
                >
                  <MapPin size={13} color="#EF4444" style={{ marginRight: 4 }} />
                  <Text style={styles.locationLinkText} numberOfLines={1}>
                    {activeGym?.location || 'Hyderabad, Telangana'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <Text style={styles.sectionHeading}>Description</Text>
                <Text style={styles.descriptionText}>
                  {activeGym?.description || 'Premium fitness facility offering high-energy workouts and state-of-the-art strength gear.'}
                </Text>
              </View>
            </View>

            {/* 2. OPERATIONAL STATUS & PROMOTIONS GRID */}
            <View style={styles.cardsGrid}>
              {/* OPERATIONAL STATUS CARD */}
              <View style={styles.sideCard}>
                <Text style={styles.sideCardTitle}>Operational Status</Text>
                <View style={styles.statusBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={16} color={isOpenStatus ? '#059669' : '#DC2626'} />
                    <View>
                      <Text style={[styles.statusText, { color: isOpenStatus ? '#059669' : '#DC2626' }]}>
                        {isOpenStatus ? 'Open' : 'Closed'}
                      </Text>
                      <Text style={styles.statusSubText}>
                        {isOpenStatus ? 'Visible to customers' : 'Temporarily paused'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.statusToggleBtn}
                    onPress={() => setIsOpenStatus(!isOpenStatus)}
                  >
                    <Text style={styles.statusToggleText}>
                      {isOpenStatus ? 'Close Gym' : 'Open Gym'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* PROMOTIONAL OFFER CARD */}
              <View style={styles.sideCard}>
                <Text style={styles.sideCardTitle}>Promotional Offer</Text>
                <View style={styles.offerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.offerLabel}>Activate Discount</Text>
                    <Text style={styles.offerSub}>Apply to all memberships</Text>
                  </View>
                  <Switch 
                    value={hasOffer} 
                    onValueChange={setHasOffer}
                    trackColor={{ false: '#E2E8F0', true: '#EF4444' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {hasOffer && (
                  <View style={styles.offerInputWrapper}>
                    <Text style={styles.offerInputLabel}>Discount %</Text>
                    <TextInput 
                      value={offerPercentage}
                      onChangeText={setOfferPercentage}
                      keyboardType="numeric"
                      style={styles.offerTextInput}
                    />
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.saveOfferBtn}
                  onPress={handleSaveOffer}
                  disabled={isUpdatingOffer}
                >
                  {isUpdatingOffer ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveOfferBtnText}>Save Offer Settings</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* QUICK STATS CARD */}
              <View style={styles.sideCard}>
                <Text style={styles.sideCardTitle}>Quick Stats</Text>
                
                <View style={styles.quickStatRow}>
                  <Text style={styles.quickStatLabel}>Total Bookings</Text>
                  <Text style={styles.quickStatVal}>{liveStats.totalBookings}</Text>
                </View>
                
                <View style={styles.quickStatRow}>
                  <Text style={styles.quickStatLabel}>Total Net Revenue</Text>
                  <Text style={styles.quickStatValGreen}>₹{liveStats.totalRevenue.toLocaleString()}</Text>
                </View>

                <View style={[styles.quickStatRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.quickStatLabel}>Commission Rate</Text>
                  <Text style={styles.quickStatVal}>10%</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 2: BOOKINGS & REVENUE                                       */}
        {/* ============================================================== */}
        {activeTab === 'bookings' && (
          <View style={styles.tabContentWrapper}>
            <Text style={styles.pageTitle}>Bookings & Revenue</Text>
            <Text style={styles.pageSubtitle}>Live check-in history and revenue payouts breakdown.</Text>

            {/* Stats Overview: EXACT 3 CARDS MATCHING WEBSITE */}
            <View style={styles.statsRowThree}>
              {/* 1. Total Revenue */}
              <View style={styles.statMetricCardCol}>
                <View style={styles.statCardHeaderRow}>
                  <View style={styles.statMetricIconBoxGreen}>
                    <DollarSign size={16} color="#059669" />
                  </View>
                  <View style={styles.statPercentBadge}>
                    <TrendingUp size={10} color="#059669" style={{ marginRight: 2 }} />
                    <Text style={styles.statPercentText}>+0%</Text>
                  </View>
                </View>
                <Text style={styles.statMetricLabel}>Total Revenue</Text>
                <Text style={styles.statMetricValGreen}>₹{liveStats.totalRevenue.toLocaleString()}</Text>
              </View>

              {/* 2. Total Bookings */}
              <View style={styles.statMetricCardCol}>
                <View style={styles.statCardHeaderRow}>
                  <View style={styles.statMetricIconBoxBlue}>
                    <Calendar size={16} color="#2563EB" />
                  </View>
                </View>
                <Text style={styles.statMetricLabel}>Total Bookings</Text>
                <Text style={styles.statMetricValDark}>{liveStats.totalBookings}</Text>
              </View>

              {/* 3. Unique Customers */}
              <View style={styles.statMetricCardCol}>
                <View style={styles.statCardHeaderRow}>
                  <View style={styles.statMetricIconBoxPurple}>
                    <Users size={16} color="#7C3AED" />
                  </View>
                </View>
                <Text style={styles.statMetricLabel}>Unique Customers</Text>
                <Text style={styles.statMetricValDark}>{liveStats.activeMembers}</Text>
              </View>
            </View>

            {/* Bookings List Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Recent Transactions</Text>
                <TouchableOpacity onPress={fetchLiveDashboard}>
                  <Text style={styles.viewAllBtnText}>View All</Text>
                </TouchableOpacity>
              </View>

              {partnerBookings.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 28 }}>
                  <Users size={32} color="#CBD5E1" style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B' }}>No Customer Bookings Yet</Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 }}>
                    Real-time member passes and customer transactions booked for your gym will appear here.
                  </Text>
                </View>
              ) : (
                partnerBookings.map((b, idx) => (
                  <View key={b.id || idx} style={styles.bookingRowItem}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.bookingUserName}>{b.customer_name || 'Gym Member'}</Text>
                      {b.customer_email ? (
                        <Text style={styles.bookingEmailText} numberOfLines={1}>{b.customer_email}</Text>
                      ) : null}
                      <Text style={styles.bookingUserPlan}>{b.plan_name || 'Yearly'} • {new Date(b.created_at || Date.now()).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                      <Text style={styles.bookingAmountText}>₹{Number(b.amount || 0).toLocaleString()}</Text>
                      <View style={styles.confirmedPill}>
                        <Text style={styles.confirmedPillText}>{(b.status || 'SUCCESS').toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 3: VIRTUAL WALLET (REVENUE)                                 */}
        {/* ============================================================== */}
        {activeTab === 'virtual_wallet' && (
          <View style={styles.tabContentWrapper}>
            <Text style={styles.pageTitle}>Virtual Wallet</Text>
            <Text style={styles.pageSubtitle}>Live check-in subscription payouts & net gym revenue balance.</Text>

            {/* Virtual Revenue Wallet Card */}
            <View style={styles.walletHeroCard}>
              <View style={styles.walletHeaderRow}>
                <View style={{ flex: 1, minWidth: 100 }}>
                  <Text style={styles.walletHeroLabel}>VIRTUAL REVENUE BALANCE</Text>
                  <Text style={styles.walletHeroBalance}>₹{virtualWallet.balance.toLocaleString()}</Text>
                </View>
                <View style={[styles.walletBadge, { backgroundColor: '#1E293B' }]}>
                  <Wallet size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.walletBadgeText}>Gym Revenue</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                <View>
                  <Text style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: '700' }}>Gross Net Earned</Text>
                  <Text style={{ fontSize: 13, color: '#10B981', fontWeight: '800' }}>₹{virtualWallet.total_revenue.toLocaleString()}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: '700' }}>Total Withdrawn</Text>
                  <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '800' }}>₹{virtualWallet.total_withdrawn.toLocaleString()}</Text>
                </View>
              </View>

              <Text style={styles.walletHeroDesc}>
                Minimum withdrawal threshold: ₹{virtualWallet.min_withdrawal.toLocaleString()}
              </Text>

              <TouchableOpacity 
                style={styles.withdrawBtn}
                onPress={() => openWithdrawModal('revenue')}
                activeOpacity={0.85}
              >
                <Send size={14} color="#0F172A" style={{ marginRight: 8 }} />
                <Text style={styles.withdrawBtnText}>Request Revenue Payout</Text>
              </TouchableOpacity>
            </View>

            {/* Revenue Payout Requests History */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Revenue Withdrawal History</Text>
                <Text style={styles.countBadge}>{virtualWallet.history.length} Total</Text>
              </View>

              {virtualWallet.history.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Wallet size={26} color="#CBD5E1" style={{ marginBottom: 6 }} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>No revenue payout requests yet</Text>
                  <Text style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>
                    Withdrawals from gym membership earnings will appear here.
                  </Text>
                </View>
              ) : (
                virtualWallet.history.map((p: any, idx: number) => {
                  const status = (p.status || 'PENDING').toLowerCase();
                  const isApproved = status === 'approved' || status === 'completed';
                  return (
                    <View key={p.id || idx} style={styles.bookingRowItem}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.bookingUserName}>
                          ₹{parseFloat(p.amount || 0).toLocaleString()} • {p.payout_method === 'upi' ? 'UPI Transfer' : 'Bank Transfer'}
                        </Text>
                        <Text style={styles.bookingUserPlan}>{new Date(p.created_at || Date.now()).toLocaleDateString()}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <View style={[
                          styles.confirmedPill,
                          { backgroundColor: isApproved ? '#DCFCE7' : status === 'rejected' ? '#FEE2E2' : '#FEF3C7' }
                        ]}>
                          <Text style={[
                            styles.confirmedPillText, 
                            { color: isApproved ? '#059669' : status === 'rejected' ? '#DC2626' : '#D97706' }
                          ]}>
                            {(p.status || 'PENDING').toUpperCase()}
                          </Text>
                        </View>
                        {p.payment_proof_url && (
                          <TouchableOpacity 
                            style={styles.viewReceiptBtn}
                            onPress={() => setSelectedProofUrl(p.payment_proof_url)}
                          >
                            <Eye size={11} color="#2563EB" style={{ marginRight: 3 }} />
                            <Text style={styles.viewReceiptBtnText}>Receipt</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 4: REFERRAL & REWARDS (REFERRAL WALLET)                     */}
        {/* ============================================================== */}
        {activeTab === 'referral_wallet' && (
          <View style={styles.tabContentWrapper}>
            <Text style={styles.pageTitle}>Referral & Rewards</Text>
            <Text style={styles.pageSubtitle}>
              Earn ₹{referralWallet.bonus_per_referral} for every fellow gym owner you invite to GymDate.
            </Text>

            {/* Referral Wallet Hero Card */}
            <View style={styles.walletHeroCard}>
              <View style={styles.walletHeaderRow}>
                <View style={{ flex: 1, minWidth: 100 }}>
                  <Text style={styles.walletHeroLabel}>AVAILABLE REFERRAL BONUS</Text>
                  <Text style={styles.walletHeroBalance}>₹{referralWallet.balance.toLocaleString()}</Text>
                </View>
                <View style={styles.walletBadge}>
                  <Gift size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.walletBadgeText}>Partner Rewards</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                <View>
                  <Text style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: '700' }}>Referred Gyms</Text>
                  <Text style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '800' }}>{referralWallet.total_referred_gyms}</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: '700' }}>Total Earned</Text>
                  <Text style={{ fontSize: 13, color: '#10B981', fontWeight: '800' }}>₹{referralWallet.total_earned.toLocaleString()}</Text>
                </View>
              </View>

              <Text style={styles.walletHeroDesc}>
                Minimum withdrawal threshold: ₹{referralWallet.min_withdrawal.toLocaleString()}
              </Text>

              <TouchableOpacity 
                style={styles.withdrawBtn}
                onPress={() => openWithdrawModal('referral')}
                activeOpacity={0.85}
              >
                <Send size={14} color="#0F172A" style={{ marginRight: 8 }} />
                <Text style={styles.withdrawBtnText}>Request Referral Payout</Text>
              </TouchableOpacity>
            </View>

            {/* Referral Link Share Box */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Partner Referral Link</Text>
              <Text style={styles.cardDesc}>
                Share this link with other gym owners in India. Earn ₹{referralWallet.bonus_per_referral} bonus directly to your wallet for each approved gym!
              </Text>

              <View style={styles.referralLinkBox}>
                <Text style={styles.referralLinkText} numberOfLines={1}>
                  {referralWallet.referral_link}
                </Text>
                <TouchableOpacity 
                  style={styles.copyLinkBtn} 
                  onPress={handleCopyReferral}
                >
                  <Copy size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.copyLinkBtnText}>{copied ? 'COPIED!' : 'COPY'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Referral Activity & History */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Referral Activity History</Text>
                <Text style={styles.countBadge}>{referralWallet.history.length} Total</Text>
              </View>

              {referralWallet.history.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Gift size={26} color="#CBD5E1" style={{ marginBottom: 6 }} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>No referral transactions yet</Text>
                  <Text style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>
                    Referral rewards and bonus withdrawals will appear here.
                  </Text>
                </View>
              ) : (
                referralWallet.history.map((item: any, idx: number) => {
                  const isDebit = item.type === 'debit';
                  const isApproved = item.status === 'approved' || item.status === 'completed' || item.status === 'credited';
                  return (
                    <View key={item.id || idx} style={styles.bookingRowItem}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[
                            styles.bookingUserName,
                            { color: isDebit ? '#DC2626' : '#059669', fontWeight: '800' }
                          ]}>
                            {isDebit ? '-' : '+'}₹{parseFloat(item.amount || 0).toLocaleString()}
                          </Text>
                          <Text style={[styles.bookingUserName, { fontSize: 11, color: '#475569', fontWeight: '600' }]}>
                            • {item.detail || (isDebit ? 'Withdrawal' : 'Gym Referral Bonus')}
                          </Text>
                        </View>
                        <Text style={styles.bookingUserPlan}>{new Date(item.created_at || Date.now()).toLocaleDateString()}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <View style={[
                          styles.confirmedPill,
                          { backgroundColor: isApproved ? '#DCFCE7' : item.status === 'rejected' ? '#FEE2E2' : '#FEF3C7' }
                        ]}>
                          <Text style={[
                            styles.confirmedPillText, 
                            { color: isApproved ? '#059669' : item.status === 'rejected' ? '#DC2626' : '#D97706' }
                          ]}>
                            {(item.status || 'CREDITED').toUpperCase()}
                          </Text>
                        </View>
                        {item.payment_proof_url && (
                          <TouchableOpacity 
                            style={styles.viewReceiptBtn}
                            onPress={() => setSelectedProofUrl(item.payment_proof_url)}
                          >
                            <Eye size={11} color="#2563EB" style={{ marginRight: 3 }} />
                            <Text style={styles.viewReceiptBtnText}>Receipt</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 5: ENTRY QR SCANNER (EXACT CLONE OF /partner/scan)          */}
        {/* ============================================================== */}
        {activeTab === 'scan' && (
          <View style={{ backgroundColor: '#0F172A', borderRadius: 24, padding: 16, minHeight: 500, width: '100%' }}>
            {/* Header with Back Arrow and Gym Name */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <TouchableOpacity 
                onPress={() => { setActiveTab('overview'); setIsLiveCameraScanning(false); setScanResult(null); }}
                style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
                activeOpacity={0.8}
              >
                <ArrowLeft size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900', textTransform: 'uppercase', flex: 1, letterSpacing: -0.2 }} numberOfLines={1}>
                {activeGym?.name ? `${activeGym.name} Scanner` : 'Entry Scanner'}
              </Text>
            </View>

            {/* STATE 1: INITIAL STATE (START SCANNING NOW) */}
            {!isLiveCameraScanning && !scanResult && !isScanningQR && (
              <View style={{ alignItems: 'center', paddingVertical: 12, width: '100%' }}>
                <View style={{ width: 80, height: 80, borderRadius: 26, backgroundColor: 'rgba(225, 29, 72, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16, borderWidth: 2, borderColor: 'rgba(225, 29, 72, 0.4)', borderStyle: 'dashed' }}>
                  <Camera size={36} color={THEME.COLORS.primary} />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' }}>Scan QR Ticket</Text>
                <Text style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 4, marginBottom: 20, paddingHorizontal: 10 }}>
                  Point your camera at the customer&apos;s digital ticket to verify entry.
                </Text>

                <TouchableOpacity 
                  style={{ 
                    width: '100%', 
                    backgroundColor: THEME.COLORS.primary, 
                    paddingVertical: 16, 
                    borderRadius: 16, 
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 8,
                    ...Platform.select({
                      web: { boxShadow: '0 8px 24px rgba(225, 29, 72, 0.4)' },
                      default: { elevation: 6 }
                    })
                  }}
                  onPress={() => { setIsLiveCameraScanning(true); setScannerKey(k => k + 1); }}
                  activeOpacity={0.85}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 }}>Start Scanning Now</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STATE 2: ACTIVE CAMERA SCANNING */}
            {isLiveCameraScanning && !scanResult && (
              <View style={{ alignItems: 'center', gap: 14, width: '100%' }}>
                {Platform.OS === 'web' && (
                  <>
                    <style>{`
                      #reader {
                        border: 2px solid rgba(255,255,255,0.15) !important;
                        border-radius: 20px !important;
                        background: #000000 !important;
                        overflow: hidden !important;
                        color: #FFFFFF !important;
                      }
                      #reader video {
                        border-radius: 16px !important;
                        object-fit: cover !important;
                        width: 100% !important;
                      }
                      #reader button {
                        background: #E11D48 !important;
                        color: #FFFFFF !important;
                        border: none !important;
                        padding: 8px 16px !important;
                        border-radius: 10px !important;
                        font-weight: 800 !important;
                        cursor: pointer !important;
                        font-size: 12px !important;
                        margin: 6px 4px !important;
                      }
                      #reader select {
                        background: #1E293B !important;
                        color: #FFFFFF !important;
                        border: 1px solid rgba(255,255,255,0.2) !important;
                        padding: 6px 10px !important;
                        border-radius: 8px !important;
                        margin: 6px 0 !important;
                        font-size: 11px !important;
                      }
                      #reader a {
                        color: #94A3B8 !important;
                        font-size: 11px !important;
                        text-decoration: underline !important;
                      }
                      #reader__scan_region {
                        background: #000000 !important;
                      }
                    `}</style>
                    <div 
                      id="reader" 
                      style={{ 
                        width: '100%', 
                        maxWidth: '300px', 
                        borderRadius: '20px', 
                        overflow: 'hidden', 
                        backgroundColor: '#000000',
                        border: '2px solid rgba(255,255,255,0.15)'
                      }} 
                    />
                  </>
                )}
                <TouchableOpacity 
                  style={{ paddingHorizontal: 18, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10 }}
                  onPress={() => setIsLiveCameraScanning(false)}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Cancel Scan</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STATE 3: LOADING SPINNER */}
            {isScanningQR && (
              <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
                <ActivityIndicator color={THEME.COLORS.primary} size="large" />
                <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '700' }}>Verifying Ticket...</Text>
              </View>
            )}

            {/* STATE 4: SUCCESS (ACCESS GRANTED) */}
            {scanResult && scanResult.success && (
              <View style={{ backgroundColor: '#FFFFFF', borderRadius: 28, overflow: 'hidden' }}>
                <View style={{ backgroundColor: '#10B981', padding: 22, alignItems: 'center' }}>
                  <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                    <ShieldCheck size={32} color="#10B981" />
                  </View>
                  <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Access Granted
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
                    Verified Member Entry
                  </Text>
                </View>

                <View style={{ padding: 20, gap: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={22} color="#64748B" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase' }}>Customer Name</Text>
                      <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }}>{scanResult.memberName || 'Member'}</Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 14, gap: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Building2 size={15} color={THEME.COLORS.primary} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>Subscribed Gym: </Text>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', flex: 1 }}>{scanResult.booking?.gym_name || activeGym?.name || 'Subscribed Gym'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={15} color={THEME.COLORS.primary} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>Membership Plan: </Text>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A', flex: 1 }}>{scanResult.booking?.plan_name || 'Membership Plan'}</Text>
                    </View>
                  </View>

                  <View style={{ backgroundColor: '#F1F5F9', padding: 14, borderRadius: 14, gap: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>Status</Text>
                      <Text style={{ fontSize: 12, color: '#059669', fontWeight: '900' }}>Active</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                      <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>Start Date</Text>
                      <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: '800' }}>
                        {scanResult.booking?.start_date ? new Date(scanResult.booking.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '20 Aug 2026'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
                      <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '700' }}>End Date</Text>
                      <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: '800' }}>
                        {scanResult.booking?.end_date ? new Date(scanResult.booking.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '20 Aug 2027'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={{ backgroundColor: '#0F172A', paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 6 }}
                    onPress={() => { setScanResult(null); setIsLiveCameraScanning(true); setScannerKey(k => k + 1); }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>Done & Scan Next</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STATE 5: ERROR (ACCESS DENIED) */}
            {scanResult && !scanResult.success && (
              <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 2, borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: 28, padding: 22, alignItems: 'center', gap: 14 }}>
                <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={32} color="#FFFFFF" />
                </View>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#EF4444', textTransform: 'uppercase' }}>
                  Access Denied
                </Text>
                <Text style={{ fontSize: 13, color: '#E2E8F0', fontWeight: '700', textAlign: 'center' }}>
                  {scanResult.message}
                </Text>

                <TouchableOpacity 
                  style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginTop: 8 }}
                  onPress={() => { setScanResult(null); setIsLiveCameraScanning(true); setScannerKey(k => k + 1); }}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>Try Another Scan</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ============================================================== */}
        {/* TAB 6: EDIT MY GYM (EXACT CLONE OF /partner/gym/edit)           */}
        {/* ============================================================== */}
        {activeTab === 'edit_gym' && (
          <View style={styles.tabContentWrapper}>
            {/* Header with Back Arrow, Title and Subtitle */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <TouchableOpacity 
                onPress={() => setActiveTab('overview')}
                style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' }}
                activeOpacity={0.8}
              >
                <ArrowLeft size={18} color="#0F172A" />
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>Edit My Gym</Text>
                <Text style={{ fontSize: 11.5, color: '#64748B' }}>Update your public gym profile.</Text>
              </View>
            </View>

            {/* Success Message Banner */}
            {editSuccessMsg ? (
              <View style={{ backgroundColor: '#DCFCE7', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, borderWidth: 1, borderColor: '#86EFAC' }}>
                <Check size={16} color="#16A34A" />
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#16A34A' }}>{editSuccessMsg}</Text>
              </View>
            ) : null}

            {/* CARD 1: GYM PROFILE */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Gym Profile</Text>

              {/* Gym Name */}
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', marginBottom: 6 }}>Gym Name</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12 }}>
                  <Building2 size={15} color={THEME.COLORS.primary} style={{ marginRight: 8 }} />
                  <TextInput 
                    value={editGymName}
                    onChangeText={setEditGymName}
                    placeholder="e.g. National Gym"
                    placeholderTextColor="#94A3B8"
                    style={{ flex: 1, height: 44, fontSize: 13, color: '#0F172A', fontWeight: '600' }}
                  />
                </View>
              </View>

              {/* Location */}
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', marginBottom: 6 }}>Location</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12 }}>
                  <MapPin size={15} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput 
                    value={editGymLocation}
                    onChangeText={setEditGymLocation}
                    placeholder="https://maps.app.goo.gl/..."
                    placeholderTextColor="#94A3B8"
                    style={{ flex: 1, height: 44, fontSize: 12, color: '#0F172A' }}
                  />
                  <TouchableOpacity 
                    style={{ backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    onPress={handleLocateMe}
                    disabled={isLocatingMe}
                  >
                    <MapPin size={11} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>
                      {isLocatingMe ? 'Locating...' : 'Locate Me'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Latitude & Longitude Side by Side */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#475569', marginBottom: 6 }}>Latitude (e.g. 17.3132)</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10 }}>
                    <MapPin size={13} color="#94A3B8" style={{ marginRight: 6 }} />
                    <TextInput 
                      value={editLat}
                      onChangeText={setEditLat}
                      placeholder="17.161922"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      style={{ flex: 1, height: 40, fontSize: 12, color: '#0F172A' }}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#475569', marginBottom: 6 }}>Longitude (e.g. 78.5455)</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10 }}>
                    <MapPin size={13} color="#94A3B8" style={{ marginRight: 6 }} />
                    <TextInput 
                      value={editLng}
                      onChangeText={setEditLng}
                      placeholder="78.658058"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      style={{ flex: 1, height: 40, fontSize: 12, color: '#0F172A' }}
                    />
                  </View>
                </View>
              </View>

              {/* Rating & Reviews Side by Side */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#475569', marginBottom: 6 }}>Starting Rating (e.g. 4.5)</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10 }}>
                    <Star size={13} color="#EAB308" fill="#EAB308" style={{ marginRight: 6 }} />
                    <TextInput 
                      value={editRating}
                      onChangeText={setEditRating}
                      placeholder="4.6"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      style={{ flex: 1, height: 40, fontSize: 12, color: '#0F172A' }}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#475569', marginBottom: 6 }}>Initial Review Count</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 10 }}>
                    <AlignLeft size={13} color="#94A3B8" style={{ marginRight: 6 }} />
                    <TextInput 
                      value={editReviews}
                      onChangeText={setEditReviews}
                      placeholder="1"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      style={{ flex: 1, height: 40, fontSize: 12, color: '#0F172A' }}
                    />
                  </View>
                </View>
              </View>

              {/* Special Offer / Discount */}
              <View style={{ marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A' }}>Special Offer / Discount</Text>
                    <Text style={{ fontSize: 10, color: '#64748B' }}>Enable a discount badge on your gym profile.</Text>
                  </View>
                  <Switch 
                    value={editHasOffer}
                    onValueChange={setEditHasOffer}
                    trackColor={{ false: '#CBD5E1', true: THEME.COLORS.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {editHasOffer && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: '#FFF1F2', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#FECDD3' }}>
                    <Percent size={14} color={THEME.COLORS.primary} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#9F1239' }}>Discount Percentage:</Text>
                    <TextInput 
                      value={editOfferPercentage}
                      onChangeText={setEditOfferPercentage}
                      keyboardType="numeric"
                      style={{ width: 50, height: 32, backgroundColor: '#FFFFFF', borderRadius: 6, textAlign: 'center', fontWeight: '800', color: THEME.COLORS.primary, borderWidth: 1, borderColor: '#FDA4AF' }}
                    />
                    <Text style={{ fontSize: 12, fontWeight: '800', color: THEME.COLORS.primary }}>% OFF</Text>
                  </View>
                )}
              </View>
            </View>

            {/* CARD 2: PRICING PLANS (₹) */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={styles.cardTitle}>Pricing Plans (₹)</Text>
                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  onPress={handleAddPlan}
                >
                  <Plus size={14} color={THEME.COLORS.primary} />
                  <Text style={{ color: THEME.COLORS.primary, fontSize: 12, fontWeight: '800' }}>+ Add New Plan</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {editPlans.map((plan, idx) => (
                  <View key={idx} style={{ width: '48%', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', position: 'relative' }}>
                    <TouchableOpacity 
                      onPress={() => handleRemovePlan(idx)}
                      style={{ position: 'absolute', top: 8, right: 8, padding: 2 }}
                    >
                      <X size={13} color="#94A3B8" />
                    </TouchableOpacity>

                    <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>PLAN NAME</Text>
                    <TextInput 
                      value={plan.name}
                      onChangeText={(val) => handleUpdatePlan(idx, 'name', val)}
                      placeholder="Plan name"
                      style={{ fontSize: 13, fontWeight: '900', color: '#0F172A', padding: 0, marginBottom: 8 }}
                    />

                    <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', marginBottom: 4 }}>PRICE (₹)</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: '#0F172A', marginRight: 2 }}>₹</Text>
                      <TextInput 
                        value={plan.price}
                        onChangeText={(val) => handleUpdatePlan(idx, 'price', val)}
                        keyboardType="numeric"
                        placeholder="Price"
                        style={{ fontSize: 14, fontWeight: '900', color: '#0F172A', flex: 1, padding: 0 }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* CARD 3: IMAGES */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Images</Text>
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2, marginBottom: 14 }}>
                Upload new images to replace existing ones.
              </Text>

              {/* Primary Cover Image */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', marginBottom: 6 }}>Primary Cover Image</Text>
                {editPrimaryImage ? (
                  <View style={{ width: '100%', height: 140, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F1F5F9', marginBottom: 8, position: 'relative' }}>
                    <Image source={{ uri: formatImageUrl(editPrimaryImage) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(15, 23, 42, 0.85)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 8.5, fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase' }}>CURRENT IMAGE</Text>
                    </View>
                  </View>
                ) : null}

                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 10 }}
                  onPress={handlePickPrimaryImage}
                >
                  <Upload size={14} color={THEME.COLORS.primary} />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: THEME.COLORS.primary }}>Choose Cover Image</Text>
                </TouchableOpacity>
              </View>

              {/* Gallery Images */}
              <View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', marginBottom: 6 }}>Gallery Images</Text>
                {editGallery.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {editGallery.map((img, idx) => (
                        <View key={idx} style={{ width: 100, height: 75, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                          <Image source={{ uri: formatImageUrl(img) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          <View style={{ position: 'absolute', top: 4, left: 4, backgroundColor: 'rgba(15, 23, 42, 0.85)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3 }}>
                            <Text style={{ fontSize: 7, fontWeight: '900', color: '#FFFFFF' }}>CURRENT</Text>
                          </View>
                          <TouchableOpacity 
                            onPress={() => setEditGallery(prev => prev.filter((_, i) => i !== idx))}
                            style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(239, 68, 68, 0.85)', borderRadius: 8, padding: 2 }}
                          >
                            <X size={10} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                )}

                <TouchableOpacity 
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 10 }}
                  onPress={handlePickGalleryImage}
                >
                  <Plus size={14} color="#64748B" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#64748B' }}>+ Choose Gallery Images</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* CARD 4: AMENITIES */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Amenities</Text>
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2, marginBottom: 12 }}>
                Select standard amenities or add custom tags for your gym.
              </Text>

              {/* Default Amenities Toggle Chips */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {defaultAmenitiesList.map((amenity) => {
                  const isSelected = editAmenities.includes(amenity);
                  return (
                    <TouchableOpacity 
                      key={amenity}
                      onPress={() => toggleAmenity(amenity)}
                      style={{ 
                        paddingHorizontal: 10, 
                        paddingVertical: 6, 
                        borderRadius: 20, 
                        backgroundColor: isSelected ? '#FEE2E2' : '#F1F5F9',
                        borderWidth: 1,
                        borderColor: isSelected ? '#FECACA' : '#E2E8F0'
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: isSelected ? '800' : '600', color: isSelected ? THEME.COLORS.primary : '#475569' }}>
                        {isSelected ? `✓ ${amenity}` : amenity}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Tag Chips with X */}
              {editAmenities.filter(a => !defaultAmenitiesList.includes(a)).length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {editAmenities.filter(a => !defaultAmenitiesList.includes(a)).map((customAmenity) => (
                    <View 
                      key={customAmenity}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF1F2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#FECDD3' }}
                    >
                      <Text style={{ fontSize: 11.5, fontWeight: '700', color: THEME.COLORS.primary }}>{customAmenity}</Text>
                      <TouchableOpacity onPress={() => handleRemoveCustomAmenity(customAmenity)}>
                        <X size={12} color={THEME.COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Add Custom Amenity Input */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput 
                  value={newCustomAmenity}
                  onChangeText={setNewCustomAmenity}
                  placeholder="Add custom amenity tag"
                  placeholderTextColor="#94A3B8"
                  style={{ flex: 1, height: 40, backgroundColor: '#F8FAFC', borderRadius: 10, paddingHorizontal: 12, fontSize: 12, borderWidth: 1, borderColor: '#E2E8F0' }}
                />
                <TouchableOpacity 
                  style={{ backgroundColor: '#0F172A', paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                  onPress={handleAddCustomAmenity}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '800' }}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* CARD 5: DESCRIPTION */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Description / About Gym</Text>
              <TextInput 
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Write about equipment, trainers, parking, hygiene..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                style={{ height: 90, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, fontSize: 12, color: '#0F172A', borderWidth: 1, borderColor: '#E2E8F0', marginTop: 8, textAlignVertical: 'top' }}
              />
            </View>

            {/* SAVE BUTTON */}
            <TouchableOpacity 
              style={{ 
                backgroundColor: THEME.COLORS.primary, 
                paddingVertical: 16, 
                borderRadius: 16, 
                alignItems: 'center', 
                justifyContent: 'center',
                marginVertical: 12,
                ...Platform.select({
                  web: { boxShadow: '0 8px 24px rgba(225, 29, 72, 0.4)' },
                  default: { elevation: 6 }
                })
              }}
              onPress={handleSaveGymProfile}
              disabled={isSavingEdit}
              activeOpacity={0.85}
            >
              {isSavingEdit ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 }}>Save Gym Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* 💰 IN-FRAME MODAL: WITHDRAWAL REQUEST */}
      {showWithdrawModal && (
        <View style={styles.inFrameModalOverlay}>
          <TouchableOpacity 
            style={styles.inFrameModalBackdrop} 
            activeOpacity={1} 
            onPress={() => setShowWithdrawModal(false)} 
          />
          <View style={styles.inFrameModalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Wallet size={18} color={THEME.COLORS.primary} />
                <Text style={styles.modalTitle}>
                  {withdrawPayoutType === 'revenue' ? 'Withdraw Revenue Payout' : 'Withdraw Referral Bonus'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowWithdrawModal(false)} style={{ padding: 4 }}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Wallet Info Summary Box */}
            <View style={styles.withdrawInfoBanner}>
              <View>
                <Text style={styles.withdrawInfoLabel}>Available to Withdraw</Text>
                <Text style={styles.withdrawInfoVal}>
                  ₹{(withdrawPayoutType === 'revenue' ? virtualWallet.balance : referralWallet.balance).toLocaleString()}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.withdrawInfoLabel}>Min. Limit</Text>
                <Text style={[styles.withdrawInfoVal, { color: '#64748B' }]}>
                  ₹{(withdrawPayoutType === 'revenue' ? virtualWallet.min_withdrawal : referralWallet.min_withdrawal).toLocaleString()}
                </Text>
              </View>
            </View>

            {withdrawSuccessMsg ? (
              <View style={styles.successBanner}>
                <CheckCircle2 size={20} color="#059669" style={{ marginRight: 8 }} />
                <Text style={styles.successBannerText}>{withdrawSuccessMsg}</Text>
              </View>
            ) : (
              <>
                <View style={styles.formFieldGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={styles.formLabel}>Withdrawal Amount (₹)</Text>
                    <TouchableOpacity onPress={() => setWithdrawAmount(String(withdrawPayoutType === 'revenue' ? virtualWallet.balance : referralWallet.balance))}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: THEME.COLORS.primary }}>Set Max</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput 
                    value={withdrawAmount} 
                    onChangeText={setWithdrawAmount} 
                    keyboardType="numeric" 
                    placeholder="Enter amount" 
                    style={styles.formInput} 
                  />
                </View>

                <View style={styles.withdrawTypeTabs}>
                  <TouchableOpacity 
                    style={[styles.withdrawTypeTab, withdrawMethod === 'bank' && styles.withdrawTypeTabActive]}
                    onPress={() => setWithdrawMethod('bank')}
                  >
                    <Text style={[styles.withdrawTypeTabText, withdrawMethod === 'bank' && styles.withdrawTypeTabTextActive]}>
                      Bank Transfer
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.withdrawTypeTab, withdrawMethod === 'upi' && styles.withdrawTypeTabActive]}
                    onPress={() => setWithdrawMethod('upi')}
                  >
                    <Text style={[styles.withdrawTypeTabText, withdrawMethod === 'upi' && styles.withdrawTypeTabTextActive]}>
                      UPI / QR
                    </Text>
                  </TouchableOpacity>
                </View>

                {withdrawMethod === 'bank' ? (
                  <View style={{ gap: 8 }}>
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Bank Name</Text>
                      <TextInput value={withdrawBankName} onChangeText={setWithdrawBankName} placeholder="HDFC, SBI, ICICI..." style={styles.formInput} />
                    </View>
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Account Number</Text>
                      <TextInput value={withdrawAccountNumber} onChangeText={setWithdrawAccountNumber} placeholder="0000 0000 0000" keyboardType="numeric" style={styles.formInput} />
                    </View>
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>IFSC Code</Text>
                      <TextInput value={withdrawIfsc} onChangeText={setWithdrawIfsc} placeholder="HDFC0001234" autoCapitalize="characters" style={styles.formInput} />
                    </View>
                  </View>
                ) : (
                  <View style={{ gap: 10 }}>
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>UPI ID / Mobile Number</Text>
                      <TextInput 
                        value={withdrawUpiId} 
                        onChangeText={setWithdrawUpiId} 
                        placeholder="partner@upi or 9876543210" 
                        style={styles.formInput} 
                      />
                    </View>

                    {/* QR Code / Payment Screenshot Upload */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>QR Code / Scanner Screenshot (Optional)</Text>
                      {qrCodePreview ? (
                        <View style={styles.qrPreviewBox}>
                          <Image source={{ uri: qrCodePreview }} style={styles.qrPreviewImg} />
                          <TouchableOpacity 
                            style={styles.removeQrBtn} 
                            onPress={() => { setQrCodePreview(''); setQrCodeFile(null); }}
                          >
                            <X size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity 
                          style={styles.uploadQrBox}
                          onPress={handlePickQrImage}
                          activeOpacity={0.7}
                        >
                          <Upload size={20} color={THEME.COLORS.primary} style={{ marginBottom: 6 }} />
                          <Text style={styles.uploadQrTitle}>Upload QR Code / Scanner Screenshot</Text>
                          <Text style={styles.uploadQrSub}>Super Admin will scan and transfer payout directly to your bank</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.submitWithdrawBtn}
                  onPress={handleWithdrawSubmit}
                  disabled={isWithdrawing}
                >
                  {isWithdrawing ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitWithdrawBtnText}>Submit Request</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}

      {/* 🖼️ IN-FRAME MODAL: PAYMENT PROOF RECEIPT VIEWER */}
      {selectedProofUrl && (
        <View style={styles.inFrameModalOverlay}>
          <TouchableOpacity 
            style={styles.inFrameModalBackdrop} 
            activeOpacity={1} 
            onPress={() => setSelectedProofUrl(null)} 
          />
          <View style={styles.receiptModalBox}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} color="#059669" />
                <Text style={styles.modalTitle}>Payment Receipt</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedProofUrl(null)} style={{ padding: 4 }}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 11, color: '#64748B', marginBottom: 12 }}>
              Official bank / UPI payment transfer screenshot confirmed by Super Admin.
            </Text>

            <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>
              <Image 
                source={{ uri: selectedProofUrl.startsWith('http') ? selectedProofUrl : `https://gymdate.in${selectedProofUrl}` }} 
                style={styles.receiptImage} 
              />
            </View>

            <TouchableOpacity 
              style={[styles.modalCloseBtn, { marginTop: 14 }]}
              onPress={() => setSelectedProofUrl(null)}
            >
              <Text style={styles.modalCloseBtnText}>Close Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mainScrollView: {
    flex: 1,
  },
  tabContentWrapper: {
    gap: 14,
  },
  navbarTabsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 3,
    borderRadius: 12,
    gap: 4,
    marginHorizontal: 6,
  },
  withdrawInfoBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  withdrawInfoLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '700',
  },
  withdrawInfoVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
    marginTop: 1,
  },
  uploadQrBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
  },
  uploadQrTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  uploadQrSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  qrPreviewBox: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 8,
  },
  qrPreviewImg: {
    width: 140,
    height: 140,
    borderRadius: 10,
    resizeMode: 'contain',
  },
  removeQrBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 4,
  },
  viewReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  viewReceiptBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  receiptModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    width: '92%',
    maxWidth: 440,
    maxHeight: '85%',
    ...Platform.select({
      web: { boxShadow: '0 20px 40px rgba(0,0,0,0.25)' },
      default: { elevation: 10 }
    })
  },
  receiptImage: {
    width: '100%',
    height: 320,
    resizeMode: 'contain',
  },

  /* TOP NAVBAR */
  topNavbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  menuToggleBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  navbarTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 3,
    borderRadius: 12,
    gap: 3,
  },
  navTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  navTabPillActive: {
    backgroundColor: '#0F172A',
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(15, 23, 42, 0.15)' }
    })
  },
  navTabPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  navTabPillTextActive: {
    color: '#FFFFFF',
  },
  navQrBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* DRAWER SIDEBAR */
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContent: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: '#0F172A',
    padding: 20,
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 18,
  },
  brandIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  brandSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  closeDrawerBtn: {
    padding: 4,
  },
  drawerNavList: {
    gap: 8,
    marginTop: 20,
    flex: 1,
  },
  drawerNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  drawerNavItemActive: {
    backgroundColor: '#EF4444',
  },
  drawerNavText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  drawerNavTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 16,
    gap: 10,
  },
  drawerUserViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  drawerUserViewText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  drawerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  drawerLogoutText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
  },

  /* OVERVIEW HEADER */
  overviewHeaderRow: {
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  pageTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  pageSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  btnScanEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnScanEntryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnEditDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnEditDetailsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },

  /* HERO GYM CARD */
  gymHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' }
    })
  },
  gymHeroImageContainer: {
    height: 150,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  gymHeroImage: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 16,
  },
  ratingBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  gymHeroDetails: {
    padding: 14,
  },
  gymTitleText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  locationLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationLinkText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 17,
  },

  /* CARDS GRID */
  cardsGrid: {
    gap: 10,
  },
  sideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sideCardTitle: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  statusBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12.5,
    fontWeight: '900',
  },
  statusSubText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
  },
  statusToggleBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusToggleText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#DC2626',
  },

  /* OFFER CARD */
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  offerLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  offerSub: {
    fontSize: 9.5,
    color: '#64748B',
  },
  offerInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  offerInputLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  offerTextInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    width: 50,
    textAlign: 'center',
    fontWeight: '800',
  },
  saveOfferBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  saveOfferBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  /* QUICK STATS */
  quickStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  quickStatLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  quickStatVal: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  quickStatValGreen: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#059669',
  },

  /* GENERIC CARD */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  cardDesc: {
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 3,
    marginBottom: 10,
  },
  countBadge: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },

  /* STATS ROW (3 COLUMNS MATCHING WEBSITE) */
  statsRowThree: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  statMetricCardCol: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)' }
    })
  },
  statCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statMetricIconBoxGreen: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statMetricIconBoxBlue: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statMetricIconBoxPurple: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statPercentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  statPercentText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#059669',
  },
  statMetricLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
  },
  statMetricValGreen: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  statMetricValDark: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  viewAllBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },

  /* BOOKINGS ITEMS */
  bookingRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  bookingUserName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookingEmailText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  bookingUserPlan: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  bookingAmountText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#059669',
  },
  confirmedPill: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    marginTop: 1,
  },
  confirmedPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#059669',
  },

  /* WALLET TAB */
  walletHeroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 14,
  },
  walletHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  walletHeroLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  walletHeroBalance: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 7,
  },
  walletBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  walletHeroDesc: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 8,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  withdrawBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  referralLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 5,
    paddingLeft: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  referralLinkText: {
    flex: 1,
    fontSize: 10.5,
    color: '#64748B',
  },
  copyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyLinkBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  /* IN-FRAME MODALS */
  inFrameModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  inFrameModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  inFrameModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    width: '100%',
    maxWidth: 350,
    gap: 10,
    zIndex: 1001,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)' }
    })
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  qrInputRow: {
    flexDirection: 'row',
    gap: 6,
  },
  qrTextInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  qrValidateBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrValidateBtnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scanFeedbackCard: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 10,
  },
  scanSuccess: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
  },
  scanError: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  scanFeedbackTitle: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  scanFeedbackDesc: {
    fontSize: 10.5,
    marginTop: 1,
  },
  modalCloseBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  /* EDIT DETAILS FORM */
  formFieldGroup: {
    gap: 3,
  },
  formLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 11.5,
    color: '#0F172A',
  },
  saveDetailsBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveDetailsBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  /* WITHDRAWAL TABS */
  withdrawTypeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2.5,
    gap: 3,
  },
  withdrawTypeTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  withdrawTypeTabActive: {
    backgroundColor: '#FFFFFF',
  },
  withdrawTypeTabText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  withdrawTypeTabTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  submitWithdrawBtn: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  submitWithdrawBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    padding: 10,
    borderRadius: 10,
  },
  successBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    flex: 1,
  }
});
