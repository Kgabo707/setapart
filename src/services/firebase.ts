import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Without credentials the app runs against the in-memory demo dataset instead of
 * crashing on boot, so the UI is reviewable before a Firebase project is wired up.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

const getFirebaseApp = (): FirebaseApp => {
  if (!app) {
    app = getApps().length
      ? getApp()
      : initializeApp(firebaseConfig as Required<typeof firebaseConfig>);
  }
  return app;
};

export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    // `getReactNativePersistence` is a React-Native-only export — the same
    // `firebase/auth` import resolves to a different bundle on web, one that simply
    // doesn't have it, so calling it there throws "not a function" immediately on
    // app boot. Web gets its own default (IndexedDB-backed) persistence via getAuth().
    auth =
      Platform.OS === 'web'
        ? getAuth(getFirebaseApp())
        : initializeAuth(getFirebaseApp(), {
            persistence: getReactNativePersistence(AsyncStorage),
          });
  }
  return auth;
};

export const getDb = (): Firestore => {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
};

let functionsClient: Functions | undefined;

/**
 * Cloud Functions client, used only by the Mux upload flow (`services/api/muxUpload.ts`).
 * Everything else in this app talks to Firestore directly — this is the one place that
 * needs a server in the loop, since the Mux API secret can never live in the app bundle.
 */
export const getFunctionsClient = (): Functions => {
  if (!functionsClient) {
    functionsClient = getFunctions(getFirebaseApp());
  }
  return functionsClient;
};

export const COLLECTIONS = {
  users: 'users',
  organizations: 'organizations',
  videos: 'videos',
  reports: 'reports',
} as const;
