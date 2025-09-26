
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';

// This mirrors the User entity from backend.json but is tailored for the frontend.
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: 'student' | 'institution' | 'college-admin' | 'general';
  aaparId?: string; // For students
  pineCode?: string; // For institutions
  institutionId?: string; // For college-admins
  identificationId?: string; // For college-admins (employee id)
  createdAt: string; // ISO date string
  gender?: 'female' | 'male' | 'other' | 'prefer-not-to-say';
  caretakerEmail?: string;
  caretakerPhone?: string;
  hasStressCondition?: boolean;
  stressConditionDetails?: string;
  initialMood?: string;
  busyModeStart?: string; // ISO date string
  busyModeEnd?: string; // ISO date string
  height?: number;
  weight?: number;
  sleepSchedule?: {
    weekdayWake?: string; // e.g., '07:00'
    weekdaySleep?: string; // e.g., '23:00'
    weekendWake?: string;
    weekendSleep?: string;
  };
  lastPeriodStartDate?: string;
  cycleLength?: number;
  bleedingPhaseLength?: number;
}

/**
 * Fetches the user profile from Firestore.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user to fetch.
 * @returns The user profile, or null if not found.
 */
export async function getUserProfile(firestore: Firestore, userId: string): Promise<UserProfile | null> {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        // We explicitly cast to UserProfile, assuming the data matches.
        // It might be safer to validate this data against a schema.
        return { id: userSnap.id, ...userSnap.data() } as UserProfile;
    }

    return null;
}

/**
 * Saves or updates a user's profile in Firestore.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user whose profile is being saved.
 * @param profileData The partial profile data to save.
 */
export async function saveUserProfile(firestore: Firestore, userId: string, profileData: Partial<Omit<UserProfile, 'id'>>): Promise<void> {
    const userRef = doc(firestore, 'users', userId);
    // Use setDoc with merge: true to update existing fields or create the document if it doesn't exist.
    await setDoc(userRef, profileData, { merge: true });
}
