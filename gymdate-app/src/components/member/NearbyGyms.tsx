import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useGymDate, Gym } from '../../context/GymDateContext';
import { getApiUrl } from '../../config';
import { THEME } from '../../theme';
import { useTheme } from '../../useTheme';
import { MapPin, Star, Clock, SlidersHorizontal, Navigation } from 'lucide-react-native';
import { getCurrentLocation } from '../../utils/location';

// ─── Haversine Distance (same formula as website) ────────────────────────────
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

const DISTANCE_FILTERS = [
  { label: '1km',  value: 1  },
  { label: '3km',  value: 3  },
  { label: '5km',  value: 5  },
  { label: '10km', value: 10 },
];

type GymWithRealDist = Gym & { realDistance: number | null };

export const NearbyGyms: React.FC = () => {
  const { gyms, setSelectedGymId, setActiveScreen, userProfile, userCoords, setUserCoords } = useGymDate();

  const {
    isDark,
    bg,
    cardBg,
    borderSoft,
    textPrimary,
    textSecond: textSecondary,
    textMuted,
    headerBg,
    headerBorder,
  } = useTheme();

  const [locationStatus, setLocationStatus] = useState<'loading' | 'found' | 'failed'>('loading');
  const [locationSource, setLocationSource] = useState<string>('');
  const [selectedDistance, setSelectedDistance] = useState<number>(10);

  // Use global userCoords — already fetched on login, persists across navigation
  const userLat = userCoords?.lat ?? null;
  const userLng = userCoords?.lng ?? null;

  // colours
  const chipActive         = THEME.COLORS.primary;
  const chipActiveTxt      = '#fff';
  const chipInactive       = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
  const chipInactiveTxt    = isDark ? 'rgba(255,255,255,0.55)' : '#555';
  const chipActiveBorder   = THEME.COLORS.primary;
  const chipInactiveBorder = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const starColor  = '#FBBF24';
  const ratingBg   = isDark ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.1)';

  // Re-fetch and refresh location on demand
  const resolveLocation = useCallback(async () => {
    setLocationStatus('loading');
    try {
      const email = userProfile?.email;
      if (email) {
        const res = await fetch(`${getApiUrl()}/api/user/get-profile?email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.success && data.profile?.latitude) {
          const lat = parseFloat(data.profile.latitude);
          const lng = parseFloat(data.profile.longitude);
          if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0)) {
            setUserCoords({ lat, lng });
            setLocationSource('Saved profile');
            setLocationStatus('found');
            return;
          }
        }
      }
    } catch (_) {}

    try {
      const coords = await getCurrentLocation();
      if (coords?.latitude && coords?.longitude) {
        setUserCoords({ lat: coords.latitude, lng: coords.longitude });
        setLocationSource('GPS');
        setLocationStatus('found');
      } else {
        setLocationStatus('failed');
      }
    } catch (e) {
      setLocationStatus('failed');
    }
  }, [userProfile?.email]);

  // Set initial status based on whether we already have coords from context
  useEffect(() => {
    if (userCoords) {
      setLocationStatus('found');
      setLocationSource('Profile');
    } else {
      resolveLocation();
    }
  }, [userCoords]);

  // ─── Compute real distances using haversine ──────────────────────────────
  const gymsWithDist: GymWithRealDist[] = gyms.map(g => ({
    ...g,
    realDistance: (
      userLat !== null && userLng !== null &&
      g.coordinates?.lat && g.coordinates?.lng &&
      g.coordinates.lat !== 0 && g.coordinates.lng !== 0  // skip DB placeholder 0,0
    )
      ? haversineKm(userLat, userLng, g.coordinates.lat, g.coordinates.lng)
      : null,
  }));

  // Only show gyms where we could calculate a real distance
  const filteredGyms = gymsWithDist
    .filter(g => g.realDistance !== null && g.realDistance <= selectedDistance)
    .sort((a, b) => (a.realDistance ?? 0) - (b.realDistance ?? 0));

  const openGym = (gym: GymWithRealDist) => {
    setSelectedGymId(gym.id);
    setActiveScreen('gym-details');
  };

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Nearby Gyms</Text>
          <Text style={[styles.headerSub, { color: textMuted }]} numberOfLines={1}>
            {locationStatus === 'loading'
              ? 'Detecting your location…'
              : locationStatus === 'found'
              ? `📍 ${locationSource} · ${filteredGyms.length} gym${filteredGyms.length !== 1 ? 's' : ''} found`
              : 'Location unavailable — enable GPS'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={resolveLocation}
          style={[styles.locBtn, {
            backgroundColor: isDark ? 'rgba(229,9,20,0.12)' : 'rgba(229,9,20,0.06)',
            borderColor: isDark ? 'rgba(229,9,20,0.3)' : 'rgba(229,9,20,0.2)',
          }]}
        >
          {locationStatus === 'loading'
            ? <ActivityIndicator size="small" color={THEME.COLORS.primary} />
            : <Navigation size={16} color={THEME.COLORS.primary} />}
        </TouchableOpacity>
      </View>

      {/* ── Filters ─────────────────────────────────────────────────── */}
      <View style={[styles.filtersContainer, {
        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#fafafa',
        borderBottomColor: borderSoft,
      }]}>
        <View style={styles.filterRow}>
          <SlidersHorizontal size={14} color={textMuted} style={{ marginRight: 8 }} />
          <Text style={[styles.filterLabel, { color: textMuted }]}>FILTERS</Text>
        </View>
        <Text style={[styles.distanceLabel, { color: textMuted }]}>DISTANCE</Text>
        <View style={styles.chipGrid}>
          {DISTANCE_FILTERS.map(f => {
            const active = selectedDistance === f.value;
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setSelectedDistance(f.value)}
                style={[styles.chip, {
                  backgroundColor: active ? chipActive : chipInactive,
                  borderColor: active ? chipActiveBorder : chipInactiveBorder,
                }]}
              >
                <Text style={[styles.chipTxt, { color: active ? chipActiveTxt : chipInactiveTxt }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Location failed banner ───────────────────────────────────── */}
      {locationStatus === 'failed' && (
        <View style={[styles.errorBanner, {
          backgroundColor: isDark ? 'rgba(229,9,20,0.1)' : 'rgba(229,9,20,0.06)',
          borderColor: 'rgba(229,9,20,0.2)',
        }]}>
          <Text style={[styles.errorTxt, { color: THEME.COLORS.primary }]}>
            ⚠️ Could not get your location. Please allow location access and tap refresh.
          </Text>
        </View>
      )}

      {/* ── Gym Cards ──────────────────────────────────────────────── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>

        {/* While locating */}
        {locationStatus === 'loading' && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={THEME.COLORS.primary} />
            <Text style={[styles.centerTxt, { color: textMuted }]}>Getting your location…</Text>
          </View>
        )}

        {/* Location found but no gyms in range */}
        {locationStatus === 'found' && filteredGyms.length === 0 && (
          <View style={styles.emptyState}>
            <MapPin size={48} color={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'} />
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>No gyms within {selectedDistance}km</Text>
            <Text style={[styles.emptySub, { color: textMuted }]}>Try increasing the distance filter</Text>
            <TouchableOpacity
              onPress={() => setSelectedDistance(10)}
              style={[styles.emptyBtn, { borderColor: THEME.COLORS.primary }]}
            >
              <Text style={{ color: THEME.COLORS.primary, fontWeight: '700', fontSize: 13 }}>
                Show All (10km)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Location failed — show all gyms with calculated distances (if possible) */}
        {locationStatus === 'failed' && (
          <View style={styles.emptyState}>
            <Navigation size={48} color={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'} />
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>Location Required</Text>
            <Text style={[styles.emptySub, { color: textMuted, textAlign: 'center', paddingHorizontal: 20 }]}>
              Enable location permission so we can show gyms near you with accurate distances.
            </Text>
            <TouchableOpacity
              onPress={resolveLocation}
              style={[styles.retryBtn]}
            >
              <Navigation size={14} color="#fff" />
              <Text style={styles.retryBtnTxt}>Retry Location</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Gym cards */}
        {locationStatus === 'found' && filteredGyms.map(gym => (
          <TouchableOpacity
            key={gym.id}
            onPress={() => openGym(gym)}
            activeOpacity={0.88}
            style={[styles.card, { backgroundColor: cardBg, borderColor: borderSoft }]}
          >
            {/* Image */}
            <View style={styles.imageWrapper}>
              <Image source={{ uri: gym.image }} style={styles.cardImage} resizeMode="cover" />
              {/* Distance badge — real haversine km */}
              <View style={[styles.distBadge, { backgroundColor: 'rgba(0,0,0,0.65)' }]}>
                <MapPin size={10} color="#fff" />
                <Text style={styles.distBadgeTxt}>
                  {gym.realDistance != null ? `${gym.realDistance.toFixed(1)} km` : '--'}
                </Text>
              </View>
            </View>

            {/* Body */}
            <View style={styles.cardBody}>
              {/* Top row */}
              <View style={styles.cardTopRow}>
                <Text style={[styles.gymName, { color: textPrimary }]} numberOfLines={1}>{gym.name}</Text>
                <View style={[styles.ratingPill, { backgroundColor: ratingBg }]}>
                  <Star size={11} color={starColor} fill={starColor} />
                  <Text style={[styles.ratingTxt, { color: starColor }]}>{Number(gym.rating).toFixed(1)}</Text>
                </View>
              </View>

              {/* Location */}
              <View style={styles.infoRow}>
                <MapPin size={11} color={textMuted} />
                <Text style={[styles.infoTxt, { color: textMuted }]} numberOfLines={1}>{gym.location}</Text>
              </View>

              {/* Timings */}
              <View style={styles.infoRow}>
                <Clock size={11} color={textMuted} />
                <Text style={[styles.infoTxt, { color: textMuted }]}>{gym.timings}</Text>
              </View>

              {/* Facility chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                {gym.facilities.slice(0, 5).map(f => (
                  <View key={f} style={[styles.facilityChip, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    borderColor: borderSoft,
                  }]}>
                    <Text style={[styles.facilityChipTxt, { color: textSecondary }]}>{f}</Text>
                  </View>
                ))}
              </ScrollView>

              {/* Bottom: View Details CTA */}
              <View style={[styles.cardBottom, { justifyContent: 'flex-end' }]}>
                <TouchableOpacity onPress={() => openGym(gym)} style={[styles.viewBtn, { flex: 1 }]}>
                  <Text style={styles.viewBtnTxt}>View Gym Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 130 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, marginTop: 2 },
  locBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  filtersContainer: {
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, borderBottomWidth: 1,
  },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  filterLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  distanceLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1, marginBottom: 10 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, minWidth: 70, alignItems: 'center',
  },
  chipTxt: { fontSize: 13, fontWeight: '700' },
  errorBanner: {
    marginHorizontal: 16, marginTop: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1,
  },
  errorTxt: { fontSize: 12, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingTop: 14 },
  centerState: { alignItems: 'center', paddingTop: 80, gap: 14 },
  centerTxt: { fontSize: 14 },
  card: { borderRadius: 18, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  imageWrapper: { position: 'relative' },
  cardImage: { width: '100%', height: 170 },
  distBadge: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  distBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 14 },
  cardTopRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 6,
  },
  gymName: { fontSize: 16, fontWeight: '800', flex: 1, marginRight: 8 },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  ratingTxt: { fontSize: 11, fontWeight: '700' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  infoTxt: { fontSize: 12, flex: 1 },
  facilityChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, marginRight: 6,
  },
  facilityChipTxt: { fontSize: 11, fontWeight: '600' },
  cardBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(128,128,128,0.12)',
  },
  priceLabel: { fontSize: 10, marginBottom: 2 },
  price: { fontSize: 20, fontWeight: '800' },
  priceSuffix: { fontSize: 12, fontWeight: '500' },
  viewBtn: {
    backgroundColor: THEME.COLORS.primary,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
  },
  viewBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  emptySub: { fontSize: 13 },
  emptyBtn: {
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5,
  },
  retryBtn: {
    marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: THEME.COLORS.primary,
    paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12,
  },
  retryBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
