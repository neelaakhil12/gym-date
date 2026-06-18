import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  Linking,
  Platform
} from 'react-native';
import { useGymDate } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { useTheme } from '../../useTheme';
import { apiService } from '../../services/apiService';
import { 
  Handshake,
  TrendingUp, 
  Users, 
  Shield, 
  LayoutGrid, 
  CheckCircle 
} from 'lucide-react-native';

export const PartnerForm: React.FC = () => {
  const { themeMode } = useGymDate();
  const { isDark, bg } = useTheme();
  const isLight = themeMode === 'light';

  // Form states
  const [gymName, setGymName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  // Validation & Loading states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Focus states for input outlines
  const [activeInput, setActiveInput] = useState<string | null>(null);

  const BENEFITS = [
    { icon: TrendingUp, title: "Increased Revenue", desc: "Monetize empty slots and boost monthly income significantly." },
    { icon: Users, title: "Higher Footfall", desc: "Get discovered by thousands of new fitness enthusiasts in your area." },
    { icon: Shield, title: "Zero Risk", desc: "No registration fee. We only earn when you do. Pure partnership." },
    { icon: LayoutGrid, title: "Smart Dashboard", desc: "Manage bookings, view analytics, and track earnings in real-time." }
  ];

  const CHECKLIST = [
    "Instant onboarding process",
    "Dedicated account manager",
    "Marketing support across our channels",
    "Real-time payment settlements"
  ];

  const validate = () => {
    let tempErrors: Record<string, string> = {};
    if (!gymName.trim()) tempErrors.gymName = "Gym name is required";
    if (!ownerName.trim()) tempErrors.ownerName = "Owner name is required";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      tempErrors.email = "Email is required";
    } else if (!emailRegex.test(email.trim())) {
      tempErrors.email = "Invalid email address";
    }

    if (!phone.trim()) {
      tempErrors.phone = "Phone number is required";
    } else if (phone.trim().replace(/[^0-9]/g, '').length < 10) {
      tempErrors.phone = "Valid 10-digit phone number is required";
    }

    if (!city.trim()) tempErrors.city = "City is required";
    if (!address.trim()) tempErrors.address = "Full address is required";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please correct the highlighted fields before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.registerPartner({
        gymName: gymName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim(),
      });

      if (!response.success) {
        Alert.alert('Submission Failed', response.error || 'Failed to submit registration request.');
        return;
      }

      Alert.alert(
        'Registration Submitted!',
        'Your registration request has been submitted successfully to the GymDate partnership network. Opening WhatsApp to connect with our onboarding team...',
        [
          {
            text: 'OK',
            onPress: () => {
              // Construct WhatsApp Message
              const message = `Hello GymDate! I am ${ownerName.trim()}, owner of ${gymName.trim()} in ${city.trim()}. I just submitted my registration request on your mobile app and would like to discuss the onboarding process.`;
              const encodedMessage = encodeURIComponent(message);
              const whatsappUrl = `https://wa.me/8143186677?text=${encodedMessage}`;
              
              Linking.openURL(whatsappUrl).catch(() => {
                Alert.alert('Redirection Error', 'Could not launch WhatsApp. Please reach out manually to +91 8143186677');
              });

              // Reset form fields
              setGymName('');
              setOwnerName('');
              setEmail('');
              setPhone('');
              setCity('');
              setAddress('');
              setErrors({});
            }
          }
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, isLight && { backgroundColor: '#ffffff' }]} 
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header section */}
      <View style={styles.headerBlock}>
        <View style={styles.headerIconContainer}>
          <Handshake size={32} color={THEME.COLORS.primary} />
        </View>
        <Text style={[styles.titleText, isLight && { color: '#111827' }]}>
          Partner With <Text style={{ color: THEME.COLORS.primary }}>GymDate</Text>
        </Text>
        <Text style={[styles.descText, isLight && { color: '#4B5563' }]}>
          Grow your gym business with India's largest fitness network. Get more footfall, zero risk, and a powerful dashboard.
        </Text>
      </View>

      {/* Benefits section */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, isLight && { color: '#111827' }]}>Why Partner With Us?</Text>
        <View style={styles.benefitsGrid}>
          {BENEFITS.map((b, idx) => {
            const BenefitIcon = b.icon;
            return (
              <View 
                key={idx} 
                style={[
                  styles.benefitCard, 
                  isLight && { backgroundColor: '#ffffff', borderColor: '#E5E7EB' }
                ]}
              >
                <View style={styles.benefitIconBox}>
                  <BenefitIcon size={20} color={THEME.COLORS.primary} />
                </View>
                <Text style={[styles.benefitTitle, isLight && { color: '#1F2937' }]}>{b.title}</Text>
                <Text style={[styles.benefitDesc, isLight && { color: '#6B7280' }]}>{b.desc}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Checklist Overview & Form section */}
      <View style={[styles.formContainer, isLight && { backgroundColor: '#ffffff', borderColor: '#E5E7EB' }]}>
        <Text style={[styles.formHeaderTitle, isLight && { color: '#111827' }]}>
          Register Your <Text style={{ color: THEME.COLORS.primary }}>Gym</Text>
        </Text>
        <Text style={[styles.formHeaderDesc, isLight && { color: '#6B7280' }]}>
          Fill out this form and our partnership team will get in touch with you within 24-48 hours.
        </Text>

        <View style={styles.checklistBlock}>
          {CHECKLIST.map((item, idx) => (
            <View key={idx} style={styles.checkRow}>
              <CheckCircle size={16} color={THEME.COLORS.primary} />
              <Text style={[styles.checkText, isLight && { color: '#374151' }]}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Inputs */}
        <View style={styles.inputWrapper}>
          <Text style={[styles.inputLabel, isLight && { color: '#4B5563' }]}>Gym Name</Text>
          <TextInput
            style={[
              styles.textInput,
              isLight && styles.textInputLight,
              activeInput === 'gymName' && styles.inputFocused,
              errors.gymName ? styles.inputErrorBorder : null
            ]}
            placeholder="Enter gym name"
            placeholderTextColor={isLight ? '#9CA3AF' : THEME.COLORS.textMuted}
            value={gymName}
            onChangeText={(text) => { setGymName(text); clearError('gymName'); }}
            onFocus={() => setActiveInput('gymName')}
            onBlur={() => setActiveInput(null)}
          />
          {errors.gymName && <Text style={styles.errorText}>{errors.gymName}</Text>}
        </View>

        <View style={styles.inputWrapper}>
          <Text style={[styles.inputLabel, isLight && { color: '#4B5563' }]}>Owner Name</Text>
          <TextInput
            style={[
              styles.textInput,
              isLight && styles.textInputLight,
              activeInput === 'ownerName' && styles.inputFocused,
              errors.ownerName ? styles.inputErrorBorder : null
            ]}
            placeholder="Full name"
            placeholderTextColor={isLight ? '#9CA3AF' : THEME.COLORS.textMuted}
            value={ownerName}
            onChangeText={(text) => { setOwnerName(text); clearError('ownerName'); }}
            onFocus={() => setActiveInput('ownerName')}
            onBlur={() => setActiveInput(null)}
          />
          {errors.ownerName && <Text style={styles.errorText}>{errors.ownerName}</Text>}
        </View>

        <View style={styles.inputWrapper}>
          <Text style={[styles.inputLabel, isLight && { color: '#4B5563' }]}>Email Address</Text>
          <TextInput
            style={[
              styles.textInput,
              isLight && styles.textInputLight,
              activeInput === 'email' && styles.inputFocused,
              errors.email ? styles.inputErrorBorder : null
            ]}
            placeholder="owner@gym.com"
            placeholderTextColor={isLight ? '#9CA3AF' : THEME.COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => { setEmail(text); clearError('email'); }}
            onFocus={() => setActiveInput('email')}
            onBlur={() => setActiveInput(null)}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputWrapper}>
          <Text style={[styles.inputLabel, isLight && { color: '#4B5563' }]}>Phone Number</Text>
          <TextInput
            style={[
              styles.textInput,
              isLight && styles.textInputLight,
              activeInput === 'phone' && styles.inputFocused,
              errors.phone ? styles.inputErrorBorder : null
            ]}
            placeholder="+91 00000 00000"
            placeholderTextColor={isLight ? '#9CA3AF' : THEME.COLORS.textMuted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(text) => { setPhone(text); clearError('phone'); }}
            onFocus={() => setActiveInput('phone')}
            onBlur={() => setActiveInput(null)}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>

        <View style={styles.inputWrapper}>
          <Text style={[styles.inputLabel, isLight && { color: '#4B5563' }]}>City</Text>
          <TextInput
            style={[
              styles.textInput,
              isLight && styles.textInputLight,
              activeInput === 'city' && styles.inputFocused,
              errors.city ? styles.inputErrorBorder : null
            ]}
            placeholder="e.g. Bangalore"
            placeholderTextColor={isLight ? '#9CA3AF' : THEME.COLORS.textMuted}
            value={city}
            onChangeText={(text) => { setCity(text); clearError('city'); }}
            onFocus={() => setActiveInput('city')}
            onBlur={() => setActiveInput(null)}
          />
          {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
        </View>

        <View style={styles.inputWrapper}>
          <Text style={[styles.inputLabel, isLight && { color: '#4B5563' }]}>Full Address</Text>
          <TextInput
            style={[
              styles.textInput,
              isLight && styles.textInputLight,
              styles.textArea,
              activeInput === 'address' && styles.inputFocused,
              errors.address ? styles.inputErrorBorder : null
            ]}
            placeholder="Enter complete gym address"
            placeholderTextColor={isLight ? '#9CA3AF' : THEME.COLORS.textMuted}
            multiline
            numberOfLines={4}
            value={address}
            onChangeText={(text) => { setAddress(text); clearError('address'); }}
            onFocus={() => setActiveInput('address')}
            onBlur={() => setActiveInput(null)}
          />
          {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Registration</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 24 : 16,
    paddingBottom: 90, // ensure space above custom bottom navigation row
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(229, 9, 20, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  titleText: {
    color: '#ffffff',
    
    fontWeight: '900',
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 10,
  },
  descText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
    
  },
  benefitsGrid: {
    gap: 12,
  },
  benefitCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  benefitIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(229, 9, 20, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  benefitTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 4,
    
  },
  benefitDesc: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  formContainer: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 28,
    padding: 20,
    marginBottom: 12,
  },
  formHeaderTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    
    marginBottom: 6,
  },
  formHeaderDesc: {
    color: THEME.COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 20,
  },
  checklistBlock: {
    marginBottom: 24,
    gap: 10,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  inputWrapper: {
    marginBottom: 16,
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    color: '#ffffff',
    fontSize: 13,
  },
  textInputLight: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
    color: '#1F2937',
  },
  textArea: {
    height: 90,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  inputFocused: {
    borderColor: THEME.COLORS.primary,
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: THEME.COLORS.primary,
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    ...THEME.SHADOWS.glow,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  }
});
