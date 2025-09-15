import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Connect to emulators in development
if (import.meta.env.DEV) {
  const useEmulators = import.meta.env.VITE_FIREBASE_USE_EMULATORS === 'true';
  
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