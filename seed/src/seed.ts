import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

interface User {
  uid: string;
  displayName: string;
  phone: string;
  email: string;
  role: 'admin' | 'user';
  verified: boolean;
  lastLocation?: {
    lat: number;
    lng: number;
  };
  fcmTokens: string[];
  createdAt: admin.firestore.Timestamp;
}

interface Alert {
  alertId: string;
  title: string;
  category: 'missing_person' | 'stolen_vehicle' | 'missing_elderly';
  description: string;
  photoUrl: string;
  lastSeen: {
    lat: number;
    lng: number;
  };
  lastSeenAt: admin.firestore.Timestamp;
  createdBy: string;
  createdAt: admin.firestore.Timestamp;
  active: boolean;
  radiusKm: number;
  sightingCount?: number;
  lastSightingAt?: admin.firestore.Timestamp;
  lastUpdated?: admin.firestore.Timestamp;
}

interface Sighting {
  sightingId: string;
  alertId: string;
  reportedBy: string;
  location: {
    lat: number;
    lng: number;
  };
  photoUrl?: string;
  description?: string;
  timestamp: admin.firestore.Timestamp;
}

// South African sample data
const sampleUsers: Omit<User, 'createdAt'>[] = [
  // Admins
  {
    uid: 'admin_nokuthula',
    displayName: 'Nokuthula Dlamini',
    phone: '+27831230001',
    email: 'nokuthula.dlamini@ambersa.co.za',
    role: 'admin',
    verified: true,
    lastLocation: {
      lat: -26.2041,
      lng: 28.0473, // Johannesburg
    },
    fcmTokens: [`fcm_token_${uuidv4()}`],
  },
  {
    uid: 'admin_thabo',
    displayName: 'Thabo Mokgadi',
    phone: '+27831230002',
    email: 'thabo.mokgadi@ambersa.co.za',
    role: 'admin',
    verified: true,
    lastLocation: {
      lat: -25.7479,
      lng: 28.2293, // Pretoria
    },
    fcmTokens: [`fcm_token_${uuidv4()}`],
  },
  
  // Regular Users
  {
    uid: 'user_anele',
    displayName: 'Anele Mthethwa',
    phone: '+27831230003',
    email: 'anele.mthethwa@example.co.za',
    role: 'user',
    verified: true,
    lastLocation: {
      lat: -26.1076,
      lng: 28.0567, // Sandton
    },
    fcmTokens: [`fcm_token_${uuidv4()}`],
  },
  {
    uid: 'user_palesa',
    displayName: 'Palesa Nkosi',
    phone: '+27831230004',
    email: 'palesa.nkosi@example.co.za',
    role: 'user',
    verified: true,
    lastLocation: {
      lat: -26.2041,
      lng: 28.0473, // Johannesburg
    },
    fcmTokens: [`fcm_token_${uuidv4()}`],
  },
  {
    uid: 'user_sipho',
    displayName: 'Sipho Nkosi',
    phone: '+27831230005',
    email: 'sipho.nkosi@example.co.za',
    role: 'user',
    verified: true,
    lastLocation: {
      lat: -26.1076,
      lng: 28.0567, // Sandton
    },
    fcmTokens: [`fcm_token_${uuidv4()}`],
  },
  {
    uid: 'user_lerato',
    displayName: 'Lerato Mokoena',
    phone: '+27831230006',
    email: 'lerato.mokoena@example.co.za',
    role: 'user',
    verified: true,
    lastLocation: {
      lat: -33.9249,
      lng: 18.4241, // Cape Town
    },
    fcmTokens: [`fcm_token_${uuidv4()}`],
  },
  {
    uid: 'user_pieter',
    displayName: 'Pieter van der Merwe',
    phone: '+27831230007',
    email: 'pieter.vandermerwe@example.co.za',
    role: 'user',
    verified: true,
    lastLocation: {
      lat: -29.8587,
      lng: 31.0218, // Durban
    },
    fcmTokens: [`fcm_token_${uuidv4()}`],
  },
  {
    uid: 'user_zinhle',
    displayName: 'Zinhle Khumalo',
    phone: '+27831230008',
    email: 'zinhle.khumalo@example.co.za',
    role: 'user',
    verified: false, // Unverified user
    lastLocation: {
      lat: -25.7479,
      lng: 28.2293, // Pretoria
    },
    fcmTokens: [],
  },
];

