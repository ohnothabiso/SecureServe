import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as twilio from 'twilio';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Initialize Twilio (only if credentials are provided)
let twilioClient: twilio.Twilio | null = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Haversine formula to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Get users within radius of alert location
async function getUsersWithinRadius(alertLat: number, alertLon: number, radiusKm: number): Promise<admin.firestore.DocumentData[]> {
  const usersSnapshot = await db.collection('users').get();
  const usersWithinRadius: admin.firestore.DocumentData[] = [];
  
  usersSnapshot.forEach(doc => {
    const userData = doc.data();
    if (userData.lastLocation && userData.lastLocation.lat && userData.lastLocation.lng) {
      const distance = calculateDistance(
        alertLat, 
        alertLon, 
        userData.lastLocation.lat, 
        userData.lastLocation.lng
      );
      
      if (distance <= radiusKm) {
        usersWithinRadius.push({
          uid: doc.id,
          ...userData
        });
      }
    }
  });
  
  return usersWithinRadius;
}

// Send FCM notification
async function sendFCMNotification(userTokens: string[], alert: any): Promise<void> {
  if (userTokens.length === 0) return;
  
  const message = {
    notification: {
      title: `ALERT: ${alert.title}`,
      body: `${alert.description.substring(0, 100)}... Tap for details.`,
      imageUrl: alert.photoUrl
    },
    data: {
      type: 'alert',
      alertId: alert.alertId,
      category: alert.category
    },
    tokens: userTokens
  };
  
  try {
    const response = await messaging.sendMulticast(message);
    console.log(`FCM sent to ${response.successCount} devices, ${response.failureCount} failed`);
  } catch (error) {
    console.error('Error sending FCM:', error);
  }
}

// Send WhatsApp and SMS broadcast
async function sendWhatsAppAndSMSBroadcast(alert: any, recipients: admin.firestore.DocumentData[]): Promise<void> {
  const messageContent = `ALERT: ${alert.title}
Name: ${alert.description.split('—')[1]?.trim() || 'Unknown'}
Last seen: ${new Date(alert.lastSeenAt.toDate()).toLocaleString('en-ZA')}
Description: ${alert.description}
If you see this person/vehicle, do NOT approach—call 10111 or use the app to report a sighting.`;

  if (process.env.MOCK_MESSAGING === 'true') {
    // Mock mode - store in message_logs collection
    const logEntry = {
      alertId: alert.alertId,
      messageType: 'broadcast',
      content: messageContent,
      recipients: recipients.map(r => r.phone).filter(Boolean),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'sent'
    };
    
    await db.collection('message_logs').add(logEntry);
    console.log('Mock message logged to Firestore');
    return;
  }
  
  // Real mode - send via Twilio
  if (!twilioClient) {
    console.log('Twilio not configured, skipping real messaging');
    return;
  }
  
  const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  if (!whatsappNumber) {
    console.log('WhatsApp number not configured');
    return;
  }
  
  // Send WhatsApp messages
  for (const recipient of recipients) {
    if (recipient.phone) {
      try {
        await twilioClient.messages.create({
          from: whatsappNumber,
          to: `whatsapp:${recipient.phone}`,
          body: messageContent
        });
        console.log(`WhatsApp sent to ${recipient.phone}`);
      } catch (error) {
        console.error(`Error sending WhatsApp to ${recipient.phone}:`, error);
      }
    }
  }
}

// Cloud Function: Triggered when a new alert is created
export const onAlertCreated = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snap, context) => {
    const alert = snap.data();
    const alertId = context.params.alertId;
    
    console.log(`New alert created: ${alertId}`);
    
    try {
      // Get users within radius
      const usersWithinRadius = await getUsersWithinRadius(
        alert.lastSeen.lat,
        alert.lastSeen.lng,
        alert.radiusKm || 50
      );
      
      console.log(`Found ${usersWithinRadius.length} users within ${alert.radiusKm || 50}km`);
      
      // Collect FCM tokens
      const allTokens: string[] = [];
      usersWithinRadius.forEach(user => {
        if (user.fcmTokens && Array.isArray(user.fcmTokens)) {
          allTokens.push(...user.fcmTokens);
        }
      });
      
      // Send FCM notifications
      if (allTokens.length > 0) {
        await sendFCMNotification(allTokens, alert);
      }
      
      // Send WhatsApp and SMS broadcast
      await sendWhatsAppAndSMSBroadcast(alert, usersWithinRadius);
      
      // Update alert with notification count
      await snap.ref.update({
        notificationCount: usersWithinRadius.length,
        lastNotificationSent: admin.firestore.FieldValue.serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error processing alert:', error);
    }
  });

// Cloud Function: Triggered when a new sighting is created
export const onSightingCreated = functions.firestore
  .document('sightings/{sightingId}')
  .onCreate(async (snap, context) => {
    const sighting = snap.data();
    const sightingId = context.params.sightingId;
    
    console.log(`New sighting created: ${sightingId} for alert: ${sighting.alertId}`);
    
    try {
      // Update the alert with last sighting info
      const alertRef = db.collection('alerts').doc(sighting.alertId);
      await alertRef.update({
        lastSightingAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSightingLocation: sighting.location,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Notify the alert creator (admin) about the new sighting
      const alertDoc = await alertRef.get();
      if (alertDoc.exists) {
        const alertData = alertDoc.data();
        const adminUser = await db.collection('users').doc(alertData!.createdBy).get();
        
        if (adminUser.exists) {
          const adminData = adminUser.data();
          if (adminData!.fcmTokens && adminData!.fcmTokens.length > 0) {
            const notification = {
              notification: {
                title: 'New Sighting Reported',
                body: `A sighting has been reported for alert: ${alertData!.title}`,
              },
              data: {
                type: 'sighting',
                alertId: sighting.alertId,
                sightingId: sightingId
              },
              tokens: adminData!.fcmTokens
            };
            
            await messaging.sendMulticast(notification);
            console.log('Admin notified about new sighting');
          }
        }
      }
      
    } catch (error) {
      console.error('Error processing sighting:', error);
    }
  });

// Callable function to send test message
export const sendTestMessage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }
  
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userData = userDoc.data();
  
  if (!userData || userData.role !== 'admin' || !userData.verified) {
    throw new functions.https.HttpsError('permission-denied', 'Only verified admins can send test messages');
  }
  
  const { message, phoneNumber } = data;
  
  if (process.env.MOCK_MESSAGING === 'true') {
    const logEntry = {
      messageType: 'test',
      content: message,
      recipients: [phoneNumber],
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'sent',
      sentBy: context.auth.uid
    };
    
    await db.collection('message_logs').add(logEntry);
    return { success: true, message: 'Test message logged (mock mode)' };
  }
  
  if (!twilioClient) {
    throw new functions.https.HttpsError('failed-precondition', 'Twilio not configured');
  }
  
  try {
    await twilioClient.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${phoneNumber}`,
      body: message
    });
    
    return { success: true, message: 'Test message sent successfully' };
  } catch (error) {
    console.error('Error sending test message:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send test message');
  }
});