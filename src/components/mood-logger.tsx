'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { MoodLog } from '@/services/mood';
import { Skeleton } from './ui/skeleton';

const moods = [
  { name: 'Happy', value: 5, icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><path d="M9 9h.01"></path><path d="M15 9h.01"></path></svg>, color: 'happy' },
  { name: 'Good', value: 4, icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 12s1.5 2 4 2 4-2 4-2"></path><path d="M9 9h.01"></path><path d="M15 9h.01"></path></svg>, color: 'good' },
  { name: 'Okay', value: 3, icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14h8"></path><path d="M9 9h.01"></path><path d="M15 9h.01"></path></svg>, color: 'okay' },
  { name: 'Stressed', value: 2, icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12"cy="12" r="10"></circle><path d="m16 16-4-4-4 4m4-10.5v5.5"></path><path d="M8.7 8.7a2.8 2.8 0 1 1 4 0"></path><path d="M12.8 8.7a2.8 2.8 0 1 1 4 0"></path></svg>, color: 'stressed' },
  { name: 'Anxious', value: 1, icon: (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><path d="M9 9h.01"></path><path d="M15 9h.01"></path></svg>, color: 'anxious' },
];

interface MoodLoggerProps {
    todaysMood: MoodLog | null;
    handleMoodSelect: (moodName: string, moodValue: number) => void;
    isLoading: boolean;
    loggingMood: string | null;
}

const MoodLogger = ({ todaysMood, handleMoodSelect, isLoading, loggingMood }: MoodLoggerProps) => {
  const isDisabled = !!todaysMood || isLoading || !!loggingMood;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>How are you feeling today?</CardTitle>
        <CardDescription>Your daily check-in helps us understand your well-being.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex items-center">
        {isLoading ? (
            <div className="flex justify-between items-center w-full gap-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <Skeleton className="h-14 w-14 rounded-full" />
                        <Skeleton className="h-4 w-10 rounded-md" />
                    </div>
                ))}
            </div>
        ) : (
            <div className="flex justify-between items-end w-full">
            {moods.map((mood) => (
                <div key={mood.name} className="flex flex-col items-center gap-2">
                <Button
                    variant="ghost"
                    onClick={() => handleMoodSelect(mood.name, mood.value)}
                    disabled={isDisabled}
                    className={cn(`mood-button h-14 w-14 rounded-full transition-all duration-200 flex items-center justify-center bg-card hover:bg-sidebar-accent/50`,
                    todaysMood?.moodName === mood.name
                        ? 'bg-sidebar-accent ring-2 ring-primary scale-110'
                        : 'hover:scale-110',
                    isDisabled && todaysMood?.moodName !== mood.name ? 'opacity-50 cursor-not-allowed' : ''
                    )}
                    aria-label={`Log mood as ${mood.name}`}
                >
                    {loggingMood === mood.name ? <Loader2 className="h-8 w-8 animate-spin" /> : <mood.icon className={cn('mood-icon', mood.color)} />}
                </Button>
                <p className="text-xs font-medium text-center text-muted-foreground">{mood.name}</p>
                </div>
            ))}
            </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MoodLogger;
