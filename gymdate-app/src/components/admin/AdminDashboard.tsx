import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Alert 
} from 'react-native';
import { useGymDate } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { 
  ShieldCheck, 
  Dumbbell, 
  MapPin, 
  Check, 
  X, 
  SlidersHorizontal,
  Image as ImageIcon
} from 'lucide-react-native';

export const AdminDashboard: React.FC = () => {
  const { 
    gymRequests, 
    approveGymRequest, 
    rejectGymRequest,
    adminBanners,
    toggleBannerActive,
    gyms,
    setCurrentRole
  } = useGymDate();

  const activeBanners = adminBanners.filter(b => b.active);
  const pendingRequests = gymRequests.filter(r => r.status === 'pending');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 20 }}>
      {/* Title */}
      <View style={styles.headerBlock}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.titleText}>Admin Command Center</Text>
          <TouchableOpacity onPress={() => setCurrentRole('member')}>
            <Text style={{ color: THEME.COLORS.primary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>← Return</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.descText}>Monitor platform requests, payouts, & promotions.</Text>
      </View>

      {/* 1. PLATFORM GLOBAL METRICS */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Total Gyms</Text>
          <Text style={styles.statBoxVal}>{gyms.length} active</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Global Payouts</Text>
          <Text style={styles.statBoxValSuccess}>₹96K paid</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Ad Banners</Text>
          <Text style={styles.statBoxValPrimary}>{activeBanners.length} live</Text>
        </View>
      </View>

      {/* 2. ONBOARDING PARTNERS QUEUE */}
      <View style={styles.approvalsCard}>
        <View style={styles.approvalsHeader}>
          <View style={styles.approvalsHeaderLeft}>
            <SlidersHorizontal size={12} color={THEME.COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.approvalsHeaderTitle}>Gym Partner Approvals</Text>
          </View>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingRequests.length} pending</Text>
          </View>
        </View>

        <View style={styles.approvalsList}>
          {pendingRequests.length > 0 ? (
            pendingRequests.map((req) => (
              <View key={req.id} style={styles.requestItem}>
                <View style={styles.requestHeader}>
                  <View style={styles.iconBox}>
                    <Dumbbell size={16} color={THEME.COLORS.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.requestName} numberOfLines={1}>{req.name}</Text>
                    <Text style={styles.requestMeta}><MapPin size={8} color={THEME.COLORS.textMuted} /> {req.location}</Text>
                    <Text style={styles.requestSub}>Applicant: {req.owner}</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    onPress={() => { approveGymRequest(req.id); Alert.alert('Request Approved', `${req.name} is now live in Gym Discovery search results!`); }}
                    style={styles.approveBtn}
                  >
                    <Check size={10} color={THEME.COLORS.success} style={{ marginRight: 4 }} />
                    <Text style={styles.approveBtnText}>Approve Partner</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => { rejectGymRequest(req.id); Alert.alert('Request Declined', `${req.name} registration request has been declined.`); }}
                    style={styles.declineBtn}
                  >
                    <X size={10} color={THEME.COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyRequests}>
              <Text style={styles.emptyRequestsIcon}>🎉</Text>
              <Text style={styles.emptyRequestsText}>Onboarding queue is completely cleared!</Text>
            </View>
          )}
        </View>
      </View>

      {/* 3. PROMOTIONAL SLIDER BANNER MANAGER */}
      <View style={styles.bannersCard}>
        <View style={styles.bannersHeader}>
          <ImageIcon size={12} color={THEME.COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.bannersTitle}>Active Ad Slider Banners</Text>
        </View>

        <View style={styles.bannersList}>
          {adminBanners.map((banner) => (
            <View key={banner.id} style={styles.bannerItem}>
              <View style={styles.bannerItemLeft}>
                <Image source={{ uri: banner.image }} style={styles.bannerImg} />
                <Text style={styles.bannerName} numberOfLines={1}>{banner.title}</Text>
              </View>

              {/* Toggle switch simulation button */}
              <TouchableOpacity 
                onPress={() => toggleBannerActive(banner.id)}
                style={[styles.switchTrack, banner.active ? styles.switchTrackActive : styles.switchTrackInactive]}
              >
                <View style={[styles.switchThumb, banner.active && styles.switchThumbActive]} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* 4. MODERATOR AUDIT LOGS */}
      <View style={styles.logsCard}>
        <Text style={styles.logsTitle}>Moderator Action Audits</Text>
        <View style={styles.logsContainer}>
          <Text style={styles.logText}>[2026-05-27 10:20] LOG_IN: Akash Kumar verified OTP successfully.</Text>
          <Text style={styles.logText}>[2026-05-27 10:22] PAY_APPROVED: Gold's Gym premium pass purchase validated.</Text>
          <Text style={styles.logText}>[2026-05-27 10:24] SYSTEM_CHECK_IN: Akash Kumar checked in at Gold's Gym.</Text>
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
  headerBlock: {
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
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
    fontWeight: '800',
    fontSize: 11,
  },
  statBoxValPrimary: {
    color: THEME.COLORS.primary,
    fontWeight: '800',
    fontSize: 11,
  },
  statBoxValSuccess: {
    color: THEME.COLORS.success,
    fontWeight: '800',
    fontSize: 11,
  },
  approvalsCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  approvalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  approvalsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  approvalsHeaderTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  pendingBadge: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    borderColor: 'rgba(229, 9, 20, 0.15)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    color: THEME.COLORS.primary,
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  approvalsList: {
    gap: 12,
  },
  requestItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 20,
    gap: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
  requestMeta: {
    color: THEME.COLORS.textSecondary,
    fontSize: 8.5,
    marginTop: 2,
  },
  requestSub: {
    color: THEME.COLORS.textMuted,
    fontSize: 8.5,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
  },
  approveBtn: {
    flex: 1,
    height: 32,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 199, 88, 0.08)',
    borderColor: 'rgba(0, 199, 88, 0.15)',
    borderWidth: 1,
  },
  approveBtnText: {
    color: THEME.COLORS.success,
    fontWeight: '800',
    fontSize: 8.5,
    textTransform: 'uppercase',
  },
  declineBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(229, 9, 20, 0.08)',
    borderColor: 'rgba(229, 9, 20, 0.15)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRequests: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyRequestsIcon: {
    fontSize: 20,
  },
  emptyRequestsText: {
    color: THEME.COLORS.textMuted,
    fontSize: 10,
    marginTop: 6,
  },
  bannersCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  bannersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  bannersTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  bannersList: {
    gap: 10,
  },
  bannerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 16,
    gap: 12,
  },
  bannerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  bannerImg: {
    width: 44,
    height: 28,
    borderRadius: 8,
    objectFit: 'cover',
  },
  bannerName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 10.5,
    flex: 1,
  },
  switchTrack: {
    width: 36,
    height: 20,
    borderRadius: 10,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: THEME.COLORS.primary,
  },
  switchTrackInactive: {
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
  logsCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    gap: 8,
  },
  logsTitle: {
    color: THEME.COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  logsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 10,
    borderRadius: 16,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    gap: 6,
  },
  logText: {
    color: THEME.COLORS.textMuted,
    fontSize: 8.5,
    fontFamily: 'monospace',
    lineHeight: 12,
  }
});
