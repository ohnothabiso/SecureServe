# Deployment Guide

## 🚀 Production Deployment

### Prerequisites
- Firebase project with billing enabled
- Google Cloud Platform account
- Domain name (optional, for custom hosting)

### 1. Firebase Project Setup

1. **Create Firebase Project**
   ```bash
   firebase login
   firebase init
   ```

2. **Enable Services**
   - Authentication (Email/Password)
   - Firestore Database
   - Cloud Storage
   - Cloud Functions
   - Firebase Hosting

3. **Configure Security Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

### 2. Environment Configuration

Create production environment files:

**Root `.env`:**
```env
FIREBASE_PROJECT_ID=your_production_project_id
FIREBASE_PRIVATE_KEY_ID=your_production_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_production_client_email
FIREBASE_CLIENT_ID=your_production_client_id
```

**Mobile `.env`:**
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_production_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_production_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_production_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_production_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_production_messaging_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_production_app_id
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_production_google_maps_key
```

**Admin Dashboard `.env`:**
```env
VITE_FIREBASE_API_KEY=your_production_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_production_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_production_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_production_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_production_messaging_sender_id
VITE_FIREBASE_APP_ID=your_production_app_id
VITE_GOOGLE_MAPS_API_KEY=your_production_google_maps_key
```

### 3. Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 4. Deploy Admin Dashboard

```bash
cd admin-dashboard
npm install
npm run build
firebase deploy --only hosting
```

### 5. Deploy Mobile App

#### Option A: Expo Application Services (EAS)
```bash
cd mobile
npm install -g @expo/cli
expo login
expo build:android
expo build:ios
```

#### Option B: Local Build
```bash
cd mobile
expo build:android
expo build:ios
```

### 6. Database Setup

1. **Deploy Firestore Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Create Indexes**
   ```bash
   firebase deploy --only firestore:indexes
   ```

3. **Seed Production Database**
   ```bash
   cd seed
   npm install
   npm run seed
   ```

### 7. External Services Setup

#### Twilio (WhatsApp & SMS)
1. Create Twilio account
2. Get WhatsApp Business API access
3. Configure webhook URLs
4. Set environment variables

#### Google Maps
1. Create Google Cloud Project
2. Enable Maps JavaScript API
3. Create API key with restrictions
4. Set environment variables

### 8. Monitoring & Analytics

#### Firebase Analytics
- Enable in Firebase Console
- Configure custom events
- Set up conversion tracking

#### Error Monitoring
- Enable Crashlytics
- Set up alerts
- Monitor performance

### 9. Security Checklist

- [ ] Firestore rules deployed
- [ ] API keys restricted
- [ ] HTTPS enforced
- [ ] Authentication configured
- [ ] CORS settings applied
- [ ] Rate limiting enabled

### 10. Performance Optimization

#### Mobile App
- Enable code splitting
- Optimize images
- Implement caching
- Use lazy loading

#### Admin Dashboard
- Enable compression
- Use CDN
- Optimize bundle size
- Implement caching

#### Cloud Functions
- Set memory limits
- Configure timeout
- Enable retry logic
- Monitor cold starts

### 11. Backup & Recovery

#### Database Backup
```bash
# Automated daily backups
gcloud firestore export gs://your-backup-bucket/backup-$(date +%Y%m%d)
```

#### Disaster Recovery
- Document recovery procedures
- Test backup restoration
- Set up monitoring alerts
- Create runbooks

### 12. Scaling Considerations

#### Database
- Set up read replicas
- Implement caching
- Optimize queries
- Monitor performance

#### Functions
- Use regional deployment
- Implement circuit breakers
- Monitor cold starts
- Optimize memory usage

#### Storage
- Enable CDN
- Implement compression
- Set up lifecycle policies
- Monitor usage

### 13. Maintenance

#### Regular Tasks
- Update dependencies
- Monitor performance
- Review security
- Backup data
- Test disaster recovery

#### Monitoring
- Set up alerts
- Monitor logs
- Track metrics
- Review costs

### 14. Troubleshooting

#### Common Issues
- **Authentication errors**: Check API keys
- **Database errors**: Verify rules and indexes
- **Function timeouts**: Increase memory/timeout
- **Storage errors**: Check permissions
- **Map errors**: Verify API key and restrictions

#### Debug Commands
```bash
# Check Firebase status
firebase status

# View function logs
firebase functions:log

# Test database rules
firebase emulators:start --only firestore

# Check hosting
firebase hosting:channel:list
```

### 15. Cost Optimization

#### Firebase
- Monitor usage
- Set up billing alerts
- Optimize function calls
- Use appropriate storage classes

#### External Services
- Monitor API usage
- Implement caching
- Use free tiers where possible
- Set up usage alerts

---

## 🎯 Production Checklist

- [ ] Firebase project configured
- [ ] Environment variables set
- [ ] Cloud Functions deployed
- [ ] Admin dashboard deployed
- [ ] Mobile app built and distributed
- [ ] Database rules deployed
- [ ] External services configured
- [ ] Monitoring set up
- [ ] Security reviewed
- [ ] Performance optimized
- [ ] Backup configured
- [ ] Documentation updated

---

**Ready for production! 🚀**