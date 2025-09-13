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
  projectId: 'studio-9098566573-34360',
  appId: '1:860377690712:web:8aa13e221b60552ec8902d',
  storageBucket: 'studio-9098566573-34360.appspot.com',
  apiKey: 'AIzaSyCI6uXpVK60uhPH1YiiEr1V5lYKZvsyQyw',
  authDomain: 'studio-9098566573-34360.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '860377690712',
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
