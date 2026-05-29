import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { useGymDate } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { 
  Bell, 
  Calendar, 
  Sparkles, 
  ChevronLeft,
  CheckCircle2
} from 'lucide-react-native';

export const Notifications: React.FC = () => {
  const { notifications, markNotificationsAsRead, setActiveScreen } = useGymDate();

  useEffect(() => {
    markNotificationsAsRead();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => setActiveScreen('home')} style={styles.backBtn}>
          <ChevronLeft size={16} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alerts & Messages</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* Notifications list feed */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 12 }}>
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <View 
              key={n.id} 
              style={[styles.notificationCard, n.unread && styles.notificationCardUnread]}
            >
              {n.unread && (
                <View style={styles.unreadTag} />
              )}

              <View style={styles.iconBox}>
                {n.type === 'booking' ? (
                  <Calendar size={14} color={THEME.COLORS.primary} />
                ) : n.type === 'membership' ? (
                  <CheckCircle2 size={14} color={THEME.COLORS.primary} />
                ) : (
                  <Sparkles size={14} color={THEME.COLORS.primary} />
                )}
              </View>

              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{n.title}</Text>
                  <Text style={styles.cardTime}>{n.timestamp}</Text>
                </View>
                <Text style={styles.cardMessage}>
                  {n.message}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>Your inbox is empty.</Text>
          </View>
        )}
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.COLORS.bgDark,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(12, 13, 18, 0.75)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notificationCard: {
    backgroundColor: THEME.COLORS.cardDark,
    borderColor: THEME.COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  notificationCardUnread: {
    backgroundColor: 'rgba(229, 9, 20, 0.04)',
    borderColor: 'rgba(229, 9, 20, 0.15)',
  },
  unreadTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    backgroundColor: THEME.COLORS.primary,
    borderBottomLeftRadius: 6,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 11,
    flex: 1,
  },
  cardTime: {
    color: THEME.COLORS.textMuted,
    fontSize: 8,
    marginLeft: 6,
  },
  cardMessage: {
    color: THEME.COLORS.textSecondary,
    fontSize: 9.5,
    lineHeight: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyText: {
    color: THEME.COLORS.textMuted,
    fontSize: 11,
    marginTop: 8,
  }
});
