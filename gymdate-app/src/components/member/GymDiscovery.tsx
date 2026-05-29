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
  Alert
} from 'react-native';
import { useGymDate, Trainer } from '../../context/GymDateContext';
import { THEME } from '../../theme';
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
  ChevronRight
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
    addBooking
  } = useGymDate();

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
    <View style={styles.container}>
      
      {/* ================= VIEW 1: SEARCH & DISCOVERY LIST ================= */}
      {!selectedGymId && (
        <View style={{ flex: 1 }}>
          <ScrollView style={styles.scrollList} contentContainerStyle={{ paddingBottom: 80 }}>
            {/* Header */}
            <View style={styles.headerBlock}>
              <Text style={styles.titleText}>Find Your Gym</Text>
              <Text style={styles.descText}>Discover premium multi-city fitness spaces nearby.</Text>
            </View>

            {/* Search Input bar */}
            <View style={styles.searchRow}>
              <View style={styles.searchBar}>
                <Search size={14} color={THEME.COLORS.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Search Bandra, Indiranagar..."
                  placeholderTextColor={THEME.COLORS.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={styles.textInput}
                />
              </View>
              <TouchableOpacity 
                onPress={() => setShowFilters(!showFilters)} 
                style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
              >
                <SlidersHorizontal size={14} color={showFilters ? '#ffffff' : THEME.COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Filter Overlay panel */}
            {showFilters && (
              <View style={styles.filtersCard}>
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>Max Budget/Day: ₹{maxPrice}</Text>
                  {/* Slider simulation using horizontal tabs */}
                  <View style={styles.priceGrid}>
                    {[200, 300, 400, 500].map(pr => (
                      <TouchableOpacity
                        key={pr}
                        onPress={() => setMaxPrice(pr)}
                        style={[styles.priceChip, maxPrice === pr && styles.priceChipActive]}
                      >
                        <Text style={[styles.priceChipText, maxPrice === pr && styles.priceChipTextActive]}>₹{pr}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupLabel}>Gym Amenity</Text>
                  <View style={styles.facilityGrid}>
                    {facilitiesList.map(fac => (
                      <TouchableOpacity
                        key={fac}
                        onPress={() => setActiveFacility(activeFacility === fac ? null : fac)}
                        style={[styles.facChip, activeFacility === fac && styles.facChipActive]}
                      >
                        <Text style={[styles.facChipText, activeFacility === fac && styles.facChipTextActive]}>{fac}</Text>
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
                    style={styles.gymCard}
                    activeOpacity={0.9}
                  >
                    <Image source={{ uri: gym.image }} style={styles.gymImg} />
                    <View style={styles.distBadge}>
                      <MapPin size={8} color={THEME.COLORS.primary} style={{ marginRight: 2 }} />
                      <Text style={styles.distBadgeText}>{gym.distance} km</Text>
                    </View>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceBadgeText}>₹{gym.pricePerDay} / day</Text>
                    </View>

                    <View style={styles.gymInfo}>
                      <View style={styles.titleRow}>
                        <Text style={styles.gymTitle}>{gym.name}</Text>
                        <View style={styles.ratingRow}>
                          <Star size={10} color={THEME.COLORS.warning} fill={THEME.COLORS.warning} style={{ marginRight: 2 }} />
                          <Text style={styles.ratingText}>{gym.rating}</Text>
                        </View>
                      </View>
                      
                      <Text style={styles.gymLoc}>{gym.location}</Text>

                      <View style={styles.amenityRow}>
                        {gym.facilities.slice(0, 3).map((f, i) => (
                          <View key={i} style={styles.amenityTag}>
                            <Text style={styles.amenityTagText}>{f}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🏋️‍♀️</Text>
                  <Text style={styles.emptyText}>No gyms match your active search filter.</Text>
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
          <View style={styles.detailHeaderBar}>
            <TouchableOpacity onPress={handleBackToList} style={styles.backBtn}>
              <ChevronLeft size={16} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.detailTitle}>Gym Profile Details</Text>
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
            <View style={styles.detailContent}>
              
              {/* Timings */}
              <View style={styles.timingCard}>
                <Clock size={16} color={THEME.COLORS.primary} style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.timingCardLabel}>Workout Timings</Text>
                  <Text style={styles.timingCardText}>{activeGym.timings}</Text>
                </View>
              </View>

              {/* Description */}
              <View style={styles.sectionBlock}>
                <Text style={styles.detailSectionTitle}>About this Gym</Text>
                <Text style={styles.detailDescText}>{activeGym.description}</Text>
              </View>

              {/* Amenities Grid */}
              <View style={styles.sectionBlock}>
                <Text style={styles.detailSectionTitle}>Available Amenities</Text>
                <View style={styles.detailAmenitiesGrid}>
                  {activeGym.facilities.map((fac, idx) => (
                    <View key={idx} style={styles.amenityCard}>
                      <Check size={12} color={THEME.COLORS.success} style={{ marginRight: 6 }} />
                      <Text style={styles.amenityCardText}>{fac}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Plans pass packages */}
              <View style={styles.sectionBlock}>
                <Text style={styles.detailSectionTitle}>Gym Passes Available</Text>
                <View style={styles.plansContainer}>
                  {activeGym.plans.map((plan, idx) => (
                    <View key={idx} style={styles.planCard}>
                      <View style={styles.planHeader}>
                        <View>
                          <Text style={styles.planTitle}>{plan.name}</Text>
                          <Text style={styles.planDuration}>{plan.duration} access duration</Text>
                        </View>
                        <Text style={styles.planPrice}>₹{plan.price}</Text>
                      </View>

                      <View style={styles.planFeatures}>
                        {plan.features.map((f, i) => (
                          <Text key={i} style={styles.planFeatureItem}>• {f}</Text>
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

              {/* Coaches list */}
              {activeGym.trainers.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={styles.detailSectionTitle}>Expert Coaches</Text>
                  <View style={styles.coachesContainer}>
                    {activeGym.trainers.map(trainer => (
                      <View key={trainer.id} style={styles.coachGridCard}>
                        <View style={styles.coachGridProfile}>
                          <Image source={{ uri: trainer.avatar }} style={styles.coachGridImg} />
                          <View>
                            <Text style={styles.coachGridName}>{trainer.name}</Text>
                            <Text style={styles.coachGridSpec}>{trainer.specialization}</Text>
                          </View>
                        </View>
                        <TouchableOpacity 
                          onPress={() => handleBookTrainerSlot(trainer)}
                          style={styles.coachGridBtn}
                        >
                          <Text style={styles.coachGridBtnText}>Book Coach</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Google map simulator */}
              <View style={styles.sectionBlock}>
                <Text style={styles.detailSectionTitle}>Location Directions</Text>
                <TouchableOpacity 
                  onPress={() => Linking.openURL(`https://maps.google.com/?q=${activeGym.coordinates.lat},${activeGym.coordinates.lng}`)}
                  style={styles.mapCard}
                >
                  <Compass size={20} color={THEME.COLORS.primary} style={{ marginBottom: 6 }} />
                  <Text style={styles.mapCardTitle}>Google Maps directions</Text>
                  <Text style={styles.mapCardSub}>Lat: {activeGym.coordinates.lat} | Lng: {activeGym.coordinates.lng}</Text>
                  <Text style={styles.mapCardBtn}>Tap to Open Directions</Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </View>
      )}

      {/* ================= MODAL: PAYMENT GATEWAY CHECKOUT ================= */}
      <Modal visible={showCheckoutModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTag}>Razorpay Secure</Text>
              <Text style={styles.modalTitle}>Gateway Checkout</Text>
            </View>

            {selectedPlan && activeGym && (
              <View style={styles.billCard}>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Partner Gym:</Text>
                  <Text style={styles.billVal}>{activeGym.name}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Pass Package:</Text>
                  <Text style={styles.billVal}>{selectedPlan.name}</Text>
                </View>
                <View style={[styles.billRow, { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)', paddingTop: 10, marginTop: 6 }]}>
                  <Text style={[styles.billLabel, { fontWeight: '700', color: '#ffffff' }]}>Total Payment:</Text>
                  <Text style={styles.billPrice}>₹{selectedPlan.price}</Text>
                </View>
              </View>
            )}

            <View style={styles.payMethods}>
              <Text style={styles.payMethodsTitle}>Choose Mode of Payment</Text>
              <TouchableOpacity onPress={handleConfirmPayment} style={styles.payMethodBtn}>
                <Text style={styles.payMethodText}>📱 Unified UPI (GooglePay/PhonePe)</Text>
                <ChevronRight size={12} color={THEME.COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmPayment} style={styles.payMethodBtn}>
                <Text style={styles.payMethodText}>💳 Credit / Debit Card</Text>
                <ChevronRight size={12} color={THEME.COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmPayment} style={styles.payMethodBtn}>
                <Text style={styles.payMethodText}>💼 Wallet Netbanking</Text>
                <ChevronRight size={12} color={THEME.COLORS.textMuted} />
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
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.bgDark,
  },
  scrollList: {
    flex: 1,
  },
  headerBlock: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  titleText: {
    color: '#ffffff',
    fontFamily: 'Outfit',
    fontWeight: '900',
    fontSize: 20,
  },
  descText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 46,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: THEME.COLORS.primary,
    borderColor: THEME.COLORS.primary,
  },
  filtersCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 16,
  },
  filterGroup: {
    gap: 8,
  },
  filterGroupLabel: {
    color: THEME.COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  priceGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  priceChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    alignItems: 'center',
  },
  priceChipActive: {
    backgroundColor: THEME.COLORS.primary,
    borderColor: THEME.COLORS.primary,
  },
  priceChipText: {
    color: THEME.COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 10,
  },
  priceChipTextActive: {
    color: '#ffffff',
  },
  facilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  facChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  facChipActive: {
    backgroundColor: THEME.COLORS.primary,
    borderColor: THEME.COLORS.primary,
  },
  facChipText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
  facChipTextActive: {
    color: '#ffffff',
  },
  gymGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  gymCard: {
    backgroundColor: 'rgba(22, 23, 33, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  gymImg: {
    width: '100%',
    height: 140,
    objectFit: 'cover',
  },
  distBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  priceBadge: {
    position: 'absolute',
    bottom: 96,
    right: 12,
    backgroundColor: THEME.COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  priceBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  gymInfo: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gymTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: THEME.COLORS.warning,
    fontWeight: '800',
    fontSize: 11,
  },
  gymLoc: {
    color: THEME.COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
    marginBottom: 10,
  },
  amenityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  amenityTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  amenityTagText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyText: {
    color: THEME.COLORS.textMuted,
    fontSize: 11,
    marginTop: 8,
  },
  detailHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(12, 13, 18, 0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coverImageBlock: {
    height: 180,
    position: 'relative',
  },
  coverImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 16,
  },
  coverName: {
    color: '#ffffff',
    fontFamily: 'Outfit',
    fontWeight: '900',
    fontSize: 18,
  },
  coverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  coverMetaText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '600',
  },
  detailContent: {
    padding: 20,
    gap: 20,
  },
  timingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
  },
  timingCardLabel: {
    color: THEME.COLORS.textMuted,
    fontSize: 8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  timingCardText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  sectionBlock: {
    gap: 8,
  },
  detailSectionTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 4,
  },
  detailDescText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 18,
  },
  detailAmenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
  },
  amenityCardText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  plansContainer: {
    gap: 12,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  planDuration: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9,
    marginTop: 1,
  },
  planPrice: {
    color: THEME.COLORS.primary,
    fontWeight: '900',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  planFeatures: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
    gap: 4,
  },
  planFeatureItem: {
    color: THEME.COLORS.textMuted,
    fontSize: 9,
  },
  planBuyBtn: {
    backgroundColor: THEME.COLORS.primary,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBuyBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coachesContainer: {
    gap: 8,
  },
  coachGridCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 16,
  },
  coachGridProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coachGridImg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    objectFit: 'cover',
  },
  coachGridName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
  coachGridSpec: {
    color: THEME.COLORS.primary,
    fontSize: 8,
    fontWeight: '600',
  },
  coachGridBtn: {
    borderColor: 'rgba(229, 9, 20, 0.25)',
    borderWidth: 1,
    backgroundColor: 'rgba(229, 9, 20, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  coachGridBtnText: {
    color: THEME.COLORS.primary,
    fontWeight: '800',
    fontSize: 8,
    textTransform: 'uppercase',
  },
  mapCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  mapCardTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
  mapCardSub: {
    color: THEME.COLORS.textMuted,
    fontSize: 8,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  mapCardBtn: {
    color: THEME.COLORS.primary,
    fontWeight: '800',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: 'rgba(229, 9, 20, 0.2)',
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 10,
  },
  modalTag: {
    color: THEME.COLORS.primary,
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  modalTitle: {
    color: '#ffffff',
    fontFamily: 'Outfit',
    fontWeight: '900',
    fontSize: 16,
  },
  billCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
    gap: 6,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
  },
  billVal: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
  billPrice: {
    color: THEME.COLORS.success,
    fontWeight: '900',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  payCancelBtn: {
    height: 44,
    borderRadius: 14,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  payCancelBtnText: {
    color: THEME.COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  payMethods: {
    gap: 8,
  },
  payMethodsTitle: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  payMethodBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
  },
  payMethodText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 11,
  }
});
