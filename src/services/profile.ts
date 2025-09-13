// src/services/profile.ts
import { auth, getDb } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export interface UserProfile {
  caretakerName?: string;
  caretakerEmail?: string;
  medicalConditions?: string;
  vacationMode?: boolean;
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
    await setDoc(profileRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error saving profile: ', error);
    throw new Error('Failed to save profile.');
  }
};

export const getProfile = async (uid?: string): Promise<UserProfile | null> => {
  try {
    const userId = uid || auth.currentUser?.uid;
    if (!userId) throw new Error('Could not determine user to fetch profile for.');

    const db = await getDb();
    const profileRef = doc(db, 'profiles', userId);
    const docSnap = await getDoc(profileRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      console.log("No such profile document!");
      return null;
    }
  } catch (error) {
    console.error('Error getting profile: ', error);
    // Return null instead of throwing, as a missing profile is not a critical failure
    return null;
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
