/// <reference types="vite/client" />
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Lazily import analytics to keep initial bundle small
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';
import type { Analytics } from 'firebase/analytics';

// Your web app's Firebase configuration (loaded from environment variables)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Basic runtime validation to surface misconfiguration early
if (
  !firebaseConfig.apiKey ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId ||
  !firebaseConfig.storageBucket ||
  !firebaseConfig.messagingSenderId ||
  !firebaseConfig.appId
) {
  throw new Error(
    'Missing Firebase environment variables. Please set VITE_FIREBASE_* in your .env files.'
  );
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let analytics: Analytics | null = null;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  // Enable offline persistence (best-effort)
  try {
    if (typeof window !== 'undefined') {
      await enableIndexedDbPersistence(db);
    }
  } catch (e) {
    console.warn('IndexedDB persistence not enabled:', e);
  }
  
  // Initialize Analytics only in browser environment (lazy-loaded)
  if (typeof window !== 'undefined') {
    const { getAnalytics } = await import('firebase/analytics');
    analytics = getAnalytics(app);
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  try {
    if (typeof window !== 'undefined') {
      await enableIndexedDbPersistence(db);
    }
  } catch (e) {
    console.warn('IndexedDB persistence not enabled:', e);
  }
  
  if (typeof window !== 'undefined') {
    const { getAnalytics } = await import('firebase/analytics');
    analytics = getAnalytics(app);
  }
}

export { app, auth, db, storage, analytics };
export default app;