const sampleAlerts: Omit<Alert, 'createdAt' | 'lastSeenAt'>[] = [
  {
    alertId: 'alert_001',
    title: 'Missing child — Sipho Nkosi',
    category: 'missing_person',
    description: 'Male, 9 years old, red T-shirt, blue shorts. Last seen near entrance B of Sandton Mall. If you see this child, do NOT approach—call 10111 immediately.',
    photoUrl: 'https://via.placeholder.com/400x300/e74c3c/ffffff?text=Missing+Child',
    lastSeen: {
      lat: -26.1076,
      lng: 28.0567, // Sandton Mall
    },
    createdBy: 'admin_nokuthula',
    active: true,
    radiusKm: 40,
    sightingCount: 2,
  },
  {
    alertId: 'alert_002',
    title: 'Hijacked vehicle — Nissan NP200 (GP)',
    category: 'stolen_vehicle',
    description: 'White Nissan NP200, registration: GPX123GP, taken at 19:20 near Hatfield station. Armed suspects. If spotted, do NOT approach—call 10111.',
    photoUrl: 'https://via.placeholder.com/400x300/f39c12/ffffff?text=Stolen+Vehicle',
    lastSeen: {
      lat: -25.7479,
      lng: 28.2293, // Pretoria, Hatfield
    },
    createdBy: 'admin_thabo',
    active: true,
    radiusKm: 60,
    sightingCount: 1,
  },
  {
    alertId: 'alert_003',
    title: 'Missing elderly — Maria Botha',
    category: 'missing_elderly',
    description: 'Female, 78 years old, suffering from dementia. Last seen wearing a blue cardigan and walking with a cane. Last location: Observatory, Cape Town.',
    photoUrl: 'https://via.placeholder.com/400x300/9b59b6/ffffff?text=Missing+Elderly',
    lastSeen: {
      lat: -33.9258,
      lng: 18.4232, // Cape Town, Observatory
    },
    createdBy: 'admin_nokuthula',
    active: true,
    radiusKm: 30,
    sightingCount: 0,
  },
  {
    alertId: 'alert_004',
    title: 'Missing teenager — Thandiwe Mthembu',
    category: 'missing_person',
    description: 'Female, 16 years old, last seen wearing school uniform (red blazer). Disappeared after school in Soweto. Family is very concerned.',
    photoUrl: 'https://via.placeholder.com/400x300/e74c3c/ffffff?text=Missing+Teenager',
    lastSeen: {
      lat: -26.2678,
      lng: 27.8585, // Soweto
    },
    createdBy: 'admin_thabo',
    active: false, // Resolved alert
    radiusKm: 50,
    sightingCount: 3,
  },
];

const sampleSightings: Omit<Sighting, 'timestamp'>[] = [
  {
    sightingId: 'sighting_001',
    alertId: 'alert_001',
    reportedBy: 'user_anele',
    location: {
      lat: -26.1100,
      lng: 28.0600, // Near Sandton
    },
    description: 'Saw a child matching the description near the parking garage at Sandton City',
    photoUrl: 'https://via.placeholder.com/300x200/3498db/ffffff?text=Sighting+1',
  },
  {
    sightingId: 'sighting_002',
    alertId: 'alert_001',
    reportedBy: 'user_palesa',
    location: {
      lat: -26.1050,
      lng: 28.0550, // Different location in Sandton
    },
    description: 'Possible sighting near the Gautrain station',
  },
  {
    sightingId: 'sighting_003',
    alertId: 'alert_002',
    reportedBy: 'user_sipho',
    location: {
      lat: -25.7500,
      lng: 28.2300, // Near Hatfield
    },
    description: 'White NP200 spotted on Church Street, heading towards Pretoria CBD',
    photoUrl: 'https://via.placeholder.com/300x200/3498db/ffffff?text=Sighting+3',
  },
  {
    sightingId: 'sighting_004',
    alertId: 'alert_004',
    reportedBy: 'user_lerato',
    location: {
      lat: -26.2700,
      lng: 27.8600, // Soweto
    },
    description: 'Saw someone matching the description at the local shopping center',
  },
  {
    sightingId: 'sighting_005',
    alertId: 'alert_004',
    reportedBy: 'user_pieter',
    location: {
      lat: -26.2650,
      lng: 27.8550, // Different part of Soweto
    },
    description: 'Possible sighting near the taxi rank',
  },
  {
    sightingId: 'sighting_006',
    alertId: 'alert_004',
    reportedBy: 'user_zinhle',
    location: {
      lat: -26.2600,
      lng: 27.8500, // Another location in Soweto
    },
    description: 'Saw a girl in red blazer getting into a taxi',
  },
];

async function seedUsers() {
  console.log('🌱 Seeding users...');
  
  const now = admin.firestore.Timestamp.now();
  
  for (const userData of sampleUsers) {
    const user: User = {
      ...userData,
      createdAt: now,
    };
    
    await db.collection('users').doc(user.uid).set(user);
    console.log(`✅ Created user: ${user.displayName} (${user.role})`);
  }
  
  console.log(`✅ Created ${sampleUsers.length} users`);
}

