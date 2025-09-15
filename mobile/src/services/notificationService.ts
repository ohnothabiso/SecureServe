import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getFCMToken, updateUserProfile } from './firebase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return false;
    }
    
    return true;
  } else {
    console.log('Must use physical device for Push Notifications');
    return false;
  }
};

export const registerForPushNotifications = async (userId: string): Promise<string | null> => {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    // Get FCM token
    const fcmToken = await getFCMToken();
    if (!fcmToken) return null;

    // Store token in user profile
    await updateUserProfile(userId, {
      fcmTokens: [fcmToken]
    });

    console.log('FCM Token:', fcmToken);
    return fcmToken;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

export const setupNotificationListeners = () => {
  // Handle notification received while app is in foreground
  Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });

  // Handle notification tapped
  Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    const data = response.notification.request.content.data;
    
    if (data?.type === 'alert' && data?.alertId) {
      // Navigate to alert detail screen
      // This will be handled by the navigation system
      console.log('Navigate to alert:', data.alertId);
    }
  });
};

export const scheduleLocalNotification = async (title: string, body: string, data?: any) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null, // Show immediately
  });
};