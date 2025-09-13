import { auth, getDb } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export const signUp = async (name: string, email: string, password: string, gender: 'male' | 'female' | 'other'): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Update auth profile
  await updateProfile(user, { displayName: name });

  // Create user profile in Firestore
  try {
    const db = await getDb();
    const profileRef = doc(db, 'profiles', user.uid);
    await setDoc(profileRef, {
      gender: gender,
      updatedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error creating user profile in Firestore:", error);
    // Even if Firestore profile fails, the user is created in Auth.
    // We might want to handle this more gracefully in a production app.
  }
  
  return user;
};

export const signIn = async (email: string, password: string): Promise<User> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logOut = (): Promise<void> => {
  return signOut(auth);
};

export const updateUserProfile = async (data: { displayName?: string; photoURL?: string }): Promise<void> => {
    const user = auth.currentUser;
    if (user) {
        await updateProfile(user, data);
        // This is a workaround to force a refresh of the user object in the auth context
        await auth.currentUser?.reload();
    } else {
        throw new Error("No user is currently signed in.");
    }
}
