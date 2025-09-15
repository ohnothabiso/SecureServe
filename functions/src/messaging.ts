import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

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

/**
 * Send WhatsApp and SMS broadcasts to users
 * Supports mock mode for hackathon demos
 */
export async function sendBroadcastMessage(alert: Alert, users: User[]): Promise<void> {
  const mockMode = process.env.MOCK_MESSAGING === 'true';
  
  console.log(`Sending broadcast messages for alert ${alert.alertId} to ${users.length} users (mock: ${mockMode})`);

  if (mockMode) {
    await sendMockMessages(alert, users);
  } else {
    await sendRealMessages(alert, users);
  }
}

/**
 * Send mock messages (for hackathon demo)
 */
async function sendMockMessages(alert: Alert, users: User[]): Promise<void> {
  const messageLogs = [];

  for (const user of users) {
    const whatsappMessage = generateWhatsAppMessage(alert);
    const smsMessage = generateSMSMessage(alert);

    // Log WhatsApp message
    messageLogs.push({
      userId: user.uid,
      phone: user.phone,
      platform: 'whatsapp',
      message: whatsappMessage,
      status: 'sent',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      alertId: alert.alertId
    });

    // Log SMS message
    messageLogs.push({
      userId: user.uid,
      phone: user.phone,
      platform: 'sms',
      message: smsMessage,
      status: 'sent',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      alertId: alert.alertId
    });
  }

  // Write to message_logs collection
  const batch = db.batch();
  messageLogs.forEach(log => {
    const docRef = db.collection('message_logs').doc();
    batch.set(docRef, log);
  });

  await batch.commit();
  console.log(`Mock messages logged for ${users.length} users`);
}

/**
 * Send real WhatsApp and SMS messages via Twilio
 */
async function sendRealMessages(alert: Alert, users: User[]): Promise<void> {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

  if (!twilioAccountSid || !twilioAuthToken) {
    console.error('Twilio credentials not configured');
    return;
  }

  // Import Twilio client
  const twilio = require('twilio')(twilioAccountSid, twilioAuthToken);

  const messageLogs = [];

  for (const user of users) {
    try {
      // Send WhatsApp message
      if (twilioWhatsAppNumber) {
        const whatsappMessage = generateWhatsAppMessage(alert);
        
        await twilio.messages.create({
          from: twilioWhatsAppNumber,
          to: `whatsapp:${user.phone}`,
          body: whatsappMessage
        });

        messageLogs.push({
          userId: user.uid,
          phone: user.phone,
          platform: 'whatsapp',
          message: whatsappMessage,
          status: 'sent',
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          alertId: alert.alertId
        });

        console.log(`WhatsApp sent to ${user.phone}`);
      }

      // Send SMS fallback
      const smsMessage = generateSMSMessage(alert);
      
      await twilio.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER || '+1234567890', // TODO: Configure your Twilio number
        to: user.phone,
        body: smsMessage
      });

      messageLogs.push({
        userId: user.uid,
        phone: user.phone,
        platform: 'sms',
        message: smsMessage,
        status: 'sent',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        alertId: alert.alertId
      });

      console.log(`SMS sent to ${user.phone}`);

    } catch (error) {
      console.error(`Error sending message to ${user.phone}:`, error);
      
      messageLogs.push({
        userId: user.uid,
        phone: user.phone,
        platform: 'both',
        message: 'Failed to send',
        status: 'failed',
        error: error.message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        alertId: alert.alertId
      });
    }
  }

  // Log all message attempts
  const batch = db.batch();
  messageLogs.forEach(log => {
    const docRef = db.collection('message_logs').doc();
    batch.set(docRef, log);
  });

  await batch.commit();
  console.log(`Real messages processed for ${users.length} users`);
}

/**
 * Generate WhatsApp message content
 */
function generateWhatsAppMessage(alert: Alert): string {
  const categoryEmoji = getCategoryEmoji(alert.category);
  const timeAgo = getTimeAgo(alert.createdAt);
  
  return `🚨 ${categoryEmoji} ALERT: ${alert.title}

📍 Location: ${formatLocation(alert.lastSeen)}
⏰ Reported: ${timeAgo}

📝 Description: ${alert.description}

🔍 If you see anything related to this alert:
• Do NOT approach the person/vehicle
• Call 10111 immediately
• Use the AmberSA app to report a sighting
• Share this alert with others in the area

#AmberSA #CommunitySafety #SouthAfrica`;
}

/**
 * Generate SMS message content (shorter version)
 */
function generateSMSMessage(alert: Alert): string {
  const categoryEmoji = getCategoryEmoji(alert.category);
  const timeAgo = getTimeAgo(alert.createdAt);
  
  return `🚨 ALERT: ${alert.title}
📍 ${formatLocation(alert.lastSeen)}
⏰ ${timeAgo}
📝 ${alert.description.substring(0, 100)}...
Call 10111 or use AmberSA app to report sightings.`;
}

/**
 * Get emoji for alert category
 */
function getCategoryEmoji(category: string): string {
  switch (category) {
    case 'missing_person':
      return '👶';
    case 'stolen_vehicle':
      return '🚗';
    case 'missing_elderly':
      return '👴';
    default:
      return '🚨';
  }
}

/**
 * Format location coordinates for display
 */
function formatLocation(location: { lat: number; lng: number }): string {
  // For South Africa, we can provide more meaningful location names
  // This is a simplified version - in production you'd use reverse geocoding
  
  const { lat, lng } = location;
  
  // Approximate South African city locations
  if (lat >= -26.3 && lat <= -25.7 && lng >= 27.8 && lng <= 28.4) {
    return 'Johannesburg Area';
  } else if (lat >= -25.9 && lat <= -25.6 && lng >= 28.1 && lng <= 28.4) {
    return 'Pretoria Area';
  } else if (lat >= -34.0 && lat <= -33.7 && lng >= 18.3 && lng <= 18.7) {
    return 'Cape Town Area';
  } else if (lat >= -29.9 && lat <= -29.8 && lng >= 30.9 && lng <= 31.1) {
    return 'Durban Area';
  } else {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/**
 * Get human-readable time ago string
 */
function getTimeAgo(timestamp: admin.firestore.Timestamp): string {
  const now = Date.now();
  const alertTime = timestamp.toMillis();
  const diffMinutes = Math.floor((now - alertTime) / (1000 * 60));
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  } else if (diffMinutes < 1440) { // 24 hours
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

/**
 * Callable function to resend messages for an alert
 */
export const resendAlertMessages = functions.https.onCall(async (data, context) => {
  // Verify admin authentication
  if (!context.auth || context.auth.token.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can resend messages');
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
    
    // Find users in radius (simplified - in production you'd want to be more efficient)
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => doc.data() as User);
    
    // Filter users in radius
    const usersInRadius = users.filter(user => {
      if (!user.lastLocation) return false;
      const distance = calculateDistance(alert.lastSeen, user.lastLocation);
      return distance <= alert.radiusKm;
    });

    await sendBroadcastMessage(alert, usersInRadius);

    return {
      success: true,
      message: `Messages resent to ${usersInRadius.length} users`,
      alertId: alertId
    };
  } catch (error) {
    console.error('Error resending alert messages:', error);
    throw new functions.https.HttpsError('internal', 'Failed to resend messages');
  }
});

// Import calculateDistance from geolocation module
function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);
  const lat1 = toRad(point1.lat);
  const lat2 = toRad(point2.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}