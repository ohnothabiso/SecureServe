import { initializeApp } from 'firebase/app';
import { getAuth, PhoneAuthProvider, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import Constants from 'expo-constants';

// Firebase configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: Constants.expoConfig?.extra?.firebaseAppId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize messaging (web only for now)
let messaging: any = null;
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.log('Messaging not available:', error);
  }
}

export { messaging };

// Auth functions
export const signInWithPhone = async (phoneNumber: string, verificationCode: string) => {
  const credential = PhoneAuthProvider.credential(verificationCode, verificationCode);
  return signInWithCredential(auth, credential);
};

export const signInWithEmail = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const createUserWithEmail = async (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// User management
export const createUserProfile = async (uid: string, userData: any) => {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    ...userData,
    createdAt: serverTimestamp(),
    lastUpdated: serverTimestamp()
  });
};

export const updateUserProfile = async (uid: string, updates: any) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...updates,
    lastUpdated: serverTimestamp()
  });
};

export const getUserProfile = async (uid: string) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
};

// Alerts functions
export const getActiveAlerts = (callback: (alerts: any[]) => void) => {
  const alertsRef = collection(db, 'alerts');
  const q = query(alertsRef, where('active', '==', true), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const alerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(alerts);
  });
};

export const getAlertById = async (alertId: string) => {
  const alertRef = doc(db, 'alerts', alertId);
  const alertSnap = await getDoc(alertRef);
  return alertSnap.exists() ? { id: alertSnap.id, ...alertSnap.data() } : null;
};

export const createAlert = async (alertData: any) => {
  const alertsRef = collection(db, 'alerts');
  return addDoc(alertsRef, {
    ...alertData,
    createdAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
    active: true
  });
};

// Sightings functions
export const getSightingsForAlert = (alertId: string, callback: (sightings: any[]) => void) => {
  const sightingsRef = collection(db, 'sightings');
  const q = query(sightingsRef, where('alertId', '==', alertId), orderBy('timestamp', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const sightings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(sightings);
  });
};

export const createSighting = async (sightingData: any) => {
  const sightingsRef = collection(db, 'sightings');
  return addDoc(sightingsRef, {
    ...sightingData,
    timestamp: serverTimestamp()
  });
};

// Storage functions
export const uploadImage = async (path: string, file: Blob) => {
  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
};

// FCM functions
export const getFCMToken = async () => {
  if (!messaging) return null;
  
  try {
    const token = await getToken(messaging, {
      vapidKey: Constants.expoConfig?.extra?.firebaseVapidKey
    });
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

export const onFCMMessage = (callback: (payload: any) => void) => {
  if (!messaging) return;
  
  onMessage(messaging, callback);
};