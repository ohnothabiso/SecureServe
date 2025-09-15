# AmberSA Quick Start Guide

Get AmberSA running locally in 5 minutes for hackathon demos.

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g @expo/cli`
- Firebase CLI: `npm install -g firebase-tools`

## 1. Setup (2 minutes)

```bash
# Clone and install dependencies
git clone <repository-url>
cd amber-sa

# Install all dependencies
npm run install:all

# Copy environment file
cp .env.example .env
# Edit .env with your Firebase project details (optional for demo)
```

## 2. Start Services (2 minutes)

```bash
# Terminal 1: Start Firebase emulators
npm run start:emulators

# Terminal 2: Seed sample data
npm run seed

# Terminal 3: Start mobile app
npm run start:mobile

# Terminal 4: Start admin dashboard
npm run start:admin
```

## 3. Demo (1 minute)

### Mobile App (Expo Go)
- Open Expo Go on your phone
- Scan QR code from terminal
- Login: `+27831230001` (OTP: `123456`)

### Admin Dashboard
- Open: http://localhost:3000
- Login: `admin@ambersa.co.za` / `admin123`

## Demo Flow

1. **Admin**: Create alert in dashboard
2. **User**: See alert in mobile app
3. **User**: Report sighting with photo
4. **Admin**: See sighting in real-time

## Troubleshooting

**Port conflicts?**
- Firebase emulators: Change ports in `firebase.json`
- Admin dashboard: Change port in `admin-dashboard/vite.config.ts`

**Mobile app not connecting?**
- Ensure emulators are running
- Check network connectivity
- Use tunnel mode: `expo start --tunnel`

**No data showing?**
- Run seed script: `npm run seed`
- Check Firebase emulator UI: http://localhost:4000

## Key Features

✅ **Geo-targeted alerts** - Users only see relevant alerts  
✅ **Real-time updates** - Instant sync across devices  
✅ **Multi-channel messaging** - Push + WhatsApp + SMS  
✅ **Admin dashboard** - Full management interface  
✅ **Mock mode** - Works without real API keys  

## Production Deployment

See main README.md for full deployment instructions to Firebase Hosting and Cloud Functions.

---

**Need help?** Check the full README.md or demo.md for detailed instructions.