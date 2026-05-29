import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Image,
  ImageBackground,
  Dimensions,
  Alert,
  Platform
} from 'react-native';
import { useGymDate, ActiveScreen } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { Dumbbell, ArrowRight, ShieldCheck, Mail, Phone, Lock, Sparkles, Goal } from 'lucide-react-native';
import logoImg from '../../../assets/brand-logo.png';
import { apiService } from '../../services/apiService';

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
    themeMode
  } = useGymDate();

  const [step, setStep] = useState<Omit<ActiveScreen, 'home'> | 'goals' | 'intro' | 'register'>('intro');
  const [selectedGoal, setSelectedGoal] = useState<string>('Build Muscle');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [otpCode, setOtpCode] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string>('');

  const isLight = themeMode === 'light';
  const inputRefs = useRef<Array<any>>([]);

  const goalsList = [
    { title: 'Build Muscle', desc: 'Power routines & raw strength lifting grids', icon: '💪' },
    { title: 'Lose Weight', desc: 'High-intensity calorie burner intervals', icon: '🔥' },
    { title: 'Get Fit & Tone', desc: 'Core definitions, agility, & yoga flex', icon: '⚡' },
    { title: 'Mind & Body Balance', desc: 'Stretching, yogic flows, & recovery posture', icon: '🧘' }
  ];

  const handleNextIntro = () => {
    setStep('goals');
  };

  const handleSelectGoal = (goal: string) => {
    setSelectedGoal(goal);
  };

  const handleConfirmGoal = () => {
    setUserProfile(prev => ({ ...prev, goal: selectedGoal }));
    setStep('login');
  };

  const handleLoginSubmit = () => {
    if (!loginInput.trim()) return;
    setStep('otp');
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

  const handleVerifyOtp = async () => {
    const fullCode = otpCode.join('');
    if (fullCode === '123456') {
      try {
        const existingProfile = await apiService.getProfile(loginInput);
        if (existingProfile) {
          setIsLoggedIn(true);
          setActiveScreen('home');
        } else {
          setRegEmail(loginInput.includes('@') ? loginInput : '');
          setRegPhone(!loginInput.includes('@') ? loginInput : '');
          setStep('register');
        }
      } catch (err) {
        setRegEmail(loginInput.includes('@') ? loginInput : '');
        setRegPhone(!loginInput.includes('@') ? loginInput : '');
        setStep('register');
      }
    } else {
      setOtpError('Invalid OTP Code. Use demo code "123456"!');
      setTimeout(() => setOtpError(''), 3000);
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
    if (!regPhone.trim()) {
      showAlert('Required Field', 'Please enter your Phone Number.');
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

      setIsLoggedIn(true);
      setActiveScreen('home');
    } catch (err: any) {
      showAlert('Registration Error', err.message || 'Could not register profile. Please try again.');
    }
  };

  const handleGetCurrentLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
              headers: { 'User-Agent': 'GymDateApp' }
            });
            const data = await res.json();
            if (data && data.address) {
              const city = data.address.city || data.address.town || data.address.village || data.address.state || '';
              const address = data.display_name || '';
              setRegCity(city);
              setRegAddress(address);
              showAlert('Location Found', `Successfully set location to: ${city}`);
            } else {
              setRegAddress(`Latitude: ${latitude.toFixed(4)}, Longitude: ${longitude.toFixed(4)}`);
              setRegCity('Located');
            }
          } catch (e) {
            setRegAddress(`Latitude: ${latitude.toFixed(4)}, Longitude: ${longitude.toFixed(4)}`);
            setRegCity('Located');
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          setIsLocating(false);
          showAlert('Location Error', 'Could not retrieve current location. Please type manually.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      showAlert('Not Supported', 'Geolocation is not supported on this platform.');
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, isLight && styles.containerLight]} keyboardShouldPersistTaps="handled">
      {/* STEP 1: SPLASH INTRO SCREEN */}
      {step === 'intro' && (
        <View style={styles.contentWrapper}>
          <View style={styles.centerBlock}>
            <Image source={logoImg} style={styles.brandLogoImg} />
            <Text style={styles.brandSub}>Fitness Freedom Awaits</Text>
            <Text style={[styles.brandDesc, isLight && styles.textMutedLight]}>
              Access the largest premium network of top-tier gyms with high-intensity grids, private coaches, and flexible passes.
            </Text>
          </View>

          <View style={styles.bottomBlock}>
            <View style={[styles.cardPromo, isLight && styles.cardPromoLight]}>
              <Text style={styles.promoLabel}>Flexible Passes</Text>
              <Text style={[styles.promoTitle, isLight && styles.textLight]}>Daily, Weekly, Monthly Passes</Text>
              <Text style={[styles.promoDesc, isLight && styles.textMutedLight]}>No joining fees. Instant QR checkin.</Text>
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleNextIntro}>
              <Text style={styles.btnPrimaryText}>Get Started</Text>
              <ArrowRight size={14} color="#ffffff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 2: FIT GOALS SELECTOR */}
      {step === 'goals' && (
        <View style={styles.contentWrapper}>
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
                  selectedGoal === goal.title && styles.goalCardActive
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
                  {selectedGoal === goal.title && <View style={styles.radioInner} />}
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
            <View style={styles.logoBadgeSmall}>
              <Sparkles size={20} color={THEME.COLORS.primary} />
            </View>
            <Text style={[styles.titleText, isLight && styles.textLight]}>Join the fitness circle</Text>
            <Text style={[styles.descText, isLight && styles.textMutedLight]}>Access top-tier premium workout environments instantly.</Text>

            <View style={styles.formGroup}>
              <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Enter Phone or Email</Text>
              <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
                {loginInput.includes('@') ? (
                  <Mail size={16} color={THEME.COLORS.textMuted} style={styles.inputIcon} />
                ) : (
                  <Phone size={16} color={THEME.COLORS.textMuted} style={styles.inputIcon} />
                )}
                <TextInput
                  value={loginInput}
                  onChangeText={setLoginInput}
                  placeholder="+91 98765 43210 or email@domain.com"
                  placeholderTextColor={THEME.COLORS.textMuted}
                  style={[styles.textInput, isLight && { color: '#1a1a1a' }]}
                  keyboardType={loginInput.includes('@') ? 'email-address' : 'phone-pad'}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleLoginSubmit}>
              <Text style={styles.btnPrimaryText}>Send Verification Pass</Text>
              <ArrowRight size={14} color="#ffffff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            {/* Social Logins */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, isLight && { backgroundColor: '#e5e7eb' }]} />
              <Text style={[styles.dividerText, isLight && styles.textMutedLight]}>Or continue with</Text>
              <View style={[styles.dividerLine, isLight && { backgroundColor: '#e5e7eb' }]} />
            </View>

            <View style={styles.socialGrid}>
              <TouchableOpacity onPress={() => { setLoginInput('akash.k@gmail.com'); setStep('otp'); }} style={[styles.socialBtn, isLight && styles.socialBtnLight]}>
                <Text style={[styles.socialBtnText, isLight && styles.textLight]}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setLoginInput('akash.apple@icloud.com'); setStep('otp'); }} style={[styles.socialBtn, isLight && styles.socialBtnLight]}>
                <Text style={[styles.socialBtnText, isLight && styles.textLight]}>Apple</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* STEP 4: SMS OTP VERIFICATION CODES */}
      {step === 'otp' && (
        <View style={styles.contentWrapper}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={styles.logoBadgeSmall}>
              <Lock size={20} color={THEME.COLORS.primary} />
            </View>
            <Text style={[styles.titleText, isLight && styles.textLight]}>Verify dynamic pass</Text>
            <Text style={[styles.descText, isLight && styles.textMutedLight]}>We sent a verification SMS/email pass to:</Text>
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

            <View style={[styles.infoBanner, isLight && styles.infoBannerLight]}>
              <ShieldCheck size={16} color={THEME.COLORS.success} style={{ marginRight: 6 }} />
              <Text style={[styles.infoBannerText, isLight && styles.textMutedLight]}>
                Demo Bypass Code: Enter <Text style={{ fontWeight: 'bold', color: isLight ? '#1a1a1a' : '#ffffff' }}>123456</Text> to instantly unlock Home Dashboard!
              </Text>
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleVerifyOtp}>
              <Text style={styles.btnPrimaryText}>Verify OTP Code</Text>
              <ArrowRight size={14} color="#ffffff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSecondary} onPress={() => setStep('login')}>
              <Text style={styles.btnSecondaryText}>Edit Contact Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 5: NEW USER PROFILE REGISTRATION */}
      {step === 'register' && (
        <View style={styles.contentWrapper}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
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
                  placeholder="e.g. Akash Kumar"
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
              <Text style={[styles.inputLabel, isLight && styles.textMutedLight]}>Phone Number</Text>
              <View style={[styles.inputWrapper, isLight && styles.inputWrapperLight]}>
                <TextInput
                  value={regPhone}
                  onChangeText={setRegPhone}
                  placeholder="+91 98765 43210"
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: THEME.COLORS.bgDark,
  },
  containerLight: {
    backgroundColor: '#F9F9F9',
  },
  contentWrapper: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    minHeight: 700,
  },
  centerBlock: {
    alignItems: 'center',
    marginTop: 60,
  },
  brandLogoImg: {
    width: 340,
    height: 110,
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
    fontFamily: 'Outfit',
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
    color: THEME.COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  bottomBlock: {
    gap: 16,
    marginBottom: 20,
  },
  cardPromo: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  promoDesc: {
    color: THEME.COLORS.textMuted,
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
    fontFamily: 'Outfit',
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
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    marginTop: 10,
  },
  btnSecondaryText: {
    color: THEME.COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 12,
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
    color: '#ffffff',
    fontFamily: 'Outfit',
    fontWeight: '900',
    fontSize: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  descText: {
    color: THEME.COLORS.textSecondary,
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
    backgroundColor: 'rgba(229, 9, 20, 0.08)',
    borderColor: THEME.COLORS.primary,
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
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  goalDesc: {
    color: THEME.COLORS.textSecondary,
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
    color: '#ffffff',
    fontSize: 13,
    outlineStyle: 'none' as any,
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
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: 44,
    height: 52,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 16,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    outlineStyle: 'none' as any,
    textAlign: 'center',
    padding: 0,
  },
  otpInputLight: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    color: '#1a1a1a',
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
