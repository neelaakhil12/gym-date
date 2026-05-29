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
  Platform
} from 'react-native';
import { useGymDate } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { 
  Scale, 
  LogOut, 
  ChevronRight 
} from 'lucide-react-native';

export const Profile: React.FC = () => {
  const { userProfile, setUserProfile, gyms, setIsLoggedIn, setActiveScreen, setCurrentRole, themeMode, setThemeMode, setLoginInput } = useGymDate();
  
  const [heightVal, setHeightVal] = useState(userProfile.height);
  const [weightVal, setWeightVal] = useState(userProfile.weight);
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);

  const savedGymDetails = gyms.filter(g => userProfile.savedGyms.includes(g.id));

  const handleLogout = () => {
    const performLogout = () => {
      setIsLoggedIn(false);
      setLoginInput('');
      setActiveScreen('onboarding');
    };

    if (Platform.OS === 'web') {
      const confirmLogout = window.confirm('Are you sure you want to sign out of GYMDATE?');
      if (confirmLogout) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to sign out of GYMDATE?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Log Out', 
            style: 'destructive',
            onPress: performLogout
          }
        ]
      );
    }
  };

  const handleSaveMetrics = () => {
    setUserProfile(prev => ({
      ...prev,
      height: heightVal,
      weight: weightVal
    }));
    setIsEditingMetrics(false);
    Alert.alert('Metrics Updated', 'Body stats successfully updated. Active BMI has been re-calculated!');
  };

  const isLight = themeMode === 'light';

  return (
    <ScrollView 
      style={[styles.container, isLight && styles.containerLight]} 
      contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 20 }}
    >
      {/* Title */}
      <View style={styles.headerBlock}>
        <Text style={[styles.titleText, isLight && styles.textLight]}>My Profile</Text>
        <TouchableOpacity onPress={handleLogout}>
          <LogOut size={16} color={isLight ? '#6B7280' : THEME.COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* 1. COVER CARD */}
      <View style={[styles.coverCard, isLight && styles.cardLight]}>
        <Image source={{ uri: userProfile.avatar }} style={styles.avatarImg} />
        <View style={styles.profileDetails}>
          <Text style={[styles.profileName, isLight && styles.textLight]}>{userProfile.name}</Text>
          <Text style={[styles.profileEmail, isLight && styles.textMutedLight]}>{userProfile.email}</Text>
          <View style={styles.goalTag}>
            <Text style={styles.goalTagText}>Goal: {userProfile.goal}</Text>
          </View>
        </View>
      </View>

      {/* 2. APP PREFERENCES */}
      <View style={[styles.coverCard, isLight && styles.cardLight, { marginTop: 16, flexDirection: 'column', alignItems: 'stretch', gap: 6 }]}>
        <View style={[styles.toggleRow, { borderBottomWidth: 0, paddingBottom: 0, marginBottom: 0 }]}>
          <Text style={[styles.toggleLabel, isLight && styles.textLight, { fontSize: 10, fontWeight: '700' }]}>Dark Mode Theme</Text>
          <TouchableOpacity 
            onPress={() => setThemeMode(prev => prev === 'light' ? 'dark' : 'light')}
            style={[
              styles.switchTrack, 
              themeMode === 'dark' ? styles.switchActive : styles.switchInactive,
              isLight && { backgroundColor: '#D1D5DB' }
            ]}
          >
            <View style={[
              styles.switchThumb, 
              themeMode === 'dark' && styles.switchThumbActive,
              isLight && { backgroundColor: '#ffffff', shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.5, elevation: 1 }
            ]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. BODY COMPOSITION METRICS */}
      <View style={[styles.metricsCard, isLight && styles.cardLight]}>
        <View style={[styles.cardHeader, isLight && { borderBottomColor: '#e5e7eb' }]}>
          <View style={styles.cardHeaderLeft}>
            <Scale size={12} color={THEME.COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.cardHeaderTitle, isLight && styles.textLight]}>Body Composition Specs</Text>
          </View>
          <TouchableOpacity onPress={isEditingMetrics ? handleSaveMetrics : () => setIsEditingMetrics(true)}>
            <Text style={styles.cardHeaderLink}>{isEditingMetrics ? 'Save' : 'Update'}</Text>
          </TouchableOpacity>
        </View>

        {isEditingMetrics ? (
          <View style={styles.editRow}>
            <View style={styles.editInputBox}>
              <Text style={[styles.editLabel, isLight && styles.textMutedLight]}>Height (cm)</Text>
              <TextInput
                value={heightVal.toString()}
                onChangeText={(val) => setHeightVal(Number(val))}
                keyboardType="numeric"
                style={[styles.editInput, isLight && { color: '#1a1a1a', backgroundColor: '#f9fafb', borderColor: '#d1d5db' }]}
              />
            </View>
            <View style={styles.editInputBox}>
              <Text style={[styles.editLabel, isLight && styles.textMutedLight]}>Weight (kg)</Text>
              <TextInput
                value={weightVal.toString()}
                onChangeText={(val) => setWeightVal(Number(val))}
                keyboardType="numeric"
                style={[styles.editInput, isLight && { color: '#1a1a1a', backgroundColor: '#f9fafb', borderColor: '#d1d5db' }]}
              />
            </View>
          </View>
        ) : (
          <View style={styles.statsRow}>
            <View style={[styles.statBox, isLight && styles.statBoxLight]}>
              <Text style={[styles.statBoxLabel, isLight && styles.textMutedLight]}>Height</Text>
              <Text style={[styles.statBoxText, isLight && styles.textLight]}>{userProfile.height} cm</Text>
            </View>
            <View style={[styles.statBox, isLight && styles.statBoxLight]}>
              <Text style={[styles.statBoxLabel, isLight && styles.textMutedLight]}>Weight</Text>
              <Text style={[styles.statBoxText, isLight && styles.textLight]}>{userProfile.weight} kg</Text>
            </View>
            <View style={[styles.statBox, isLight && styles.statBoxLight]}>
              <Text style={[styles.statBoxLabel, isLight && styles.textMutedLight]}>Active BMI</Text>
              <Text style={styles.statBoxTextSuccess}>{userProfile.bmi}</Text>
            </View>
          </View>
        )}
      </View>

      {/* 4. SAVED GYM FAVORITES */}
      <View style={[styles.favoritesCard, isLight && styles.cardLight]}>
        <Text style={[styles.sectionTitle, isLight && styles.sectionTitleLight]}>Saved Gym Favorites ({savedGymDetails.length})</Text>
        
        <View style={styles.favList}>
          {savedGymDetails.length > 0 ? (
            savedGymDetails.map((gym) => (
              <TouchableOpacity 
                key={gym.id} 
                onPress={() => { setActiveScreen('discovery'); }}
                style={[styles.favItem, isLight && styles.favItemLight]}
              >
                <View style={styles.favItemLeft}>
                  <Image source={{ uri: gym.image }} style={styles.favItemImg} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={[styles.favItemName, isLight && styles.textLight]}>{gym.name}</Text>
                    <Text style={[styles.favItemLoc, isLight && styles.textMutedLight]}>{gym.location}</Text>
                  </View>
                </View>
                <ChevronRight size={14} color={isLight ? '#9CA3AF' : THEME.COLORS.textMuted} />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No saved gyms yet.</Text>
          )}
        </View>
      </View>

      {/* 5. WORKOUT PREFERENCES */}
      <View style={[styles.preferencesCard, isLight && styles.cardLight]}>
        <Text style={[styles.sectionTitle, isLight && styles.sectionTitleLight]}>Workout Preferences</Text>
        <View style={styles.chipsGrid}>
          {['Free Weights', 'HIIT Circuit', 'CrossFit Rigs', 'Martial Arts', 'Saunas', 'Yoga'].map((pref, i) => (
            <View key={i} style={[styles.chipTag, isLight && styles.chipTagLight]}>
              <Text style={[styles.chipTagText, isLight && styles.textMutedLight]}>{pref}</Text>
            </View>
          ))}
        </View>
      </View>



    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.bgDark,
  },
  containerLight: {
    backgroundColor: '#F9F9F9',
  },
  headerBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 6,
  },
  titleText: {
    color: '#ffffff',
    fontFamily: 'Outfit',
    fontWeight: '900',
    fontSize: 20,
  },
  coverCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderColor: THEME.COLORS.primary,
    borderWidth: 2,
    objectFit: 'cover',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    color: '#ffffff',
    fontFamily: 'Outfit',
    fontWeight: '800',
    fontSize: 15,
  },
  profileEmail: {
    color: THEME.COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  goalTag: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    borderColor: 'rgba(229, 9, 20, 0.15)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  goalTagText: {
    color: THEME.COLORS.primary,
    fontSize: 8,
    fontWeight: '700',
  },
  metricsCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  cardHeaderLink: {
    color: THEME.COLORS.primary,
    fontWeight: '800',
    fontSize: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 16,
    alignItems: 'center',
  },
  statBoxLight: {
    backgroundColor: '#f9fafb',
    borderColor: '#e5e7eb',
  },
  statBoxLabel: {
    color: THEME.COLORS.textMuted,
    fontSize: 8,
    textTransform: 'uppercase',
    fontWeight: '800',
    marginBottom: 4,
  },
  statBoxText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
  statBoxTextSuccess: {
    color: THEME.COLORS.success,
    fontWeight: '700',
    fontSize: 11,
  },
  editRow: {
    flexDirection: 'row',
    gap: 10,
  },
  editInputBox: {
    flex: 1,
    gap: 4,
  },
  editLabel: {
    fontSize: 8,
    color: THEME.COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  editInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 10,
    height: 38,
    paddingHorizontal: 10,
    color: '#ffffff',
    fontSize: 12,
    outlineStyle: 'none' as any,
  },
  favoritesCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  sectionTitleLight: {
    color: '#1A1A1A',
    borderBottomColor: '#e5e7eb',
  },
  favList: {
    gap: 8,
  },
  favItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 16,
  },
  favItemLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
  },
  favItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favItemImg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    objectFit: 'cover',
  },
  favItemName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
  favItemLoc: {
    color: THEME.COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  emptyText: {
    color: THEME.COLORS.textMuted,
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: 12,
  },
  preferencesCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  chipTagLight: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  chipTagText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  devSimCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: 'rgba(229, 9, 20, 0.25)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  devSimDesc: {
    color: THEME.COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 14,
  },
  devSimBtnRow: {
    gap: 8,
    marginTop: 4,
  },
  devSimBtn: {
    backgroundColor: 'rgba(229, 9, 20, 0.08)',
    borderColor: 'rgba(229, 9, 20, 0.2)',
    borderWidth: 1,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devSimBtnText: {
    color: THEME.COLORS.primary,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 10,
    marginBottom: 6,
  },
  toggleLabel: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  switchTrack: {
    width: 36,
    height: 20,
    borderRadius: 10,
    padding: 2,
    justifyContent: 'center',
  },
  switchActive: {
    backgroundColor: THEME.COLORS.primary,
  },
  switchInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  switchThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  textLight: {
    color: '#1a1a1a',
  },
  textMutedLight: {
    color: '#6B7280',
  }
});
