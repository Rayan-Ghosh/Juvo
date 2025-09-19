'use client';
// src/services/hydration.ts
import { auth, getDb } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';

export interface HydrationLog {
    id: string;
    glasses: number;
    updatedAt: Date;
}

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be logged in to manage hydration data.');
    return user.uid;
}

/**
 * Adds or updates a hydration log for the current day.
 * @param glasses - The number of glasses of water consumed.
 */
export const addHydrationLog = async (glasses: number): Promise<void> => {
  try {
    const userId = getUserId();
    const db = await getDb();
    
    // Use a predictable document ID for today's log to ensure one log per day.
    const docId = `${userId}_${format(new Date(), 'yyyy-MM-dd')}`;
    const logRef = doc(db, 'hydrationLogs', docId);

    await setDoc(logRef, {
      userId,
      glasses,
      updatedAt: serverTimestamp(),
    }, { merge: true }); // Use merge to create or update the document.
  } catch (error) {
    console.error('Error adding hydration log: ', error);
    throw new Error('Failed to log hydration.');
  }
};

/**
 * Retrieves today's hydration log for the current user.
 * @returns The hydration log object or null if it doesn't exist.
 */
export const getTodaysHydration = async (): Promise<HydrationLog | null> => {
    try {
        const userId = getUserId();
        const db = await getDb();
        const docId = `${userId}_${format(new Date(), 'yyyy-MM-dd')}`;
        const logRef = doc(db, 'hydrationLogs', docId);

        const docSnap = await getDoc(logRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                glasses: data.glasses,
                updatedAt: data.updatedAt.toDate(),
            };
        }
        return null;
    } catch (error) {
        // If it's a non-logged-in user, fail gracefully
        if (error instanceof Error && error.message.includes('logged in')) {
            return null;
        }
        console.error("Error getting today's hydration log:", error);
        throw new Error("Could not retrieve today's hydration data.");
    }
};
