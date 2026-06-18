import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Image, 
  Alert 
} from 'react-native';
import { useGymDate } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { 
  QrCode, 
  DollarSign, 
  Users, 
  Clock, 
  Check, 
  AlertCircle,
  UserCheck,
  MapPin
} from 'lucide-react-native';

export const OwnerDashboard: React.FC = () => {
  const { ownerProfile, checkInUserByQR, gyms, userProfile, setCurrentRole } = useGymDate();
  
  const [terminalInput, setTerminalInput] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; memberName?: string } | null>(null);
  
  const myGym = gyms.find(g => g.name === ownerProfile.gymName) || gyms[0];

  const handleTerminalScan = () => {
    if (!terminalInput.trim()) return;

    const res = checkInUserByQR(terminalInput);
    setScanResult(res);

    if (res.success) {
      setTerminalInput('');
    }
  };

  const handleSelectDemoCode = (code: string) => {
    setTerminalInput(code);
    setScanResult(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 20 }}>
      {/* Title */}
      <View style={styles.headerBlock}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.titleText}>Owner Dashboard</Text>
          <TouchableOpacity onPress={() => setCurrentRole('member')}>
            <Text style={{ color: THEME.COLORS.primary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>← Return</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.descText}>Manage checkins, bookings, and revenue metrics.</Text>
      </View>

      {/* 1. OPERATIONAL BUSINESS STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Total Earnings</Text>
          <Text style={styles.statBoxValSuccess}>₹{ownerProfile.revenue.toLocaleString()}</Text>
          <Text style={styles.statBoxSub}>₹{ownerProfile.payoutPending.toLocaleString()} pending payout</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>Active Subscribers</Text>
          <Text style={styles.statBoxVal}>{ownerProfile.activeMembers} members</Text>
          <Text style={styles.statBoxSubPrimary}>● Live checkin terminal active</Text>
        </View>
      </View>

      {/* 2. QR SCANNER TERMINAL */}
      <View style={styles.terminalCard}>
        <View style={styles.terminalHeader}>
          <QrCode size={14} color={THEME.COLORS.primary} style={{ marginRight: 6 }} />
          <Text style={styles.terminalHeaderTitle}>Member Check-In Terminal</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Scan or Enter Member QR Code</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              value={terminalInput}
              onChangeText={(val) => { setTerminalInput(val); setScanResult(null); }}
              placeholder="e.g. GD-MEMBER-9988-77"
              placeholderTextColor={THEME.COLORS.textMuted}
              style={styles.textInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity 
              onPress={handleTerminalScan}
              style={styles.validateBtn}
            >
              <Text style={styles.validateBtnText}>Validate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Demo Fast Selector Helper */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Developer Demo Codes</Text>
          <View style={styles.chipsGrid}>
            <TouchableOpacity 
              onPress={() => handleSelectDemoCode(userProfile.qrCodeValue)}
              style={styles.demoChip}
            >
              <Text style={styles.demoChipText}>Akhil's active QR</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleSelectDemoCode('GD-MEMBER-GUEST')}
              style={styles.demoChip}
            >
              <Text style={styles.demoChipText}>Guest active QR</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleSelectDemoCode('GD-INVALID-CODE')}
              style={styles.demoChip}
            >
              <Text style={styles.demoChipText}>Invalid QR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scan Status results */}
        {scanResult && (
          <View style={[styles.resultCard, scanResult.success ? styles.resultCardSuccess : styles.resultCardError]}>
            {scanResult.success ? (
              <UserCheck size={16} color={THEME.COLORS.success} style={{ marginRight: 10, marginTop: 2 }} />
            ) : (
              <AlertCircle size={16} color={THEME.COLORS.primary} style={{ marginRight: 10, marginTop: 2 }} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.resultTitle}>
                {scanResult.success ? `Scan Approved: ${scanResult.memberName}` : 'Scan Denied'}
              </Text>
              <Text style={styles.resultDesc}>{scanResult.message}</Text>
            </View>
          </View>
        )}
      </View>

      {/* 3. REGISTERED GYM PARTNER OVERVIEW */}
      <View style={styles.partnerCard}>
        <View style={styles.partnerHeader}>
          <Text style={styles.partnerHeaderTitle}>Active Partner Profile</Text>
          <View style={styles.approvedBadge}>
            <Text style={styles.approvedBadgeText}>Approved</Text>
          </View>
        </View>

        <View style={styles.partnerRow}>
          <Image source={{ uri: myGym.image }} style={styles.partnerImg} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.partnerName} numberOfLines={1}>{myGym.name}</Text>
            <Text style={styles.partnerMeta}><MapPin size={9} color={THEME.COLORS.primary} /> {myGym.location}</Text>
            <Text style={styles.partnerMeta}><Clock size={9} color={THEME.COLORS.primary} /> {myGym.timings}</Text>
          </View>
        </View>

        <View style={styles.amenitiesSection}>
          <Text style={styles.amenitiesLabel}>Amenity Flags</Text>
          <View style={styles.amenitiesGrid}>
            {myGym.facilities.map((fac, idx) => (
              <View key={idx} style={styles.amenityChip}>
                <Check size={10} color={THEME.COLORS.success} style={{ marginRight: 4 }} />
                <Text style={styles.amenityChipText}>{fac.split(' ')[0]}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 4. REVENUE TRAFFIC CHARTS */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Weekly Entry Traffic</Text>
        
        <View style={styles.chartBlock}>
          {[
            { day: 'Mon', val: '40%' },
            { day: 'Tue', val: '65%' },
            { day: 'Wed', val: '90%' },
            { day: 'Thu', val: '50%' },
            { day: 'Fri', val: '75%' },
            { day: 'Sat', val: '95%' },
            { day: 'Sun', val: '30%' }
          ].map((bar, i) => (
            <View key={i} style={styles.chartColumn}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: bar.val as any }]} />
              </View>
              <Text style={styles.xAxisText}>{bar.day}</Text>
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
  headerBlock: {
    paddingTop: 16,
    paddingBottom: 6,
  },
  titleText: {
    color: '#ffffff',
    
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
    gap: 12,
    marginTop: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 14,
    justifyContent: 'space-between',
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
    fontSize: 13,
  },
  statBoxValSuccess: {
    color: THEME.COLORS.success,
    fontWeight: '900',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  statBoxSub: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9,
    marginTop: 4,
  },
  statBoxSubPrimary: {
    color: THEME.COLORS.primary,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
  },
  terminalCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    gap: 14,
  },
  terminalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  terminalHeaderTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    color: '#ffffff',
    fontSize: 12,
  },
  validateBtn: {
    backgroundColor: THEME.COLORS.primary,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  validateBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  demoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    padding: 12,
    borderRadius: 16,
    gap: 8,
  },
  demoTitle: {
    fontSize: 8,
    fontWeight: '700',
    color: THEME.COLORS.textMuted,
    textTransform: 'uppercase',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  demoChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
  },
  demoChipText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontFamily: 'monospace',
  },
  resultCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  resultCardSuccess: {
    backgroundColor: 'rgba(0, 199, 88, 0.08)',
    borderColor: 'rgba(0, 199, 88, 0.2)',
  },
  resultCardError: {
    backgroundColor: 'rgba(229, 9, 20, 0.08)',
    borderColor: 'rgba(229, 9, 20, 0.2)',
  },
  resultTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
  resultDesc: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9,
    lineHeight: 13,
    marginTop: 2,
  },
  partnerCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  partnerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  partnerHeaderTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  approvedBadge: {
    backgroundColor: 'rgba(0, 199, 88, 0.12)',
    borderColor: 'rgba(0, 199, 88, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  approvedBadgeText: {
    color: THEME.COLORS.success,
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerImg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    objectFit: 'cover',
  },
  partnerName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  partnerMeta: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9,
    marginTop: 2,
  },
  amenitiesSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
    gap: 6,
  },
  amenitiesLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: THEME.COLORS.textMuted,
    textTransform: 'uppercase',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amenityChipText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 8.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  chartCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  chartTitle: {
    color: THEME.COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  chartBlock: {
    height: 90,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 16,
    padding: 10,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
  },
  chartColumn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  barTrack: {
    width: 6,
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 3,
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    backgroundColor: THEME.COLORS.primary,
    borderRadius: 3,
  },
  xAxisText: {
    color: THEME.COLORS.textMuted,
    fontSize: 7,
    fontWeight: '700',
  }
});
