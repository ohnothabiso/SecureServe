# AmberSA - Community Alert System for South Africa

**AmberSA — Geo-targeted, WhatsApp-integrated community alert system for South Africa. Verified authorities can issue life-saving alerts in seconds; community members within a configurable radius receive push/WhatsApp/SMS alerts and can report sightings with geo-tagged photos. Built for low data usage and fast response. Demo-ready for hackathons.**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Firebase CLI
- Expo CLI (for mobile development)
- Android Studio / Xcode (for mobile testing)

### 1. Clone and Install
```bash
git clone <repository-url>
cd amber-sa
npm run install:all
```

### 2. Firebase Setup
1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Authentication, Firestore, Storage, and Cloud Functions
3. Download service account key and place in `functions/` directory
4. Copy `.env.example` to `.env` and fill in your Firebase credentials

### 3. Environment Variables
Create `.env` files in each directory:

**Root `.env`:**
```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
```

**Mobile `.env`:**
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Admin Dashboard `.env`:**
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Seed Database
```bash
cd seed
npm install
npm run seed
```

### 5. Run Locally

**Start Firebase Emulators:**
```bash
firebase emulators:start
```

**Start Mobile App:**
```bash
cd mobile
npm start
```

**Start Admin Dashboard:**
```bash
cd admin-dashboard
npm run dev
```

## 📱 Mobile App (React Native + Expo)

### Features
- **Authentication**: Phone OTP and email sign-in
- **Alert List**: Geo-filtered alerts within user's radius
- **Alert Details**: Full alert info with map and sightings
- **Report Sighting**: Submit sightings with photo and location
- **Push Notifications**: FCM notifications for nearby alerts
- **Offline Support**: Works with cached data

### Key Screens
- `LoginScreen`: Authentication with demo credentials
- `AlertsListScreen`: Shows nearby active alerts
- `AlertDetailScreen`: Full alert details with map
- `ReportSightingScreen`: Submit sighting reports
- `CreateAlertScreen`: Admin-only alert creation

### Demo Credentials
- **Admin**: admin@ambersa.co.za / password123
- **User**: user@ambersa.co.za / password123

## 🖥️ Admin Dashboard (React + Vite)

### Features
- **Dashboard**: Overview of alerts, users, and messages
- **Alert Management**: Create, view, and manage alerts
- **User Management**: View and verify users
- **Message Logs**: View all sent messages (mock mode)

### Pages
- `/dashboard`: Overview and statistics
- `/alerts`: Alert management
- `/alerts/create`: Create new alerts
- `/users`: User management
- `/messages`: Message logs

## 🔧 Cloud Functions (Node.js + TypeScript)

### Functions
- `onAlertCreated`: Triggers when new alert is created
  - Finds users within radius
  - Sends FCM notifications
  - Broadcasts via WhatsApp/SMS (mockable)
- `onSightingCreated`: Triggers when sighting is reported
  - Updates alert with latest sighting
  - Notifies alert creator
- `sendTestMessage`: Callable function for testing messages

### Mock Mode
Set `MOCK_MESSAGING=true` in environment to log messages instead of sending them.

## 🗄️ Database Schema (Firestore)

### Collections

**users/{uid}**
```typescript
{
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  role: 'admin' | 'user';
  verified: boolean;
  lastLocation?: { lat: number; lng: number };
  fcmTokens: string[];
  createdAt: Timestamp;
  lastUpdated: Timestamp;
}
```

**alerts/{alertId}**
```typescript
{
  alertId: string;
  title: string;
  category: 'missing_person' | 'stolen_vehicle' | 'missing_elderly';
  description: string;
  photoUrl?: string;
  lastSeen: { lat: number; lng: number };
  lastSeenAt: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
  active: boolean;
  radiusKm: number;
  notificationCount?: number;
  lastNotificationSent?: Timestamp;
}
```

**sightings/{sightingId}**
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

## 🗺️ Maps Integration

