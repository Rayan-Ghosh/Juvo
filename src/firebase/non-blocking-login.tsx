
'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
} from 'firebase/auth';
import { toast } from "@/hooks/use-toast";

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (BLOCKING). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<UserCredential> {
  try {
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
    return userCredential;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      toast({
        variant: 'destructive',
        title: 'Email Already Registered',
        description: 'An account with this email already exists. Please sign in instead.',
      });
    }
    // Re-throw the error to be caught by the calling function's try/catch block
    throw error;
  }
}

/** Initiate email/password sign-in (BLOCKING). */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<UserCredential | undefined> {
  try {
    const userCredential = await signInWithEmailAndPassword(authInstance, email, password);
    return userCredential;
  } catch (error: any) {
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        toast({
            variant: 'destructive',
            title: 'Sign-In Failed',
            description: 'Invalid credentials. Please check your email and password and try again.',
          });
    }
    throw error; // Re-throw to be handled by the form
  }
}


/**
 * Initiates Google sign-in using a popup.
 * This function IS blocking as it needs to await the user interaction.
 * @param authInstance The Firebase Auth instance.
 * @returns A Promise that resolves with the UserCredential on success.
 */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(authInstance, provider);
    return result;
  } catch (error: any) {
    toast({
      variant: 'destructive',
      title: 'Google Sign-In Failed',
      description: error.message || 'Could not sign in with Google. Please try again.',
    });
    // Re-throw the error so the calling component can handle the final state.
    throw error;
  }
}
