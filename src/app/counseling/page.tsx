
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useUser, useFirestore } from '@/firebase';
import { getUserProfile, type UserProfile } from '@/services/profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Loader2, Settings } from 'lucide-react';
import { RequestSessionDialog } from '@/components/counseling/request-session-dialog';

export default function CounselingPage() {
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
            router.replace('/dashboard');
        } else {
            setProfile(userProfile);
            setIsLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user, firestore, router]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto max-w-4xl py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold font-headline">Counseling & Support</h1>
          <p className="text-muted-foreground mt-2">
            Access professional help when you need it. You are not alone.
          </p>
        </div>

        <div className="flex justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:w-full">
            <Card className="flex flex-col md:col-span-1">
              <CardHeader className="text-center">
                <CardTitle>Tele-MANAS Helpline</CardTitle>
                <CardDescription>
                  Connect with a trained counselor from India’s national mental health helpline for free, confidential support, 24/7.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex items-center justify-center">
                  <div className="text-center">
                      <p className="font-semibold text-lg">Toll-Free Number</p>
                      <p className="text-2xl font-bold tracking-widest text-primary">1-800-891-4416</p>
                  </div>
              </CardContent>
              <div className="p-6 pt-0">
                <Button asChild className="w-full">
                  <a href="tel:1-800-891-4416">
                    <Phone className="mr-2 h-4 w-4" />
                    Call Now
                  </a>
                </Button>
              </div>
            </Card>
              
            {profile?.role === 'student' && (
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle>Book with Your Counselor</CardTitle>
                  <CardDescription>
                    Schedule a one-on-one session with your designated caretaker or university counselor.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center">
                  {isLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : profile?.caretakerEmail ? (
                    <div className="text-center">
                      <p className="font-semibold">Your Counselor's Contact:</p>
                      <p className="text-muted-foreground">{profile.caretakerEmail}</p>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                        <p>You haven't added a counselor yet.</p>
                         <Button variant="link" asChild>
                            <Link href="/settings"><Settings className="mr-2 h-4 w-4" /> Add in Settings</Link>
                         </Button>
                    </div>
                  )}
                </CardContent>
                <div className="p-6 pt-0">
                   {profile?.caretakerEmail && (
                     <RequestSessionDialog counselorEmail={profile.caretakerEmail} userName={profile.name || user?.displayName || 'Juvo User'} />
                   )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
