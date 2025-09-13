import { auth } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';

export const signUp = async (name: string, email: string, password: string): Promise<User> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  return userCredential.user;
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
