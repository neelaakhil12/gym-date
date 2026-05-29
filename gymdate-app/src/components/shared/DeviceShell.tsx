import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Platform, 
  ScrollView, 
  SafeAreaView,
  StatusBar,
  Dimensions
} from 'react-native';
import { useGymDate } from '../../context/GymDateContext';
import { THEME } from '../../theme';

// Import icons safely for React Native
import { 
  Smartphone, 
  User, 
  Shield, 
  Database,
  Wifi,
  Monitor,
  Sun,
  Moon
} from 'lucide-react-native';

interface DeviceShellProps {
  children: React.ReactNode;
}

export const DeviceShell: React.FC<DeviceShellProps> = ({ children }) => {
  const { 
    currentRole, 
    setCurrentRole, 
    activeScreen, 
    setActiveScreen,
    userProfile,
    fitnessMetrics,
    bookings,
    ownerProfile,
    gyms,
    posts,
    themeMode
  } = useGymDate();

  const [deviceFrame, setDeviceFrame] = useState<'iphone' | 'android' | 'fullscreen'>('iphone');
  const [time, setTime] = useState('10:44');
  const [activeTab, setActiveTab] = useState<'user' | 'owner' | 'db'>('user');

  // Sync clock time
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleChange = (role: 'member' | 'owner' | 'admin') => {
    setCurrentRole(role);
    setActiveScreen('home');
  };

  // If not on web (running on active native iOS/Android device), safely bypass the desktop shell!
  if (Platform.OS !== 'web' || deviceFrame === 'fullscreen') {
    return (
      <SafeAreaView style={styles.nativeWrapper}>
        <StatusBar barStyle="light-content" backgroundColor="#060608" />
        <View style={styles.nativeContainer}>{children}</View>
      </SafeAreaView>
    );
  }

  // Desktop PWA Simulator wrapper for Web
  return (
    <View style={[styles.simulatorContainer, themeMode === 'light' && styles.simulatorContainerLight]}>
      {/* Centered Simulated Phone Frame container */}
      <View style={styles.phoneViewportContainer}>
        <View style={[styles.phoneShell, deviceFrame === 'android' && styles.phoneShellAndroid]}>
          {/* Notch */}
          <View style={styles.phoneNotch} />
          
          {/* Screen */}
          <View style={styles.phoneScreen}>
            {/* Status bar mock */}
            <View style={styles.phoneStatusBar}>
              <Text style={styles.phoneStatusText}>{time}</Text>
              <View style={styles.phoneStatusRight}>
                <Wifi size={10} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.phoneStatusText}>5G</Text>
              </View>
            </View>

            {/* Viewport container */}
            <View style={styles.phoneContentWrapper}>
              {children}
            </View>

            {/* Home indicator bar */}
            <View style={styles.phoneHomeBar} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nativeWrapper: {
    flex: 1,
    backgroundColor: '#060608',
  },
  nativeContainer: {
    flex: 1,
  },
  simulatorContainer: {
    flex: 1,
    minHeight: '100vh' as any,
    backgroundColor: '#030303',
    position: 'relative',
  },
  simulatorContainerLight: {
    backgroundColor: '#ffffff',
  },
  floatingThemeBtn: {
    position: 'absolute',
    top: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    zIndex: 999,
    cursor: 'pointer' as any,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  floatingThemeBtnLight: {
    backgroundColor: '#f3f4f6',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  floatingThemeBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  floatingThemeBtnTextLight: {
    color: '#030303',
  },
  devToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(8, 8, 12, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  devLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  devLogoText: {
    fontFamily: 'Outfit',
    fontWeight: '900',
    fontSize: 20,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  roleTag: {
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    borderColor: 'rgba(229, 9, 20, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleTagText: {
    color: THEME.COLORS.primary,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  devControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    padding: 3,
    borderRadius: 20,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: 'transparent',
    cursor: 'pointer' as any,
  },
  toggleBtnActive: {
    backgroundColor: THEME.COLORS.primary,
    shadowColor: THEME.COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  toggleBtnText: {
    color: THEME.COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleBtnTextActive: {
    color: '#ffffff',
  },
  simulatorLayout: {
    flex: 1,
    flexDirection: 'row',
    maxWidth: 1600,
    width: '100%',
    marginHorizontal: 'auto' as any,
    padding: 24,
    gap: 24,
  },
  inspectorSidebar: {
    flex: 1,
    maxWidth: 360,
    gap: 20,
  },
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    padding: 4,
    borderRadius: 12,
  },
  tabHeaderBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  tabHeaderBtnActive: {
    backgroundColor: THEME.COLORS.primary,
  },
  tabHeaderBtnText: {
    color: THEME.COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabHeaderBtnTextActive: {
    color: '#ffffff',
  },
  dbWidget: {
    flex: 1,
    backgroundColor: 'rgba(18, 19, 26, 0.85)',
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 20,
  },
  dbWidgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  dbWidgetHeaderText: {
    color: '#ffffff',
    fontFamily: 'Outfit',
    fontWeight: '700',
    fontSize: 12,
  },
  dbWidgetContent: {
    padding: 16,
    gap: 16,
  },
  avatarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.COLORS.primary,
  },
  avatarName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  avatarEmail: {
    color: THEME.COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  avatarLabel: {
    color: THEME.COLORS.textMuted,
    fontSize: 8,
    textTransform: 'uppercase',
    fontWeight: '800',
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 16,
  },
  statBoxLabel: {
    color: THEME.COLORS.textMuted,
    fontSize: 8,
    textTransform: 'uppercase',
    fontWeight: '800',
    marginBottom: 4,
  },
  statBoxVal: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  statBoxValPrimary: {
    color: THEME.COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  statBoxValSuccess: {
    color: THEME.COLORS.success,
    fontWeight: '700',
    fontSize: 12,
  },
  sectionHeader: {
    color: THEME.COLORS.textMuted,
    fontWeight: '800',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 4,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    paddingVertical: 6,
  },
  detailRowLabel: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
  },
  detailRowVal: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
  jsonCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 12,
    borderRadius: 16,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
  },
  jsonTitle: {
    color: THEME.COLORS.success,
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  jsonText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  phoneViewportContainer: {
    flex: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneShell: {
    width: 375,
    height: 760,
    borderRadius: 44,
    backgroundColor: THEME.COLORS.bgDark,
    borderColor: '#181920',
    borderWidth: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.9,
    shadowRadius: 50,
    overflow: 'hidden',
    position: 'relative',
  },
  phoneShellAndroid: {
    borderRadius: 32,
    borderColor: '#222222',
  },
  phoneNotch: {
    position: 'absolute',
    top: 10,
    left: '50%',
    transform: [{ translateX: -55 }],
    width: 110,
    height: 24,
    backgroundColor: '#000000',
    borderRadius: 12,
    zIndex: 99,
  },
  phoneScreen: {
    width: '100%',
    height: '100%',
    paddingTop: 36,
    paddingBottom: 18,
    backgroundColor: THEME.COLORS.bgDark,
  },
  phoneStatusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 90,
  },
  phoneStatusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  phoneStatusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneContentWrapper: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  phoneHomeBar: {
    position: 'absolute',
    bottom: 5,
    left: '50%',
    transform: [{ translateX: -60 }],
    width: 120,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    zIndex: 99,
  }
});
