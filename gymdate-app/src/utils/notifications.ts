import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions on device
 */
export async function registerForPushNotificationsAsync(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'GymDate Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E50914',
        sound: 'default',
      });
    }

    return true;
  } catch (error) {
    console.warn('Error configuring notifications:', error);
    return false;
  }
}

/**
 * Trigger an immediate external system notification in the phone's notification tray
 */
export async function sendLocalNotification(title: string, body: string, data: any = {}) {
  if (Platform.OS === 'web') return;

  try {
    await registerForPushNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        color: '#E50914',
      },
      trigger: null, // trigger immediately
    });
  } catch (error) {
    console.warn('Failed to send local notification:', error);
  }
}
