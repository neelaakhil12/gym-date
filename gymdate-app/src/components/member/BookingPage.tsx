import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert 
} from 'react-native';
import { useGymDate, Booking } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { 
  Calendar, 
  Clock, 
  Dumbbell, 
  XCircle, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react-native';

export const BookingPage: React.FC = () => {
  const { bookings, cancelBooking, addBooking, gyms, userProfile } = useGymDate();
  const [filterTab, setFilterTab] = useState<'upcoming' | 'history'>('upcoming');
  const [showBookNew, setShowBookNew] = useState(false);

  // New Booking form state
  const [selectedGymId, setSelectedGymId] = useState(gyms[0]?.id || '');
  const [sessionType, setSessionType] = useState<'workout' | 'trainer' | 'class'>('workout');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [selectedClass, setSelectedClass] = useState('Power HIIT Circuit');
  const [selectedDate, setSelectedDate] = useState('2026-05-30');
  const [selectedTime, setSelectedTime] = useState('08:00 AM');

  const times = ['06:00 AM', '08:00 AM', '10:00 AM', '04:00 PM', '06:00 PM', '08:00 PM'];
  const dates = [
    { label: 'Today', value: '2026-05-28' },
    { label: 'Tomorrow', value: '2026-05-29' },
    { label: 'Saturday', value: '2026-05-30' },
    { label: 'Sunday', value: '2026-05-31' }
  ];

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed');
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled');

  const activeGym = gyms.find(g => g.id === selectedGymId) || gyms[0];

  const handleBookingSubmit = () => {
    if (userProfile.membershipType === 'none') {
      Alert.alert('Scan Failed', 'An active membership pass is required to book slots!');
      return;
    }

    addBooking({
      gymId: selectedGymId,
      gymName: activeGym.name,
      dateTime: `${selectedDate}T${selectedTime.includes('AM') ? selectedTime.replace(' AM', ':00').padStart(5, '0') : (Number(selectedTime.replace(' PM', '').split(':')[0]) + 12) + ':00'}`,
      trainerName: sessionType === 'trainer' ? selectedTrainer || activeGym.trainers[0]?.name : undefined,
      sessionType,
      className: sessionType === 'class' ? selectedClass : undefined
    });

    setShowBookNew(false);
    Alert.alert('Slot Booked', 'Your workout session slot has been registered. View details below.');
  };

  const handleCancel = (id: string) => {
    Alert.alert(
      'Cancel Slot',
      'Are you sure you want to cancel this booking? Pass balance will be refunded.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: () => cancelBooking(id)
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
      {/* Title */}
      <View style={styles.headerBlock}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.titleText}>Bookings Calendar</Text>
            <Text style={styles.descText}>Track workout sessions & personal trainer slots.</Text>
          </View>
          {!showBookNew && (
            <TouchableOpacity 
              onPress={() => setShowBookNew(true)}
              style={styles.bookNewBtn}
            >
              <Text style={styles.bookNewBtnText}>Book Slot</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ================= VIEW 1: BOOKING CREATOR FORM ================= */}
      {showBookNew && (
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formHeaderTitle}>Configure Workout Slot</Text>
            <TouchableOpacity onPress={() => setShowBookNew(false)}>
              <Text style={styles.formHeaderCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formBody}>
            {/* Gym Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Select Partner Gym</Text>
              {/* Dropdown simulation */}
              <View style={styles.selectorGrid}>
                {gyms.map(g => (
                  <TouchableOpacity
                    key={g.id}
                    onPress={() => setSelectedGymId(g.id)}
                    style={[styles.selectorChip, selectedGymId === g.id && styles.selectorChipActive]}
                  >
                    <Text style={[styles.selectorChipText, selectedGymId === g.id && styles.selectorChipTextActive]} numberOfLines={1}>
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Type selector */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Booking Type</Text>
              <View style={styles.typeGroup}>
                {(['workout', 'trainer', 'class'] as const).map(type => (
                  <TouchableOpacity 
                    key={type}
                    onPress={() => setSessionType(type)}
                    style={[styles.typeBtn, sessionType === type && styles.typeBtnActive]}
                  >
                    <Text style={[styles.typeBtnText, sessionType === type && styles.typeBtnTextActive]}>
                      {type === 'workout' ? 'General' : type === 'trainer' ? 'Coach' : 'Class'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Dynamic Coach Selector */}
            {sessionType === 'trainer' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Pick Personal Coach</Text>
                <View style={styles.selectorGrid}>
                  {activeGym.trainers.map(t => (
                    <TouchableOpacity
                      key={t.id}
                      onPress={() => setSelectedTrainer(t.name)}
                      style={[styles.selectorChip, selectedTrainer === t.name && styles.selectorChipActive]}
                    >
                      <Text style={[styles.selectorChipText, selectedTrainer === t.name && styles.selectorChipTextActive]}>
                        {t.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Dynamic Class Selector */}
            {sessionType === 'class' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Select Scheduled Class</Text>
                <View style={styles.selectorGrid}>
                  {['Power HIIT Circuit', 'HRX Strength Conditioning', 'Ashtanga Yoga Flow', 'Zumba Cardio Dance'].map(cls => (
                    <TouchableOpacity
                      key={cls}
                      onPress={() => setSelectedClass(cls)}
                      style={[styles.selectorChip, selectedClass === cls && styles.selectorChipActive]}
                    >
                      <Text style={[styles.selectorChipText, selectedClass === cls && styles.selectorChipTextActive]}>
                        {cls.split(' ')[0]} class
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Pick Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Choose Date</Text>
              <View style={styles.dateGrid}>
                {dates.map(d => (
                  <TouchableOpacity
                    key={d.value}
                    onPress={() => setSelectedDate(d.value)}
                    style={[styles.dateChip, selectedDate === d.value && styles.dateChipActive]}
                  >
                    <Text style={[styles.dateChipText, selectedDate === d.value && styles.dateChipTextActive]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pick Time */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Choose Time Slot</Text>
              <View style={styles.timeGrid}>
                {times.map(t => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setSelectedTime(t)}
                    style={[styles.timeChip, selectedTime === t && styles.timeChipActive]}
                  >
                    <Text style={[styles.timeChipText, selectedTime === t && styles.timeChipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleBookingSubmit}>
              <Text style={styles.confirmBtnText}>Confirm Workout Slot</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ================= VIEW 2: BOOKINGS LISTING (UPCOMING VS HISTORY) ================= */}
      {!showBookNew && (
        <View style={styles.listingBlock}>
          {/* Subheader tabs */}
          <View style={styles.tabBar}>
            <TouchableOpacity 
              onPress={() => setFilterTab('upcoming')}
              style={[styles.tabItem, filterTab === 'upcoming' && styles.tabItemActive]}
            >
              <Text style={[styles.tabText, filterTab === 'upcoming' && styles.tabTextActive]}>
                Upcoming ({upcomingBookings.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setFilterTab('history')}
              style={[styles.tabItem, filterTab === 'history' && styles.tabItemActive]}
            >
              <Text style={[styles.tabText, filterTab === 'history' && styles.tabTextActive]}>
                History ({pastBookings.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cards feed */}
          <View style={styles.cardsGrid}>
            {filterTab === 'upcoming' ? (
              upcomingBookings.length > 0 ? (
                upcomingBookings.map((b) => (
                  <View key={b.id} style={styles.bookingCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={styles.iconBox}>
                          <Dumbbell size={16} color={THEME.COLORS.primary} />
                        </View>
                        <View style={{ minWidth: 0 }}>
                          <Text style={styles.gymName} numberOfLines={1}>{b.gymName}</Text>
                          <View style={styles.sessionTag}>
                            <Text style={styles.sessionTagText}>
                              {b.sessionType === 'trainer' ? `Coach: ${b.trainerName}` : b.sessionType === 'class' ? b.className : 'General Workout'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <TouchableOpacity onPress={() => handleCancel(b.id)}>
                        <XCircle size={18} color={THEME.COLORS.textMuted} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cardFooter}>
                      <View style={styles.footerItem}>
                        <Calendar size={10} color={THEME.COLORS.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.footerText}>
                          {new Date(b.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                      <View style={styles.footerItem}>
                        <Clock size={10} color={THEME.COLORS.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.footerText}>
                          {new Date(b.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>🗓️</Text>
                  <Text style={styles.emptyText}>No upcoming workout slots.</Text>
                  <TouchableOpacity onPress={() => setShowBookNew(true)}>
                    <Text style={styles.emptyLink}>Book custom slot now +</Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              pastBookings.length > 0 ? (
                pastBookings.map((b) => (
                  <View key={b.id} style={[styles.bookingCard, { opacity: 0.55 }]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <View style={styles.iconBoxMuted}>
                          <CheckCircle2 size={16} color={b.status === 'completed' ? THEME.COLORS.success : THEME.COLORS.textMuted} />
                        </View>
                        <View>
                          <Text style={styles.gymName}>{b.gymName}</Text>
                          <Text style={styles.sessionText}>
                            {b.sessionType === 'trainer' ? `Coach: ${b.trainerName}` : b.sessionType === 'class' ? b.className : 'General Workout'}
                          </Text>
                        </View>
                      </View>
                      <View style={[styles.statusTag, b.status === 'completed' ? styles.statusCompleted : styles.statusCancelled]}>
                        <Text style={[styles.statusTagText, b.status === 'completed' ? styles.statusTextCompleted : styles.statusTextCancelled]}>
                          {b.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardFooter}>
                      <Text style={styles.footerText}>{new Date(b.dateTime).toLocaleDateString()}</Text>
                      <Text style={styles.footerText}>
                        {new Date(b.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No historical logs recorded.</Text>
                </View>
              )
            )}
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
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  bookNewBtn: {
    backgroundColor: THEME.COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  bookNewBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 10,
    gap: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 8,
  },
  formHeaderTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formHeaderCancel: {
    color: THEME.COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  formBody: {
    gap: 14,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: THEME.COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectorChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
  },
  selectorChipActive: {
    backgroundColor: THEME.COLORS.primary,
    borderColor: THEME.COLORS.primary,
  },
  selectorChipText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
  selectorChipTextActive: {
    color: '#ffffff',
  },
  typeGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    padding: 3,
    borderRadius: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  typeBtnActive: {
    backgroundColor: THEME.COLORS.primary,
  },
  typeBtnText: {
    color: THEME.COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  typeBtnTextActive: {
    color: '#ffffff',
  },
  dateGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  dateChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    alignItems: 'center',
  },
  dateChipActive: {
    backgroundColor: THEME.COLORS.primary,
    borderColor: THEME.COLORS.primary,
  },
  dateChipText: {
    color: THEME.COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 9,
  },
  dateChipTextActive: {
    color: '#ffffff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeChip: {
    width: '31%',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: THEME.COLORS.primary,
    borderColor: THEME.COLORS.primary,
  },
  timeChipText: {
    color: THEME.COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 9,
  },
  timeChipTextActive: {
    color: '#ffffff',
  },
  confirmBtn: {
    backgroundColor: THEME.COLORS.primary,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: THEME.COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontFamily: 'Outfit',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listingBlock: {
    marginTop: 10,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: THEME.COLORS.primary,
  },
  tabText: {
    color: THEME.COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 11,
  },
  tabTextActive: {
    color: THEME.COLORS.primary,
  },
  cardsGrid: {
    paddingHorizontal: 20,
    gap: 12,
  },
  bookingCard: {
    backgroundColor: 'rgba(22, 23, 33, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxMuted: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymName: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
  },
  sessionTag: {
    backgroundColor: 'rgba(229, 9, 20, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  sessionTagText: {
    color: THEME.COLORS.primary,
    fontSize: 8,
    fontWeight: '700',
  },
  sessionText: {
    color: THEME.COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 10,
    gap: 16,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9,
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusCompleted: {
    backgroundColor: 'rgba(0, 199, 88, 0.12)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  statusTagText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statusTextCompleted: {
    color: THEME.COLORS.success,
  },
  statusTextCancelled: {
    color: THEME.COLORS.textMuted,
  },
  emptyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 24,
  },
  emptyText: {
    color: THEME.COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
  },
  emptyLink: {
    color: THEME.COLORS.primary,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 8,
  }
});
