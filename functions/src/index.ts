import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendBroadcastMessage } from './messaging';
import { calculateDistance, findUsersInRadius } from './geolocation';

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Types
interface Alert {
  alertId: string;
  title: string;
  category: 'missing_person' | 'stolen_vehicle' | 'missing_elderly';
  description: string;
  photoUrl: string;
  lastSeen: { lat: number; lng: number };
  lastSeenAt: admin.firestore.Timestamp;
  createdBy: string;
  createdAt: admin.firestore.Timestamp;
  active: boolean;
  radiusKm: number;
}

interface User {
  uid: string;
  displayName: string;
  phone: string;
  email: string;
  role: 'admin' | 'user';
  verified: boolean;
  lastLocation?: { lat: number; lng: number };
  fcmTokens: string[];
}

interface Sighting {
  sightingId: string;
  alertId: string;
  reportedBy: string;
  location: { lat: number; lng: number };
  photoUrl?: string;
  timestamp: admin.firestore.Timestamp;
}

/**
 * Triggered when a new alert is created
 * Sends notifications to users within the alert radius
 */
export const onAlertCreated = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snap, context) => {
    const alert = snap.data() as Alert;
    const alertId = context.params.alertId;

    console.log(`New alert created: ${alertId}`);

    try {
      // Find users within the alert radius
      const usersInRadius = await findUsersInRadius(
        alert.lastSeen,
        alert.radiusKm
      );

      console.log(`Found ${usersInRadius.length} users within ${alert.radiusKm}km radius`);

      // Send FCM notifications
      await sendFCMNotifications(alert, usersInRadius);

      // Send WhatsApp and SMS broadcasts
      await sendBroadcastMessage(alert, usersInRadius);

      // Update alert with notification count
      await snap.ref.update({
        notificationCount: usersInRadius.length,
        lastNotificationSent: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Successfully processed alert ${alertId}`);
    } catch (error) {
      console.error(`Error processing alert ${alertId}:`, error);
      // Don't throw error to avoid retries
    }
  });

/**
 * Triggered when a new sighting is reported
 * Notifies the alert creator and updates alert metadata
 */
export const onSightingCreated = functions.firestore
  .document('sightings/{sightingId}')
  .onCreate(async (snap, context) => {
    const sighting = snap.data() as Sighting;
    const sightingId = context.params.sightingId;

    console.log(`New sighting reported: ${sightingId} for alert: ${sighting.alertId}`);

    try {
      // Get the alert document
      const alertDoc = await db.collection('alerts').doc(sighting.alertId).get();
      
      if (!alertDoc.exists) {
        console.error(`Alert ${sighting.alertId} not found`);
        return;
      }

      const alert = alertDoc.data() as Alert;

      // Update alert with sighting count and last updated
      await alertDoc.ref.update({
        sightingCount: admin.firestore.FieldValue.increment(1),
        lastSightingAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });

      // Notify the alert creator (admin) about the new sighting
      await notifyAlertCreator(alert, sighting);

      console.log(`Successfully processed sighting ${sightingId}`);
    } catch (error) {
      console.error(`Error processing sighting ${sightingId}:`, error);
    }
  });

/**
 * Send FCM notifications to users within the alert radius
 */
async function sendFCMNotifications(alert: Alert, users: User[]): Promise<void> {
  const tokens: string[] = [];
  
  // Collect all FCM tokens from users in radius
  users.forEach(user => {
    if (user.fcmTokens && user.fcmTokens.length > 0) {
      tokens.push(...user.fcmTokens);
    }
  });

  if (tokens.length === 0) {
    console.log('No FCM tokens found for users in radius');
    return;
  }

  // Prepare notification payload
  const payload: admin.messaging.MulticastMessage = {
    notification: {
      title: `ALERT: ${alert.title}`,
      body: `${alert.description.substring(0, 100)}... Tap for details.`,
      imageUrl: alert.photoUrl
    },
    data: {
      type: 'alert',
      alertId: alert.alertId,
      category: alert.category,
      timestamp: alert.createdAt.toMillis().toString()
    },
    tokens: tokens,
    android: {
      priority: 'high',
      notification: {
        priority: 'high',
        defaultSound: true,
        defaultVibrateTimings: true,
        channelId: 'amber_alerts'
      }
    },
    apns: {
      payload: {
        aps: {
          alert: {
            title: `ALERT: ${alert.title}`,
            body: `${alert.description.substring(0, 100)}... Tap for details.`
          },
          badge: 1,
          sound: 'default',
          category: 'ALERT_CATEGORY'
        }
      }
    }
  };

  try {
    const response = await messaging.sendMulticast(payload);
    console.log(`Successfully sent ${response.successCount} FCM notifications`);
    console.log(`Failed notifications: ${response.failureCount}`);
    
    // Log failed tokens for cleanup
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.error(`FCM failed for token ${idx}:`, resp.error);
        }
      });
      
      // Clean up invalid tokens
      await cleanupInvalidTokens(failedTokens);
    }
  } catch (error) {
    console.error('Error sending FCM notifications:', error);
  }
}

/**
 * Notify the alert creator about a new sighting
 */
async function notifyAlertCreator(alert: Alert, sighting: Sighting): Promise<void> {
  try {
    // Get the alert creator's user document
    const userDoc = await db.collection('users').doc(alert.createdBy).get();
    
    if (!userDoc.exists) {
      console.error(`Alert creator ${alert.createdBy} not found`);
      return;
    }

    const user = userDoc.data() as User;
    
    if (!user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`No FCM tokens for alert creator ${alert.createdBy}`);
      return;
    }

    // Get the sighting reporter's name
    const reporterDoc = await db.collection('users').doc(sighting.reportedBy).get();
    const reporterName = reporterDoc.exists ? 
      (reporterDoc.data() as User).displayName : 'Anonymous';

    const payload: admin.messaging.MulticastMessage = {
      notification: {
        title: 'New Sighting Reported',
        body: `${reporterName} reported a sighting for "${alert.title}"`,
        imageUrl: sighting.photoUrl
      },
      data: {
        type: 'sighting',
        alertId: alert.alertId,
        sightingId: sighting.sightingId,
        timestamp: sighting.timestamp.toMillis().toString()
      },
      tokens: user.fcmTokens,
      android: {
        priority: 'high',
        notification: {
          priority: 'high',
          channelId: 'amber_alerts'
        }
      }
    };

    const response = await messaging.sendMulticast(payload);
    console.log(`Notified alert creator: ${response.successCount} notifications sent`);
  } catch (error) {
    console.error('Error notifying alert creator:', error);
  }
}

/**
 * Clean up invalid FCM tokens from user documents
 */
async function cleanupInvalidTokens(invalidTokens: string[]): Promise<void> {
  if (invalidTokens.length === 0) return;

  console.log(`Cleaning up ${invalidTokens.length} invalid FCM tokens`);

  // Get all users and remove invalid tokens
  const usersSnapshot = await db.collection('users').get();
  
  const batch = db.batch();
  let updateCount = 0;

  usersSnapshot.forEach(doc => {
    const user = doc.data() as User;
    if (user.fcmTokens) {
      const validTokens = user.fcmTokens.filter(token => !invalidTokens.includes(token));
      
      if (validTokens.length !== user.fcmTokens.length) {
        batch.update(doc.ref, { fcmTokens: validTokens });
        updateCount++;
      }
    }
  });

  if (updateCount > 0) {
    await batch.commit();
    console.log(`Cleaned up FCM tokens for ${updateCount} users`);
  }
}

/**
 * Callable function to manually trigger alert notifications
 * (Useful for testing and admin actions)
 */
export const triggerAlertNotifications = functions.https.onCall(async (data, context) => {
  // Verify admin authentication
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can trigger notifications');
  }

  const { alertId } = data;
  
  if (!alertId) {
    throw new functions.https.HttpsError('invalid-argument', 'alertId is required');
  }

  try {
    const alertDoc = await db.collection('alerts').doc(alertId).get();
    
    if (!alertDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Alert not found');
    }

    const alert = alertDoc.data() as Alert;
    const usersInRadius = await findUsersInRadius(alert.lastSeen, alert.radiusKm);

    await sendFCMNotifications(alert, usersInRadius);
    await sendBroadcastMessage(alert, usersInRadius);

    return {
      success: true,
      message: `Notifications sent to ${usersInRadius.length} users`,
      alertId: alertId
    };
  } catch (error) {
    console.error('Error triggering alert notifications:', error);
    throw new functions.https.HttpsError('internal', 'Failed to trigger notifications');
  }
});

/**
 * Callable function to get alert statistics
 */
export const getAlertStats = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  const { alertId } = data;
  
  if (!alertId) {
    throw new functions.https.HttpsError('invalid-argument', 'alertId is required');
  }

  try {
    const alertDoc = await db.collection('alerts').doc(alertId).get();
    
    if (!alertDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Alert not found');
    }

    // Get sighting count
    const sightingsSnapshot = await db.collection('sightings')
      .where('alertId', '==', alertId)
      .get();

    const alert = alertDoc.data() as Alert;
    
    return {
      alertId: alertId,
      title: alert.title,
      sightingCount: sightingsSnapshot.size,
      createdAt: alert.createdAt.toMillis(),
      lastSightingAt: alert.lastSightingAt?.toMillis() || null,
      activeUsersInRadius: await findUsersInRadius(alert.lastSeen, alert.radiusKm).then(users => users.length)
    };
  } catch (error) {
    console.error('Error getting alert stats:', error);
    throw new functions.https.HttpsError('internal', 'Failed to get alert statistics');
  }
});