import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  Alert,
  PanResponder,
  Animated,
  Dimensions
} from 'react-native';
import { useGymDate, GymDateNotification } from '../../context/GymDateContext';
import { THEME } from '../../theme';
import { 
  Bell, 
  Calendar, 
  Sparkles, 
  ChevronLeft,
  CheckCircle2,
  Trash2,
  X,
  Clock,
  ShieldAlert,
  Ticket
} from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Swipeable Notification Item Component
const SwipeableNotificationItem: React.FC<{
  item: GymDateNotification;
  onDelete: (id: string) => void;
}> = ({ item, onDelete }) => {
  const pan = useState(() => new Animated.ValueXY())[0];
  const [isDismissing, setIsDismissing] = useState(false);

  const panResponder = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 15;
      },
      onPanResponderMove: (_, gestureState) => {
        pan.setValue({ x: gestureState.dx, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 100) {
          // Swipe to dismiss
          setIsDismissing(true);
          Animated.timing(pan, {
            toValue: { x: gestureState.dx > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH, y: 0 },
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDelete(item.id);
          });
        } else {
          // Snap back
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  )[0];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <Ticket size={18} color="#E50914" />;
      case 'membership':
        return <CheckCircle2 size={18} color="#00C758" />;
      default:
        return <Sparkles size={18} color="#E50914" />;
    }
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.notificationWrapper,
        {
          transform: [{ translateX: pan.x }],
        },
      ]}
    >
      <View style={[
        styles.notificationCard,
        item.unread && styles.notificationCardUnread
      ]}>
        {/* Unread red dot indicator */}
        {item.unread && <View style={styles.unreadDot} />}

        <View style={styles.iconCircle}>
          {getNotificationIcon(item.type)}
        </View>

        <View style={styles.contentBox}>
          <View style={styles.titleRow}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.timeBadge}>
              <Clock size={10} color="#9CA3AF" style={{ marginRight: 3 }} />
              <Text style={styles.itemTime}>{item.timestamp}</Text>
            </View>
          </View>
          <Text style={styles.itemMessage}>
            {item.message}
          </Text>
        </View>

        {/* Quick clear button */}
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          style={styles.deleteBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export const Notifications: React.FC = () => {
  const { 
    notifications, 
    markNotificationsAsRead, 
    deleteNotification,
    clearAllNotifications,
    setActiveScreen,
    goBack 
  } = useGymDate();

  useEffect(() => {
    markNotificationsAsRead();
  }, []);

  const handleClearAll = () => {
    if (notifications.length === 0) return;
    Alert.alert(
      'Clear All Alerts',
      'Are you sure you want to clear all notifications from your inbox?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearAllNotifications }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <TouchableOpacity 
          onPress={() => {
            if (!goBack()) setActiveScreen('home');
          }} 
          style={styles.backBtn}
        >
          <ChevronLeft size={20} color="#111827" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {notifications.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{notifications.length}</Text>
            </View>
          )}
        </View>

        {notifications.length > 0 ? (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearAllBtn}>
            <Trash2 size={15} color="#EF4444" style={{ marginRight: 4 }} />
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Swipe Hint */}
      {notifications.length > 0 && (
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>💡 Swipe left or right on any alert to clear it</Text>
        </View>
      )}

      {/* Notifications List */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={[styles.listContent, notifications.length === 0 && { flex: 1, justifyContent: 'center' }]}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <SwipeableNotificationItem 
              key={n.id} 
              item={n} 
              onDelete={deleteNotification} 
            />
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Bell size={36} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No New Notifications</Text>
            <Text style={styles.emptyText}>
              You're all caught up! Booking updates, QR passes, and alerts will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 16,
  },
  countBadge: {
    backgroundColor: '#E50914',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  clearAllText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  hintBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  hintText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  notificationWrapper: {
    width: '100%',
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  notificationCardUnread: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E50914',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  contentBox: {
    flex: 1,
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  itemTime: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '500',
  },
  itemMessage: {
    color: '#4B5563',
    fontSize: 12,
    lineHeight: 17,
  },
  deleteBtn: {
    padding: 4,
    alignSelf: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  }
});
