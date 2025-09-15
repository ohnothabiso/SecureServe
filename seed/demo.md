# AmberSA Demo Script

This document provides a step-by-step guide for demonstrating the AmberSA system during a hackathon or presentation.

## Pre-Demo Setup

1. **Start Firebase Emulators**
   ```bash
   firebase emulators:start
   ```

2. **Seed Sample Data**
   ```bash
   cd seed
   npm run seed
   ```

3. **Start Mobile App**
   ```bash
   cd mobile
   expo start
   ```

4. **Start Admin Dashboard**
   ```bash
   cd admin-dashboard
   npm run dev
   ```

## Demo Flow (10 minutes)

### 1. Admin Dashboard Demo (3 minutes)

**URL**: http://localhost:3000

**Login Credentials**:
- Email: `admin@ambersa.co.za`
- Password: `admin123`

**Demonstration Points**:
- Show dashboard with system statistics
- Navigate to "Alerts" to see existing alerts
- Navigate to "Users" to show user management
- Navigate to "Message Logs" to show WhatsApp/SMS logs (mock mode)
- Create a new alert using "Create Alert"

### 2. Mobile App Demo (5 minutes)

**Login Options**:
- Admin: `+27831230001` (OTP: `123456`)
- User: `+27831230003` (OTP: `123456`)

**Demonstration Points**:

**As Admin User**:
- Show alerts list with geo-filtering
- Create a new alert (if not done in web dashboard)
- Show alert detail with map and sightings

**As Regular User**:
- Show alerts list (filtered by location)
- Open alert detail
- Report a sighting with photo and location
- Show how sightings appear on the map in real-time

### 3. Real-time Features Demo (2 minutes)

**Cross-Platform Demonstration**:
- Create alert in admin dashboard
- Show how it appears immediately in mobile app
- Report sighting in mobile app
- Show how it appears in admin dashboard
- Show message logs with mock WhatsApp/SMS content

## Key Features to Highlight

### 🚨 Geo-Targeted Alerts
- Alerts only sent to users within specified radius
- Real-time location-based filtering
- Efficient notification delivery

### 📱 Multi-Channel Messaging
- Push notifications via FCM
- WhatsApp integration (mock mode for demo)
- SMS fallback (mock mode for demo)
- Message delivery tracking

### 🗺️ Real-Time Mapping
- Live alert locations
- Sighting reports with GPS coordinates
- Clustered map view for better performance

### 🔐 Security & Verification
- Role-based access control
- Admin verification system
- Secure Firestore rules
- User permission management

### 📊 Analytics & Monitoring
- Real-time dashboard statistics
- Message delivery tracking
- User engagement metrics
- Alert performance monitoring

## Technical Highlights

### Architecture
- **Frontend**: React Native (Expo) + React (Vite)
- **Backend**: Firebase (Auth, Firestore, Functions, Storage)
- **Real-time**: Firestore listeners + FCM
- **Maps**: Google Maps SDK with OpenStreetMap fallback
- **Messaging**: Twilio integration with mock mode

### Scalability Features
- Cloud Functions for serverless processing
- Firestore for real-time data synchronization
- Efficient geospatial queries
- Offline-capable mobile app
- Progressive Web App (PWA) ready

### South African Context
- Local phone number formats
- South African city recognition
- Emergency number integration (10111)
- Localized alert content
- Cultural sensitivity in messaging

## Demo Troubleshooting

### Common Issues

**Firebase Emulators Not Starting**:
```bash
# Kill existing processes
pkill -f firebase
# Restart emulators
firebase emulators:start
```

**Mobile App Not Connecting**:
- Ensure emulators are running
- Check that mobile device/emulator is on same network
- Verify Firebase configuration in mobile app

**Admin Dashboard Not Loading**:
- Check that Vite dev server is running on port 3000
- Verify Firebase configuration in admin dashboard
- Check browser console for errors

### Mock Mode Features

**Message Logs**: All WhatsApp/SMS messages are logged to Firestore instead of being sent
**Location**: Uses OpenStreetMap tiles if Google Maps API key is not provided
**Authentication**: Demo accounts are pre-seeded with known credentials

## Post-Demo Q&A

### Common Questions

**Q: How does this scale to real production?**
A: The system is built on Firebase which automatically scales. Cloud Functions handle the heavy lifting, and Firestore provides real-time sync across unlimited devices.

**Q: What about data privacy?**
A: All data is encrypted in transit and at rest. Location data is only stored when users opt-in, and we follow GDPR principles for data handling.

**Q: How accurate is the geo-targeting?**
A: Uses Haversine formula for distance calculation with configurable radius. In production, you'd integrate with reverse geocoding services for better accuracy.

**Q: Can this work offline?**
A: Yes, the mobile app caches alerts and can work offline. Sightings are queued and synced when connectivity is restored.

**Q: What's the cost model?**
A: Firebase has generous free tiers. For a medium-sized city, costs would be minimal. WhatsApp/SMS costs depend on volume but are typically very affordable.

## Success Metrics

- **Demo Completion Time**: 10 minutes
- **User Engagement**: Real-time interaction between admin and users
- **Technical Impressiveness**: Full-stack real-time system
- **Practical Value**: Addresses real community safety needs
- **Scalability**: Built for production deployment

## Next Steps for Production

1. **Real API Integration**: Replace mock messaging with actual Twilio/Meta APIs
2. **Enhanced Security**: Implement proper admin verification workflow
3. **Analytics**: Add comprehensive reporting and analytics
4. **Multi-language**: Add support for local languages
5. **Integration**: Connect with existing emergency services systems