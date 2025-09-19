// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  memoryEagerGarbageCollector,
  Firestore,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);

let dbInstance: Firestore | null = null;

export const getDb = () => {
  if (dbInstance) {
    return dbInstance;
  }

  // Use initializeFirestore for modern persistence setup
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      // @ts-ignore
      garbageCollector: memoryEagerGarbageCollector(),
    }),
  });

  return dbInstance;
};

export { auth, app, storage };
