# API Keys & External Services Setup

## 🔑 Required API Keys

### 1. Firebase Configuration
**Where to get:** [Firebase Console](https://console.firebase.google.com)

1. Create a new Firebase project
2. Go to Project Settings > General
3. Scroll down to "Your apps" section
4. Click "Add app" and select Web
5. Copy the configuration object

**Required Keys:**
- `apiKey` - Firebase API key
- `authDomain` - Project auth domain
- `projectId` - Project ID
- `storageBucket` - Storage bucket name
- `messagingSenderId` - Messaging sender ID
- `appId` - App ID

**Service Account Key:**
1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the required fields:
   - `private_key_id`
   - `private_key`
   - `client_email`
   - `client_id`

### 2. Google Maps API Key
**Where to get:** [Google Cloud Console](https://console.cloud.google.com)

1. Create a new project or select existing
2. Enable "Maps JavaScript API"
3. Go to Credentials > Create Credentials > API Key
4. Restrict the key to your domains
5. Copy the API key

**Required APIs:**
- Maps JavaScript API
- Places API (optional)
- Geocoding API (optional)

### 3. Twilio Configuration
**Where to get:** [Twilio Console](https://console.twilio.com)

1. Sign up for Twilio account
2. Get your Account SID and Auth Token from dashboard
3. For WhatsApp:
   - Request WhatsApp Business API access
   - Get approved phone number
   - Format as `whatsapp:+1234567890`

**Required Credentials:**
- `TWILIO_ACCOUNT_SID` - Your account SID
- `TWILIO_AUTH_TOKEN` - Your auth token
- `TWILIO_WHATSAPP_NUMBER` - WhatsApp business number

## 🛠️ Setup Instructions

### Step 1: Firebase Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init

# Select services:
# - Firestore
# - Functions
# - Hosting
# - Storage
```

### Step 2: Environment Files
Create these files with your API keys:

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
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
```

**Admin Dashboard `.env`:**
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
```

**Functions `.env`:**
```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890
MOCK_MESSAGING=true
```

### Step 3: Firebase Services Setup

#### Authentication
1. Go to Authentication > Sign-in method
2. Enable Email/Password
3. Configure authorized domains

#### Firestore
1. Go to Firestore Database
2. Create database in production mode
3. Deploy security rules: `firebase deploy --only firestore:rules`

#### Storage
1. Go to Storage
2. Get started with default rules
3. Update rules for production

#### Functions
1. Go to Functions
2. Deploy functions: `firebase deploy --only functions`

#### Hosting
1. Go to Hosting
2. Deploy admin dashboard: `firebase deploy --only hosting`

### Step 4: Test Configuration

#### Test Firebase Connection
```bash
# Test Firestore
firebase firestore:get /users

# Test Functions
firebase functions:log

# Test Hosting
firebase hosting:channel:list
```

#### Test Mobile App
```bash
cd mobile
npm start
# Scan QR code with Expo Go app
```

#### Test Admin Dashboard
```bash
cd admin-dashboard
npm run dev
# Open http://localhost:3000
```

## 🔒 Security Best Practices

### API Key Security
- Never commit API keys to version control
- Use environment variables
- Restrict API keys to specific domains/IPs
- Rotate keys regularly
- Monitor usage

### Firebase Security
- Use Firestore security rules
- Implement proper authentication
- Restrict storage access
- Monitor for suspicious activity

### Twilio Security
- Use environment variables
- Restrict webhook URLs
- Monitor usage and costs
- Use test credentials for development

## 🧪 Mock Mode for Development

For hackathon demos, you can use mock mode to avoid API costs:

```env
MOCK_MESSAGING=true
```

This will:
- Log messages to Firestore instead of sending them
- Skip external API calls
- Perfect for demos and testing

## 🚨 Troubleshooting

### Common Issues

**Firebase Authentication Error:**
- Check API key configuration
- Verify authorized domains
- Check Firebase project settings

**Maps Not Loading:**
- Verify Google Maps API key
- Check API restrictions
- Ensure Maps JavaScript API is enabled

**Twilio Messages Not Sending:**
- Check account credentials
- Verify phone number format
- Check account balance
- Use mock mode for testing

**Database Permission Denied:**
- Check Firestore security rules
- Verify user authentication
- Check user roles and permissions

### Debug Commands
```bash
# Check Firebase status
firebase status

# View function logs
firebase functions:log --only sendTestMessage

# Test database rules
firebase emulators:start --only firestore

# Check environment variables
echo $FIREBASE_PROJECT_ID
```

## 💰 Cost Estimation

### Firebase (Free Tier)
- Authentication: 10,000 users/month
- Firestore: 50,000 reads, 20,000 writes/day
- Storage: 1GB
- Functions: 125,000 invocations/month
- Hosting: 10GB transfer/month

### Google Maps
- $2-7 per 1,000 map loads
- Free tier: $200/month credit

### Twilio
- WhatsApp: ~$0.005 per message
- SMS: ~$0.0075 per message
- Free tier: $15 credit

### Total Estimated Cost
- **Development**: $0-50/month
- **Small Production**: $50-200/month
- **Large Scale**: $200+/month

---

## 🎯 Quick Start Checklist

- [ ] Firebase project created
- [ ] API keys obtained
- [ ] Environment files created
- [ ] Firebase services enabled
- [ ] Security rules deployed
- [ ] Test configuration
- [ ] Mock mode enabled (for demos)
- [ ] Documentation reviewed

**Ready to build! 🚀**