import React, { useState } from 'react';
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
  useColorScheme
} from 'react-native';
import { useGymDate, Trainer } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { useTheme } from '../../useTheme';
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
  Menu
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
    userCoords,
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
  const [activeFacility, setActiveFacility] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(500);
  const [showFilters, setShowFilters] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: number; duration: string } | null>(null);

  const facilitiesList = ['Locker Room', 'Steam Room', 'Air Conditioned', 'MMA Cage', 'Group Workouts'];

  const handleGymClick = (id: string) => {
    setSelectedGymId(id);
    setActiveScreen('gym-details');
  };

  const handleBackToList = () => {
    setSelectedGymId(null);
    setActiveScreen('discovery');
  };

  const filteredGyms = gyms.filter(gym => {
    const matchesSearch = gym.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          gym.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFacility = activeFacility ? gym.facilities.includes(activeFacility) : true;
    const matchesPrice = gym.pricePerDay <= maxPrice;
    return matchesSearch && matchesFacility && matchesPrice;
  });

  const activeGym = gyms.find(g => g.id === selectedGymId);

  const handleBuyPassClick = (plan: { name: string; price: number; duration: string }) => {
    setSelectedPlan(plan);
    setShowCheckoutModal(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedPlan || !activeGym) return;
    
    setUserProfile(prev => ({
      ...prev,
      membershipType: selectedPlan.name as any,
      membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    }));

    setShowCheckoutModal(false);
    Alert.alert('Payment Successful', `You have unlocked the ${selectedPlan.name} for ${activeGym.name}. Digital QR checkin pass is active!`);
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
      {!selectedGymId && (
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.scrollList} contentContainerStyle={{ paddingBottom: 80 }}>
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

            {/* Search Input bar */}
            <View style={styles.searchRow}>
              <View style={[styles.searchBar, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                <Search size={14} color={textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Search Bandra, Indiranagar..."
                  placeholderTextColor={textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={[styles.textInput, { color: textPrimary }]}
                />
              </View>
              <TouchableOpacity 
                onPress={() => setShowFilters(!showFilters)} 
                style={[styles.filterBtn, { backgroundColor: inputBg, borderColor: inputBorder }, showFilters && styles.filterBtnActive]}
              >
                <SlidersHorizontal size={14} color={showFilters ? '#ffffff' : textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Filter Overlay panel */}
            {showFilters && (
              <View style={[styles.filtersCard, { backgroundColor: filterCardBg, borderColor: isDark ? THEME.COLORS.borderColor : 'rgba(0,0,0,0.08)' }]}>
                <View style={styles.filterGroup}>
                  <Text style={[styles.filterGroupLabel, { color: textSecondary }]}>Max Budget/Day: ₹{maxPrice}</Text>
                  <View style={styles.priceGrid}>
                    {[200, 300, 400, 500].map(pr => (
                      <TouchableOpacity
                        key={pr}
                        onPress={() => setMaxPrice(pr)}
                        style={[styles.priceChip, { borderColor: inputBorder, backgroundColor: inputBg }, maxPrice === pr && styles.priceChipActive]}
                      >
                        <Text style={[styles.priceChipText, { color: textSecondary }, maxPrice === pr && styles.priceChipTextActive]}>₹{pr}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.filterGroup}>
                  <Text style={[styles.filterGroupLabel, { color: textSecondary }]}>Gym Amenity</Text>
                  <View style={styles.facilityGrid}>
                    {facilitiesList.map(fac => (
                      <TouchableOpacity
                        key={fac}
                        onPress={() => setActiveFacility(activeFacility === fac ? null : fac)}
                        style={[styles.facChip, { borderColor: inputBorder, backgroundColor: inputBg }, activeFacility === fac && styles.facChipActive]}
                      >
                        <Text style={[styles.facChipText, { color: textSecondary }, activeFacility === fac && styles.facChipTextActive]}>{fac}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

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
      )}

      {/* ================= VIEW 2: GYM DETAILS DEEP VIEW ================= */}
      {selectedGymId && activeGym && (
        <View style={{ flex: 1 }}>
          {/* Header toolbar */}
          <View style={[styles.detailHeaderBar, { backgroundColor: headerBarBg, borderBottomColor: headerBarBorder }]}>
            <TouchableOpacity onPress={handleBackToList} style={[styles.backBtn, { backgroundColor: backBtnBg, borderColor: headerBarBorder }]}>
              <ChevronLeft size={16} color={textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.detailTitle, { color: textPrimary }]}>Gym Profile Details</Text>
            <View style={{ width: 34 }} />
          </View>

          <ScrollView style={styles.scrollList} contentContainerStyle={{ paddingBottom: 80 }}>
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

      {/* ================= MODAL: PAYMENT GATEWAY CHECKOUT ================= */}
      <Modal visible={showCheckoutModal} transparent animationType="slide">
        <View style={[styles.modalBackdrop, { backgroundColor: modalBg }]}>
          <View style={[styles.modalCard, { backgroundColor: modalCardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTag}>Razorpay Secure</Text>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Gateway Checkout</Text>
            </View>

            {selectedPlan && activeGym && (
              <View style={[styles.billCard, { backgroundColor: billCardBg }]}>
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: textSecondary }]}>Partner Gym:</Text>
                  <Text style={[styles.billVal, { color: textPrimary }]}>{activeGym.name}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: textSecondary }]}>Pass Package:</Text>
                  <Text style={[styles.billVal, { color: textPrimary }]}>{selectedPlan.name}</Text>
                </View>
                <View style={[styles.billRow, { borderTopWidth: 1, borderTopColor: sectionBorder, paddingTop: 10, marginTop: 6 }]}>
                  <Text style={[styles.billLabel, { fontWeight: '700', color: textPrimary }]}>Total Payment:</Text>
                  <Text style={styles.billPrice}>₹{selectedPlan.price}</Text>
                </View>
              </View>
            )}

            <View style={styles.payMethods}>
              <Text style={[styles.payMethodsTitle, { color: textSecondary }]}>Choose Mode of Payment</Text>
              <TouchableOpacity onPress={handleConfirmPayment} style={[styles.payMethodBtn, { backgroundColor: payBtnBg, borderColor: payBtnBorder }]}>
                <Text style={[styles.payMethodText, { color: textPrimary }]}>📱 Unified UPI (GooglePay/PhonePe)</Text>
                <ChevronRight size={12} color={textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmPayment} style={[styles.payMethodBtn, { backgroundColor: payBtnBg, borderColor: payBtnBorder }]}>
                <Text style={[styles.payMethodText, { color: textPrimary }]}>💳 Credit / Debit Card</Text>
                <ChevronRight size={12} color={textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmPayment} style={[styles.payMethodBtn, { backgroundColor: payBtnBg, borderColor: payBtnBorder }]}>
                <Text style={[styles.payMethodText, { color: textPrimary }]}>💼 Wallet Netbanking</Text>
                <ChevronRight size={12} color={textMuted} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setShowCheckoutModal(false)} style={styles.payCancelBtn}>
              <Text style={styles.payCancelBtnText}>Cancel checkout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  planBuyBtn: { backgroundColor: '#e50914', height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planBuyBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
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
  modalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 320, borderColor: 'rgba(229,9,20,0.2)', borderWidth: 1, borderRadius: 28, padding: 20, gap: 16 },
  modalHeader: { alignItems: 'center', borderBottomWidth: 1, paddingBottom: 10 },
  modalTag: { color: '#e50914', fontSize: 8, fontWeight: '800', textTransform: 'uppercase', backgroundColor: 'rgba(229,9,20,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 4 },
  modalTitle: {  fontWeight: '900', fontSize: 16 },
  billCard: { borderWidth: 1, padding: 12, borderRadius: 16, gap: 6 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  billLabel: { fontSize: 11 },
  billVal: { fontWeight: '700', fontSize: 11 },
  billPrice: { color: '#00c758', fontWeight: '900', fontSize: 14, fontFamily: 'monospace' },
  payCancelBtn: { height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  payCancelBtnText: { fontWeight: '700', fontSize: 11, textTransform: 'uppercase' },
  payMethods: { gap: 8 },
  payMethodsTitle: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginBottom: 2 },
  payMethodBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, padding: 10, borderRadius: 12 },
  payMethodText: { fontWeight: '600', fontSize: 11 },
});
