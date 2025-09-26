
'use client';

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  Firestore,
  Timestamp,
} from 'firebase/firestore';
import { isToday } from 'date-fns';

export type Vitals = {
  id?: string;
  bp: string;       // Blood pressure, e.g., "120/80"
  stress: number;   // Stress level, e.g., 45 on a scale of 100
  spo2: number;     // Blood oxygen saturation, e.g., 98
  timestamp?: Timestamp;
};

/**
 * Fetches the most recent vitals log for the current day from Firestore.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user.
 * @returns The latest Vitals object for today, or null if none exists.
 */
export async function getTodaysVitals(firestore: Firestore, userId: string): Promise<Vitals | null> {
  const vitalsRef = collection(firestore, 'users', userId, 'vitals');
  const q = query(vitalsRef, orderBy('timestamp', 'desc'), limit(1));

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    return null; // No vitals logged ever
  }

  const latestVitalsDoc = querySnapshot.docs[0];
  const latestVitals = { id: latestVitalsDoc.id, ...latestVitalsDoc.data() } as Vitals;

  // Check if the latest log is from today
  if (latestVitals.timestamp && isToday(latestVitals.timestamp.toDate())) {
    return latestVitals;
  }

  return null; // Latest log is not from today
}

/**
 * Saves a new vitals log to Firestore.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user.
 * @param vitalsData The vitals data to save.
 */
export async function saveVitals(firestore: Firestore, userId: string, vitalsData: Omit<Vitals, 'id' | 'timestamp'>): Promise<void> {
  const vitalsRef = collection(firestore, 'users', userId, 'vitals');
  await addDoc(vitalsRef, {
    ...vitalsData,
    userId: userId,
    timestamp: serverTimestamp(),
  });
}
