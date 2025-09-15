import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { auth, firestore } from './firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

class NotificationService {
  private expoPushToken: string | null = null;

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('amber-alerts', {
        name: 'Amber Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#e74c3c',
        sound: 'default',
      });
    }

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

    try {
      this.expoPushToken = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo push token:', this.expoPushToken);
      return true;
    } catch (error) {
      console.error('Error getting push token:', error);
      return false;
    }
  }

  async registerToken(userId: string): Promise<void> {
    if (!this.expoPushToken) {
      console.log('No push token available');
      return;
    }

    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(this.expoPushToken)
      });
      console.log('FCM token registered for user:', userId);
    } catch (error) {
      console.error('Error registering FCM token:', error);
    }
  }

  async unregisterToken(userId: string): Promise<void> {
    if (!this.expoPushToken) {
      return;
    }

    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayRemove(this.expoPushToken)
      });
      console.log('FCM token unregistered for user:', userId);
    } catch (error) {
      console.error('Error unregistering FCM token:', error);
    }
  }

  async scheduleLocalNotification(title: string, body: string, data?: any): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Show immediately
    });
  }

  getPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();