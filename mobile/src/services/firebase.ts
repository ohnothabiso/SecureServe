import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import Constants from 'expo-constants';

// Firebase configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || process.env.FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.firebaseAppId || process.env.FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators in development
if (__DEV__) {
  const useEmulators = process.env.FIREBASE_USE_EMULATORS === 'true';
  
  if (useEmulators) {
    try {
      // Connect to Auth emulator
      if (!auth._delegate._config.emulator) {
        connectAuthEmulator(auth, 'http://localhost:9099');
      }
      
      // Connect to Firestore emulator
      if (!firestore._delegate._settings.host?.includes('localhost')) {
        connectFirestoreEmulator(firestore, 'localhost', 8080);
      }
      
      // Connect to Storage emulator
      if (!storage._delegate._host.includes('localhost')) {
        connectStorageEmulator(storage, 'localhost', 9199);
      }
      
      // Connect to Functions emulator
      if (!functions._delegate._url.includes('localhost')) {
        connectFunctionsEmulator(functions, 'localhost', 5001);
      }
    } catch (error) {
      console.log('Emulators already connected or not available:', error);
    }
  }
}

export default app;