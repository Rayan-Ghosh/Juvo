// src/services/vitals.ts
import { auth, getDb } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit, serverTimestamp, setDoc, doc, getDoc } from 'firebase/firestore';
import { startOfDay, endOfDay, format } from 'date-fns';
import type { VitalLog } from '@/lib/types';


const getUserId = () => {
    const user = auth.currentUser;
    if (!user) {
        return 'anonymous-user';
    }
    return user.uid;
}

interface VitalData {
    bp?: string;
    stress?: number;
    spo2?: number;
}


export const addVitalLog = async (data: VitalData): Promise<void> => {
  try {
    const userId = getUserId();
    if (userId === 'anonymous-user') throw new Error('User not logged in');
    
    const db = await getDb();
    
    // Use the date as part of the document ID to ensure only one log per day per user.
    const docId = `${userId}_${format(new Date(), 'yyyy-MM-dd')}`;
    const vitalLogRef = doc(db, 'vitalEntries', docId);

    await setDoc(vitalLogRef, {
      userId: userId,
      ...data,
      // Use a server timestamp to know when it was last updated.
      updatedAt: serverTimestamp(), 
    }, { merge: true }); // Merge to update fields without overwriting the whole doc

  } catch (error) {
    console.error('Error adding vital log: ', error);
    throw new Error('Failed to log vitals.');
  }
};


export const getTodaysVitals = async (): Promise<VitalLog | null> => {
    try {
        const userId = getUserId();
        if (userId === 'anonymous-user') return null;
        
        const db = await getDb();
        // Construct the predictable document ID for today.
        const docId = `${userId}_${format(new Date(), 'yyyy-MM-dd')}`;
        const vitalLogRef = doc(db, 'vitalEntries', docId);
        
        const docSnap = await getDoc(vitalLogRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // The document exists, so we can return its data.
            return {
                id: docSnap.id,
                bp: data.bp,
                stress: data.stress,
                spo2: data.spo2,
                // The `createdAt` field might not be what we want if we're overwriting. `updatedAt` is better.
                // For consistency with the type, we'll use a new Date() for the `createdAt` property on the client.
                createdAt: data.updatedAt ? (data.updatedAt as Timestamp).toDate() : new Date(),
            };
        }
        // If the document doesn't exist for today, return null.
        return null;
    } catch (error) {
        console.error("Error getting today's vitals:", error);
        return null;
    }
}
