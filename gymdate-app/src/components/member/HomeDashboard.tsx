import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert,
  Platform,
  ActivityIndicator
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
import { WebView } from 'react-native-webview';
import { getCurrentLocation, reverseGeocode } from '../../utils/location';

// ── Haversine distance helper ─────────────────────
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
    setUserProfile,
    gyms,
    unreadNotificationsCount,
    themeMode,
    userCoords,
    setUserCoords,
  } = useGymDate();
  const { isDark, bg } = useTheme();

  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedRadius, setSelectedRadius] = useState<number | 'all'>('all');
  const [isLocating, setIsLocating] = useState(false);

  const isLight = themeMode === 'light';

  // Listen for gym card clicks inside Leaflet iframe on web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleIframeMessage = (e: MessageEvent) => {
        if (e.data && e.data.type === 'OPEN_GYM' && e.data.id) {
          handleGymClick(e.data.id);
        }
      };
      window.addEventListener('message', handleIframeMessage);
      return () => window.removeEventListener('message', handleIframeMessage);
    }
  }, []);

  // Effective user GPS coordinates (with profile fallback)
  const effectiveUserCoords = React.useMemo(() => {
    if (userCoords?.lat && userCoords?.lng) return userCoords;
    if (userProfile.latitude && userProfile.longitude) {
      return { lat: userProfile.latitude, lng: userProfile.longitude };
    }
    return { lat: 17.385044, lng: 78.486671 };
  }, [userCoords, userProfile.latitude, userProfile.longitude]);

  // Compute real distance for a gym using effectiveUserCoords
  const getGymDistance = (gym: Gym): string => {
    const gLat = gym.coordinates?.lat || 17.3208917;
    const gLng = gym.coordinates?.lng || 78.562233;
    const km = haversineKm(effectiveUserCoords.lat, effectiveUserCoords.lng, gLat, gLng);
    return km >= 100 ? `${Math.round(km)} km` : `${km.toFixed(1)} km`;
  };

  const getGymDistanceNum = (gym: Gym): number => {
    const gLat = gym.coordinates?.lat || 17.3208917;
    const gLng = gym.coordinates?.lng || 78.562233;
    return haversineKm(effectiveUserCoords.lat, effectiveUserCoords.lng, gLat, gLng);
  };

  // Filter gyms by selected radius
  const filteredGyms = gyms.filter(gym => {
    if (selectedRadius === 'all') return true;
    const dist = getGymDistanceNum(gym);
    return dist <= selectedRadius;
  });

  // Auto locate user on mount if coordinates not yet available
  useEffect(() => {
    if (!userCoords) {
      handleLocateUser(true);
    }
  }, [userCoords]);

  const handleLocateUser = async (silent: boolean = false) => {
    setIsLocating(true);
    try {
      const coords = await getCurrentLocation();
      if (coords?.latitude && coords?.longitude) {
        setUserCoords({ lat: coords.latitude, lng: coords.longitude });
        const geo = await reverseGeocode(coords.latitude, coords.longitude);
        const resolvedAddress = geo.address || geo.city || userProfile.address || 'Current Location';
        
        setUserProfile(prev => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude,
          address: resolvedAddress
        }));

        // Persist to backend profile if email is present
        if (userProfile.email) {
          fetch('https://gymdate.in/api/user/sync-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userProfile.email,
              name: userProfile.name,
              phone: userProfile.phone,
              lat: coords.latitude,
              lng: coords.longitude,
              address: resolvedAddress,
            }),
          }).catch(() => {});
        }
      }
    } catch (err: any) {
      if (!silent) {
        if (Platform.OS === 'web') {
          window.alert(err.message || 'Could not fetch current GPS location.');
        } else {
          Alert.alert('Location Error', err.message || 'Could not fetch current GPS location.');
        }
      }
    } finally {
      setIsLocating(false);
    }
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

  // Generate interactive Leaflet Map HTML with accurate coordinates
  const generateMapHtml = () => {
    const lat = effectiveUserCoords.lat;
    const lng = effectiveUserCoords.lng;
    const radiusMeters = selectedRadius === 'all' ? 0 : selectedRadius * 1000;

    // Pluck real coordinates for each gym
    const gymsPayload = filteredGyms.map((g, idx) => {
      let gLat = g.coordinates?.lat || 0;
      let gLng = g.coordinates?.lng || 0;

      // If gym coords are 0, fallback to sensible offset around center
      if (!gLat || !gLng) {
        gLat = lat + ((idx % 2 === 0 ? 1 : -1) * (0.008 + idx * 0.006));
        gLng = lng + ((idx % 3 === 0 ? 1 : -1) * (0.008 + idx * 0.005));
      }

      const dist = haversineKm(lat, lng, gLat, gLng).toFixed(1);

      return {
        id: g.id,
        name: (g.name || 'Gym').replace(/'/g, "\\'"),
        price: g.pricePerDay || 299,
        rating: g.rating || 4.8,
        lat: gLat,
        lng: gLng,
        distance: dist,
      };
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body, html, #map { width: 100%; height: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; overflow: hidden; }
          
          .user-pulse-marker {
            width: 28px; height: 28px; background: #FF0000; border: 3px solid #ffffff;
            border-radius: 50%; box-shadow: 0 0 14px rgba(255, 0, 0, 0.75);
            display: flex; align-items: center; justify-content: center; color: #fff; font-size: 11px;
            animation: userPulse 1.8s infinite;
          }
          @keyframes userPulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.75); }
            70% { box-shadow: 0 0 0 16px rgba(255, 0, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
          }
          
          .gym-price-pill {
            background: #10B981; color: #ffffff; padding: 6px 12px; border-radius: 20px;
            font-size: 11px; font-weight: 800; border: 2px solid #ffffff;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); white-space: nowrap;
            cursor: pointer; display: flex; align-items: center; gap: 4px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .gym-price-pill:hover { transform: scale(1.08); background: #059669; }
          
          .leaflet-popup-content-wrapper {
            border-radius: 18px; padding: 4px; box-shadow: 0 12px 30px rgba(0,0,0,0.15);
            background: #ffffff; border: 1px solid #e2e8f0;
          }
          .leaflet-popup-content { margin: 10px; }
          .gym-popup-card { text-align: center; min-width: 160px; }
          .gym-popup-title { font-size: 14px; font-weight: 800; color: #0F172A; margin-bottom: 2px; }
          .gym-popup-rate { font-size: 12px; font-weight: 700; color: #10B981; margin-bottom: 10px; }
          .gym-popup-btn {
            background: #FF0000; color: #ffffff; border: none; padding: 8px 14px;
            border-radius: 10px; font-size: 11px; font-weight: 800; cursor: pointer;
            width: 100%; transition: opacity 0.2s; box-shadow: 0 4px 12px rgba(255,0,0,0.25);
          }
          .gym-popup-btn:hover { opacity: 0.9; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const userLat = ${lat};
          const userLng = ${lng};
          const map = L.map('map', { 
            zoomControl: true,
            attributionControl: false,
            dragging: true,
            touchZoom: true,
            doubleClickZoom: true,
            scrollWheelZoom: true
          }).setView([userLat, userLng], 13);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          function selectGym(id) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_GYM', id: id }));
            } else if (window.parent && window.parent.postMessage) {
              window.parent.postMessage({ type: 'OPEN_GYM', id: id }, '*');
            }
          }

          // Radius Boundary Circle (if not 'all')
          const radiusMeters = ${radiusMeters};
          if (radiusMeters > 0) {
            L.circle([userLat, userLng], {
              color: '#FF0000',
              fillColor: '#FF0000',
              fillOpacity: 0.06,
              weight: 2,
              dashArray: '6, 6',
              radius: radiusMeters
            }).addTo(map);
          }

          // Pinned User Location
          const userIcon = L.divIcon({
            className: '',
            html: '<div class="user-pulse-marker">🎯</div>',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });
          const userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(map)
            .bindPopup('<div style="text-align:center;padding:4px;"><b style="font-size:13px;color:#0F172A;">📍 Your Pinned Location</b></div>');

          // Pinned Gym Locations
          const gymsData = ${JSON.stringify(gymsPayload)};
          const allMarkers = [userMarker];

          if (gymsData.length === 0 && radiusMeters > 0) {
            userMarker.bindPopup('<div style="text-align:center;padding:6px;"><b style="font-size:13px;color:#0F172A;">📍 You are here</b><div style="font-size:11px;color:#EF4444;margin-top:4px;font-weight:700;">No gyms within ${selectedRadius} km.<br>Switch to 5km, 10km, or All!</div></div>').openPopup();
          }

          gymsData.forEach(g => {
            if (g.lat && g.lng) {
              const gymIcon = L.divIcon({
                className: '',
                html: '<div class="gym-price-pill">🏋️ ₹' + g.price + '/d</div>',
                iconSize: [88, 28],
                iconAnchor: [44, 14]
              });
              const marker = L.marker([g.lat, g.lng], { icon: gymIcon }).addTo(map);
              marker.bindPopup(
                '<div class="gym-popup-card">' +
                  '<div class="gym-popup-title">' + g.name + '</div>' +
                  '<div class="gym-popup-rate">₹' + g.price + '/day • ' + g.rating + ' ★ (' + g.distance + ' km)</div>' +
                  '<button class="gym-popup-btn" onclick="selectGym(\'' + g.id + '\')">View Passes & Gym →</button>' +
                '</div>'
              );
              allMarkers.push(marker);
            }
          });

          if (allMarkers.length > 1) {
            const group = new L.featureGroup(allMarkers);
            map.fitBounds(group.getBounds().pad(0.2));
          } else {
            map.setView([userLat, userLng], 14);
          }
        </script>
      </body>
      </html>
    `;
  };

  const pinnedLocationTitle = userProfile.address || 'Hyderabad';
  const mapUri = `https://gymdate.in/map-view?lat=${effectiveUserCoords.lat}&lng=${effectiveUserCoords.lng}&radius=${selectedRadius}`;

  return (
    <ScrollView style={[styles.container, isLight && { backgroundColor: '#ffffff' }]} contentContainerStyle={{ paddingBottom: 130 }}>
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
            <Text style={[styles.welcomeText, isLight && { color: '#111827' }]}>Hello, {userProfile.name?.split(' ')[0] || 'User'} 👋</Text>
            <Text style={[styles.subGreetingText, isLight && { color: THEME.COLORS.primary }]} numberOfLines={1}>Find nearby premium gyms & passes</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={() => setActiveScreen('notifications')} 
            style={[styles.notificationBtn, isLight && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }, { marginRight: 8 }]}
          >
            <Bell size={16} color={isLight ? '#1F2937' : '#ffffff'} />
            {unreadNotificationsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadNotificationsCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setActiveScreen('profile')} 
            style={[styles.notificationBtn, isLight && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}
          >
            <Menu size={16} color={isLight ? '#1F2937' : '#ffffff'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Pinned Location Card */}
      <View style={styles.pinnedSection}>
        <View style={[styles.pinnedCard, isLight && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <MapPin size={12} color={THEME.COLORS.primary} />
                <Text style={[styles.pinnedTag, isLight && { color: THEME.COLORS.primary }]}>SEARCH NEAR PINNED LOCATION</Text>
              </View>
              <Text style={[styles.pinnedAddress, isLight && { color: '#0F172A' }]} numberOfLines={1}>
                {pinnedLocationTitle}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.changePinBtn, { backgroundColor: THEME.COLORS.primary }]} 
              onPress={() => handleLocateUser(false)}
              disabled={isLocating}
              activeOpacity={0.8}
            >
              {isLocating ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.changePinBtnText}>Change Pin 🎯</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3. Search Bar */}
      <View style={styles.searchContainer}>
        <TouchableOpacity 
          onPress={() => setActiveScreen('discovery')}
          style={[styles.searchBar, isLight && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}
          activeOpacity={0.8}
        >
          <Search size={15} color={isLight ? '#64748B' : '#94A3B8'} style={{ marginRight: 10 }} />
          <Text style={[styles.searchBarText, isLight && { color: '#475569' }]}>Search specific gym, area, or landmark...</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Radius Distance Filter Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusScroll}>
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
                styles.radiusChip,
                isLight && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
                isSelected && { backgroundColor: THEME.COLORS.primary, borderColor: THEME.COLORS.primary }
              ]}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.radiusChipText,
                isLight && { color: '#475569' },
                isSelected && { color: '#ffffff', fontWeight: '800' }
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 5. Demand Heat Map Banner & View Switcher (Live Map View vs List View) */}
      <View style={styles.mapControlHeader}>
        {/* Heat Map Legend Banner */}
        <View style={[styles.heatMapBanner, isLight && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <Text style={[styles.heatMapTitle, isLight && { color: '#0F172A' }]}>🔥 Gym Demand Heat Map</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.heatMapStatus}><Text style={{ color: '#10B981', fontSize: 13 }}>●</Text> Easy</Text>
              <Text style={styles.heatMapStatus}><Text style={{ color: '#F59E0B', fontSize: 13 }}>●</Text> Moderate</Text>
              <Text style={styles.heatMapStatus}><Text style={{ color: '#EF4444', fontSize: 13 }}>●</Text> Full</Text>
            </View>
          </View>
          <Text style={[styles.heatMapSubtitle, isLight && { color: '#64748B' }]}>Helps users decide workout rush & pass booking before traveling.</Text>
        </View>

        {/* View Switcher Toggle */}
        <View style={styles.viewSwitcherRow}>
          <TouchableOpacity
            onPress={() => setViewMode('map')}
            style={[
              styles.viewSwitchBtn, 
              isLight && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
              viewMode === 'map' && styles.viewSwitchBtnActive
            ]}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.viewSwitchText, 
              isLight && { color: '#475569' },
              viewMode === 'map' && styles.viewSwitchTextActive
            ]}>
              🗺️ Live Map View ({filteredGyms.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setViewMode('list')}
            style={[
              styles.viewSwitchBtn, 
              isLight && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
              viewMode === 'list' && styles.viewSwitchBtnActive
            ]}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.viewSwitchText, 
              isLight && { color: '#475569' },
              viewMode === 'list' && styles.viewSwitchTextActive
            ]}>
              📋 List View ({filteredGyms.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. Live Interactive Map or List View */}
      {viewMode === 'map' ? (
        <View style={styles.mapContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              id="gymdate-leaflet-map"
              srcDoc={generateMapHtml()}
              style={{
                width: '100%',
                height: 380,
                border: 'none',
                borderRadius: 20,
                overflow: 'hidden'
              }}
            />
          ) : (
            <View style={{ height: 380, width: '100%', borderRadius: 20, overflow: 'hidden', backgroundColor: isLight ? '#F1F5F9' : '#0F172A' }}>
              <WebView
                key={`${selectedRadius}-${effectiveUserCoords.lat}-${effectiveUserCoords.lng}-${filteredGyms.length}`}
                originWhitelist={['*']}
                source={{ html: generateMapHtml(), baseUrl: 'https://gymdate.in' }}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data?.type === 'OPEN_GYM' && data.id) {
                      handleGymClick(data.id);
                    }
                  } catch (e) {}
                }}
                style={{ flex: 1, backgroundColor: 'transparent' }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                nestedScrollEnabled={true}
                mixedContentMode="always"
                allowFileAccess={true}
                geolocationEnabled={true}
              />
            </View>
          )}

          {/* Overlay Button: View All Gyms */}
          <TouchableOpacity
            style={[styles.floatingViewAllBtn, isLight && { backgroundColor: 'rgba(15, 23, 42, 0.92)' }]}
            onPress={() => setActiveScreen('discovery')}
            activeOpacity={0.9}
          >
            <Search size={13} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.floatingViewAllText}>View All Gyms ({gyms.length})</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* List View Mode */
        <View style={styles.listViewContainer}>
          {filteredGyms.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text style={{ fontSize: 24, marginBottom: 8 }}>📍</Text>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 4 }}>
                No Gyms Within {selectedRadius} km
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B', textAlign: 'center', marginBottom: 12 }}>
                Try selecting 5 km, 10 km, or All to view nearby gyms.
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedRadius('all')}
                style={{ backgroundColor: THEME.COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}
              >
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>View All Gyms</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredGyms.map((gym) => (
              <TouchableOpacity 
                key={gym.id}
                onPress={() => handleGymClick(gym.id)}
                style={[styles.listCard, isLight && { backgroundColor: '#ffffff', borderColor: '#E2E8F0' }]}
                activeOpacity={0.88}
              >
                <Image source={{ uri: gym.image }} style={styles.listCardImg} />
                <View style={styles.listCardContent}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.listCardTitle, isLight && { color: '#0F172A' }]} numberOfLines={1}>
                      {gym.name}
                    </Text>
                    <Text style={styles.listCardPrice}>₹{gym.pricePerDay}/d</Text>
                  </View>
                  <Text style={[styles.listCardLoc, isLight && { color: '#64748B' }]} numberOfLines={1}>
                    {gym.location}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <Text style={{ fontSize: 10, color: '#F59E0B', fontWeight: '700' }}>★ {gym.rating} ({gym.reviewsCount})</Text>
                    <View style={styles.listCardDistBadge}>
                      <Text style={styles.listCardDistText}>📍 {getGymDistance(gym)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* 7. Horizontal Categories Row */}
      <View style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat, i) => (
            <TouchableOpacity 
              key={i} 
              onPress={() => setActiveScreen('discovery')}
              style={[styles.categoryChip, isLight && { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryChipText, isLight && { color: '#334155' }]}>{cat.icon} {cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 8. Horizontal Nearby Premium Gyms Carousel */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionTitle, isLight && { color: '#0F172A' }]}>Nearby Premium Gyms</Text>
        <TouchableOpacity onPress={() => setActiveScreen('discovery')} style={styles.seeAllBtn}>
          <Text style={styles.seeAllText}>See All</Text>
          <ChevronRight size={11} color={THEME.COLORS.primary} style={{ marginLeft: 2 }} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gymScroll}>
        {gyms.map((gym) => (
          <TouchableOpacity 
            key={gym.id}
            onPress={() => handleGymClick(gym.id)}
            style={[styles.gymCard, isLight && { backgroundColor: '#ffffff', borderColor: '#E2E8F0' }]}
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
              <Text style={[styles.gymName, isLight && { color: '#0F172A' }]} numberOfLines={1}>{gym.name}</Text>
              <Text style={[styles.gymLoc, isLight && { color: '#64748B' }]} numberOfLines={1}>{gym.location}</Text>
              
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
    backgroundColor: '#ffffff',
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
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: THEME.COLORS.primary,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  welcomeText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '800',
  },
  subGreetingText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.COLORS.primary,
    marginTop: 1,
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
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
  pinnedSection: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 4,
  },
  pinnedCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pinnedTag: {
    fontSize: 8.5,
    fontWeight: '900',
    color: THEME.COLORS.primary,
    letterSpacing: 0.5,
  },
  pinnedAddress: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  changePinBtn: {
    backgroundColor: THEME.COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  changePinBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
  },
  searchBarText: {
    color: '#64748B',
    fontSize: 11,
  },
  radiusScroll: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 4,
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  radiusChipActive: {
    backgroundColor: THEME.COLORS.primary,
    borderColor: THEME.COLORS.primary,
  },
  radiusChipText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  radiusChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  mapControlHeader: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 8,
  },
  heatMapBanner: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  heatMapTitle: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '800',
  },
  heatMapStatus: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '700',
  },
  heatMapSubtitle: {
    color: '#64748B',
    fontSize: 9,
    marginTop: 1,
  },
  viewSwitcherRow: {
    flexDirection: 'row',
    gap: 10,
  },
  viewSwitchBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewSwitchBtnActive: {
    backgroundColor: THEME.COLORS.primary,
    borderColor: THEME.COLORS.primary,
  },
  viewSwitchText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  viewSwitchTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  mapContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
    position: 'relative',
  },
  floatingViewAllBtn: {
    position: 'absolute',
    top: 14,
    right: 32,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingViewAllText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  listViewContainer: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  listCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
  },
  listCardImg: {
    width: 65,
    height: 65,
    borderRadius: 12,
    objectFit: 'cover',
  },
  listCardContent: {
    flex: 1,
    marginLeft: 12,
  },
  listCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 6,
  },
  listCardPrice: {
    fontSize: 12,
    fontWeight: '900',
    color: '#10B981',
  },
  listCardLoc: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
  },
  listCardDistBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  listCardDistText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800',
  },
  categoriesSection: {
    paddingVertical: 6,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
  },
  categoryChipText: {
    color: '#334155',
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
    marginTop: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#0F172A',
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
    fontSize: 9.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gymScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  gymCard: {
    width: 220,
    backgroundColor: '#ffffff',
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
    fontWeight: '700',
    fontSize: 11,
  },
  gymLoc: {
    color: '#64748B',
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
    color: '#64748B',
    fontSize: 8,
    marginLeft: 3,
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
