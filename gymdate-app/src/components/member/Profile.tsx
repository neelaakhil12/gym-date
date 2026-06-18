import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Image, 
  Alert,
  Platform,
  Linking
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useGymDate } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { useTheme } from '../../useTheme';
import { apiService } from '../../services/apiService';
import { 
  User, 
  Gift, 
  CreditCard, 
  History, 
  Ticket, 
  MapPin, 
  Camera, 
  Copy, 
  Check, 
  LogOut, 
  Plus, 
  FileDown, 
  TrendingUp, 
  Wallet,
  ChevronRight,
  Compass,
  ArrowRight,
  Menu,
  ChevronLeft
} from 'lucide-react-native';

export const Profile: React.FC = () => {
  const { 
    activeScreen,
    userProfile, 
    setUserProfile, 
    gyms, 
    bookings,
    setIsLoggedIn, 
    setActiveScreen, 
    themeMode, 
    setThemeMode, 
    setLoginInput 
  } = useGymDate();

  const { isDark, bg } = useTheme();
  const [activeTab, setActiveTab] = useState<'profile' | 'wallet' | 'subscriptions' | 'payments' | 'tickets' | 'addresses'>(
    activeScreen === 'bookings' ? 'tickets' : 'profile'
  );
  const isLight = themeMode === 'light';
  
  const [isEditing, setIsEditing] = useState(false);
  const [nameVal, setNameVal] = useState(userProfile.name);
  const [phoneVal, setPhoneVal] = useState(userProfile.phone);
  const [isLocating, setIsLocating] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    setNameVal(userProfile.name);
    setPhoneVal(userProfile.phone);
  }, [userProfile.name, userProfile.phone]);

  const handleSaveProfile = async () => {
    if (!nameVal.trim()) {
      Alert.alert('Required Field', 'Please enter your Full Name.');
      return;
    }
    try {
      const updatedUser = await apiService.syncProfile({
        email: userProfile.email,
        name: nameVal.trim(),
        phone: phoneVal.trim()
      });
      setUserProfile(prev => ({
        ...prev,
        name: updatedUser.full_name || nameVal.trim(),
        phone: updatedUser.phone || phoneVal.trim()
      }));
      setIsEditing(false);
      Alert.alert('Profile Saved', 'Your profile details have been synced successfully with the database!');
    } catch (e: any) {
      Alert.alert('Error Saving Profile', e.message || 'Could not sync updates to live database.');
    }
  };

  // Format initials
  const getInitials = (name: string) => {
    if (!name) return "GY";
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const initials = getInitials(userProfile.name);

  // Copy referral code mockup
  const referralLink = `https://gymdate.in/signup?ref=${userProfile.name.toLowerCase().replace(/ /g, '-')}`;
  const handleCopyReferral = () => {
    setCopied(true);
    Alert.alert('Referral Copied', 'Your custom sharing link was successfully copied to your clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    const performLogout = () => {
      setIsLoggedIn(false);
      setLoginInput('');
      setActiveScreen('onboarding');
    };

    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to sign out of GYMDATE?');
      if (confirmLogout) performLogout();
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to sign out of GYMDATE?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log Out', style: 'destructive', onPress: performLogout }
        ]
      );
    }
  };

  const handleUploadPhoto = () => {
    if (Platform.OS === 'web') {
      // Web: use file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              setUserProfile(prev => ({ ...prev, avatar: reader.result as string }));
              Alert.alert('Success', 'Profile photo updated successfully!');
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      // Native Android/iOS: show picker option sheet
      Alert.alert(
        'Update Profile Photo',
        'Choose how to upload your photo:',
        [
          {
            text: '📷 Take a Photo',
            onPress: () => openCamera()
          },
          {
            text: '🖼️ Choose from Gallery',
            onPress: () => openGallery()
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const openGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow GymDate to access your photos in Settings.',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setUserProfile(prev => ({ ...prev, avatar: uri }));
        Alert.alert('✅ Photo Updated', 'Your profile photo has been updated!');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Could not open gallery: ' + err.message);
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow GymDate to access your camera in Settings.',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setUserProfile(prev => ({ ...prev, avatar: uri }));
        Alert.alert('✅ Photo Updated', 'Your profile photo has been updated!');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Could not open camera: ' + err.message);
    }
  };

  const updateAvatar = (url: string) => {
    setUserProfile(prev => ({ ...prev, avatar: url }));
    Alert.alert('Success', 'Profile photo updated successfully!');
  };

  const GOOGLE_MAPS_API_KEY = 'AIzaSyA_y5PoTdP0o2MZRDGkTVtFgguLTSaGIEE';

  const showAlertSafe = (title: string, msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const handleGetLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      showAlertSafe('Not Supported', 'Geolocation is not supported on this browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use same Google Maps API key as the website
          const geoRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
          );
          const geoData = await geoRes.json();

          let fullAddress = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          if (geoData.status === 'OK' && geoData.results.length > 0) {
            fullAddress = geoData.results[0].formatted_address;
          }

          // Save address + lat/lng to backend so NearbyGyms & HomeDashboard can compute real distances
          const { getApiUrl } = require('../../config');
          await fetch(`${getApiUrl()}/api/user/sync-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: userProfile.email,
              name: userProfile.name,
              phone: userProfile.phone,
              lat: latitude,
              lng: longitude,
              address: fullAddress,
            }),
          });

          // Update local profile state
          setUserProfile(prev => ({ ...prev, address: fullAddress }));
          showAlertSafe('✅ Location Updated', `Address set to:\n${fullAddress}`);
        } catch (e) {
          // Even if geocoding fails, save raw coordinates
          const rawAddr = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          setUserProfile(prev => ({ ...prev, address: rawAddr }));
          showAlertSafe('Location Saved', 'Saved your GPS coordinates.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Could not get your location.';
        if (err.code === 1) msg = 'Permission denied. Please allow location access in browser settings.';
        if (err.code === 3) msg = 'Request timed out. Please try again.';
        showAlertSafe('Location Error', msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Static Mock Payments List
  const mockPayments = [
    { id: 'pay-1', date: '2026-05-28', plan: userProfile.membershipType !== 'none' ? userProfile.membershipType : 'Monthly Premium Pass', amount: 399, status: 'Success' },
    { id: 'pay-2', date: '2026-04-28', plan: 'Daily Workout pass', amount: 99, status: 'Success' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      
      {/* 1. Header Toolbar */}
      <View style={[styles.headerBar, isLight && { borderBottomColor: '#E5E7EB', backgroundColor: '#ffffff' }]}>
        <TouchableOpacity 
          onPress={() => setActiveScreen('home')}
          style={[styles.backBtn, isLight && { backgroundColor: '#F3F4F6' }]}
        >
          <ChevronLeft size={16} color={isLight ? '#374151' : '#ffffff'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isLight && { color: '#111827' }]}>Account Settings</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={16} color={THEME.COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* 2. Top Profile Summary Display */}
      <View style={[styles.profileHero, isLight && { backgroundColor: '#F9FAFB' }]}>
        <View style={styles.profileSummaryRow}>
          <TouchableOpacity onPress={handleUploadPhoto} activeOpacity={0.8} style={styles.avatarContainer}>
            {userProfile.avatar ? (
              <Image source={{ uri: userProfile.avatar }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarImg, styles.initialsAvatar]}>
                <Text style={styles.initialsText}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Camera size={8} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <View style={styles.nameSection}>
            <Text style={[styles.profileName, isLight && { color: '#111827' }]}>{userProfile.name}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.roleLabel}>Active Member</Text>
              {userProfile.membershipType !== 'none' && (
                <View style={styles.premiumTag}>
                  <Text style={styles.premiumTagText}>PRO</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Dynamic Dark Mode Toggle */}
        <View style={[styles.toggleCard, isLight && { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}>
          <Text style={[styles.toggleText, isLight && { color: '#374151' }]}>App Dark Theme Mode</Text>
          <TouchableOpacity 
            onPress={() => setThemeMode(prev => prev === 'light' ? 'dark' : 'light')}
            style={[styles.switchTrack, themeMode === 'dark' ? styles.switchActive : styles.switchInactive]}
          >
            <View style={[styles.switchThumb, themeMode === 'dark' && styles.switchThumbActive]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Horizontal Tabs Picker */}
      <View style={[styles.tabListContainer, isLight && { borderBottomColor: '#E5E7EB' }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
          {[
            { id: 'profile', label: 'My Profile', icon: <User size={13} color={activeTab === 'profile' ? '#ffffff' : (isLight ? '#4B5563' : '#99a1af')} /> },
            { id: 'wallet', label: 'Wallet & Referrals', icon: <Gift size={13} color={activeTab === 'wallet' ? '#ffffff' : (isLight ? '#4B5563' : '#99a1af')} /> },
            { id: 'subscriptions', label: 'Subscriptions', icon: <CreditCard size={13} color={activeTab === 'subscriptions' ? '#ffffff' : (isLight ? '#4B5563' : '#99a1af')} /> },
            { id: 'payments', label: 'Payments History', icon: <History size={13} color={activeTab === 'payments' ? '#ffffff' : (isLight ? '#4B5563' : '#99a1af')} /> },
            { id: 'tickets', label: 'QR Tickets', icon: <Ticket size={13} color={activeTab === 'tickets' ? '#ffffff' : (isLight ? '#4B5563' : '#99a1af')} /> },
            { id: 'addresses', label: 'Saved Addresses', icon: <MapPin size={13} color={activeTab === 'addresses' ? '#ffffff' : (isLight ? '#4B5563' : '#99a1af')} /> },
          ].map(t => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setActiveTab(t.id as any)}
              style={[
                styles.tabItem,
                activeTab === t.id && styles.tabItemActive,
                isLight && activeTab !== t.id && { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }
              ]}
            >
              {t.icon}
              <Text style={[
                styles.tabItemText,
                activeTab === t.id && styles.tabItemTextActive,
                isLight && activeTab !== t.id && { color: '#374151' }
              ]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 4. Active Tab Details Content */}
      <ScrollView style={styles.tabContentArea} contentContainerStyle={styles.scrollContainerStyle}>
        
        {/* ============= PROFILE TAB ============= */}
        {activeTab === 'profile' && (
          <View style={styles.tabPanel}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ color: isLight ? '#111827' : '#ffffff', fontSize: 13, fontWeight: '800' }}>Profile Credentials</Text>
              <TouchableOpacity 
                style={[
                  styles.editProfileBtn, 
                  isEditing ? styles.editProfileBtnSave : styles.editProfileBtnEdit,
                  isLight && !isEditing && { backgroundColor: '#E5E7EB', borderColor: '#D1D5DB' }
                ]}
                onPress={() => {
                  if (isEditing) {
                    handleSaveProfile();
                  } else {
                    setIsEditing(true);
                  }
                }}
              >
                <Text style={[
                  styles.editProfileBtnText,
                  isEditing ? { color: '#ffffff' } : (isLight ? { color: '#374151' } : { color: '#ffffff' })
                ]}>
                  {isEditing ? 'Save Details' : 'Edit Profile'}
                </Text>
              </TouchableOpacity>
            </View>

            {isEditing && (
              <TouchableOpacity 
                style={[styles.cancelEditBtn, isLight && { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}
                onPress={() => {
                  setIsEditing(false);
                  setNameVal(userProfile.name);
                  setPhoneVal(userProfile.phone);
                }}
              >
                <Text style={[styles.cancelEditBtnText, isLight && { color: '#4B5563' }]}>Cancel Editing</Text>
              </TouchableOpacity>
            )}

            <View style={[styles.fieldCard, isLight && { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}>
              <Text style={styles.fieldLabel}>FULL NAME</Text>
              {isEditing ? (
                <TextInput
                  value={nameVal}
                  onChangeText={setNameVal}
                  style={[
                    styles.fieldInput,
                    isLight ? styles.fieldInputLight : styles.fieldInputDark,
                  ]}
                  placeholder="Enter your full name"
                  placeholderTextColor={THEME.COLORS.textMuted}
                />
              ) : (
                <Text style={[styles.fieldVal, isLight && { color: '#111827' }]}>{userProfile.name}</Text>
              )}
            </View>

            <View style={[styles.fieldCard, isLight && { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}>
              <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
              {isEditing ? (
                <TextInput
                  value={phoneVal}
                  onChangeText={setPhoneVal}
                  style={[
                    styles.fieldInput,
                    isLight ? styles.fieldInputLight : styles.fieldInputDark,
                  ]}
                  placeholder="Enter phone number"
                  placeholderTextColor={THEME.COLORS.textMuted}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={[styles.fieldVal, isLight && { color: '#111827' }]}>{userProfile.phone || 'Not provided'}</Text>
              )}
            </View>

            <View style={[styles.fieldCard, isLight && { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}>
              <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
              <Text style={[styles.fieldVal, isLight && { color: '#111827' }, { opacity: 0.6 }]}>{userProfile.email} (Read-Only)</Text>
            </View>

            <View style={[styles.fieldCard, isLight && { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}>
              <Text style={styles.fieldLabel}>CURRENT ADDRESS LOCATION</Text>
              <View style={styles.locationRow}>
                <MapPin size={12} color={THEME.COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={[styles.fieldVal, isLight && { color: '#111827' }, { flex: 1 }]}>{userProfile.address || 'No location set'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ============= WALLET TAB ============= */}
        {activeTab === 'wallet' && (
          <View style={styles.tabPanel}>
            {/* Wallet Stats Cards */}
            <View style={styles.walletCardRow}>
              <View style={[styles.walletMetric, { backgroundColor: THEME.COLORS.primary }]}>
                <View style={styles.metricHeader}>
                  <Wallet size={12} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.metricLabelText}>BALANCE</Text>
                </View>
                <Text style={styles.metricBigText}>₹60.00</Text>
                <Text style={styles.metricSubText}>Auto-applied at checkouts</Text>
              </View>

              <View style={[styles.walletMetric, isLight && { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}>
                <View style={styles.metricHeader}>
                  <TrendingUp size={12} color={THEME.COLORS.secondary} style={{ marginRight: 4 }} />
                  <Text style={[styles.metricLabelText, isLight && { color: '#6B7280' }]}>REFERRALS</Text>
                </View>
                <Text style={[styles.metricBigText, isLight && { color: '#111827' }]}>2 friends</Text>
                <Text style={[styles.metricSubText, isLight && { color: '#6B7280' }]}>Joined GYMDATE Network</Text>
              </View>
            </View>

            {/* Referral Link Card */}
            <View style={[styles.infoBlock, isLight && { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}>
              <Text style={[styles.blockTitleText, isLight && { color: '#111827' }]}>Your Referral Link</Text>
              <Text style={[styles.blockDescText, isLight && { color: '#6B7280' }]}>
                Share your personal link to earn benefits! When a friend joins and purchases any pass, you automatically earn ₹30 wallet cash!
              </Text>
              
              <View style={[styles.copyBox, isLight && { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
                <Text style={[styles.copyText, isLight && { color: '#374151' }]} numberOfLines={1}>
                  {referralLink}
                </Text>
                <TouchableOpacity onPress={handleCopyReferral} style={styles.copyBtn}>
                  <Copy size={12} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Share Steps */}
              <View style={[styles.dividerLine, isLight && { backgroundColor: '#E5E7EB' }]} />
              <Text style={[styles.shareTitle, isLight && { color: '#111827' }]}>HOW TO GET COMMISSIONS:</Text>
              
              <View style={styles.stepsColumn}>
                {[
                  { step: '1', title: 'Send Invitation Link', desc: 'Copy and send code' },
                  { step: '2', title: 'Friend Signs Up', desc: 'Friend joins pass group' },
                  { step: '3', title: 'Get Wallet Bonus', desc: '₹30 added instantaneously' }
                ].map((s, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <View style={styles.stepCircle}>
                      <Text style={styles.stepCircleText}>{s.step}</Text>
                    </View>
                    <View style={{ marginLeft: 12 }}>
                      <Text style={[styles.stepItemTitle, isLight && { color: '#1F2937' }]}>{s.title}</Text>
                      <Text style={[styles.stepItemDesc, isLight && { color: '#6B7280' }]}>{s.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ============= SUBSCRIPTIONS TAB ============= */}
        {activeTab === 'subscriptions' && (
          <View style={styles.tabPanel}>
            {userProfile.membershipType === 'none' ? (
              <View style={[styles.emptyContentCard, isLight && { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}>
                <Text style={styles.emptyIconStyle}>💳</Text>
                <Text style={[styles.emptyTitleText, isLight && { color: '#111827' }]}>No Active Subscriptions</Text>
                <Text style={[styles.emptySubText, isLight && { color: '#6B7280' }]}>
                  Unlock partnered premium gyms pan India with zero commitments today!
                </Text>
                <TouchableOpacity 
                  onPress={() => setActiveScreen('discovery')}
                  style={styles.actionBtnStyle}
                >
                  <Text style={styles.actionBtnTextStyle}>Explore Gyms</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.subCard, isLight && { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}>
                <View style={styles.subHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.subPlanName, isLight && { color: '#111827' }]}>{userProfile.membershipType}</Text>
                    <Text style={styles.subNetwork}>GYMDATE PREMIUM NETWORK</Text>
                  </View>
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTagText}>ACTIVE</Text>
                  </View>
                </View>

                <View style={[styles.dividerLine, isLight && { backgroundColor: '#E5E7EB' }]} />

                <View style={styles.subDetails}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, isLight && { color: '#6B7280' }]}>Expiry Date</Text>
                    <Text style={[styles.detailValText, isLight && { color: '#1F2937' }]}>{userProfile.membershipExpiry || '30 days from purchase'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, isLight && { color: '#6B7280' }]}>Total Paid</Text>
                    <Text style={[styles.detailValTextPrimary]}>₹399.00</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, isLight && { color: '#6B7280' }]}>Check-In Method</Text>
                    <Text style={[styles.detailValText, isLight && { color: '#1F2937' }]}>Digital Entry QR Ticket</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ============= PAYMENTS TAB ============= */}
        {activeTab === 'payments' && (
          <View style={styles.tabPanel}>
            {mockPayments.map(p => (
              <View key={p.id} style={[styles.payHistoryCard, isLight && { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}>
                <View style={styles.payHeader}>
                  <View>
                    <Text style={[styles.payPlanText, isLight && { color: '#111827' }]}>{p.plan}</Text>
                    <Text style={[styles.payDateText, isLight && { color: '#6B7280' }]}>{p.date}</Text>
                  </View>
                  <Text style={styles.payAmountText}>₹{p.amount}.00</Text>
                </View>
                <View style={[styles.dividerLine, isLight && { backgroundColor: '#E5E7EB' }]} />
                <View style={styles.payFooter}>
                  <Text style={styles.txnIdText}>Txn ID: #{p.id.toUpperCase()}</Text>
                  <TouchableOpacity onPress={() => Alert.alert('Download Invoice', 'Your receipt PDF is being downloaded successfully.')}>
                    <Text style={styles.invoiceLink}>Receipt PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ============= QR TICKETS TAB ============= */}
        {activeTab === 'tickets' && (
          <View style={styles.tabPanel}>
            {bookings.length === 0 ? (
              <View style={[styles.emptyContentCard, isLight && { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}>
                <Text style={styles.emptyIconStyle}>🎫</Text>
                <Text style={[styles.emptyTitleText, isLight && { color: '#111827' }]}>No Active Entry QR Tickets</Text>
                <Text style={[styles.emptySubText, isLight && { color: '#6B7280' }]}>
                  Book workout slots or personal training sessions to generate entry QR passes!
                </Text>
                <TouchableOpacity 
                  onPress={() => setActiveScreen('discovery')}
                  style={styles.actionBtnStyle}
                >
                  <Text style={styles.actionBtnTextStyle}>Book Workout Slot</Text>
                </TouchableOpacity>
              </View>
            ) : (
              bookings.map((booking) => (
                <View key={booking.id} style={styles.ticketCardOuter}>
                  {/* Top Gym Info Bar */}
                  <View style={styles.ticketHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ticketGymName} numberOfLines={1}>{booking.gymName}</Text>
                      <View style={styles.sessionRow}>
                        <MapPin size={8} color="rgba(255,255,255,0.7)" style={{ marginRight: 3 }} />
                        <Text style={styles.ticketGymLoc} numberOfLines={1}>Premium Gym Network</Text>
                      </View>
                    </View>
                    <View style={styles.planBadge}>
                      <Text style={styles.planBadgeText}>
                        {booking.sessionType === 'trainer' ? 'Coach Slot' : booking.sessionType === 'class' ? 'Class Pass' : 'Entry Ticket'}
                      </Text>
                    </View>
                  </View>

                  {/* QR Entry section */}
                  <View style={[styles.ticketBody, isLight && { backgroundColor: '#ffffff' }]}>
                    <View style={styles.qrContainer}>
                      <Image 
                        source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(booking.id)}` }}
                        style={styles.qrImgMock}
                      />
                    </View>
                    <Text style={[styles.ticketIdText, isLight && { color: '#374151' }]}>TICKET PASS: #{booking.id.toUpperCase().substring(0, 8)}</Text>
                    <Text style={[styles.entryLabelText, isLight && { color: '#6B7280' }]}>SCAN QR AT GYM COUNTER FOR DIGITAL LOG ENTRY</Text>
                  </View>

                  {/* Validity Info */}
                  <View style={[styles.ticketFooter, isLight && { backgroundColor: '#F9FAFB', borderTopColor: '#E5E7EB' }]}>
                    <View>
                      <Text style={[styles.validLabel, isLight && { color: '#6B7280' }]}>VALIDITY DATE</Text>
                      <Text style={[styles.validValText, isLight && { color: '#1F2937' }]}>
                        {new Date(booking.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.validLabel, isLight && { color: '#6B7280' }]}>STATUS</Text>
                      <Text style={styles.activeStatusText}>● ACTIVE</Text>
                    </View>
                  </View>

                  {/* Simulated perforations on both sides */}
                  <View style={styles.perforationLeft} />
                  <View style={styles.perforationRight} />
                </View>
              ))
            )}
          </View>
        )}

        {/* ============= ADDRESSES TAB ============= */}
        {activeTab === 'addresses' && (
          <View style={styles.tabPanel}>
            <View style={[styles.addressItemCard, isLight && { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}>
              <View style={styles.addressCardHeader}>
                <View style={styles.houseIconBox}>
                  <Compass size={14} color={THEME.COLORS.primary} />
                </View>
                <Text style={[styles.addrLabel, isLight && { color: '#111827' }]}>PRIMARY GYM LOCATION</Text>
              </View>
              <Text style={[styles.addrVal, isLight && { color: '#4B5563' }]}>
                {userProfile.address || 'Address location coordinates not defined.'}
              </Text>
              <TouchableOpacity 
                onPress={handleGetLocation}
                style={[styles.gpsBtn, isLocating && { opacity: 0.7 }]}
                disabled={isLocating}
              >
                <Text style={styles.gpsBtnText}>{isLocating ? 'Locating via Geolocation...' : 'Refresh GPS Coordinates'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0a0b10',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    
  },
  logoutBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHero: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  profileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderColor: THEME.COLORS.primary,
    borderWidth: 2,
    objectFit: 'cover',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: THEME.COLORS.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#060608',
  },
  nameSection: {
    flex: 1,
  },
  profileName: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
    
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  roleLabel: {
    fontSize: 8,
    color: THEME.COLORS.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  premiumTag: {
    backgroundColor: THEME.COLORS.primary,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  premiumTagText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: '900',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    marginTop: 16,
  },
  toggleText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  switchTrack: {
    width: 42,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#374151',
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: THEME.COLORS.primary,
  },
  switchInactive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  tabListContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 10,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: THEME.COLORS.primary,
    borderColor: THEME.COLORS.primary,
  },
  tabItemText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  tabItemTextActive: {
    color: '#ffffff',
  },
  tabContentArea: {
    flex: 1,
    padding: 16,
  },
  scrollContainerStyle: {
    paddingBottom: 40,
  },
  tabPanel: {
    gap: 12,
  },
  fieldCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  fieldLabel: {
    color: THEME.COLORS.textMuted,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fieldVal: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletCardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  walletMetric: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabelText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 8,
    fontWeight: '800',
  },
  metricBigText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    
  },
  metricSubText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 7,
    fontWeight: '600',
  },
  infoBlock: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 10,
  },
  blockTitleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  blockDescText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9,
    lineHeight: 13,
  },
  copyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 12,
    paddingRight: 4,
    height: 40,
    justifyContent: 'space-between',
  },
  copyText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9,
    flex: 1,
    marginRight: 10,
  },
  copyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: THEME.COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dividerLine: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginVertical: 4,
  },
  shareTitle: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stepsColumn: {
    gap: 12,
    marginTop: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  stepItemTitle: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  stepItemDesc: {
    color: THEME.COLORS.textMuted,
    fontSize: 8,
    marginTop: 1,
  },
  emptyContentCard: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyIconStyle: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyTitleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptySubText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 13,
  },
  actionBtnStyle: {
    backgroundColor: THEME.COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 8,
  },
  actionBtnTextStyle: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  subCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subPlanName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  subNetwork: {
    fontSize: 8,
    color: THEME.COLORS.primary,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  activeTag: {
    backgroundColor: 'rgba(0,199,88,0.12)',
    borderColor: 'rgba(0,199,88,0.2)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTagText: {
    color: THEME.COLORS.success,
    fontSize: 7,
    fontWeight: '900',
  },
  subDetails: {
    gap: 8,
    marginTop: 10,
  },
  detailValText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  detailValTextPrimary: {
    color: THEME.COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  detailLabel: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
  payHistoryCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
  },
  payHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payPlanText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  payDateText: {
    color: THEME.COLORS.textMuted,
    fontSize: 8,
    marginTop: 2,
  },
  payAmountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  payFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  txnIdText: {
    color: THEME.COLORS.textMuted,
    fontSize: 8,
    fontFamily: 'monospace',
  },
  invoiceLink: {
    color: THEME.COLORS.primary,
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  ticketCardOuter: {
    backgroundColor: '#fe6e00',
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  ticketHeader: {
    padding: 14,
    backgroundColor: '#fe6e00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ticketGymName: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  ticketGymLoc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 8,
  },
  planBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  planBadgeText: {
    color: '#fe6e00',
    fontSize: 7,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  ticketBody: {
    backgroundColor: '#12131a',
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  qrImgMock: {
    width: 120,
    height: 120,
  },
  ticketIdText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  entryLabelText: {
    color: THEME.COLORS.textMuted,
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  ticketFooter: {
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.15)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  validLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 7,
    fontWeight: '800',
  },
  validValText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
  },
  activeStatusText: {
    color: THEME.COLORS.success,
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
  },
  perforationLeft: {
    position: 'absolute',
    left: -12,
    top: 76,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#060608',
  },
  perforationRight: {
    position: 'absolute',
    right: -12,
    top: 76,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#060608',
  },
  addressItemCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    gap: 8,
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  houseIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addrLabel: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  addrVal: {
    color: THEME.COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
  gpsBtn: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderRadius: 12,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  gpsBtnText: {
    color: THEME.COLORS.primary,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  initialsAvatar: {
    backgroundColor: THEME.COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.COLORS.primary,
  },
  initialsText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    
  },
  editProfileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editProfileBtnEdit: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  editProfileBtnSave: {
    backgroundColor: THEME.COLORS.success,
    borderColor: THEME.COLORS.success,
  },
  editProfileBtnText: {
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cancelEditBtn: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cancelEditBtnText: {
    color: '#ef4444',
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  fieldInput: {
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 4,
    borderBottomWidth: 1,
    marginTop: 2,
  },
  fieldInputDark: {
    color: '#ffffff',
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  fieldInputLight: {
    color: '#111827',
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  }
});
