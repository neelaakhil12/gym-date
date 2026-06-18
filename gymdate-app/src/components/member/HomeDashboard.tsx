import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert,
  Platform
} from 'react-native';
import { useGymDate, Gym } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { useTheme } from '../../useTheme';
import { 
  Search, 
  MapPin, 
  Star, 
  Bell, 
  ChevronRight,
  Menu 
} from 'lucide-react-native';

// ── Haversine distance (same as website & NearbyGyms) ─────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const HomeDashboard: React.FC = () => {
  const { 
    setActiveScreen, 
    setSelectedGymId, 
    userProfile, 
    gyms,
    unreadNotificationsCount,
    themeMode,
    userCoords,
  } = useGymDate();
  const { isDark, bg } = useTheme();

  // Compute real distance for a gym using global userCoords (persists across navigation)
  const getGymDistance = (gym: Gym): string => {
    if (
      userCoords &&
      gym.coordinates?.lat && gym.coordinates?.lng &&
      gym.coordinates.lat !== 0 && gym.coordinates.lng !== 0
    ) {
      const km = haversineKm(userCoords.lat, userCoords.lng, gym.coordinates.lat, gym.coordinates.lng);
      return km >= 100 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
    }
    return '-- km';
  };

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

  const getInitials = (name: string) => {
    if (!name) return "GY";
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(userProfile.name);
  const isLight = themeMode === 'light';

  return (
    <ScrollView style={[styles.container, isLight && { backgroundColor: '#ffffff' }]} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* 1. Header Toolbar */}
      <View style={styles.headerBar}>
        <View style={styles.profileRow}>
          <TouchableOpacity onPress={() => setActiveScreen('profile')} style={styles.avatarWrapper}>
            {userProfile.avatar ? (
              <Image source={{ uri: userProfile.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarImg, styles.initialsAvatar]}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={[styles.nameText, isLight && { color: '#111827' }]} numberOfLines={1} ellipsizeMode="tail">{userProfile.name}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={() => setActiveScreen('notifications')} 
            style={[styles.notificationBtn, isLight && { backgroundColor: '#ffffff', borderColor: '#E5E7EB' }, { marginRight: 8 }]}
          >
            <Bell size={16} color={isLight ? '#374151' : '#ffffff'} />
            {unreadNotificationsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadNotificationsCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setActiveScreen('profile')} 
            style={[styles.notificationBtn, isLight && { backgroundColor: '#ffffff', borderColor: '#E5E7EB' }]}
          >
            <Menu size={16} color={isLight ? '#374151' : '#ffffff'} />
          </TouchableOpacity>
        </View>
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

      {/* 3. Gym Image Banners Carousel */}
      <View style={styles.videoSectionContainer}>
        <View style={styles.videoSectionHeader}>
          <Text style={[styles.videoSectionTitle, isLight && { color: '#111827' }]}>Featured Gym Environments</Text>
          <Text style={styles.videoSectionSub}>Explore cinematic views of premium workout vibes.</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.videoScroll}>
          {[
            {
              id: 'gym-1',
              name: "Gold's Gym Elite",
              location: "Bandra West, Mumbai",
              image: require('../../../assets/gym_slide_reception.jpg'),
              tag: "PREMIUM LOUNGE"
            },
            {
              id: 'gym-2',
              name: "UFC Gym & Octagon Club",
              location: "Indiranagar, Bangalore",
              image: require('../../../assets/gym_slide_floor.jpg'),
              tag: "TRAINING FLOOR"
            },
            {
              id: 'gym-3',
              name: "Cult.fit Premium Center",
              location: "Gachibowli, Hyderabad",
              image: require('../../../assets/gym_slide_yoga.jpg'),
              tag: "MIND & BODY"
            },
            {
              id: 'gym-1',
              name: "Gold's Gym Elite",
              location: "Bandra West, Mumbai",
              image: require('../../../assets/gym_slide_cardio.jpg'),
              tag: "CARDIO ZONE"
            },
            {
              id: 'gym-3',
              name: "Cult.fit Premium Center",
              location: "Gachibowli, Hyderabad",
              image: require('../../../assets/gym_slide_crossfit.jpg'),
              tag: "CROSSFIT RIG"
            }
          ].map((slide, idx) => (
            <TouchableOpacity 
              key={idx}
              onPress={() => handleGymClick(slide.id)}
              style={styles.videoCard}
              activeOpacity={0.9}
            >
              <Image
                source={slide.image}
                style={styles.videoStyle}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
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
              <Text style={styles.gymDistanceText}>{getGymDistance(gym)}</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    flex: 1,
    marginRight: 12,
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
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    
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
  videoSectionContainer: {
    paddingVertical: 10,
  },
  videoSectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  videoSectionTitle: {
    color: '#ffffff',
    
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  videoSectionSub: {
    color: THEME.COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  videoScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  videoCard: {
    width: 260,
    height: 150,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000000',
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
  videoStyle: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  videoContent: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  videoTagContainer: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  videoTagText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  videoGymName: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
    
  },
  videoGymLoc: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 8.5,
    marginTop: 1,
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
  },
  initialsAvatar: {
    backgroundColor: THEME.COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  initialsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    
  }
});
