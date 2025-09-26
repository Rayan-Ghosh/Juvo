
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { AddCounselorForm } from '@/components/dashboard/add-counselor-form';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useUser, useFirestore } from '@/firebase';
import { getUserProfile, type UserProfile } from '@/services/profile';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function AddCounselorPage() {
  useAuthGuard();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user && firestore) {
        const userProfile = await getUserProfile(firestore, user.uid);
        if (userProfile?.role === 'institution' || userProfile?.role === 'college-admin') {
          setProfile(userProfile);
        } else {
          // If the user is not an admin, redirect them away.
          router.replace('/dashboard');
        }
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [user, firestore, router]);

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const institutionId = profile.role === 'institution' ? profile.id : profile.institutionId;

  if (!institutionId) {
      return (
          <AppShell>
                <div className="container mx-auto py-10 text-center">
                    <h1 className="text-2xl font-bold">Error</h1>
                    <p className="text-muted-foreground">Could not determine your institution ID.</p>
                    <Button asChild className="mt-4">
                        <Link href="/dashboard">Return to Dashboard</Link>
                    </Button>
                </div>
          </AppShell>
      )
  }

  return (
    <AppShell>
      <div className="container mx-auto max-w-2xl py-10">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <AddCounselorForm institutionId={institutionId} />
      </div>
    </AppShell>
  );
}
