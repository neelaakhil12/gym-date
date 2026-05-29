import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert 
} from 'react-native';
import { useGymDate } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { 
  QrCode, 
  Sparkles, 
  Calendar, 
  Zap, 
  ShieldAlert, 
  ChevronRight 
} from 'lucide-react-native';

export const MembershipCard: React.FC = () => {
  const { userProfile, setUserProfile } = useGymDate();
  const [showPlans, setShowPlans] = useState(false);

  const mockPlans = [
    { name: '7-Day Pass', price: 1800, duration: '7 Days', desc: 'Perfect for business trips or short training stints.' },
    { name: 'Monthly Premium', price: 4500, duration: '30 Days', desc: 'Unrestricted entry to all gyms, steam rooms, and juice bars.' },
    { name: 'Elite Annual', price: 24500, duration: '12 Months', desc: 'Complete fitness freedom. 24 personal trainer sessions included.' }
  ];

  const handlePurchaseMock = (planName: string) => {
    setUserProfile(prev => ({
      ...prev,
      membershipType: planName as any,
      membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    }));
    setShowPlans(false);
    Alert.alert('Purchase Successful', `You have unlocked the ${planName} pass. Digital QR checkin pass is active!`);
  };

  const handleCancelPass = () => {
    Alert.alert(
      'Cancel Pass',
      'Are you sure you want to cancel your active gym pass?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => {
            setUserProfile(prev => ({
              ...prev,
              membershipType: 'none',
              membershipExpiry: null
            }));
          }
        }
      ]
    );
  };

  const hasActivePass = userProfile.membershipType !== 'none';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* Title */}
      <View style={styles.headerBlock}>
        <Text style={styles.titleText}>Digital Pass Card</Text>
        <Text style={styles.descText}>Scan this QR terminal code at any gym to checkin.</Text>
      </View>

      {/* 1. GORGEOUS GLOWING DIGITAL PASSCARD */}
      <View style={styles.cardContainer}>
        {hasActivePass ? (
          <View style={[styles.passCard, THEME.SHADOWS.glow]}>
            <View style={styles.passCardHeader}>
              <View>
                <View style={styles.activeTag}>
                  <Text style={styles.activeTagText}>ACTIVE MEMBER</Text>
                </View>
                <Text style={styles.cardName}>{userProfile.name}</Text>
                <Text style={styles.cardPhone}>{userProfile.phone}</Text>
              </View>
              <Zap size={20} color={THEME.COLORS.primary} />
            </View>

            <View style={styles.passCardFooter}>
              <View>
                <Text style={styles.footerLabel}>Membership Pass</Text>
                <Text style={styles.footerVal}>{userProfile.membershipType}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.footerLabel}>Valid Until</Text>
                <Text style={styles.footerValSuccess}>{userProfile.membershipExpiry}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noPassCard}>
            <View style={styles.noPassIconBlock}>
              <ShieldAlert size={24} color={THEME.COLORS.primary} />
            </View>
            <Text style={styles.noPassTitle}>No active membership pass</Text>
            <Text style={styles.noPassDesc}>
              Purchase a daily workout pass or flexible subscription to unlock multi-gym access.
            </Text>
            <TouchableOpacity 
              onPress={() => setShowPlans(true)}
              style={styles.noPassBtn}
            >
              <Text style={styles.noPassBtnText}>Buy Gym Pass</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 2. CHECK-IN QR BLOCK */}
      {hasActivePass && !showPlans && (
        <View style={styles.qrSection}>
          <Text style={styles.qrLabel}>Dynamic Scannable Signature</Text>
          
          {/* Animated Pulsing QR scanner container */}
          <View style={styles.qrBorder}>
            <View style={styles.qrInner}>
              <QrCode size={110} color="#000000" strokeWidth={1.5} />
            </View>
          </View>

          <View style={styles.qrCodeCard}>
            <Text style={styles.qrCodeLabel}>Check-In Reference Code</Text>
            <Text style={styles.qrCodeVal}>{userProfile.qrCodeValue}</Text>
          </View>

          <Text style={styles.qrHelpText}>
            Open this scanner code upon entering any partnered gym. The operator check-in terminal will scan to record entry validation.
          </Text>
        </View>
      )}

      {/* 3. MEMBER ACTION TOGGLES / UPGRADES */}
      {!showPlans && (
        <View style={styles.actionsBlock}>
          {hasActivePass ? (
            <>
              <TouchableOpacity 
                onPress={() => setShowPlans(true)}
                style={styles.actionBtn}
              >
                <View style={styles.actionBtnLeft}>
                  <Sparkles size={14} color={THEME.COLORS.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.actionBtnText}>Upgrade Pass Subscription</Text>
                </View>
                <ChevronRight size={14} color={THEME.COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleCancelPass}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel Active Pass</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
      )}

      {/* 4. PLANS COMPARISON CAROUSEL OVERLAY */}
      {showPlans && (
        <View style={styles.plansCard}>
          <View style={styles.plansHeader}>
            <Text style={styles.plansHeaderTitle}>Compare Membership Passes</Text>
            <TouchableOpacity onPress={() => setShowPlans(false)}>
              <Text style={styles.plansHeaderClose}>Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.plansList}>
            {mockPlans.map((plan) => (
              <View key={plan.name} style={styles.planItem}>
                <View style={styles.planItemHeader}>
                  <Text style={styles.planItemTitle}>{plan.name}</Text>
                  <Text style={styles.planItemPrice}>₹{plan.price}</Text>
                </View>
                <Text style={styles.planItemDesc}>{plan.desc}</Text>
                <TouchableOpacity 
                  onPress={() => handlePurchaseMock(plan.name)}
                  style={styles.planItemBtn}
                >
                  <Text style={styles.planItemBtnText}>Purchase Pass Now</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.bgDark,
  },
  headerBlock: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 6,
  },
  titleText: {
    color: '#ffffff',
    fontFamily: 'Outfit',
    fontWeight: '900',
    fontSize: 20,
  },
  descText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  cardContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  passCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: 'rgba(229, 9, 20, 0.25)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    height: 180,
    justifyContent: 'space-between',
  },
  passCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activeTag: {
    backgroundColor: 'rgba(229, 9, 20, 0.15)',
    borderColor: 'rgba(229, 9, 20, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  activeTagText: {
    color: THEME.COLORS.primary,
    fontWeight: '700',
    fontSize: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardName: {
    color: '#ffffff',
    fontFamily: 'Outfit',
    fontWeight: '900',
    fontSize: 16,
  },
  cardPhone: {
    color: THEME.COLORS.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  passCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
  },
  footerLabel: {
    color: THEME.COLORS.textMuted,
    fontSize: 8,
    textTransform: 'uppercase',
    fontWeight: '800',
    marginBottom: 2,
  },
  footerVal: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
  footerValSuccess: {
    color: THEME.COLORS.success,
    fontWeight: '700',
    fontSize: 11,
  },
  noPassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  noPassIconBlock: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  noPassTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  noPassDesc: {
    color: THEME.COLORS.textSecondary,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  noPassBtn: {
    backgroundColor: THEME.COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  noPassBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qrSection: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    alignItems: 'center',
    gap: 16,
  },
  qrLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  qrBorder: {
    width: 140,
    height: 140,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(229, 9, 20, 0.25)',
    borderWidth: 2,
  },
  qrInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrCodeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
  },
  qrCodeLabel: {
    fontSize: 8,
    color: THEME.COLORS.textMuted,
    textTransform: 'uppercase',
    fontWeight: '800',
    marginBottom: 2,
  },
  qrCodeVal: {
    color: '#ffffff',
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1.5,
  },
  qrHelpText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 10,
  },
  actionsBlock: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    padding: 14,
    borderRadius: 20,
  },
  actionBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
  cancelBtn: {
    backgroundColor: 'rgba(229, 9, 20, 0.05)',
    borderColor: 'rgba(229, 9, 20, 0.1)',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: THEME.COLORS.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  plansCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 20,
    gap: 16,
  },
  plansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  plansHeaderTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
    fontFamily: 'Outfit',
  },
  plansHeaderClose: {
    color: THEME.COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  plansList: {
    gap: 12,
  },
  planItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
    gap: 6,
  },
  planItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planItemTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
  planItemPrice: {
    color: THEME.COLORS.primary,
    fontWeight: '900',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  planItemDesc: {
    color: THEME.COLORS.textMuted,
    fontSize: 9,
    lineHeight: 13,
  },
  planItemBtn: {
    backgroundColor: THEME.COLORS.primary,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  planItemBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 9,
    textTransform: 'uppercase',
  }
});
