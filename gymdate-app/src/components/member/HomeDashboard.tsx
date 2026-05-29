import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert 
} from 'react-native';
import { useGymDate, Gym } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { 
  Search, 
  MapPin, 
  Star, 
  Bell, 
  ChevronRight 
} from 'lucide-react-native';

export const HomeDashboard: React.FC = () => {
  const { 
    setActiveScreen, 
    setSelectedGymId, 
    userProfile, 
    gyms,
    unreadNotificationsCount,
    themeMode
  } = useGymDate();

  const handleGymClick = (id: string) => {
    setSelectedGymId(id);
    setActiveScreen('gym-details');
  };

  const categories = [
    { name: 'Strength', icon: '💪' },
    { name: 'Cardio', icon: '🏃‍♂️' },
    { name: 'MMA Cage', icon: '🥊' },
    { name: 'Yoga', icon: '🧘' },
    { name: 'Crossfit', icon: '🏋️' }
  ];

  const isLight = themeMode === 'light';

  return (
    <ScrollView style={[styles.container, isLight && { backgroundColor: '#F9F9F9' }]} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* 1. Header Toolbar */}
      <View style={styles.headerBar}>
        <View style={styles.profileRow}>
          <TouchableOpacity onPress={() => setActiveScreen('profile')} style={styles.avatarWrapper}>
            <Image source={{ uri: userProfile.avatar }} style={styles.avatarImg} />
          </TouchableOpacity>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={[styles.nameText, isLight && { color: '#111827' }]}>{userProfile.name}</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => setActiveScreen('notifications')} 
          style={[styles.notificationBtn, isLight && { backgroundColor: '#ffffff', borderColor: '#E5E7EB' }]}
        >
          <Bell size={16} color={isLight ? '#374151' : '#ffffff'} />
          {unreadNotificationsCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{unreadNotificationsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 2. Unified Search */}
      <View style={styles.searchContainer}>
        <TouchableOpacity 
          onPress={() => setActiveScreen('discovery')}
          style={[styles.searchBar, isLight && { backgroundColor: '#ffffff', borderColor: '#E5E7EB' }]}
          activeOpacity={0.8}
        >
          <Search size={14} color={isLight ? '#6B7280' : THEME.COLORS.textMuted} style={{ marginRight: 8 }} />
          <Text style={[styles.searchBarText, isLight && { color: '#4B5563' }]}>Search premium gyms, fitness classes...</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Promo Launch Banner */}
      <View style={styles.promoContainer}>
        <View style={styles.promoCard}>
          <View style={styles.promoHeader}>
            <Text style={styles.promoTag}>LAUNCH OFFER</Text>
          </View>
          <Text style={styles.promoTitle}>FITNESS FREEDOM{'\n'}AT 20% DISCOUNT</Text>
          <Text style={styles.promoSub}>Access partnered gyms pan India with zero commitments.</Text>
          
          <View style={styles.couponRow}>
            <Text style={styles.couponText}>GDGOLD20</Text>
            <TouchableOpacity 
              onPress={() => Alert.alert('Code Copied', 'Apply coupon "GDGOLD20" at membership checkout.')}
              style={styles.couponBtn}
            >
              <Text style={styles.couponBtnText}>Copy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 4. Horizontal Categories Row */}
      <View style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat, i) => (
            <TouchableOpacity 
              key={i} 
              onPress={() => setActiveScreen('discovery')}
              style={[styles.categoryChip, isLight && { backgroundColor: '#ffffff', borderColor: '#E5E7EB' }]}
            >
              <Text style={[styles.categoryChipText, isLight && { color: '#4B5563' }]}>{cat.icon} {cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 5. Horizontal Nearby Gyms list */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, isLight && { color: '#111827' }]}>Nearby Premium Gyms</Text>
        <TouchableOpacity onPress={() => setActiveScreen('discovery')} style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={10} color={THEME.COLORS.primary} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gymScroll}>
        {gyms.map((gym) => (
          <TouchableOpacity 
            key={gym.id}
            onPress={() => handleGymClick(gym.id)}
            style={[styles.gymCard, isLight && { backgroundColor: '#ffffff', borderColor: '#E5E7EB' }]}
            activeOpacity={0.9}
          >
            <Image source={{ uri: gym.image }} style={styles.gymImg} />
            <View style={styles.gymDistanceBadge}>
              <MapPin size={8} color={THEME.COLORS.primary} style={{ marginRight: 2 }} />
              <Text style={styles.gymDistanceText}>{gym.distance} km</Text>
            </View>
            <View style={styles.gymPriceBadge}>
              <Text style={styles.gymPriceText}>₹{gym.pricePerDay}/d</Text>
            </View>

            <View style={styles.gymInfo}>
              <Text style={[styles.gymName, isLight && { color: '#1F2937' }]} numberOfLines={1}>{gym.name}</Text>
              <Text style={[styles.gymLoc, isLight && { color: '#6B7280' }]} numberOfLines={1}>{gym.location}</Text>
              
              <View style={styles.ratingRow}>
                <Star size={10} color={THEME.COLORS.warning} fill={THEME.COLORS.warning} style={{ marginRight: 2 }} />
                <Text style={styles.ratingText}>{gym.rating}</Text>
                <Text style={styles.ratingCount}>({gym.reviewsCount})</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 6. Active Fitness Challenge Banner */}
      <View style={styles.challengeContainer}>
        <View style={[styles.challengeCard, isLight && { backgroundColor: '#ffffff', borderColor: '#E5E7EB' }]}>
          <View style={styles.challengeBadge}>
            <Text style={styles.challengeBadgeIcon}>🔥</Text>
          </View>
          <View style={styles.challengeInfo}>
            <Text style={styles.challengeLabel}>Active Challenge</Text>
            <Text style={[styles.challengeTitle, isLight && { color: '#1F2937' }]}>7-Day HIIT Calorie Burner</Text>
            <Text style={[styles.challengeDesc, isLight && { color: '#6B7280' }]}>Burn 800kcal daily to earn special profile badge.</Text>
          </View>
          <TouchableOpacity onPress={() => setActiveScreen('community')} style={styles.challengeBtn}>
            <Text style={styles.challengeBtnText}>Join</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 7. Featured Personal Coaches */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, isLight && { color: '#111827' }]}>Popular Personal Coaches</Text>
      </View>

      <View style={styles.coachesGrid}>
        <View style={[styles.coachCard, isLight && { backgroundColor: '#ffffff', borderColor: '#E5E7EB' }]}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=100' }} style={styles.coachAvatar} />
          <View style={styles.coachInfo}>
            <Text style={[styles.coachName, isLight && { color: '#1F2937' }]}>Vikram Singh</Text>
            <Text style={styles.coachSpec}>Strength Specialist</Text>
          </View>
        </View>

        <View style={[styles.coachCard, isLight && { backgroundColor: '#ffffff', borderColor: '#E5E7EB' }]}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100' }} style={styles.coachAvatar} />
          <View style={styles.coachInfo}>
            <Text style={[styles.coachName, isLight && { color: '#1F2937' }]}>Riya Sharma</Text>
            <Text style={styles.coachSpec}>HIIT Conditioning</Text>
          </View>
        </View>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.bgDark,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: THEME.COLORS.primary,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  welcomeText: {
    fontSize: 9,
    color: THEME.COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  nameText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: 'Outfit',
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: THEME.COLORS.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 46,
  },
  searchBarText: {
    color: THEME.COLORS.textMuted,
    fontSize: 11,
  },
  promoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  promoCard: {
    backgroundColor: THEME.COLORS.primary,
    borderRadius: 24,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: THEME.COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  promoHeader: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 10,
  },
  promoTag: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 8,
    letterSpacing: 1,
  },
  promoTitle: {
    color: '#ffffff',
    fontFamily: 'Outfit',
    fontWeight: '900',
    fontSize: 18,
    lineHeight: 22,
  },
  promoSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 9,
    marginTop: 6,
    marginBottom: 16,
  },
  couponRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  couponText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
    fontFamily: 'monospace',
    letterSpacing: 1.5,
    marginLeft: 8,
  },
  couponBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  couponBtnText: {
    color: THEME.COLORS.primary,
    fontWeight: '800',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  categoriesSection: {
    paddingVertical: 10,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderRadius: 20,
  },
  categoryChipText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontFamily: 'Outfit',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    color: THEME.COLORS.primary,
    fontWeight: '800',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gymScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  gymCard: {
    width: 220,
    backgroundColor: 'rgba(22, 23, 33, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  gymImg: {
    width: '100%',
    height: 110,
    objectFit: 'cover',
  },
  gymDistanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  gymDistanceText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  gymPriceBadge: {
    position: 'absolute',
    bottom: 80,
    right: 10,
    backgroundColor: THEME.COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  gymPriceText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  gymInfo: {
    padding: 12,
  },
  gymName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
  gymLoc: {
    color: THEME.COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    color: THEME.COLORS.warning,
    fontWeight: '800',
    fontSize: 10,
  },
  ratingCount: {
    color: THEME.COLORS.textMuted,
    fontSize: 8,
    marginLeft: 3,
  },
  challengeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 20,
  },
  challengeBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(254, 110, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeBadgeIcon: {
    fontSize: 18,
  },
  challengeInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  challengeLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: THEME.COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  challengeTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
    marginTop: 1,
  },
  challengeDesc: {
    color: THEME.COLORS.textMuted,
    fontSize: 9,
    marginTop: 1,
  },
  challengeBtn: {
    backgroundColor: THEME.COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  challengeBtnText: {
    color: THEME.COLORS.textBlack,
    fontWeight: '800',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  coachesGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  coachCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 16,
  },
  coachAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    objectFit: 'cover',
  },
  coachInfo: {
    marginLeft: 10,
    flex: 1,
  },
  coachName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 10,
  },
  coachSpec: {
    color: THEME.COLORS.primary,
    fontSize: 8,
    fontWeight: '600',
    marginTop: 1,
  }
});
