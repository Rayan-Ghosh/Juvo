// src/services/profile.ts
import { auth, getDb } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface UserProfile {
  // Personal Info
  gender?: 'male' | 'female' | 'other';
  height?: number; // in cm
  weight?: number; // in kg

  // Caretaker Info
  caretakerName?: string;
  caretakerEmail?: string;
  
  // Health Info
  medicalConditions?: string;

  // Preferences
  vacationMode?: boolean;
  hydrationGoal?: number; // in glasses or ml
  sleepSchedule?: {
    weekdayWake?: string;
    weekdaySleep?: string;
    weekendWake?: string;
    weekendSleep?: string;
  }

  // Timestamps
  updatedAt?: Timestamp;
  lastSeen?: Timestamp;
}

export const saveProfile = async (profileData: Partial<UserProfile>): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be logged in to manage your profile.');
    const userId = user.uid;

    const db = await getDb();
    const profileRef = doc(db, 'profiles', userId);
    
    // Convert height and weight to numbers if they are strings
    const dataToSave = { ...profileData };
    if (dataToSave.height) dataToSave.height = Number(dataToSave.height);
    if (dataToSave.weight) dataToSave.weight = Number(dataToSave.weight);
    if (dataToSave.hydrationGoal) dataToSave.hydrationGoal = Number(dataToSave.hydrationGoal);
    
    await setDoc(profileRef, {
      ...dataToSave,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving profile: ', error);
    throw new Error('Failed to save profile.');
  }
};

export const getProfile = async (uid?: string): Promise<UserProfile | null> => {
  const userId = uid || auth.currentUser?.uid;
  if (!userId) {
    // If no UID is provided and no user is logged in on the client, we can't proceed.
    return null;
  }

  try {
    const db = await getDb();
    const profileRef = doc(db, 'profiles', userId);
    const docSnap = await getDoc(profileRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      // Profile might not exist for a newly signed up user
      return null;
    }
  } catch (error) {
    console.error('Error getting profile: ', error);
    // Re-throw the error to be handled by the calling function.
    throw new Error('Could not retrieve your profile.');
  }
};

export const updateUserLastSeen = async (): Promise<void> => {
    try {
        const user = auth.currentUser;
        if (!user) return; // Fail silently if no user
        const userId = user.uid;

        const db = await getDb();
        const profileRef = doc(db, 'profiles', userId);
        await setDoc(profileRef, {
            lastSeen: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.error("Error updating user's last seen timestamp:", error);
        // We don't throw an error here as it's a background task.
    }
};
