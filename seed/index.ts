import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

// South African sample data
const sampleUsers = [
  // Admins
  {
    uid: 'admin_nokuthula',
    displayName: 'Nokuthula Dlamini',
    email: 'admin@ambersa.co.za',
    phone: '+27831230001',
    role: 'admin',
    verified: true,
    lastLocation: { lat: -26.2041, lng: 28.0473 }, // Johannesburg
    fcmTokens: ['mock_token_admin_1']
  },
  {
    uid: 'admin_thabo',
    displayName: 'Thabo Mokgadi',
    email: 'thabo@ambersa.co.za',
    phone: '+27831230002',
    role: 'admin',
    verified: true,
    lastLocation: { lat: -25.7479, lng: 28.2293 }, // Pretoria
    fcmTokens: ['mock_token_admin_2']
  },
  // Regular users
  {
    uid: 'user_anele',
    displayName: 'Anele Mthethwa',
    email: 'user@ambersa.co.za',
    phone: '+27831230003',
    role: 'user',
    verified: true,
    lastLocation: { lat: -26.1076, lng: 28.0567 }, // Sandton
    fcmTokens: ['mock_token_user_1']
  },
  {
    uid: 'user_palesa',
    displayName: 'Palesa Nkosi',
    email: 'palesa@ambersa.co.za',
    phone: '+27831230004',
    role: 'user',
    verified: true,
    lastLocation: { lat: -33.9258, lng: 18.4232 }, // Cape Town
    fcmTokens: ['mock_token_user_2']
  },
  {
    uid: 'user_sipho',
    displayName: 'Sipho Nkosi',
    email: 'sipho@ambersa.co.za',
    phone: '+27831230005',
    role: 'user',
    verified: true,
    lastLocation: { lat: -29.8587, lng: 31.0218 }, // Durban
    fcmTokens: ['mock_token_user_3']
  },
  {
    uid: 'user_lerato',
    displayName: 'Lerato Mokoena',
    email: 'lerato@ambersa.co.za',
    phone: '+27831230006',
    role: 'user',
    verified: true,
    lastLocation: { lat: -26.2485, lng: 27.9115 }, // Soweto
    fcmTokens: ['mock_token_user_4']
  },
  {
    uid: 'user_pieter',
    displayName: 'Pieter van der Merwe',
    email: 'pieter@ambersa.co.za',
    phone: '+27831230007',
    role: 'user',
    verified: true,
    lastLocation: { lat: -33.7414, lng: 18.9721 }, // Paarl
    fcmTokens: ['mock_token_user_5']
  },
  {
    uid: 'user_zinhle',
    displayName: 'Zinhle Khumalo',
    email: 'zinhle@ambersa.co.za',
    phone: '+27831230008',
    role: 'user',
    verified: false, // Unverified user
    lastLocation: { lat: -26.2041, lng: 28.0473 }, // Johannesburg
    fcmTokens: ['mock_token_user_6']
  }
];

const sampleAlerts = [
  {
    alertId: 'alert_001',
    title: 'Missing child — Sipho Nkosi',
    category: 'missing_person',
    description: 'Male, 9 years old, red T-shirt, blue shorts. Last seen near entrance B of Sandton Mall. Please call 10111 if seen.',
    photoUrl: 'https://via.placeholder.com/400x300/ff9800/ffffff?text=Missing+Child',
    lastSeen: { lat: -26.1076, lng: 28.0567 }, // Sandton Mall
    radiusKm: 40,
    createdBy: 'admin_nokuthula',
    active: true
  },
  {
    alertId: 'alert_002',
    title: 'Hijacked vehicle — Nissan NP200 (GP)',
    category: 'stolen_vehicle',
    description: 'White Nissan NP200, registration: GPX123GP, taken at 19:20 near Hatfield. Armed suspects. Do not approach.',
    photoUrl: 'https://via.placeholder.com/400x300/f44336/ffffff?text=Stolen+Vehicle',
    lastSeen: { lat: -25.7479, lng: 28.2293 }, // Pretoria Hatfield
    radiusKm: 60,
    createdBy: 'admin_thabo',
    active: true
  },
  {
    alertId: 'alert_003',
    title: 'Missing elderly — Maria Botha',
    category: 'missing_elderly',
    description: 'Female, 78 years old, grey hair, wearing blue cardigan and black pants. Last seen near Observatory train station. May be confused.',
    photoUrl: 'https://via.placeholder.com/400x300/9c27b0/ffffff?text=Missing+Elderly',
    lastSeen: { lat: -33.9258, lng: 18.4232 }, // Cape Town Observatory
    radiusKm: 30,
    createdBy: 'admin_nokuthula',
    active: true
  }
];

