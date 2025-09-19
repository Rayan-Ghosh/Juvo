
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Loader2, Moon, Sparkles } from 'lucide-react';
import { getProfile, UserProfile } from '@/services/profile';
import { getMoodForLast48Hours, MoodLog } from '@/services/mood';
import { sleepStressAnalysis } from '@/ai/flows/sleep-stress-analysis';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import type { View } from '../dashboard';


interface SleepTrackerProps {
    setActiveView: (view: View) => void;
}

const SleepTracker = ({ setActiveView }: SleepTrackerProps) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [insight, setInsight] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isGettingInsight, setIsGettingInsight] = useState(false);

    const hasSleepSchedule = profile?.sleepSchedule?.weekdayWake && profile?.sleepSchedule?.weekdaySleep;

    const fetchData = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const userProfile = await getProfile();
            setProfile(userProfile);
        } catch (error) {
            toast({ title: 'Error', description: 'Could not load your profile.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleGetInsight = async () => {
        if (!user) return;
        setIsGettingInsight(true);
        setInsight('');
        try {
            const recentMoods = await getMoodForLast48Hours();
            const result = await sleepStressAnalysis({
                sleepSchedule: profile?.sleepSchedule,
                recentMoods: recentMoods.map(m => ({ mood: m.moodName, timestamp: m.createdAt.toISOString() })),
            });
            setInsight(result.analysis);
        } catch (error) {
            console.error('Sleep analysis error:', error);
            toast({ title: 'Analysis Failed', description: 'Could not generate a sleep insight. Please try again.', variant: 'destructive' });
        } finally {
            setIsGettingInsight(false);
        }
    };

    const handleGoToSettings = () => {
        setActiveView('settings');
        // We can also add a hint to the settings view to scroll to the right section
        // This can be done via a shared context or another state management solution if needed
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Circadian Health</CardTitle>
                <CardDescription>Analyze your sleep-stress connection.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col space-y-4 justify-center">
                {isLoading ? (
                    <>
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </>
                ) : !hasSleepSchedule ? (
                    <div className="text-center space-y-4">
                        <p className="text-muted-foreground">Set up your sleep schedule in settings to unlock personalized insights.</p>
                        <Button onClick={handleGoToSettings}>Go to Settings</Button>
                    </div>
                ) : (
                    <>
                        <Button
                            variant="outline"
                            onClick={handleGetInsight}
                            disabled={isGettingInsight}
                        >
                            {isGettingInsight ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Get Sleep Insight
                        </Button>
                        
                        {insight && (
                             <Alert>
                                <Moon className="h-4 w-4" />
                                <AlertDescription className="ml-7">{insight}</AlertDescription>
                            </Alert>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default SleepTracker;
