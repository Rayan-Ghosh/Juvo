
'use client';

import { 
    doc,
    setDoc,
    getDoc,
    Firestore,
    Timestamp,
} from 'firebase/firestore';

export interface MenstrualCycleLog {
    id?: string;
    userId: string;
    lastPeriodStartDate?: string; // Stored as 'YYYY-MM-DD'
    cycleLength?: number;
    bleedingPhaseLength?: number;
    logDate: Timestamp;
}

/**
 * Saves or updates a user's menstrual cycle log.
 * In a real app, you'd have a collection of logs, but for simplicity,
 * we'll store the latest log directly on the user's profile or a dedicated sub-collection doc.
 * Let's create a single document to store the latest log.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user.
 * @param cycleData The cycle data to save.
 */
export async function saveCycleLog(
    firestore: Firestore,
    userId: string,
    cycleData: Partial<Omit<MenstrualCycleLog, 'id' | 'userId' | 'logDate'>>
): Promise<void> {
    // We'll use a specific doc ID to always update the same log document.
    const cycleLogRef = doc(firestore, 'users', userId, 'menstrual_cycle_logs', 'latest');
    
    const dataToSave = {
        ...cycleData,
        userId: userId,
        logDate: Timestamp.now(),
    };
    
    await setDoc(cycleLogRef, dataToSave, { merge: true });
}

/**
 * Fetches the latest menstrual cycle log for a user.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user.
 * @returns The latest cycle log or null if not found.
 */
export async function getLatestCycleLog(
    firestore: Firestore,
    userId: string
): Promise<MenstrualCycleLog | null> {
    const cycleLogRef = doc(firestore, 'users', userId, 'menstrual_cycle_logs', 'latest');
    const docSnap = await getDoc(cycleLogRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as MenstrualCycleLog;
    }

    return null;
}
