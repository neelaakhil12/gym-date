import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, useColorScheme, BackHandler, ToastAndroid } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GymDateProvider, useGymDate } from './context/GymDateContext';
import { DeviceShell } from './components/shared/DeviceShell';
import { Onboarding } from './components/member/Onboarding';
import { HomeDashboard } from './components/member/HomeDashboard';
import { GymDiscovery } from './components/member/GymDiscovery';
import { PartnerForm } from './components/member/PartnerForm';
import { NearbyGyms } from './components/member/NearbyGyms';
import { Notifications } from './components/member/Notifications';
import { Profile } from './components/member/Profile';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { THEME } from './theme';
// @ts-ignore
import RootErrorBoundary from './components/shared/ErrorBoundary';

import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Safe Lucide Native Icons
import { 
  Home, 
  Search, 
  Handshake, 
  Ticket 
} from 'lucide-react-native';

const AppContent: React.FC = () => {
  const { 
    currentRole, 
    activeScreen, 
    setActiveScreen, 
    selectedGymId,
    setSelectedGymId,
    goBack,
    isLoggedIn,
    themeMode,
    setThemeMode
  } = useGymDate();

  const insets = useSafeAreaInsets();
  const safeTop = Math.max(insets.top, Platform.OS === 'android' ? 24 : 0);
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 8);
  const dynamicNavHeight = 58 + safeBottom;

  const lastBackPressTime = useRef<number>(0);

  // Android hardware back button and swipe gesture navigation handler
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      // 1. Try to go back in history or close active sub-views/gym details
      const handled = goBack();
      if (handled) {
        return true; // Successfully navigated back internally
      }

      // 2. If at root screen, prompt user before exiting
      const now = Date.now();
      if (now - lastBackPressTime.current < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressTime.current = now;
      ToastAndroid.show('Press back again to exit GymDate', ToastAndroid.SHORT);
      return true;
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSubscription.remove();
  }, [goBack]);


  // Screen Switcher routing engine
  const renderScreen = () => {
    // Auth Guard
    if (!isLoggedIn && (activeScreen === 'onboarding' || activeScreen === 'login' || activeScreen === 'otp')) {
      return <Onboarding />;
    }

    // Role-based Router
    if (currentRole === 'owner') {
      return <OwnerDashboard />;
    }

    if (currentRole === 'admin') {
      return <AdminDashboard />;
    }

    // Gym Member App Navigation
    switch (activeScreen) {
      case 'onboarding':
      case 'login':
      case 'otp':
        return <Onboarding />;
      case 'home':
        return <HomeDashboard />;
      case 'discovery':
      case 'gym-details':
        return <GymDiscovery />;
      case 'bookings':
        return <Profile />;
      case 'partner':
        return <PartnerForm />;
      case 'nearby':
        return <NearbyGyms />;
      case 'notifications':
        return <Notifications />;
      case 'profile':
        return <Profile />;
      default:
        return <HomeDashboard />;
    }
  };

  const showBottomNav = isLoggedIn && currentRole === 'member' && 
    activeScreen !== 'onboarding' && activeScreen !== 'login' && activeScreen !== 'otp';

  const isLight = themeMode === 'light';
  const inactiveIconColor = isLight ? '#6B7280' : THEME.COLORS.textMuted;

  return (
    <DeviceShell>
      <View style={[
        styles.appViewport, 
        {
          paddingTop: currentRole === 'owner' ? 0 : safeTop,
          paddingBottom: showBottomNav ? 0 : safeBottom,
        },
        isLight && { backgroundColor: '#ffffff' }
      ]}>
        <StatusBar style={isLight ? 'dark' : 'light'} />
        
        {/* Active Screen View */}
        <View style={styles.screenContainer}>
          {renderScreen()}
        </View>

        {/* Custom React Native styled bottom navigation footer row */}
        {showBottomNav && (
          <View style={[styles.bottomNav, { height: dynamicNavHeight, paddingBottom: safeBottom }, isLight && { backgroundColor: '#ffffff', borderTopColor: '#e5e7eb' }]}>
            <TouchableOpacity 
              onPress={() => setActiveScreen('home')}
              style={styles.navItem}
            >
              <Home size={18} color={activeScreen === 'home' ? THEME.COLORS.primary : inactiveIconColor} />
              <Text style={[
                styles.navText, 
                isLight && { color: '#6B7280' },
                activeScreen === 'home' && styles.navTextActive
              ]}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => {
                setSelectedGymId(null);
                setActiveScreen('discovery');
              }}
              style={styles.navItem}
            >
              <Search size={18} color={activeScreen === 'discovery' || activeScreen === 'gym-details' ? THEME.COLORS.primary : inactiveIconColor} />
              <Text style={[
                styles.navText, 
                isLight && { color: '#6B7280' },
                (activeScreen === 'discovery' || activeScreen === 'gym-details') && styles.navTextActive
              ]}>Explore</Text>
            </TouchableOpacity>
            

            <TouchableOpacity 
              onPress={() => setActiveScreen('partner')}
              style={styles.navItem}
            >
              <Handshake size={18} color={activeScreen === 'partner' ? THEME.COLORS.primary : inactiveIconColor} />
              <Text style={[
                styles.navText, 
                isLight && { color: '#6B7280' },
                activeScreen === 'partner' && styles.navTextActive
              ]}>Partner</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setActiveScreen('bookings')}
              style={styles.navItem}
            >
              <Ticket size={18} color={activeScreen === 'bookings' ? THEME.COLORS.primary : inactiveIconColor} />
              <Text style={[
                styles.navText, 
                isLight && { color: '#6B7280' },
                activeScreen === 'bookings' && styles.navTextActive
              ]}>Bookings</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </DeviceShell>
  );
};

export default function App() {
  return (
    <RootErrorBoundary>
      <SafeAreaProvider>
        <GymDateProvider>
          <AppContent />
        </GymDateProvider>
      </SafeAreaProvider>
    </RootErrorBoundary>
  );
}

const styles = StyleSheet.create({
  appViewport: {
    flex: 1,
    backgroundColor: THEME.COLORS.bgDark,
  },
  screenContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#0a0b10',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
  navText: {
    color: THEME.COLORS.textMuted,
    fontSize: 8.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  navTextActive: {
    color: THEME.COLORS.primary,
  }
});
