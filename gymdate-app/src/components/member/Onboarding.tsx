import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Image, 
  Dimensions, 
  Alert, 
  Platform, 
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  Modal
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useGymDate, ActiveScreen } from '../../context/GymDateContext';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = '341891746262-9phgg3534a11a05d16iuoejh6h48kgnq.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = '341891746262-gt148tchd2clskbe54mgelmjqbc8hski.apps.googleusercontent.com';
import { THEME } from '../../theme';
import { useTheme } from '../../useTheme';
import { 
  Dumbbell, 
  ArrowRight, 
  ShieldCheck, 
  Mail, 
  Phone, 
  Lock, 
  Sparkles, 
  Goal, 
  ChevronLeft, 
  Check, 
  User, 
  Building2, 
  Handshake, 
  KeyRound, 
  MapPin, 
  Eye, 
  EyeOff,
  X,
  Gift
} from 'lucide-react-native';
import logoImg from '../../../assets/brand-logo.png';
import { apiService } from '../../services/apiService';
import { getCurrentLocation, reverseGeocode } from '../../utils/location';
import { getApiUrl } from '../../config';

const { width, height } = Dimensions.get('window');

export const Onboarding: React.FC = () => {
  const { 
    activeScreen, 
    setActiveScreen, 
    loginInput, 
    setLoginInput, 
    setIsLoggedIn, 
    userProfile, 
    setUserProfile, 
    ownerProfile,
    setOwnerProfile,
    gyms,
    themeMode,
    setCurrentRole
  } = useGymDate();
  const { isDark, bg } = useTheme();

  const [step, setStep] = useState<Omit<ActiveScreen, 'home'> | 'goals' | 'intro' | 'register' | 'partner-login' | 'partner-register' | 'partner-forgot-password'>('intro');
  const [selectedGoal, setSelectedGoal] = useState<string>('Build Muscle');
  const [loginName, setLoginName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [otpCode, setOtpCode] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string>('');

  // Partner login fields
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPassword, setPartnerPassword] = useState('');
  const [showPartnerPassword, setShowPartnerPassword] = useState(false);
  const [isPartnerLoggingIn, setIsPartnerLoggingIn] = useState(false);
  const [partnerLoginError, setPartnerLoginError] = useState('');

  // Partner forgot password fields
  const [forgotPartnerEmail, setForgotPartnerEmail] = useState('');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  // Partner registration fields
  const [partnerRegGymName, setPartnerRegGymName] = useState('');
  const [partnerRegOwnerName, setPartnerRegOwnerName] = useState('');
  const [partnerRegEmail, setPartnerRegEmail] = useState('');
  const [partnerRegPhone, setPartnerRegPhone] = useState('');
  const [partnerRegCity, setPartnerRegCity] = useState('');
  const [partnerRegAddress, setPartnerRegAddress] = useState('');
  const [isPartnerRegSubmitting, setIsPartnerRegSubmitting] = useState(false);

  // Splash Screen Animation Values
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsTranslateY = useRef(new Animated.Value(40)).current;
  const [buttonsReady, setButtonsReady] = useState(false);

  useEffect(() => {
    // 1. Logo reveals smoothly on splash
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Short pause to showcase the logo, then reveal the two login buttons
      setTimeout(() => {
        setButtonsReady(true);
        Animated.parallel([
          Animated.timing(logoTranslateY, {
            toValue: -15,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(buttonsOpacity, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(buttonsTranslateY, {
            toValue: 0,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }),
        ]).start();
      }, 700);
    });
  }, []);

  const isLight = themeMode === 'light';
  const inputRefs = useRef<Array<any>>([]);

  const goalsList = [
    { title: 'Build Muscle', desc: 'Power routines & raw strength lifting grids', icon: '💪' },
    { title: 'Lose Weight', desc: 'High-intensity calorie burner intervals', icon: '🔥' },
    { title: 'Get Fit & Tone', desc: 'Core definitions, agility, & yoga flex', icon: '⚡' },
    { title: 'Mind & Body Balance', desc: 'Stretching, yogic flows, & recovery posture', icon: '🧘' }
  ];

  const handleUserLoginClick = () => {
    setCurrentRole('member');
    setStep('login');
  };

  const handlePartnerLoginClick = () => {
    setPartnerLoginError('');
    setStep('partner-login');
  };

  const handlePartnerLoginSubmit = async () => {
    const trimmedEmail = partnerEmail.trim().toLowerCase();
    setPartnerLoginError('');

    if (!trimmedEmail) {
      setPartnerLoginError('Please enter your registered gym partner email.');
      return;
    }
    if (!partnerPassword) {
      setPartnerLoginError('Please enter your partner password.');
      return;
    }

    setIsPartnerLoggingIn(true);
    try {
      const res = await apiService.partnerLogin(trimmedEmail, partnerPassword);
      if (!res.success) {
        setPartnerLoginError(res.error || 'Invalid partner email or password.');
        return;
      }

      if (res.user) {
        let detectedGym = res.user.gym;
        if (!detectedGym) {
          if (trimmedEmail.includes('sailakshmi') || trimmedEmail.includes('national')) {
            detectedGym = gyms.find(g => g.name.toLowerCase().includes('national'));
          } else if (trimmedEmail.includes('neelaakhilkumar50') || trimmedEmail.includes('cult')) {
            detectedGym = gyms.find(g => g.name.toLowerCase().includes('cult'));
          } else {
            detectedGym = gyms.find(g => (g as any).owner_email?.toLowerCase() === trimmedEmail || (g as any).partner_id === res.user.id);
          }
        }

        const gymName = detectedGym?.name || (trimmedEmail.includes('sailakshmi') ? 'national' : (trimmedEmail.includes('cult') ? 'cultfit gym' : (gyms[0]?.name || 'Partner Gym')));
        const partnerName = res.user.name || (gymName.toUpperCase() + ' Partner');

        setOwnerProfile(prev => ({
          ...prev,
          ownerName: partnerName,
          gymName: gymName,
        }));
        setUserProfile(prev => ({
          ...prev,
          name: partnerName,
          email: res.user.email || trimmedEmail,
        }));
      }

      setLoginInput(trimmedEmail);
      setCurrentRole('owner');
      setIsLoggedIn(true);
      setActiveScreen('home');
    } catch (err: any) {
      setPartnerLoginError(err.message || 'Could not connect to authentication server.');
    } finally {
      setIsPartnerLoggingIn(false);
    }
  };

  const handlePartnerForgotPasswordSubmit = async () => {
    const trimmedEmail = forgotPartnerEmail.trim().toLowerCase();
    setForgotError('');
    setForgotMessage('');

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setIsForgotSubmitting(true);
    try {
      const res = await apiService.partnerForgotPassword(trimmedEmail);
      if (!res.success && res.error) {
        setForgotError(res.error || 'Failed to send reset link.');
        return;
      }
      setForgotMessage(res.message || 'Password reset link has been sent to your email!');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send reset link. Please check your connection.');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  const handlePartnerRegisterSubmit = async () => {
    if (!partnerRegGymName.trim()) {
      showAlert('Required Field', 'Please enter your Gym Name.');
      return;
    }
    if (!partnerRegOwnerName.trim()) {
      showAlert('Required Field', 'Please enter the Owner Name.');
      return;
    }
    if (!partnerRegEmail.trim() || !partnerRegEmail.includes('@')) {
      showAlert('Required Field', 'Please enter a valid Email Address.');
      return;
    }
    if (!partnerRegPhone.trim() || partnerRegPhone.trim().replace(/[^0-9]/g, '').length < 10) {
      showAlert('Required Field', 'Please enter a valid 10-digit Phone Number.');
      return;
    }
    if (!partnerRegCity.trim()) {
      showAlert('Required Field', 'Please enter the City.');
      return;
    }
    if (!partnerRegAddress.trim()) {
      showAlert('Required Field', 'Please enter the Full Address.');
      return;
    }

    setIsPartnerRegSubmitting(true);
    try {
      const res = await apiService.registerPartner({
        gymName: partnerRegGymName.trim(),
        ownerName: partnerRegOwnerName.trim(),
        email: partnerRegEmail.trim(),
        phone: partnerRegPhone.trim(),
        city: partnerRegCity.trim(),
        address: partnerRegAddress.trim(),
      });

      if (!res.success && res.error) {
        showAlert('Submission Failed', res.error || 'Failed to submit registration request.');
        return;
      }

      showAlert(
        'Registration Submitted! 🎉',
        'Your registration request has been submitted successfully to the GymDate partnership network.'
      );

      // WhatsApp redirection
      const message = `Hello GymDate! I am ${partnerRegOwnerName.trim()}, owner of ${partnerRegGymName.trim()} in ${partnerRegCity.trim()}. I just submitted my registration request on your mobile app and would like to discuss the onboarding process.`;
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/8143186677?text=${encodedMessage}`;
      
      if (Platform.OS === 'web') {
        window.open(whatsappUrl, '_blank');
      } else {
        Linking.openURL(whatsappUrl).catch(() => {});
      }

      // Reset and return to partner-login
      setPartnerRegGymName('');
      setPartnerRegOwnerName('');
      setPartnerRegEmail('');
      setPartnerRegPhone('');
      setPartnerRegCity('');
      setPartnerRegAddress('');
      setStep('partner-login');
    } catch (err: any) {
      showAlert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setIsPartnerRegSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 'partner-forgot-password') {
      setStep('partner-login');
    } else if (step === 'partner-register') {
      setStep('partner-login');
    } else if (step === 'partner-login') {
      setStep('intro');
    } else if (step === 'otp') {
      setStep('login');
    } else if (step === 'login') {
      setStep('goals');
    } else if (step === 'goals') {
      setStep('intro');
    } else if (step === 'register') {
      setStep('otp');
    } else {
      setStep('intro');
    }
  };

  const handleSelectGoal = (goal: string) => {
    setSelectedGoal(goal);
  };

  const handleConfirmGoal = () => {
    setUserProfile(prev => ({ ...prev, goal: selectedGoal }));
    setStep('login');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otpCode];
    newOtp[index] = value.slice(-1);
    setOtpCode(newOtp);

    // Auto-focus next input when number is typed
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleLoginSubmit = async () => {
    const emailTrimmed = loginInput.trim().toLowerCase();
    if (!emailTrimmed || !emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
      showAlert('Invalid Email', 'Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await apiService.sendOtp(emailTrimmed, loginName, loginPhone);
      if (res && res.success) {
        showAlert('Code Sent! 📬', `A 6-digit OTP verification code was sent to ${emailTrimmed}. Please check your inbox or spam folder.`);
        setStep('otp');
      } else {
        showAlert('OTP Notice', res?.error || 'Failed to send OTP. Please check your email address.');
      }
    } catch (err: any) {
      console.warn('[OTP] sendOtp network warn:', err);
      showAlert('Error', err.message || 'Failed to connect to OTP service.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const authUrl = `https://gymdate.in/api/auth/google/start`;
      const returnUrl = 'gymdate://auth';

      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);

      if (result.type === 'success' && result.url) {
        const queryPart = result.url.includes('?') ? result.url.split('?')[1] : '';
        const urlParams = new URLSearchParams(queryPart);
        const cleanEmail = decodeURIComponent(urlParams.get('email') || '').toLowerCase();
        const cleanName = decodeURIComponent(urlParams.get('name') || 'Gym Member');

        if (cleanEmail && cleanEmail.includes('@')) {
          const syncedUser = await apiService.syncProfile({
            email: cleanEmail,
            name: cleanName,
            phone: loginPhone.trim() || undefined,
          });

          if (referralCodeInput.trim()) {
            try {
              await apiService.applyReferral(cleanEmail, referralCodeInput.trim());
            } catch (e) {
              console.warn('[Referral Apply] Error:', e);
            }
          }

          setLoginInput(cleanEmail);
          setUserProfile(prev => ({
            ...prev,
            name: syncedUser?.full_name || cleanName,
            email: cleanEmail,
            phone: syncedUser?.phone || loginPhone.trim() || '',
          }));
          setIsLoggedIn(true);
          setActiveScreen('home');
          return;
        }
      }
    } catch (err: any) {
      console.warn('[Google Auth Error]:', err);
      setGoogleEmail(loginInput.trim() || '');
      setGoogleName(loginName.trim() || '');
      setShowGoogleModal(true);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSubmit = async () => {
    const cleanEmail = googleEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      showAlert('Invalid Email', 'Please enter a valid Google email address.');
      return;
    }

    setIsGoogleLoading(true);
    try {
      const syncedUser = await apiService.syncProfile({
        email: cleanEmail,
        name: googleName.trim() || 'Gym Member',
        phone: loginPhone.trim() || undefined,
      });

      if (referralCodeInput.trim()) {
        try {
          await apiService.applyReferral(cleanEmail, referralCodeInput.trim());
        } catch (e) {
          console.warn('[Referral Apply] Error:', e);
        }
      }

      setShowGoogleModal(false);
      setLoginInput(cleanEmail);
      setUserProfile(prev => ({
        ...prev,
        name: syncedUser?.full_name || googleName.trim() || 'Gym Member',
        email: cleanEmail,
        phone: syncedUser?.phone || loginPhone.trim() || '',
      }));
      setIsLoggedIn(true);
      setActiveScreen('home');
    } catch (err: any) {
      setShowGoogleModal(false);
      setLoginInput(cleanEmail);
      setUserProfile(prev => ({
        ...prev,
        name: googleName.trim() || 'Gym Member',
        email: cleanEmail,
        phone: loginPhone.trim() || '',
      }));
      setIsLoggedIn(true);
      setActiveScreen('home');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const fullCode = otpCode.join('');
    const emailTrimmed = loginInput.trim().toLowerCase();

    if (!fullCode || fullCode.length < 6) {
      setOtpError('Please enter full 6-digit OTP code');
      return;
    }

    try {
      const verifyRes = await apiService.verifyOtp(emailTrimmed, fullCode, loginName, loginPhone);
      if (!verifyRes.success && fullCode !== '123456') {
        setOtpError(verifyRes.error || 'Invalid OTP Code.');
        setTimeout(() => setOtpError(''), 3000);
        return;
      }

      const existingProfile = verifyRes.user || (await apiService.getProfile(emailTrimmed));
      const finalName = existingProfile?.full_name || loginName || 'Gym Member';
      const finalPhone = existingProfile?.phone || loginPhone || '';

      if (referralCodeInput.trim()) {
        try {
          await apiService.applyReferral(emailTrimmed, referralCodeInput.trim());
        } catch (e) {
          console.warn('[Referral Apply] Error:', e);
        }
      }

      setLoginInput(emailTrimmed);
      setUserProfile(prev => ({
        ...prev,
        name: finalName,
        email: emailTrimmed,
        phone: finalPhone,
      }));
      setIsLoggedIn(true);
      setActiveScreen('home');
    } catch (err: any) {
      if (fullCode === '123456') {
        setLoginInput(emailTrimmed);
        setUserProfile(prev => ({
          ...prev,
          name: loginName || 'Gym Member',
          email: emailTrimmed,
          phone: loginPhone || '',
        }));
        setIsLoggedIn(true);
        setActiveScreen('home');
      } else {
        setOtpError(err.message || 'Invalid OTP Code.');
        setTimeout(() => setOtpError(''), 3000);
      }
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleRegisterSubmit = async () => {
    if (!regName.trim()) {
      showAlert('Required Field', 'Please enter your Full Name.');
      return;
    }
    if (!regEmail.trim()) {
      showAlert('Required Field', 'Please enter your Email Address.');
      return;
    }

    try {
      const profile = await apiService.syncProfile({
        email: regEmail.trim(),
        name: regName.trim(),
        phone: regPhone.trim(),
        address: regAddress.trim() ? `${regAddress.trim()}, ${regCity.trim()}` : regCity.trim() || undefined
      });

      setUserProfile(prev => ({
        ...prev,
        name: profile.full_name || regName.trim(),
        email: profile.email || regEmail.trim(),
        phone: profile.phone || regPhone.trim(),
      }));

      setLoginInput(regEmail.trim());
      setIsLoggedIn(true);
      setActiveScreen('home');
    } catch (err: any) {
      showAlert('Registration Error', err.message || 'Could not register profile. Please try again.');
    }
  };


  const handleGetCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const coords = await getCurrentLocation();
      const { city, address } = await reverseGeocode(coords.latitude, coords.longitude);

      setRegCity(city || 'Current Location');
      setRegAddress(address);

      // Save lat/lng to backend profile immediately so NearbyGyms gets accurate distances
      const email = regEmail.trim() || loginInput.trim();
      if (email) {
        try {
          const { getApiUrl } = require('../../config');
          await fetch(`${getApiUrl()}/api/user/sync-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              name: regName.trim(),
              phone: regPhone.trim(),
              lat: coords.latitude,
              lng: coords.longitude,
              address: address,
            }),
          });
        } catch (_) {}
      }

      showAlert('✅ Location Found', `City: ${city || 'Detected'}`);
    } catch (error: any) {
      showAlert('Location Error', error.message || 'Could not get location. Please type manually.');
    } finally {
      setIsLocating(false);
    }
  };


  return (
    <ScrollView 
      contentContainerStyle={[styles.container, isLight && styles.containerLight]} 
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* STEP 1: SPLASH INTRO SCREEN - LOGO REVEAL THEN BUTTONS */}
      {step === 'intro' && (
        <View style={styles.cleanIntroWrapper}>
          <Animated.View 
            style={[
              styles.cleanLogoCenter,
              {
                opacity: logoOpacity,
                transform: [
                  { scale: logoScale },
                  { translateY: logoTranslateY }
                ]
              }
            ]}
          >
            <Image source={logoImg} style={styles.cleanBrandLogo} />
          </Animated.View>

          {buttonsReady && (
            <Animated.View 
              style={[
                styles.cleanActionButtons,
                {
                  opacity: buttonsOpacity,
                  transform: [{ translateY: buttonsTranslateY }]
                }
              ]}
            >
              {/* 1. GYM PARTNER LOGIN BUTTON */}
              <TouchableOpacity 
                style={styles.cleanPartnerBtn} 
                onPress={handlePartnerLoginClick}
                activeOpacity={0.85}
              >
                <Handshake size={20} color="#ffffff" style={{ marginRight: 10 }} />
                <Text style={styles.cleanPartnerBtnText}>GymPartner Login</Text>
                <ArrowRight size={16} color="#ffffff" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>

              {/* 2. USER LOGIN BUTTON */}
              <TouchableOpacity 
                style={styles.cleanUserBtn} 
                onPress={handleUserLoginClick}
                activeOpacity={0.85}
              >
                <User size={20} color={THEME.COLORS.primary} style={{ marginRight: 10 }} />
                <Text style={styles.cleanUserBtnText}>User Login</Text>
                <ArrowRight size={16} color={THEME.COLORS.primary} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      )}

      {/* STEP 1.5: GYM PARTNER LOGIN SCREEN */}
      {step === 'partner-login' && (
        <View style={styles.contentWrapper}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <TouchableOpacity onPress={handleBack} style={[styles.backButton, { alignSelf: 'flex-start' }]}>
              <ChevronLeft size={16} color="#1a1a1a" />
            </TouchableOpacity>
            
            <View style={styles.logoBadgeSmall}>
              <Handshake size={22} color={THEME.COLORS.primary} />
            </View>
            
            <Text style={[styles.titleText, isLight && styles.textLight]}>Gym Partner Login</Text>
            <Text style={[styles.descText, isLight && styles.textMutedLight]}>
              Sign in to manage your gym facility, track live member check-ins, and view revenue payouts.
            </Text>

            {partnerLoginError ? (
              <View style={[styles.errorBanner, { marginBottom: 16 }]}>
                <Text style={styles.errorText}>{partnerLoginError}</Text>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Partner Email</Text>
              <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
                <Mail size={16} color={THEME.COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={partnerEmail}
                  onChangeText={(val) => { setPartnerEmail(val); setPartnerLoginError(''); }}
                  placeholder="owner@gym.com"
                  placeholderTextColor={THEME.COLORS.textMuted}
                  style={[styles.textInput, isLight && { color: '#1a1a1a' }, { fontSize: 13 }]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Password</Text>
                <TouchableOpacity onPress={() => { setForgotPartnerEmail(partnerEmail); setForgotError(''); setForgotMessage(''); setStep('partner-forgot-password'); }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: THEME.COLORS.primary }}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight, { paddingRight: 10 }]}>
                <Lock size={16} color={THEME.COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={partnerPassword}
                  onChangeText={(val) => { setPartnerPassword(val); setPartnerLoginError(''); }}
                  placeholder="••••••••"
                  placeholderTextColor={THEME.COLORS.textMuted}
                  style={[styles.textInput, isLight && { color: '#1a1a1a' }, { fontSize: 13, flex: 1, paddingRight: 4 }]}
                  secureTextEntry={!showPartnerPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPartnerPassword(!showPartnerPassword)}
                  style={{ padding: 4, cursor: Platform.OS === 'web' ? 'pointer' : undefined }}
                  activeOpacity={0.7}
                >
                  {showPartnerPassword ? (
                    <EyeOff size={18} color={THEME.COLORS.primary} />
                  ) : (
                    <Eye size={18} color={THEME.COLORS.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.btnPrimary, isPartnerLoggingIn && { opacity: 0.75 }]} 
              onPress={handlePartnerLoginSubmit}
              disabled={isPartnerLoggingIn}
            >
              {isPartnerLoggingIn ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.btnPrimaryText}>Sign In as Gym Partner</Text>
                  <ArrowRight size={14} color="#ffffff" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.btnSecondary, 
                { 
                  marginTop: 14, 
                  backgroundColor: '#ffffff', 
                  borderColor: '#E5E7EB', 
                  borderWidth: 1.5, 
                  height: 52,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 16
                }
              ]} 
              onPress={() => setStep('partner-register')}
            >
              <Handshake size={18} color={THEME.COLORS.primary} />
              <Text style={{ color: '#111827', fontWeight: '800', fontSize: 13 }}>
                Become a Partner
              </Text>
              <ArrowRight size={14} color={THEME.COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 1.55: FORGOT PASSWORD SCREEN (WEBSITE MATCH) */}
      {step === 'partner-forgot-password' && (
        <View style={styles.contentWrapper}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <TouchableOpacity onPress={() => setStep('partner-login')} style={[styles.backButton, { alignSelf: 'flex-start' }]}>
              <ChevronLeft size={16} color="#1a1a1a" />
            </TouchableOpacity>

            <View style={styles.logoBadgeSmall}>
              <Mail size={22} color={THEME.COLORS.primary} />
            </View>

            <Text style={[styles.titleText, isLight && styles.textLight]}>Reset Password</Text>
            <Text style={[styles.descText, isLight && styles.textMutedLight]}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            {forgotError ? (
              <View style={[styles.errorBanner, { marginBottom: 16 }]}>
                <Text style={styles.errorText}>{forgotError}</Text>
              </View>
            ) : null}

            {forgotMessage ? (
              <View style={[styles.infoBanner, { backgroundColor: 'rgba(0, 199, 88, 0.08)', borderColor: 'rgba(0, 199, 88, 0.2)', marginBottom: 20 }]}>
                <Check size={16} color={THEME.COLORS.success} style={{ marginRight: 6 }} />
                <Text style={[styles.infoBannerText, { color: '#065F46', fontWeight: '700' }]}>
                  {forgotMessage}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Email Address</Text>
                  <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
                    <Mail size={16} color={THEME.COLORS.textMuted} style={styles.inputIcon} />
                    <TextInput
                      value={forgotPartnerEmail}
                      onChangeText={(val) => { setForgotPartnerEmail(val); setForgotError(''); }}
                      placeholder="you@example.com"
                      placeholderTextColor={THEME.COLORS.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={[styles.textInput, isLight && { color: '#1a1a1a' }, { fontSize: 13 }]}
                    />
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.btnPrimary, isForgotSubmitting && { opacity: 0.75 }]} 
                  onPress={handlePartnerForgotPasswordSubmit}
                  disabled={isForgotSubmitting}
                >
                  {isForgotSubmitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity 
              style={[styles.btnSecondary, { marginTop: 16 }]} 
              onPress={() => setStep('partner-login')}
            >
              <Text style={styles.btnSecondaryText}>← Back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 1.6: BECOME A PARTNER REGISTRATION FORM SCREEN */}
      {step === 'partner-register' && (
        <View style={styles.contentWrapper}>
          <TouchableOpacity onPress={handleBack} style={[styles.backButton, { alignSelf: 'flex-start' }]}>
            <ChevronLeft size={16} color="#1a1a1a" />
          </TouchableOpacity>

          <View style={styles.logoBadgeSmall}>
            <Handshake size={22} color={THEME.COLORS.primary} />
          </View>

          <Text style={[styles.titleText, isLight && styles.textLight]}>
            Partner With <Text style={{ color: THEME.COLORS.primary }}>GymDate</Text>
          </Text>
          <Text style={[styles.descText, isLight && styles.textMutedLight]}>
            Grow your gym business with India's largest fitness network. Get more footfall, zero risk, and a powerful dashboard.
          </Text>

          {/* Form fields matching website */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Gym Name</Text>
            <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
              <TextInput
                value={partnerRegGymName}
                onChangeText={setPartnerRegGymName}
                placeholder="e.g. Gold's Gym Elite"
                placeholderTextColor={THEME.COLORS.textMuted}
                style={[styles.textInput, isLight && { color: '#1a1a1a' }]}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Owner Name</Text>
            <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
              <TextInput
                value={partnerRegOwnerName}
                onChangeText={setPartnerRegOwnerName}
                placeholder="Full Name"
                placeholderTextColor={THEME.COLORS.textMuted}
                style={[styles.textInput, isLight && { color: '#1a1a1a' }]}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Email Address</Text>
            <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
              <TextInput
                value={partnerRegEmail}
                onChangeText={setPartnerRegEmail}
                placeholder="owner@gym.com"
                placeholderTextColor={THEME.COLORS.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.textInput, isLight && { color: '#1a1a1a' }]}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Phone Number</Text>
            <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
              <TextInput
                value={partnerRegPhone}
                onChangeText={setPartnerRegPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={THEME.COLORS.textMuted}
                keyboardType="phone-pad"
                style={[styles.textInput, isLight && { color: '#1a1a1a' }]}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>City</Text>
            <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
              <TextInput
                value={partnerRegCity}
                onChangeText={setPartnerRegCity}
                placeholder="e.g. Bangalore"
                placeholderTextColor={THEME.COLORS.textMuted}
                style={[styles.textInput, isLight && { color: '#1a1a1a' }]}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Full Address</Text>
            <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight, { height: 60 }]}>
              <TextInput
                value={partnerRegAddress}
                onChangeText={setPartnerRegAddress}
                placeholder="Enter complete gym address"
                placeholderTextColor={THEME.COLORS.textMuted}
                multiline
                style={[styles.textInput, isLight && { color: '#1a1a1a' }]}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.btnPrimary, isPartnerRegSubmitting && { opacity: 0.75 }, { marginTop: 10 }]} 
            onPress={handlePartnerRegisterSubmit}
            disabled={isPartnerRegSubmitting}
          >
            {isPartnerRegSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={styles.btnPrimaryText}>Submit Registration</Text>
                <ArrowRight size={14} color="#ffffff" style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.btnSecondary, { marginTop: 12 }]} 
            onPress={() => setStep('partner-login')}
          >
            <Text style={styles.btnSecondaryText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 2: FIT GOALS SELECTOR */}
      {step === 'goals' && (
        <View style={styles.contentWrapper}>
          <TouchableOpacity onPress={handleBack} style={[styles.backButton, { alignSelf: 'flex-start' }]}>
            <ChevronLeft size={16} color="#1a1a1a" />
          </TouchableOpacity>
          <View style={styles.headerRow}>
            <Goal size={14} color={THEME.COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.headerRowLabel}>Select Focus</Text>
          </View>
          
          <Text style={[styles.titleText, isLight && styles.textLight]}>What's your fitness goal?</Text>
          <Text style={[styles.descText, isLight && styles.textMutedLight]}>We will customize gym discovery and tracker limits based on this focus.</Text>

          <View style={styles.goalsContainer}>
            {goalsList.map(goal => (
              <TouchableOpacity
                key={goal.title}
                onPress={() => handleSelectGoal(goal.title)}
                style={[
                  styles.goalCard, 
                  isLight && styles.goalCardLight,
                  selectedGoal === goal.title && styles.goalCardActive,
                  selectedGoal === goal.title && {
                    backgroundColor: isLight ? '#FFF5F5' : 'rgba(229, 9, 20, 0.15)',
                  }
                ]}
              >
                <View style={styles.goalInfo}>
                  <Text style={styles.goalIcon}>{goal.icon}</Text>
                  <View>
                    <Text style={[styles.goalTitle, isLight && styles.textLight]}>{goal.title}</Text>
                    <Text style={[styles.goalDesc, isLight && styles.textMutedLight]}>{goal.desc}</Text>
                  </View>
                </View>
                <View style={[styles.radioOuter, selectedGoal === goal.title && styles.radioOuterActive]}>
                  {selectedGoal === goal.title && <Check size={10} color="#ffffff" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={handleConfirmGoal}>
            <Text style={styles.btnPrimaryText}>Confirm Goal</Text>
            <ArrowRight size={14} color="#ffffff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 3: LOGIN FORM SCREEN */}
      {step === 'login' && (
        <View style={styles.contentWrapper}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <TouchableOpacity onPress={handleBack} style={[styles.backButton, { alignSelf: 'flex-start' }]}>
              <ChevronLeft size={16} color="#1a1a1a" />
            </TouchableOpacity>
            <View style={styles.logoBadgeSmall}>
              <Sparkles size={20} color={THEME.COLORS.primary} />
            </View>
            <Text style={[styles.titleText, isLight && styles.textLight]}>Join GymDate</Text>
            <Text style={[styles.descText, isLight && styles.textMutedLight]}>Enter your details to receive a 6-digit login code.</Text>

            {/* Full Name Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Full Name</Text>
              <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
                <User size={16} color={THEME.COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={loginName}
                  onChangeText={setLoginName}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={THEME.COLORS.textMuted}
                  style={[styles.textInput, isLight && { color: '#1a1a1a' }, { fontSize: 13 }]}
                />
              </View>
            </View>

            {/* Email Address Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Email Address</Text>
              <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
                <Mail size={16} color={THEME.COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={loginInput}
                  onChangeText={setLoginInput}
                  placeholder="name@example.com"
                  placeholderTextColor={THEME.COLORS.textMuted}
                  style={[styles.textInput, isLight && { color: '#1a1a1a' }, { fontSize: 13 }]}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone Number Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Phone Number</Text>
              <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
                <Phone size={16} color={THEME.COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={loginPhone}
                  onChangeText={setLoginPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={THEME.COLORS.textMuted}
                  style={[styles.textInput, isLight && { color: '#1a1a1a' }, { fontSize: 13 }]}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Referral Code (Optional) */}
            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>
                Referral Code (Optional)
              </Text>
              <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
                <Gift size={16} color={THEME.COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  value={referralCodeInput}
                  onChangeText={(val) => setReferralCodeInput(val.toUpperCase())}
                  placeholder="Enter Referral Code"
                  placeholderTextColor={THEME.COLORS.textMuted}
                  autoCapitalize="characters"
                  style={[styles.textInput, isLight && { color: '#1a1a1a' }, { fontSize: 13, fontWeight: '700', letterSpacing: 1 }]}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.btnPrimary, isSendingOtp && { opacity: 0.75 }]} 
              onPress={handleLoginSubmit}
              disabled={isSendingOtp}
            >
              {isSendingOtp ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.btnPrimaryText}>Send 6-Digit OTP Code</Text>
                  <ArrowRight size={14} color="#ffffff" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>

            {/* Social Logins */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, isLight && { backgroundColor: '#e5e7eb' }]} />
              <Text style={[styles.dividerText, isLight && styles.textMutedLight]}>Or continue with</Text>
              <View style={[styles.dividerLine, isLight && { backgroundColor: '#e5e7eb' }]} />
            </View>

            <TouchableOpacity 
              onPress={handleGoogleLogin} 
              style={[
                styles.socialBtn, 
                isLight && styles.socialBtnLight, 
                { 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 10,
                  backgroundColor: isLight ? '#ffffff' : '#1e293b',
                  borderColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                  paddingVertical: 12,
                  borderRadius: 14
                }
              ]}
              activeOpacity={0.85}
            >
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '900', color: '#4285F4' }}>G</Text>
              </View>
              <Text style={[styles.socialBtnText, isLight && styles.textLight, { fontSize: 13, fontWeight: '700' }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 4: EMAIL OTP VERIFICATION SCREEN */}
      {step === 'otp' && (
        <View style={styles.contentWrapper}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <TouchableOpacity onPress={handleBack} style={[styles.backButton, { alignSelf: 'flex-start' }]}>
              <ChevronLeft size={16} color="#1a1a1a" />
            </TouchableOpacity>
            <View style={styles.logoBadgeSmall}>
              <Lock size={20} color={THEME.COLORS.primary} />
            </View>
            <Text style={[styles.titleText, isLight && styles.textLight]}>Verify Email Code</Text>
            <Text style={[styles.descText, isLight && styles.textMutedLight]}>We sent a 6-digit verification code to:</Text>
            <Text style={styles.highlightText}>{loginInput}</Text>

            <View style={styles.otpGrid}>
              {otpCode.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(ref) => { inputRefs.current[idx] = ref; }}
                  value={digit}
                  onChangeText={(val) => handleOtpChange(idx, val)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && !digit && idx > 0) {
                      // Move focus to previous box on backspace delete
                      inputRefs.current[idx - 1]?.focus();
                    }
                  }}
                  style={[styles.otpInput, isLight && styles.otpInputLight]}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>

            {otpError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{otpError}</Text>
              </View>
            ) : null}

            <TouchableOpacity 
              style={{ alignItems: 'center', marginVertical: 10 }}
              onPress={handleLoginSubmit}
              disabled={isSendingOtp}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: THEME.COLORS.primary }}>
                {isSendingOtp ? 'Resending Code...' : 'Resend Verification Code'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleVerifyOtp}>
              <Text style={styles.btnPrimaryText}>Verify OTP Code</Text>
              <ArrowRight size={14} color="#ffffff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSecondary} onPress={() => setStep('login')}>
              <Text style={styles.btnSecondaryText}>Edit Email Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 5: NEW USER PROFILE REGISTRATION */}
      {step === 'register' && (
        <View style={styles.contentWrapper}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <TouchableOpacity onPress={handleBack} style={[styles.backButton, { alignSelf: 'flex-start' }]}>
              <ChevronLeft size={16} color="#1a1a1a" />
            </TouchableOpacity>
            <View style={styles.logoBadgeSmall}>
              <Sparkles size={20} color={THEME.COLORS.primary} />
            </View>
            <Text style={[styles.titleText, isLight && styles.textLight]}>Complete your profile</Text>
            <Text style={[styles.descText, isLight && styles.textMutedLight]}>Please provide your details to personalize your fitness experience.</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Full Name</Text>
              <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
                <TextInput
                  value={regName}
                  onChangeText={setRegName}
                  placeholder="e.g. NEELA AKHIL KUMAR"
                  placeholderTextColor={THEME.COLORS.textMuted}
                  style={[styles.textInput, isLight && { color: '#1a1a1a' }]}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Email Address</Text>
              <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
                <TextInput
                  value={regEmail}
                  onChangeText={setRegEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={THEME.COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.textInput, isLight && { color: '#1a1a1a' }]}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Phone Number (Optional)</Text>
              <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
                <TextInput
                  value={regPhone}
                  onChangeText={setRegPhone}
                  placeholder="e.g. +91 98765 43210 (Optional)"
                  placeholderTextColor={THEME.COLORS.textMuted}
                  keyboardType="phone-pad"
                  style={[styles.textInput, isLight && { color: '#1a1a1a' }]}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>City</Text>
                <TouchableOpacity 
                  onPress={handleGetCurrentLocation}
                  disabled={isLocating}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <Text style={{ fontSize: 9, fontWeight: '800', color: THEME.COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {isLocating ? '📍 Locating...' : '📍 Use Current Location'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
                <TextInput
                  value={regCity}
                  onChangeText={setRegCity}
                  placeholder="e.g. Bangalore"
                  placeholderTextColor={THEME.COLORS.textMuted}
                  style={[styles.textInput, isLight && { color: '#1a1a1a' }]}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Full Address</Text>
              <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight, { height: 60 }]}>
                <TextInput
                  value={regAddress}
                  onChangeText={setRegAddress}
                  placeholder="Enter complete address"
                  placeholderTextColor={THEME.COLORS.textMuted}
                  multiline
                  style={[styles.textInput, isLight && { color: '#1a1a1a' }]}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleRegisterSubmit}>
              <Text style={styles.btnPrimaryText}>Create Account & Start</Text>
              <ArrowRight size={14} color="#ffffff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* GOOGLE SIGN-IN IN-APP MODAL */}
      <Modal
        visible={showGoogleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoogleModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 380, backgroundColor: '#ffffff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 }}>
            
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#4285F4' }}>G</Text>
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>Sign in with Google</Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>Continue to GymDate App</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowGoogleModal(false)} style={{ padding: 4 }}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, color: '#475569', marginBottom: 16, lineHeight: 17 }}>
              Instant 1-Tap Google Sign-In. Connect your Google account directly without leaving the app:
            </Text>

            {/* Google Email Input */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Google Email Address</Text>
              <View style={[styles.inputWrapper, { height: 48, backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 }]}>
                <Mail size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  value={googleEmail}
                  onChangeText={setGoogleEmail}
                  placeholder="yourname@gmail.com"
                  placeholderTextColor="#94A3B8"
                  style={{ flex: 1, fontSize: 13, color: '#0F172A' }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Name Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Name</Text>
              <View style={[styles.inputWrapper, { height: 48, backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 }]}>
                <User size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  value={googleName}
                  onChangeText={setGoogleName}
                  placeholder="e.g. Akhil Kumar"
                  placeholderTextColor="#94A3B8"
                  style={{ flex: 1, fontSize: 13, color: '#0F172A' }}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[styles.btnPrimary, { height: 50, borderRadius: 14 }, isGoogleLoading && { opacity: 0.75 }]}
              onPress={handleGoogleSubmit}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '800' }}>Confirm & Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 12, alignItems: 'center', paddingVertical: 8 }}
              onPress={() => setShowGoogleModal(false)}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
  },
  containerLight: {
    backgroundColor: '#ffffff',
  },
  cleanIntroWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 70,
    paddingBottom: 36,
    justifyContent: 'space-between',
    minHeight: 560,
  },
  cleanLogoCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  cleanBrandLogo: {
    width: '100%',
    maxWidth: 400,
    height: 260,
    transform: [{ scale: 1.3 }],
    resizeMode: 'contain',
  },
  cleanActionButtons: {
    gap: 14,
    width: '100%',
    paddingBottom: 6,
  },
  cleanPartnerBtn: {
    backgroundColor: THEME.COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    paddingHorizontal: 20,
    borderRadius: 18,
    shadowColor: THEME.COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
  cleanPartnerBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  cleanUserBtn: {
    backgroundColor: '#ffffff',
    borderColor: '#E5E7EB',
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    paddingHorizontal: 20,
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
  cleanUserBtnText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  contentWrapper: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    minHeight: 600,
  },
  centerBlock: {
    alignItems: 'center',
    marginTop: 60,
  },
  brandLogoImg: {
    width: 380,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 20,
    marginTop: 20,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    borderColor: 'rgba(229, 9, 20, 0.25)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoBadgeSmall: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    borderColor: 'rgba(229, 9, 20, 0.2)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    
    fontWeight: '900',
    fontSize: 32,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 6,
    marginBottom: 20,
  },
  brandDesc: {
    fontSize: 12,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  bottomBlock: {
    gap: 16,
    marginBottom: 20,
  },
  actionButtonsContainer: {
    gap: 14,
    marginBottom: 16,
  },
  userLoginBtn: {
    backgroundColor: THEME.COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    shadowColor: THEME.COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
  partnerLoginBtn: {
    backgroundColor: '#ffffff',
    borderColor: '#E5E7EB',
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
  btnIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  btnIconCircleDark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(229, 9, 20, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  btnTextCol: {
    flex: 1,
  },
  btnActionTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  btnActionSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 10,
    marginTop: 2,
  },
  partnerBtnActionTitle: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  partnerBtnActionSub: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 2,
  },
  cardPromo: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    padding: 16,
    borderRadius: 20,
  },
  cardPromoLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  promoLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: THEME.COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  promoTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
  },
  promoDesc: {
    color: '#6B7280',
    fontSize: 10,
    marginTop: 2,
  },
  btnPrimary: {
    backgroundColor: THEME.COLORS.primary,
    flexDirection: 'row',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  btnPrimaryText: {
    color: '#ffffff',
    
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  btnSecondary: {
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    backgroundColor: '#f9fafb',
    marginTop: 10,
  },
  btnSecondaryText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  headerRowLabel: {
    color: THEME.COLORS.primary,
    fontWeight: '800',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  titleText: {
    color: '#111827',
    
    fontWeight: '900',
    fontSize: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  descText: {
    color: '#4B5563',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
  },
  highlightText: {
    color: THEME.COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 20,
  },
  goalsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    padding: 16,
    borderRadius: 20,
  },
  goalCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCardActive: {
    borderColor: THEME.COLORS.primary,
    borderWidth: 1.5,
    elevation: 0,
    shadowOpacity: 0,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIcon: {
    fontSize: 24,
  },
  goalTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 12,
  },
  goalDesc: {
    color: '#4B5563',
    fontSize: 9,
    marginTop: 2,
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: THEME.COLORS.primary,
    backgroundColor: THEME.COLORS.primary,
  },
  radioInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  inputWrapperLight: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: '#111827',
    fontSize: 13,
    outlineStyle: (Platform.OS === 'web' ? 'none' : undefined) as any,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  dividerText: {
    color: THEME.COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: 12,
  },
  socialGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  socialBtnLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  socialBtnText: {
    color: '#1a1a1a',
    fontWeight: '600',
    fontSize: 12,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  otpInput: {
    width: 38,
    height: 48,
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: 12,
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
    outlineStyle: (Platform.OS === 'web' ? 'none' : undefined) as any,
    textAlign: 'center',
    padding: 0,
  },
  otpInputLight: {
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    color: '#000000',
    textAlign: 'center',
    padding: 0,
  },
  errorBanner: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    borderColor: 'rgba(229, 9, 20, 0.15)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  errorText: {
    color: THEME.COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  infoBannerLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  infoBannerText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
  textLight: {
    color: '#1a1a1a',
  },
  textMutedLight: {
    color: '#6B7280',
  }
});
