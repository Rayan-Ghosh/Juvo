"use client";

import { create } from "zustand";
import { User as FirebaseUser } from "firebase/auth";

type User = {
  email: string | null;
  uid: string;
};

type AuthState = {
  user: User | null;
  setUser: (user: FirebaseUser | null) => void;
};

// This store is now a simple store to hold user info.
// The actual auth state is managed by Firebase and the useUser hook.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (firebaseUser) => {
    if (firebaseUser) {
      set({ user: { email: firebaseUser.email, uid: firebaseUser.uid } });
    } else {
      set({ user: null });
    }
  },
}));
