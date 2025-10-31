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

/**
 * Firebase Client Configuration
 * 
 * SECURITY NOTE: These values (with VITE_ prefix) are exposed to the browser, which is
 * INTENDED and SAFE for Firebase client-side SDKs. Firebase API keys are designed to be
 * public - they cannot access your data without proper authentication and Security Rules.
 * 
 * Security is enforced by:
 * 1. Firebase Security Rules (Firestore, Storage)
 * 2. Firebase Authentication (user login)
 * 3. API Key restrictions in Google Cloud Console (HTTP referrer restrictions)
 * 
 * IMPORTANT: Configure API key restrictions in Google Cloud Console:
 * - Go to: APIs & Services → Credentials → Your API Key
 * - Set Application restrictions: HTTP referrers (web sites)
 * - Add allowed domains: localhost, your Vercel domains, production domain
 * - Set API restrictions: Restrict to Firebase APIs only
 */
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
  const missingVars = [];
  if (!firebaseConfig.apiKey) missingVars.push('VITE_FIREBASE_API_KEY');
  if (!firebaseConfig.authDomain) missingVars.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (!firebaseConfig.projectId) missingVars.push('VITE_FIREBASE_PROJECT_ID');
  if (!firebaseConfig.storageBucket) missingVars.push('VITE_FIREBASE_STORAGE_BUCKET');
  if (!firebaseConfig.messagingSenderId) missingVars.push('VITE_FIREBASE_MESSAGING_SENDER_ID');
  if (!firebaseConfig.appId) missingVars.push('VITE_FIREBASE_APP_ID');
  
  const errorMessage = `Missing Firebase environment variables: ${missingVars.join(', ')}\n\n` +
    `Please set these variables in your Vercel project settings:\n` +
    `Settings → Environment Variables → Add:\n` +
    missingVars.map(v => `  - ${v}`).join('\n');
  
  console.error(errorMessage);
  // Throw error to prevent app from running with invalid config
  throw new Error(errorMessage);
}

// Initialize Firebase synchronously (async features initialized lazily)
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
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}

// Initialize async features (IndexedDB persistence and Analytics) lazily
if (typeof window !== 'undefined') {
  // Enable offline persistence (best-effort, non-blocking)
  enableIndexedDbPersistence(db).catch((e) => {
    console.warn('IndexedDB persistence not enabled:', e);
  });
  
  // Initialize Analytics only in browser environment (lazy-loaded)
  import('firebase/analytics').then(({ getAnalytics }) => {
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.warn('Analytics initialization failed:', e);
    }
  }).catch((e) => {
    console.warn('Analytics import failed:', e);
  });
}

export { app, auth, db, storage, analytics };
export default app;
