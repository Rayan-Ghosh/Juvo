
"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser, useAuth } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";

type AuthGuardOptions = {
  allowAnonymous?: boolean;
};

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If auth state is still loading, do nothing yet.
    if (isUserLoading || !auth) {
      return;
    }

    // If auth check is complete and there's no user...
    if (!user) {
      if (options.allowAnonymous) {
        // ...and anonymous users are allowed, sign them in silently.
        initiateAnonymousSignIn(auth);
      } else {
        // ...otherwise, redirect to the sign-in page.
        router.replace("/sign-in");
      }
    }
  }, [user, isUserLoading, router, pathname, auth, options.allowAnonymous]);

  // Return true if the auth check is complete (i.e., not loading).
  return !isUserLoading;
}
