# AmberSA - Amber Alert System for South Africa

**Geo-targeted, WhatsApp-integrated community alert system for South Africa. Verified authorities can issue life-saving alerts in seconds; community members within a configurable radius receive push/WhatsApp/SMS alerts and can report sightings with geo-tagged photos. Built for low data usage and fast response. Demo-ready for hackathons.**

## 🚨 Features

- **Real-time Alerts**: Verified authorities can create alerts with photos, GPS coordinates, and configurable radius
- **Geo-targeted Notifications**: Users receive alerts only if within the specified radius of the incident
- **Multi-channel Broadcasting**: Push notifications, WhatsApp, and SMS alerts via Cloud Functions
- **Sighting Reports**: Community members can report sightings with photos and GPS coordinates
- **Live Map Integration**: Real-time map showing alert locations and sighting pins
- **Admin Dashboard**: Web interface for authorities to manage alerts and verify users
- **Mock Mode**: Full demo capability without real API keys for hackathons

## 🏗️ Architecture

```
[React Native Expo App] <--> Firebase Auth/Firestore/Storage/FCM
       |                                   |
       |                                   +--> Cloud Functions (sendBroadcast)
       |                                                   |
       +--> Maps SDK (Google Maps or OSM)   <---------------+
[Admin Web Dashboard (React)]
```

## 📱 Tech Stack

- **Mobile**: React Native (Expo) + TypeScript + react-native-maps + expo-location + expo-image-picker
- **Web Admin**: React + Vite + TypeScript
- **Backend**: Firebase (Auth, Firestore, Storage, Cloud Functions, FCM)
- **Maps**: Google Maps SDK (with OpenStreetMap fallback)
- **Messaging**: Twilio (WhatsApp/SMS) with mock mode support
- **Hosting**: Firebase Hosting

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- Firebase CLI (`npm install -g firebase-tools`)
- iOS Simulator or Android Emulator (for mobile testing)

### 1. Setup Firebase Project

```bash
# Install dependencies
npm install

# Login to Firebase
firebase login

# Initialize Firebase project (select existing or create new)
firebase init

# Copy environment template
cp .env.example .env
# Edit .env with your Firebase config and API keys
```

### 2. Start Development Environment

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal - start mobile app
cd mobile
npm install
expo start

# In another terminal - start admin dashboard
cd admin-dashboard
npm install
npm run dev

# In another terminal - seed sample data
cd seed
npm install
npm run seed
```

### 3. Demo Flow

1. **Login as Admin**: Use phone number `+27831230001` (OTP: `123456`)
2. **Create Alert**: Go to Create Alert screen, add details, photo, location
3. **Receive Notification**: Login as user `+27831230003` to receive FCM notification
4. **Report Sighting**: Open alert detail, tap "Report Sighting", add photo and location
5. **View on Map**: See sighting pins appear in real-time on the map

## 🔧 Environment Variables

Create `.env` file with:

```env
# Firebase Configuration
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Twilio (optional - use mock mode for demo)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1415XXXXXXX

# Google Maps (optional - falls back to OpenStreetMap)
GOOGLE_MAPS_API_KEY=your_maps_key

# Mock Mode (set to true for hackathon demo)
MOCK_MESSAGING=true
```

## 📊 Database Schema

### Users Collection
```typescript
{
  uid: string;
  displayName: string;
  phone: string;
  email: string;
  role: "admin" | "user";
  verified: boolean;
  lastLocation?: { lat: number; lng: number };
  fcmTokens: string[];
}
```

### Alerts Collection
```typescript
{
  alertId: string;
  title: string;
  category: "missing_person" | "stolen_vehicle" | "missing_elderly";
  description: string;
  photoUrl: string;
  lastSeen: { lat: number; lng: number };
  lastSeenAt: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
  active: boolean;
  radiusKm: number;
}
```

### Sightings Collection
```typescript
{
  sightingId: string;
  alertId: string;
  reportedBy: string;
  location: { lat: number; lng: number };
  photoUrl?: string;
  timestamp: Timestamp;
}
```

## 🛡️ Security Rules

Firestore security rules ensure:
- Only verified admins can create alerts
- Any authenticated user can report sightings
- All users can read alerts and sightings
- Admin verification updates restricted to admins

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run mobile tests
cd mobile && npm test

# Run admin dashboard tests
cd admin-dashboard && npm test
```

## 🚀 Deployment

### Mobile App
```bash
cd mobile
expo build:android  # or expo build:ios
```

### Admin Dashboard
```bash
cd admin-dashboard
npm run build
firebase deploy --only hosting
```

### Cloud Functions
```bash
firebase deploy --only functions
```

## 📱 Sample Data

The seed script creates realistic South African test data:

**Admins:**
- Nokuthula Dlamini (+27831230001)
- Thabo Mokgadi (+27831230002)

**Users:**
- Anele Mthethwa (+27831230003)
- Palesa Nkosi (+27831230004)
- Sipho Nkosi (+27831230005)
- Lerato Mokoena (+27831230006)

**Sample Alerts:**
- Missing child in Sandton Mall
- Hijacked vehicle in Pretoria
- Missing elderly in Cape Town

## 🔄 Mock Mode

For hackathon demos, set `MOCK_MESSAGING=true` in your environment. This will:
- Write messages to Firestore `message_logs` collection instead of sending real WhatsApp/SMS
- Use OpenStreetMap tiles if no Google Maps API key provided
- Log all notification attempts for debugging

## 📞 Support

For hackathon support or questions:
- Check the demo script in `/seed/demo.md`
- Review the troubleshooting section in each component's README
- All mock APIs are documented in the Cloud Functions code

## 🏆 Demo Pitch (30 seconds)

"AmberSA transforms community safety through geo-targeted alerts. When a child goes missing in Sandton, every phone within 50km instantly receives a push notification with photos and exact location. Citizens can report sightings with one tap, creating a real-time crowd-sourced search network. Built for South Africa's unique challenges - low data usage, WhatsApp integration, and offline capability. Ready to deploy and save lives today."