const sampleSightings = [
  {
    sightingId: 'sighting_001',
    alertId: 'alert_001',
    reportedBy: 'user_anele',
    location: { lat: -26.1100, lng: 28.0600 },
    photoUrl: 'https://via.placeholder.com/400x300/2196f3/ffffff?text=Sighting+1',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    sightingId: 'sighting_002',
    alertId: 'alert_001',
    reportedBy: 'user_palesa',
    location: { lat: -26.1050, lng: 28.0550 },
    photoUrl: 'https://via.placeholder.com/400x300/2196f3/ffffff?text=Sighting+2',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
  },
  {
    sightingId: 'sighting_003',
    alertId: 'alert_002',
    reportedBy: 'user_sipho',
    location: { lat: -25.7500, lng: 28.2300 },
    photoUrl: 'https://via.placeholder.com/400x300/2196f3/ffffff?text=Sighting+3',
    timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
  }
];

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    // Note: In production, you might want to be more selective about what to clear
    
    // Seed users
    console.log('👥 Seeding users...');
    for (const user of sampleUsers) {
      await db.collection('users').doc(user.uid).set({
        ...user,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log(`✅ Created ${sampleUsers.length} users`);

    // Seed alerts
    console.log('🚨 Seeding alerts...');
    for (const alert of sampleAlerts) {
      await db.collection('alerts').doc(alert.alertId).set({
        ...alert,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    console.log(`✅ Created ${sampleAlerts.length} alerts`);

    // Seed sightings
    console.log('👁️  Seeding sightings...');
    for (const sighting of sampleSightings) {
      await db.collection('sightings').doc(sighting.sightingId).set({
        ...sighting,
        timestamp: admin.firestore.Timestamp.fromDate(sighting.timestamp)
      });
    }
    console.log(`✅ Created ${sampleSightings.length} sightings`);

    // Create admin verification records
    console.log('✅ Creating admin verification records...');
    for (const user of sampleUsers.filter(u => u.role === 'admin')) {
      await db.collection('admin_verifications').doc(user.uid).set({
        uid: user.uid,
        approvedBy: 'system',
        approvedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Create some message logs for demo
    console.log('📱 Creating message logs...');
    const messageLogs = [
      {
        alertId: 'alert_001',
        messageType: 'broadcast',
        content: `ALERT: Missing child — Sipho Nkosi
Name: Sipho Nkosi (9)
Last seen: Sandton Mall entrance B at 14:05
Description: Red T-shirt, blue shorts
If you see this child, do NOT approach—call 10111 or use the app to report a sighting.`,
        recipients: ['+27831230003', '+27831230004', '+27831230005'],
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'sent'
      },
      {
        alertId: 'alert_002',
        messageType: 'broadcast',
        content: `ALERT: Hijacked vehicle — Nissan NP200 (GP)
Vehicle: White Nissan NP200, reg: GPX123GP
Last seen: Hatfield at 19:20
Description: Armed suspects, do not approach
If you see this vehicle, do NOT approach—call 10111 or use the app to report a sighting.`,
        recipients: ['+27831230001', '+27831230002', '+27831230006'],
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'sent'
      }
    ];

    for (const log of messageLogs) {
      await db.collection('message_logs').add(log);
    }
    console.log(`✅ Created ${messageLogs.length} message logs`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('Admin: admin@ambersa.co.za / password123');
    console.log('User: user@ambersa.co.za / password123');
    console.log('\n📱 Test Phone Numbers:');
    console.log('Admin: +27831230001, +27831230002');
    console.log('Users: +27831230003, +27831230004, +27831230005, +27831230006');
    console.log('\n🚨 Sample Alerts Created:');
    console.log('- Missing child near Sandton Mall');
    console.log('- Hijacked vehicle in Pretoria');
    console.log('- Missing elderly in Cape Town');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase().then(() => {
  console.log('✅ Seeding process completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});