### Google Maps
- Set `GOOGLE_MAPS_API_KEY` in environment
- Uses `react-native-maps` for mobile
- Uses Google Maps JavaScript API for web

### Fallback
- OpenStreetMap tiles if no API key provided
- Static map images as last resort

## 📱 Messaging Integration

### WhatsApp (Twilio)
- Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
- Uses Twilio WhatsApp Business API

### SMS Fallback
- Same Twilio credentials
- Falls back to SMS if WhatsApp fails

### Mock Mode
- Set `MOCK_MESSAGING=true`
- Messages logged to `message_logs` collection
- Perfect for hackathon demos

## 🚀 Deployment

### Firebase Hosting (Admin Dashboard)
```bash
cd admin-dashboard
npm run build
firebase deploy --only hosting
```

### Cloud Functions
```bash
cd functions
npm run deploy
```

### Mobile App
- Use Expo Application Services (EAS) for production builds
- Or build locally with `expo build`

## 🧪 Testing & Demo

### Demo Scenario
1. **Seed Database**: Run seed script to create sample data
2. **Login as Admin**: Use admin credentials in mobile app
3. **Create Alert**: Create new alert with sample coordinates
4. **Login as User**: Use user credentials in another device
5. **Receive Notification**: User should receive FCM notification
6. **Report Sighting**: User reports sighting with photo
7. **View in Admin**: Admin sees sighting in dashboard

### Sample Data
- **Admins**: Nokuthula Dlamini, Thabo Mokgadi
- **Users**: Anele Mthethwa, Palesa Nkosi, Sipho Nkosi, Lerato Mokoena
- **Locations**: Sandton Mall, Hatfield, Observatory, Durban CBD, Soweto, Paarl

## 🔒 Security

### Firestore Rules
- Only verified admins can create alerts
- Any authenticated user can create sightings
- Users can only read their own profile
- Admin verification managed through separate collection

### Authentication
- Firebase Authentication with email/password
- Phone number verification (optional)
- Role-based access control

## 📊 Monitoring

### Analytics
- Alert creation and response rates
- User engagement metrics
- Message delivery success rates
- Geographic distribution of alerts

### Logging
- Cloud Functions logs in Firebase Console
- Message logs in Firestore
- Error tracking and debugging

## 🛠️ Development

### Project Structure
```
amber-sa/
├── mobile/                 # React Native Expo app
│   ├── src/
│   │   ├── screens/       # App screens
│   │   ├── components/    # Reusable components
│   │   └── services/      # Firebase and API services
│   └── app.json
├── admin-dashboard/        # React + Vite admin panel
│   ├── src/
│   │   ├── pages/         # Admin pages
│   │   ├── components/    # UI components
│   │   └── contexts/      # React contexts
│   └── vite.config.ts
├── functions/              # Cloud Functions
│   ├── src/
│   │   └── index.ts       # Function implementations
│   └── package.json
├── seed/                   # Database seeding
│   └── index.ts           # Seed script
├── firestore.rules         # Security rules
├── firestore.indexes.json  # Database indexes
└── firebase.json          # Firebase configuration
```

### Key Commands
```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev:mobile      # Mobile app
npm run dev:admin       # Admin dashboard
npm run dev:functions   # Cloud Functions

# Build for production
npm run build:admin     # Admin dashboard
npm run deploy:functions # Deploy functions
npm run deploy:admin    # Deploy admin dashboard

# Database operations
npm run seed            # Seed database
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For hackathon support or questions:
- Check the demo credentials above
- Ensure all environment variables are set
- Use mock mode for external API testing
- Check Firebase Console for logs

## 🎯 Hackathon Demo Tips

1. **Use Mock Mode**: Set `MOCK_MESSAGING=true` to avoid API costs
2. **Pre-seed Data**: Run seed script before demo
3. **Test Flow**: Practice the complete user journey
4. **Have Backup**: Keep screenshots of working features
5. **Explain Architecture**: Be ready to explain the tech stack

---

**Built with ❤️ for South Africa's safety and security**