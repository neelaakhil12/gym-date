import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GymDateProvider, useGymDate } from './src/context/GymDateContext';
import { DeviceShell } from './src/components/shared/DeviceShell';
import { Onboarding } from './src/components/member/Onboarding';
import { HomeDashboard } from './src/components/member/HomeDashboard';
import { GymDiscovery } from './src/components/member/GymDiscovery';
import { PartnerForm } from './src/components/member/PartnerForm';
import { NearbyGyms } from './src/components/member/NearbyGyms';
import { Notifications } from './src/components/member/Notifications';
import { Profile } from './src/components/member/Profile';
import { OwnerDashboard } from './src/components/owner/OwnerDashboard';
import { AdminDashboard } from './src/components/admin/AdminDashboard';
import { THEME } from './src/theme';

// Safe Lucide Native Icons
import { 
  Home, 
  Search, 
  Handshake, 
  MapPin 
} from 'lucide-react-native';

const AppContent: React.FC = () => {
  const { 
    currentRole, 
    activeScreen, 
    setActiveScreen, 
    isLoggedIn,
    themeMode,
    setThemeMode
  } = useGymDate();


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
      <View style={[styles.appViewport, isLight && { backgroundColor: '#ffffff' }]}>
        <StatusBar style={isLight ? 'dark' : 'light'} />
        
        {/* Active Screen View */}
        <View style={styles.screenContainer}>
          {renderScreen()}
        </View>

        {/* Custom React Native styled bottom navigation footer row */}
        {showBottomNav && (
          <View style={[styles.bottomNav, isLight && { backgroundColor: '#ffffff', borderTopColor: '#e5e7eb' }]}>
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
              onPress={() => setActiveScreen('discovery')}
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
              onPress={() => setActiveScreen('nearby')}
              style={styles.navItem}
            >
              <MapPin size={18} color={activeScreen === 'nearby' ? THEME.COLORS.primary : inactiveIconColor} />
              <Text style={[
                styles.navText, 
                isLight && { color: '#6B7280' },
                activeScreen === 'nearby' && styles.navTextActive
              ]}>Nearby</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </DeviceShell>
  );
};

export default function App() {
  return (
    <GymDateProvider>
      <AppContent />
    </GymDateProvider>
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
    height: Platform.OS === 'ios' ? 76 : 60,
    backgroundColor: '#0a0b10',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: Platform.OS === 'ios' ? 16 : 0,
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    cursor: 'pointer' as any,
  },
  navText: {
    color: THEME.COLORS.textMuted,
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  navTextActive: {
    color: THEME.COLORS.primary,
  }
});
