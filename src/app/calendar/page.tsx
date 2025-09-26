
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useUser, useFirestore } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { isSameDay, startOfMonth } from "date-fns";
import { Loader2 } from "lucide-react";
import { getUserProfile, UserProfile } from "@/services/profile";
import { getMonthlyMoodLogs, MoodLogWithDate } from "@/services/mood";
import { cn } from "@/lib/utils";


const moodScoreToColor: { [key: number]: string } = {
  5: "#22c55e", // Happy
  4: "#84cc16", // Good
  3: "#facc15", // Okay
  2: "#f97316", // Stressed
  1: "#ef4444", // Anxious
};


export default function CalendarPage() {
  useAuthGuard();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [moods, setMoods] = useState<MoodLogWithDate[]>([]);
  
  // Default to September 2025 as in the image, but allow it to change
  const [month, setMonth] = useState(new Date(2025, 8, 1));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date(2025, 8, 24));


  useEffect(() => {
    const fetchProfileAndMoods = async () => {
      if (user && firestore) {
        setIsLoading(true);
        const userProfile = await getUserProfile(firestore, user.uid);
        if (userProfile?.role === 'institution' || userProfile?.role === 'college-admin') {
            router.replace('/dashboard');
            return;
        }
        setProfile(userProfile);

        const year = month.getFullYear();
        const monthIndex = month.getMonth();
        const fetchedMoods = await getMonthlyMoodLogs(firestore, user.uid, year, monthIndex);
        setMoods(fetchedMoods);

        setIsLoading(false);
      }
    };
    fetchProfileAndMoods();
  }, [user, firestore, router, month]);


  const DayWithMood = (props: { date: Date }) => {
    const moodLog = moods.find((log) => isSameDay(log.date, props.date));
    const color = moodLog ? moodScoreToColor[moodLog.score] : undefined;

    return (
      <div className="relative flex items-center justify-center h-full w-full">
        <span>{props.date.getDate()}</span>
        {moodLog && (
          <div
            className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
      </div>
    );
  };
  
  if (isLoading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto py-10">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Mood Calendar</CardTitle>
            <CardDescription>
              View your mood history at a glance. A colored dot represents the mood you logged on that day.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            {isLoading && <Loader2 className="h-8 w-8 animate-spin my-10" />}
            {!isLoading && (
                 <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    month={month}
                    onMonthChange={(newMonth) => setMonth(startOfMonth(newMonth))}
                    className="p-0"
                    classNames={{
                        day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-md",
                        day: "w-10 h-10",
                    }}
                    components={{
                        Day: ({ date }) => <DayWithMood date={date} />,
                    }}
                 />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
