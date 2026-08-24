import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Image, 
  Modal, 
  Linking,
  Alert,
  Switch,
  useColorScheme,
  Platform,
  BackHandler
} from 'react-native';
import { useGymDate, Trainer, Gym } from '../../context/GymDateContext';
import { apiService } from '../../services/apiService';
import { getApiUrl } from '../../config';
import { THEME } from '../../theme';
import { useTheme } from '../../useTheme';
import { RazorpayCheckout, RazorpayPaymentOptions } from '../RazorpayCheckout';
import { 
  Search, 
  MapPin, 
  Star, 
  ChevronLeft, 
  Check, 
  SlidersHorizontal,
  Clock,
  Compass,
  ArrowRight,
  ChevronRight,
  Menu,
  Gift,
  Wallet,
  User,
  Phone,
  Mail,
  CheckCircle2,
  Tag
} from 'lucide-react-native';

export const GymDiscovery: React.FC = () => {
  const { 
    activeScreen, 
    setActiveScreen, 
    gyms, 
    selectedGymId, 
    setSelectedGymId,
    userProfile,
    setUserProfile,
    addBooking,
    addNotification,
    userCoords,
    loginInput,
  } = useGymDate();

  // Haversine distance
  const getGymDistance = (gym: { coordinates?: { lat: number; lng: number }; distance: number }): string => {
    if (
      userCoords &&
      gym.coordinates?.lat && gym.coordinates?.lng &&
      gym.coordinates.lat !== 0 && gym.coordinates.lng !== 0
    ) {
      const R = 6371;
      const dLat = (gym.coordinates.lat - userCoords.lat) * Math.PI / 180;
      const dLng = (gym.coordinates.lng - userCoords.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(userCoords.lat*Math.PI/180) * Math.cos(gym.coordinates.lat*Math.PI/180) * Math.sin(dLng/2)**2;
      const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return km >= 100 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
    }
    return '-- km';
  };

  const {
    isDark,
    bg,
    cardBg,
    borderSoft: cardBorder,
    textPrimary,
    textSecond: textSecondary,
    textMuted,
    inputBg,
    inputBorder,
    cardBg: filterCardBg,
    headerBg: headerBarBg,
    headerBorder: headerBarBorder,
    inputBg: backBtnBg,
    cardBgSoft: timingCardBg,
    borderSoft: timingCardBorder,
    divider: sectionBorder,
    cardBgSoft: amenityBg,
    borderSoft: amenityBorder,
    cardBgSoft: planCardBg,
    modalBg,
    modalCardBg,
    cardBgSoft: billCardBg,
    inputBg: payBtnBg,
    borderSoft: payBtnBorder,
  } = useTheme();

  const mapCardBg = isDark ? 'rgba(229,9,20,0.08)' : 'rgba(229,9,20,0.04)';
  const mapCardBorder = isDark ? 'rgba(229,9,20,0.2)' : 'rgba(229,9,20,0.15)';


  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRadius, setSelectedRadius] = useState<'all' | number>('all');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: number; duration: string } | null>(null);

  // Autofilled Member Details State
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');

  // Wallet & Referral Balance State
  const [walletBalance, setWalletBalance] = useState(0);
  const [maxWalletPerTxn, setMaxWalletPerTxn] = useState(10);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [useWallet, setUseWallet] = useState(false);

  // Real Razorpay payment options state — null = closed
  const [paymentOptions, setPaymentOptions] = useState<RazorpayPaymentOptions | null>(null);

  // Fetch live GST and wallet settings on mount
  useEffect(() => {
    const fetchLiveConfig = async () => {
      try {
        const confRes = await fetch(`${getApiUrl()}/api/admin/referral-config?_t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache' }
        });
        const d = await confRes.json();
        if (d.success && d.config) {
          if (d.config.max_wallet_per_txn) {
            setMaxWalletPerTxn(parseFloat(d.config.max_wallet_per_txn) || 10);
          }
          if (d.config.gst_percentage !== undefined) {
            const parsedGst = parseFloat(d.config.gst_percentage);
            setGstPercentage(isNaN(parsedGst) ? 0 : parsedGst);
          }
        }
      } catch (e) {
        console.warn('Failed to load initial platform config:', e);
      }
    };
    fetchLiveConfig();
  }, []);

  // Android hardware back button & gesture handling for Discovery & Modals
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      if (paymentOptions) {
        setPaymentOptions(null);
        return true;
      }
      if (showCheckoutModal) {
        setShowCheckoutModal(false);
        return true;
      }
      if (selectedGymId) {
        setSelectedGymId(null);
        setActiveScreen('discovery');
        return true;
      }
      if (activeScreen === 'discovery' || activeScreen === 'gym-details') {
        setActiveScreen('home');
        return true;
      }
      return false;
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSub.remove();
  }, [paymentOptions, showCheckoutModal, selectedGymId, activeScreen, setActiveScreen, setSelectedGymId]);

  const handleGymClick = (id: string) => {
    setSelectedGymId(id);
    setActiveScreen('gym-details');
  };

  const handleBackToList = () => {
    setSelectedGymId(null);
    setActiveScreen('discovery');
  };

  const filteredGyms = gyms.filter(gym => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || gym.name.toLowerCase().includes(q) || gym.location.toLowerCase().includes(q);
    if (!matchesSearch) return false;

    if (selectedRadius === 'all') return true;

    const gymLat = gym.coordinates?.lat || 0;
    const gymLng = gym.coordinates?.lng || 0;
    if (!gymLat || !gymLng) return true;

    const uLat = userCoords?.lat || 17.385044;
    const uLng = userCoords?.lng || 78.486671;
    const dist = (() => {
      const R = 6371;
      const dLat = (gymLat - uLat) * Math.PI / 180;
      const dLng = (gymLng - uLng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(uLat*Math.PI/180) * Math.cos(gymLat*Math.PI/180) * Math.sin(dLng/2)**2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    })();

    return dist <= selectedRadius;
  });

  const activeGym = gyms.find(g => g.id === selectedGymId);
  const showDetails = Boolean(selectedGymId && activeGym);

  const handleBuyPassClick = async (plan: { name: string; price: number; duration: string }) => {
    setSelectedPlan(plan);
    setBuyerName(userProfile.name || '');
    const rawP = userProfile.phone || '';
    setBuyerPhone(rawP.replace(/^\+91/, '').trim());
    setBuyerEmail(userProfile.email || loginInput || '');
    setUseWallet(false);

    // 1. Fetch live GST percentage & max wallet config with cache busting
    try {
      const confRes = await fetch(`${getApiUrl()}/api/admin/referral-config?_t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const d = await confRes.json();
      if (d.success && d.config) {
        if (d.config.max_wallet_per_txn) {
          setMaxWalletPerTxn(parseFloat(d.config.max_wallet_per_txn) || 10);
        }
        if (d.config.gst_percentage !== undefined) {
          const parsedGst = parseFloat(d.config.gst_percentage);
          setGstPercentage(isNaN(parsedGst) ? 0 : parsedGst);
        }
      }
    } catch (e) {}

    // 2. Fetch user wallet balance from backend
    const targetEmail = (userProfile.email || loginInput || '').trim().toLowerCase();
    if (targetEmail) {
      try {
        const profRes = await apiService.getProfile(targetEmail);
        if (profRes) {
          const wb = (profRes as any).wallet_balance !== undefined ? parseFloat((profRes as any).wallet_balance) : 0;
          setWalletBalance(wb);
          if (profRes.full_name && !userProfile.name) setBuyerName(profRes.full_name);
          if (profRes.phone && !userProfile.phone) setBuyerPhone(profRes.phone.replace(/^\+91/, '').trim());
          if ((profRes as any).id) {
            try {
              const wData = await apiService.getWalletData((profRes as any).id);
              if (wData && (wData as any).balance !== undefined) {
                setWalletBalance(parseFloat((wData as any).balance) || wb);
              }
            } catch (e) {}
          }
        }
      } catch (e) {
        console.warn('Wallet fetch error in checkout:', e);
      }
    }

    setShowCheckoutModal(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedPlan || !activeGym) return;

    if (!buyerName.trim()) {
      Alert.alert('Required Field', 'Please enter your Full Name for the booking pass.');
      return;
    }
    if (!buyerPhone.trim()) {
      Alert.alert('Required Field', 'Please enter your Phone Number.');
      return;
    }
    if (!buyerEmail.trim() || !buyerEmail.includes('@') || !buyerEmail.includes('.')) {
      Alert.alert('Required Field', 'Please enter a valid Email Address.');
      return;
    }

    const basePrice = Number(selectedPlan.price) || 0;
    const gstAmount = gstPercentage > 0 ? Math.round((basePrice * gstPercentage) / 100) : 0;
    const subtotalWithGst = basePrice + gstAmount;
    const usableWallet = (useWallet && walletBalance > 0) ? Math.min(walletBalance, maxWalletPerTxn, subtotalWithGst) : 0;
    const finalAmount = Math.max(1, subtotalWithGst - usableWallet);

    // Launch real Razorpay payment
    setShowCheckoutModal(false);
    setPaymentOptions({
      gymId: activeGym.id,
      gymName: activeGym.name,
      planName: selectedPlan.name,
      amount: finalAmount,
      customerEmail: buyerEmail.trim().toLowerCase(),
      customerName: buyerName.trim(),
      customerPhone: buyerPhone.trim().startsWith('+91') ? buyerPhone.trim() : `+91${buyerPhone.trim()}`,
      useWallet: useWallet && usableWallet > 0,
      startDate: new Date().toISOString(),
      onSuccess: (bookingId, paymentId) => {
        if (useWallet && usableWallet > 0) {
          setWalletBalance(prev => Math.max(0, prev - usableWallet));
        }

        // Add real notification to in-app bell & trigger phone system notification
        addNotification({
          title: `Booking Confirmed: ${selectedPlan.name}! 🎉`,
          message: `Your pass for ${activeGym.name} is active. Order ID: ${bookingId.substring(0, 8).toUpperCase()}. QR entry ticket is ready in My Tickets!`,
          type: 'booking',
        });

        Alert.alert(
          '✅ Payment Successful!',
          `Your ${selectedPlan.name} for ${activeGym.name} is now active.\nBooking ID: ${bookingId.substring(0, 8).toUpperCase()}\n\nYour QR entry ticket is ready in My Tickets!`,
          [{ text: 'View My Tickets', onPress: () => setActiveScreen('profile') }]
        );
        setSelectedPlan(null);
      },
      onFailure: (error) => {
        Alert.alert('Payment Failed', error || 'Something went wrong. Please try again.');
      },
      onDismiss: () => {
        setPaymentOptions(null);
      },
    });
  };

  const handleBookTrainerSlot = (trainer: Trainer) => {
    if (userProfile.membershipType === 'none') {
      Alert.alert('Access Denied', 'An active GymDate membership pass is required to book slots!');
      return;
    }

    addBooking({
      gymId: selectedGymId || 'gym-1',
      gymName: activeGym?.name || 'Gold\'s Gym',
      dateTime: '2026-05-30T10:00:00',
      trainerName: trainer.name,
      sessionType: 'trainer'
    });
    setActiveScreen('bookings');
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      
      {/* ================= VIEW 1: SEARCH & DISCOVERY LIST ================= */}
      {!selectedGymId || !activeGym ? (
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.scrollList} contentContainerStyle={{ paddingBottom: 130 }}>
            <View style={[styles.headerBlock, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.titleText, { color: textPrimary }]}>Find Your Gym</Text>
                <Text style={[styles.descText, { color: textSecondary }]}>Discover premium multi-city fitness spaces nearby.</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setActiveScreen('profile')} 
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: inputBg,
                  borderColor: inputBorder,
                  borderWidth: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: 12
                }}
              >
                <Menu size={16} color={textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchRow}>
              <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor: inputBorder, flex: 1 }]}>
                <Search size={14} color={textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Search gym name, area, or location..."
                  placeholderTextColor={textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={[styles.textInput, { color: textPrimary }]}
                />
              </View>
            </View>

            {/* Distance Filter Chips (All, 1km, 5km, 10km, 25km) */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginTop: 4, marginBottom: 14 }}
            >
              {[
                { label: '🌐 All', value: 'all' as const },
                { label: '🎯 1 km', value: 1 },
                { label: '🎯 5 km', value: 5 },
                { label: '🎯 10 km', value: 10 },
                { label: '🎯 25 km', value: 25 },
              ].map((item, idx) => {
                const isSelected = selectedRadius === item.value;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedRadius(item.value)}
                    style={[
                      {
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 20,
                        backgroundColor: inputBg,
                        borderWidth: 1,
                        borderColor: inputBorder,
                      },
                      isSelected && { backgroundColor: THEME.COLORS.primary, borderColor: THEME.COLORS.primary }
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      { fontSize: 11, fontWeight: '700', color: textSecondary },
                      isSelected && { color: '#ffffff', fontWeight: '800' }
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Gyms cards render feed */}
            <View style={styles.gymGrid}>
              {filteredGyms.length > 0 ? (
                filteredGyms.map(gym => (
                  <TouchableOpacity 
                    key={gym.id}
                    onPress={() => handleGymClick(gym.id)}
                    style={[styles.gymCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: gym.image }} style={styles.gymImg} />
                    <View style={styles.distBadge}>
                      <MapPin size={8} color={THEME.COLORS.primary} style={{ marginRight: 2 }} />
                      <Text style={styles.distBadgeText}>{getGymDistance(gym)}</Text>
                    </View>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceBadgeText}>₹{gym.pricePerDay} / day</Text>
                    </View>

                    <View style={styles.gymInfo}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.gymTitle, { color: textPrimary }]}>{gym.name}</Text>
                        <View style={styles.ratingRow}>
                          <Star size={10} color={THEME.COLORS.warning} fill={THEME.COLORS.warning} style={{ marginRight: 2 }} />
                          <Text style={styles.ratingText}>{gym.rating}</Text>
                        </View>
                      </View>
                      
                      <Text style={[styles.gymLoc, { color: textMuted }]}>{gym.location}</Text>

                      <View style={styles.amenityRow}>
                        {gym.facilities.slice(0, 3).map((f, i) => (
                          <View key={i} style={[styles.amenityTag, { backgroundColor: amenityBg, borderColor: amenityBorder }]}>
                            <Text style={[styles.amenityTagText, { color: textSecondary }]}>{f}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🏋️‍♀️</Text>
                  <Text style={[styles.emptyText, { color: textMuted }]}>No gyms match your active search filter.</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      ) : (
        /* ================= VIEW 2: GYM DETAILS DEEP VIEW ================= */
        <View style={{ flex: 1 }}>
          {/* Header toolbar */}
          <View style={[styles.detailHeaderBar, { backgroundColor: headerBarBg, borderBottomColor: headerBarBorder }]}>
            <TouchableOpacity onPress={handleBackToList} style={[styles.backBtn, { backgroundColor: backBtnBg, borderColor: headerBarBorder }]}>
              <ChevronLeft size={16} color={textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.detailTitle, { color: textPrimary }]}>Gym Profile Details</Text>
            <View style={{ width: 34 }} />
          </View>

          <ScrollView style={styles.scrollList} contentContainerStyle={{ paddingBottom: 130 }}>
            {/* Cover image */}
            <View style={styles.coverImageBlock}>
              <Image source={{ uri: activeGym.image }} style={styles.coverImg} />
              <View style={styles.coverOverlay}>
                <Text style={styles.coverName}>{activeGym.name}</Text>
                <View style={styles.coverMeta}>
                  <MapPin size={9} color={THEME.COLORS.primary} style={{ marginRight: 2 }} />
                  <Text style={styles.coverMetaText}>{activeGym.location}</Text>
                  <Star size={9} color={THEME.COLORS.warning} fill={THEME.COLORS.warning} style={{ marginLeft: 8, marginRight: 2 }} />
                  <Text style={styles.coverMetaText}>{activeGym.rating} rating</Text>
                </View>
              </View>
            </View>

            {/* Profile body content */}
            <View style={[styles.detailContent, { backgroundColor: bg }]}>
              
              {/* Timings */}
              <View style={[styles.timingCard, { backgroundColor: timingCardBg, borderColor: timingCardBorder }]}>
                <Clock size={16} color={THEME.COLORS.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={[styles.timingCardLabel, { color: textMuted }]}>Workout Timings</Text>
                  <Text style={[styles.timingCardText, { color: textPrimary }]}>{activeGym.timings}</Text>
                </View>
              </View>

              {/* Description */}
              <View style={styles.sectionBlock}>
                <Text style={[styles.detailSectionTitle, { color: textPrimary, borderBottomColor: sectionBorder }]}>About this Gym</Text>
                <Text style={[styles.detailDescText, { color: textSecondary }]}>{activeGym.description}</Text>
              </View>

              {/* Amenities Grid */}
              <View style={styles.sectionBlock}>
                <Text style={[styles.detailSectionTitle, { color: textPrimary, borderBottomColor: sectionBorder }]}>Available Amenities</Text>
                <View style={styles.detailAmenitiesGrid}>
                  {activeGym.facilities.map((fac, idx) => (
                    <View key={idx} style={[styles.amenityCard, { backgroundColor: amenityBg, borderColor: amenityBorder }]}>
                      <Check size={12} color={THEME.COLORS.success} style={{ marginRight: 6 }} />
                      <Text style={[styles.amenityCardText, { color: textSecondary }]}>{fac}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Plans pass packages */}
              <View style={styles.sectionBlock}>
                <Text style={[styles.detailSectionTitle, { color: textPrimary, borderBottomColor: sectionBorder }]}>Gym Passes Available</Text>
                <View style={styles.plansContainer}>
                  {activeGym.plans.map((plan, idx) => (
                    <View key={idx} style={[styles.planCard, { backgroundColor: planCardBg, borderColor: amenityBorder }]}>
                      <View style={styles.planHeader}>
                        <View>
                          <Text style={[styles.planTitle, { color: textPrimary }]}>{plan.name}</Text>
                          <Text style={[styles.planDuration, { color: textSecondary }]}>{plan.duration} access duration</Text>
                        </View>
                        <Text style={styles.planPrice}>₹{plan.price}</Text>
                      </View>

                      <View style={styles.planFeatures}>
                        {plan.features.map((f, i) => (
                          <Text key={i} style={[styles.planFeatureItem, { color: textSecondary }]}>• {f}</Text>
                        ))}
                      </View>

                      <TouchableOpacity 
                        onPress={() => handleBuyPassClick(plan)}
                        style={styles.planBuyBtn}
                      >
                        <Text style={styles.planBuyBtnText}>Select Pass Plan</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>


            </View>
          </ScrollView>
        </View>
      )}

      {/* ================= MODAL: BILL SUMMARY BEFORE PAYMENT ================= */}
      <Modal visible={showCheckoutModal} transparent animationType="slide">
        <View style={[styles.modalBackdrop, { backgroundColor: modalBg }]}>
          <View style={[styles.modalCard, { backgroundColor: modalCardBg }]}>
            
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTag}>Razorpay Secure Checkout</Text>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Pass Order Summary</Text>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={{ maxHeight: 420 }} 
              contentContainerStyle={{ gap: 12, paddingBottom: 60 }}
              keyboardShouldPersistTaps="handled"
            >
              
              {/* Gym and Plan details */}
              {selectedPlan && activeGym && (
                <View style={[styles.billCard, { backgroundColor: billCardBg, borderColor: amenityBorder }]}>
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: textSecondary }]}>Partner Gym:</Text>
                    <Text style={[styles.billVal, { color: textPrimary }]}>{activeGym.name}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: textSecondary }]}>Pass Package:</Text>
                    <Text style={[styles.billVal, { color: textPrimary }]}>{selectedPlan.name}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: textSecondary }]}>Duration:</Text>
                    <Text style={[styles.billVal, { color: textPrimary }]}>{selectedPlan.duration}</Text>
                  </View>
                </View>
              )}

              {/* Autofilled Member Details */}
              <View style={[styles.memberFormCard, { backgroundColor: billCardBg, borderColor: amenityBorder }]}>
                <View style={styles.memberFormHeader}>
                  <User size={13} color="#e50914" />
                  <Text style={[styles.memberFormTitle, { color: textPrimary }]}>Member Details</Text>
                  <Text style={styles.autofillBadge}>Autofilled</Text>
                </View>

                {/* Name */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: textSecondary }]}>Full Name</Text>
                  <View style={[styles.inputBox, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                    <User size={13} color={textSecondary} />
                    <TextInput
                      value={buyerName}
                      onChangeText={setBuyerName}
                      placeholder="Enter Full Name"
                      placeholderTextColor={textMuted}
                      style={[styles.formTextInput, { color: textPrimary }]}
                    />
                  </View>
                </View>

                {/* Phone */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: textSecondary }]}>Phone Number</Text>
                  <View style={[styles.inputBox, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                    <Phone size={13} color={textSecondary} />
                    <TextInput
                      value={buyerPhone}
                      onChangeText={setBuyerPhone}
                      placeholder="9876543210"
                      keyboardType="phone-pad"
                      placeholderTextColor={textMuted}
                      style={[styles.formTextInput, { color: textPrimary }]}
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: textSecondary }]}>Email Address</Text>
                  <View style={[styles.inputBox, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                    <Mail size={13} color={textSecondary} />
                    <TextInput
                      value={buyerEmail}
                      onChangeText={setBuyerEmail}
                      placeholder="name@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor={textMuted}
                      style={[styles.formTextInput, { color: textPrimary }]}
                    />
                  </View>
                </View>
              </View>

              {/* Wallet / Referral Balance Discount Card */}
              {walletBalance > 0 && selectedPlan && (
                <View style={[
                  styles.walletDiscountCard, 
                  { 
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#F0FDF4', 
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#BBF7D0' 
                  }
                ]}>
                  {/* Wallet Discount Row */}
                  <View style={styles.walletDiscountRow}>
                    <View style={styles.walletLeft}>
                      <View style={[
                        styles.walletIconBox, 
                        useWallet 
                          ? { backgroundColor: '#10B981' } 
                          : { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7' }
                      ]}>
                        <Gift size={16} color={useWallet ? '#ffffff' : '#10B981'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.walletTitle, { color: isDark ? '#34D399' : '#065F46' }]}>
                          WALLET DISCOUNT
                        </Text>
                        <Text style={[styles.walletSub, { color: isDark ? '#A7F3D0' : '#047857' }]}>
                          Use ₹{Math.min(walletBalance, maxWalletPerTxn, (Number(selectedPlan.price) || 0) + (gstPercentage > 0 ? Math.round(((Number(selectedPlan.price) || 0) * gstPercentage) / 100) : 0))} from wallet (Balance: ₹{walletBalance.toFixed(2)})
                        </Text>
                      </View>
                    </View>

                    <Switch
                      value={useWallet}
                      onValueChange={setUseWallet}
                      trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  {useWallet && (
                    <View style={[styles.walletAppliedRow, { borderTopColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7' }]}>
                      <Text style={[styles.walletAppliedLabel, { color: isDark ? '#34D399' : '#047857' }]}>DISCOUNT APPLIED</Text>
                      <Text style={[styles.walletAppliedVal, { color: isDark ? '#34D399' : '#047857' }]}>
                        -₹{Math.min(walletBalance, maxWalletPerTxn, (Number(selectedPlan.price) || 0) + (gstPercentage > 0 ? Math.round(((Number(selectedPlan.price) || 0) * gstPercentage) / 100) : 0))}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Total Payment Breakdown */}
              {selectedPlan && (() => {
                const basePrice = Number(selectedPlan.price) || 0;
                const gstAmount = gstPercentage > 0 ? Math.round((basePrice * gstPercentage) / 100) : 0;
                const subtotalWithGst = basePrice + gstAmount;
                const usableWallet = (useWallet && walletBalance > 0) ? Math.min(walletBalance, maxWalletPerTxn, subtotalWithGst) : 0;
                const finalPayable = Math.max(1, subtotalWithGst - usableWallet);

                return (
                  <View style={[styles.billCard, { backgroundColor: billCardBg, borderColor: amenityBorder, gap: 6 }]}>
                    <View style={styles.billRow}>
                      <Text style={[styles.billLabel, { color: textSecondary }]}>Subscription Fee:</Text>
                      <Text style={[styles.billVal, { color: textPrimary, fontWeight: '700' }]}>₹{basePrice}</Text>
                    </View>

                    {gstPercentage > 0 && (
                      <View style={styles.billRow}>
                        <Text style={[styles.billLabel, { color: textSecondary }]}>GST Fee ({gstPercentage}%):</Text>
                        <Text style={[styles.billVal, { color: textPrimary, fontWeight: '700' }]}>+₹{gstAmount}</Text>
                      </View>
                    )}
                    
                    {useWallet && usableWallet > 0 && (
                      <View style={styles.billRow}>
                        <Text style={[styles.billLabel, { color: '#10B981', fontWeight: '700' }]}>Wallet Discount:</Text>
                        <Text style={[styles.billVal, { color: '#10B981', fontWeight: '800' }]}>
                          -₹{usableWallet}
                        </Text>
                      </View>
                    )}

                    <View style={[styles.billRow, { borderTopWidth: 1, borderTopColor: sectionBorder, paddingTop: 8, marginTop: 4 }]}>
                      <Text style={[styles.billLabel, { fontWeight: '800', color: textPrimary }]}>Total Fee to Pay:</Text>
                      <Text style={styles.billPrice}>
                        ₹{finalPayable}
                      </Text>
                    </View>
                  </View>
                );
              })()}

            </ScrollView>

            {/* Single real Razorpay button */}
            {selectedPlan && (() => {
              const basePrice = Number(selectedPlan.price) || 0;
              const gstAmount = gstPercentage > 0 ? Math.round((basePrice * gstPercentage) / 100) : 0;
              const subtotalWithGst = basePrice + gstAmount;
              const usableWallet = (useWallet && walletBalance > 0) ? Math.min(walletBalance, maxWalletPerTxn, subtotalWithGst) : 0;
              const finalPayable = Math.max(1, subtotalWithGst - usableWallet);

              return (
                <TouchableOpacity
                  onPress={handleConfirmPayment}
                  style={styles.planBuyBtn}
                >
                  <Text style={styles.planBuyBtnText}>
                    🔒  Pay ₹{finalPayable} via Razorpay
                  </Text>
                </TouchableOpacity>
              );
            })()}

            <TouchableOpacity onPress={() => setShowCheckoutModal(false)} style={styles.payCancelBtn}>
              <Text style={styles.payCancelBtnText}>Cancel checkout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= REAL RAZORPAY CHECKOUT (WebView / Script) ================= */}
      <RazorpayCheckout
        options={paymentOptions}
        onClose={() => setPaymentOptions(null)}
      />

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollList: { flex: 1 },
  headerBlock: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 6 },
  titleText: {  fontWeight: '900', fontSize: 20 },
  descText: { fontSize: 11, marginTop: 2 },
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 10, gap: 8 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, height: 46 },
  textInput: { flex: 1, fontSize: 12 },
  filterBtn: { width: 46, height: 46, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterBtnActive: { backgroundColor: '#e50914', borderColor: '#e50914' },
  filtersCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginHorizontal: 20, marginBottom: 16, gap: 16 },
  filterGroup: { gap: 8 },
  filterGroupLabel: { fontWeight: '700', fontSize: 10, textTransform: 'uppercase' },
  priceGrid: { flexDirection: 'row', gap: 8 },
  priceChip: { flex: 1, paddingVertical: 8, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  priceChipActive: { backgroundColor: '#e50914', borderColor: '#e50914' },
  priceChipText: { fontWeight: '700', fontSize: 10 },
  priceChipTextActive: { color: '#ffffff' },
  facilityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  facChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  facChipActive: { backgroundColor: '#e50914', borderColor: '#e50914' },
  facChipText: { fontSize: 9, fontWeight: '700' },
  facChipTextActive: { color: '#ffffff' },
  gymGrid: { paddingHorizontal: 20, gap: 16 },
  gymCard: { borderWidth: 1, borderRadius: 24, overflow: 'hidden', position: 'relative' },
  gymImg: { width: '100%', height: 140, objectFit: 'cover' },
  distBadge: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  distBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '900' },
  priceBadge: { position: 'absolute', bottom: 96, right: 12, backgroundColor: '#e50914', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  priceBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '900' },
  gymInfo: { padding: 16 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gymTitle: { fontWeight: '800', fontSize: 13 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { color: '#fac800', fontWeight: '800', fontSize: 11 },
  gymLoc: { fontSize: 10, marginTop: 2, marginBottom: 10 },
  amenityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  amenityTag: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  amenityTagText: { fontSize: 8, fontWeight: '600', textTransform: 'uppercase' },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontSize: 11, marginTop: 8 },
  detailHeaderBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  coverImageBlock: { height: 180, position: 'relative' },
  coverImg: { width: '100%', height: '100%', objectFit: 'cover' },
  coverOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 16 },
  coverName: { color: '#ffffff',  fontWeight: '900', fontSize: 18 },
  coverMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  coverMetaText: { color: '#99a1af', fontSize: 9, fontWeight: '600' },
  detailContent: { padding: 20, gap: 20 },
  timingCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, padding: 12, borderRadius: 16 },
  timingCardLabel: { fontSize: 8, textTransform: 'uppercase', fontWeight: '700' },
  timingCardText: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  sectionBlock: { gap: 8 },
  detailSectionTitle: { fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, borderBottomWidth: 1, paddingBottom: 4 },
  detailDescText: { fontSize: 11, lineHeight: 18, fontWeight: '500' },
  detailAmenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityCard: { flexDirection: 'row', alignItems: 'center', width: '48%', borderWidth: 1, padding: 10, borderRadius: 12 },
  amenityCardText: { fontSize: 10, fontWeight: '600' },
  plansContainer: { gap: 12 },
  planCard: { borderWidth: 1, padding: 16, borderRadius: 20, gap: 12 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planTitle: { fontWeight: '800', fontSize: 12 },
  planDuration: { fontSize: 9, marginTop: 1 },
  planPrice: { color: '#e50914', fontWeight: '900', fontSize: 14, fontFamily: 'monospace' },
  planFeatures: { borderTopWidth: 1, paddingTop: 8, gap: 4 },
  planFeatureItem: { fontSize: 9 },
  planBuyBtn: { backgroundColor: '#e50914', height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  planBuyBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  coachesContainer: { gap: 8 },
  coachGridCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, padding: 10, borderRadius: 16 },
  coachGridProfile: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coachGridImg: { width: 32, height: 32, borderRadius: 10, objectFit: 'cover' },
  coachGridName: { fontWeight: '700', fontSize: 11 },
  coachGridSpec: { color: '#e50914', fontSize: 8, fontWeight: '600' },
  coachGridBtn: { borderColor: 'rgba(229,9,20,0.25)', borderWidth: 1, backgroundColor: 'rgba(229,9,20,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  coachGridBtnText: { color: '#e50914', fontWeight: '800', fontSize: 8, textTransform: 'uppercase' },
  mapCard: { borderWidth: 1, borderRadius: 20, padding: 16, alignItems: 'center' },
  mapCardTitle: { fontWeight: '700', fontSize: 11 },
  mapCardSub: { fontSize: 8, fontFamily: 'monospace', marginTop: 2 },
  mapCardBtn: { color: '#e50914', fontWeight: '800', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 10 },
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 360, borderColor: 'rgba(229,9,20,0.2)', borderWidth: 1, borderRadius: 28, padding: 18, gap: 12 },
  modalHeader: { alignItems: 'center', borderBottomWidth: 1, paddingBottom: 8, borderBottomColor: 'rgba(229,9,20,0.1)' },
  modalTag: { color: '#e50914', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', backgroundColor: 'rgba(229,9,20,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 4 },
  modalTitle: { fontWeight: '900', fontSize: 16 },
  billCard: { borderWidth: 1, padding: 10, borderRadius: 14, gap: 5 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billLabel: { fontSize: 10 },
  billVal: { fontWeight: '700', fontSize: 10 },
  billPrice: { color: '#10B981', fontWeight: '900', fontSize: 14, fontFamily: 'monospace' },
  
  // Member Form Styles
  memberFormCard: { borderWidth: 1, padding: 10, borderRadius: 14, gap: 8 },
  memberFormHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  memberFormTitle: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  autofillBadge: { fontSize: 7, fontWeight: '800', color: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4, marginLeft: 'auto', textTransform: 'uppercase' },
  inputGroup: { gap: 3 },
  inputLabel: { fontSize: 8, fontWeight: '700', textTransform: 'uppercase' },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, height: 32, gap: 6 },
  formTextInput: { flex: 1, fontSize: 10, fontWeight: '600', paddingVertical: 0 },

  // Wallet Discount Styles
  walletDiscountCard: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  walletDiscountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  walletLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  walletIconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  walletTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  walletSub: { fontSize: 9, fontWeight: '700', marginTop: 1 },
  walletAppliedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 6, marginTop: 2 },
  walletAppliedLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  walletAppliedVal: { fontSize: 10, fontWeight: '900' },
  walletToggleText: { fontSize: 9, fontWeight: '800', color: '#10B981' },

  payCancelBtn: { height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', borderColor: 'rgba(150,150,150,0.25)' },
  payCancelBtnText: { fontWeight: '700', fontSize: 10, textTransform: 'uppercase', color: '#64748b' },
});