async function seedAlerts() {
  console.log('🌱 Seeding alerts...');
  
  const now = admin.firestore.Timestamp.now();
  
  for (const alertData of sampleAlerts) {
    const alert: Alert = {
      ...alertData,
      createdAt: now,
      lastSeenAt: now,
      lastUpdated: alertData.sightingCount && alertData.sightingCount > 0 ? now : undefined,
    };
    
    await db.collection('alerts').doc(alert.alertId).set(alert);
    console.log(`✅ Created alert: ${alert.title}`);
  }
  
  console.log(`✅ Created ${sampleAlerts.length} alerts`);
}

async function seedSightings() {
  console.log('🌱 Seeding sightings...');
  
  const now = admin.firestore.Timestamp.now();
  
  for (const sightingData of sampleSightings) {
    const sighting: Sighting = {
      ...sightingData,
      timestamp: now,
    };
    
    await db.collection('sightings').doc(sighting.sightingId).set(sighting);
    console.log(`✅ Created sighting: ${sighting.sightingId} for alert ${sighting.alertId}`);
  }
  
  console.log(`✅ Created ${sampleSightings.length} sightings`);
}

async function seedMessageLogs() {
  console.log('🌱 Seeding message logs...');
  
  const now = admin.firestore.Timestamp.now();
  
  // Create sample message logs for each alert
  for (const alert of sampleAlerts) {
    // Find users who would have received notifications (within radius)
    const usersInRadius = sampleUsers.filter(user => {
      if (!user.lastLocation) return false;
      
      // Simple distance calculation (not precise, but good for demo)
      const distance = Math.sqrt(
        Math.pow(user.lastLocation.lat - alert.lastSeen.lat, 2) +
        Math.pow(user.lastLocation.lng - alert.lastSeen.lng, 2)
      ) * 111; // Rough conversion to km
      
      return distance <= alert.radiusKm;
    });
    
    // Create message logs for each user in radius
    for (const user of usersInRadius) {
      // WhatsApp message
      await db.collection('message_logs').add({
        userId: user.uid,
        phone: user.phone,
        platform: 'whatsapp',
        message: `🚨 ALERT: ${alert.title}\n\n📍 Location: ${getLocationName(alert.lastSeen)}\n\n📝 Description: ${alert.description.substring(0, 200)}...\n\n🔍 If you see anything related to this alert:\n• Do NOT approach\n• Call 10111 immediately\n• Use AmberSA app to report sightings`,
        status: 'sent',
        timestamp: now,
        alertId: alert.alertId,
      });
      
      // SMS message
      await db.collection('message_logs').add({
        userId: user.uid,
        phone: user.phone,
        platform: 'sms',
        message: `🚨 ALERT: ${alert.title}\n📍 ${getLocationName(alert.lastSeen)}\n📝 ${alert.description.substring(0, 100)}...\nCall 10111 or use AmberSA app to report sightings.`,
        status: 'sent',
        timestamp: now,
        alertId: alert.alertId,
      });
    }
  }
  
  console.log('✅ Created message logs');
}

function getLocationName(location: { lat: number; lng: number }): string {
  const { lat, lng } = location;
  
  if (lat >= -26.3 && lat <= -25.7 && lng >= 27.8 && lng <= 28.4) {
    return 'Johannesburg Area';
  } else if (lat >= -25.9 && lat <= -25.6 && lng >= 28.1 && lng <= 28.4) {
    return 'Pretoria Area';
  } else if (lat >= -34.0 && lat <= -33.7 && lng >= 18.3 && lng <= 18.7) {
    return 'Cape Town Area';
  } else if (lat >= -29.9 && lat <= -29.8 && lng >= 30.9 && lng <= 31.1) {
    return 'Durban Area';
  } else {
    return 'Unknown Location';
  }
}

async function clearExistingData() {
  console.log('🧹 Clearing existing data...');
  
  const collections = ['users', 'alerts', 'sightings', 'message_logs'];
  
  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();
    
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`🗑️ Cleared ${snapshot.size} documents from ${collectionName}`);
  }
}

async function main() {
  try {
    console.log('🚀 Starting AmberSA seed script...');
    console.log(`📊 Project: ${process.env.FIREBASE_PROJECT_ID}`);
    
    // Clear existing data
    await clearExistingData();
    
    // Seed data
    await seedUsers();
    await seedAlerts();
    await seedSightings();
    await seedMessageLogs();
    
    console.log('\n🎉 Seed script completed successfully!');
    console.log('\n📱 Demo Login Credentials:');
    console.log('Admin (Mobile): +27831230001 (OTP: 123456)');
    console.log('Admin (Mobile): +27831230002 (OTP: 123456)');
    console.log('User (Mobile): +27831230003 (OTP: 123456)');
    console.log('\n💻 Admin Dashboard:');
    console.log('Email: admin@ambersa.co.za');
    console.log('Password: admin123');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Start Firebase emulators: firebase emulators:start');
    console.log('2. Start mobile app: cd mobile && expo start');
    console.log('3. Start admin dashboard: cd admin-dashboard && npm run dev');
    console.log('4. Login and test the full flow!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the seed script
main();