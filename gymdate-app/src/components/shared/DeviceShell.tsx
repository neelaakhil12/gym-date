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
  Dimensions,
  useColorScheme,
  useWindowDimensions
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

  const { width: windowWidth } = useWindowDimensions();
  const systemScheme = useColorScheme();
  const isDark = systemScheme === 'dark';
  const isLight = themeMode === 'light';

  // Responsive Check: If the window is narrow (e.g. less than 500px, which matches DevTools mobile simulation or actual mobile screens),
  // render the pure clean fullscreen app directly without the custom outer frame border!
  if (Platform.OS !== 'web' || windowWidth < 500 || deviceFrame === 'fullscreen') {
    // On Android, SafeAreaView does NOT pad for the status bar.
    // We must manually add StatusBar.currentHeight as paddingTop.
    const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
    const bgColor = isLight ? '#ffffff' : '#060608';
    return (
      <SafeAreaView style={[styles.nativeWrapper, { backgroundColor: bgColor }]}>
        <StatusBar 
          barStyle={isLight ? 'dark-content' : 'light-content'} 
          backgroundColor={bgColor}
          translucent={false}
        />
        <View style={[
          styles.nativeContainer,
          { backgroundColor: bgColor, paddingTop: statusBarHeight }
        ]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  // Otherwise, render the gorgeous widescreen desktop PWA simulator frame border!
  return (
    <View style={[styles.simulatorContainer, isLight && styles.simulatorContainerLight]}>
      {/* Centered Simulated Phone Frame container */}
      <View style={styles.phoneViewportContainer}>
        <View style={[styles.phoneShell, deviceFrame === 'android' && styles.phoneShellAndroid, isLight && { backgroundColor: '#ffffff', borderColor: '#e5e7eb' }]}>
          {/* Notch */}
          <View style={styles.phoneNotch} />
          
          {/* Screen */}
          <View style={[styles.phoneScreen, isLight && { backgroundColor: '#ffffff' }]}>
            {/* Status bar mock */}
            <View style={styles.phoneStatusBar}>
              <Text style={[styles.phoneStatusText, isLight && { color: '#000000' }]}>{time}</Text>
              <View style={styles.phoneStatusRight}>
                <Wifi size={10} color={isLight ? '#000000' : '#ffffff'} style={{ marginRight: 4 }} />
                <Text style={[styles.phoneStatusText, isLight && { color: '#000000' }]}>5G</Text>
              </View>
            </View>

            {/* Viewport container */}
            <View style={styles.phoneContentWrapper}>
              {children}
            </View>

            {/* Home indicator bar */}
            <View style={[styles.phoneHomeBar, isLight && { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nativeWrapper: {
    flex: 1,
    // backgroundColor set dynamically above based on color scheme
  },
  nativeContainer: {
    flex: 1,
  },
  simulatorContainer: {
    flex: 1,
    minHeight: (Platform.OS === 'web' ? '100vh' : '100%') as any,
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
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
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
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
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
    marginHorizontal: Platform.OS === 'web' ? ('auto' as any) : 0,
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
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
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
    width: 340,
    height: 680,
    borderRadius: 36,
    backgroundColor: THEME.COLORS.bgDark,
    borderColor: '#181920',
    borderWidth: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.85,
    shadowRadius: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  phoneShellAndroid: {
    borderRadius: 24,
    borderColor: '#222222',
  },
  phoneNotch: {
    position: 'absolute',
    top: 8,
    left: '50%',
    transform: [{ translateX: -45 }],
    width: 90,
    height: 18,
    backgroundColor: '#000000',
    borderRadius: 9,
    zIndex: 99,
  },
  phoneScreen: {
    width: '100%',
    height: '100%',
    paddingTop: 30,
    paddingBottom: 14,
    backgroundColor: THEME.COLORS.bgDark,
  },
  phoneStatusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 90,
  },
  phoneStatusText: {
    color: '#ffffff',
    fontSize: 9.5,
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
    bottom: 4,
    left: '50%',
    transform: [{ translateX: -50 }],
    width: 100,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    zIndex: 99,
  }
});
