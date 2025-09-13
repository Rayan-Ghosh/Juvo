'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { addCycleLog, getLatestCycleLog } from '@/services/cycle';
import { useAuth } from '@/context/auth-context';
import { Loader2, CalendarPlus, Droplets } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { differenceInDays, format } from 'date-fns';
import { cycleInsights } from '@/ai/flows/cycle-insights';
import { getTodaysMood, MoodLog } from '@/services/mood';
import { Alert, AlertDescription } from './ui/alert';

const CycleTracker = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [lastLog, setLastLog] = useState<{ date: Date } | null>(null);
    const [todaysMood, setTodaysMood] = useState<MoodLog | null>(null);
    const [insight, setInsight] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isLogging, setIsLogging] = useState(false);
    const [isGettingInsight, setIsGettingInsight] = useState(false);

    const fetchData = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [latestLog, mood] = await Promise.all([
                getLatestCycleLog(),
                getTodaysMood(),
            ]);
            if (latestLog) setLastLog(latestLog);
            if (mood) setTodaysMood(mood);
        } catch (error) {
            toast({ title: 'Error', description: 'Could not load cycle data.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleLogPeriod = async () => {
        setIsLogging(true);
        try {
            await addCycleLog();
            toast({ title: 'Cycle Logged', description: 'Today has been marked as the start of your period.' });
            fetchData(); // Refresh data
        } catch (error) {
            toast({ title: 'Error', description: 'Could not log cycle start.', variant: 'destructive' });
        } finally {
            setIsLogging(false);
        }
    };

    const handleGetInsight = async () => {
        if (!todaysMood || !lastLog) return;
        setIsGettingInsight(true);
        setInsight('');
        try {
            const dayOfCycle = differenceInDays(new Date(), lastLog.date) + 1;
            const result = await cycleInsights({
                dayOfCycle,
                mood: todaysMood.moodName,
            });
            setInsight(result.insight);
        } catch (error) {
            toast({ title: 'Error', description: 'Could not generate insight.', variant: 'destructive' });
        } finally {
            setIsGettingInsight(false);
        }
    };
    
    const dayOfCycle = lastLog ? differenceInDays(new Date(), lastLog.date) + 1 : 0;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Menstrual Cycle Tracker</CardTitle>
                <CardDescription>Log your cycle for personalized insights.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col space-y-4">
                {isLoading ? (
                    <div className="space-y-4 flex flex-col items-center">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                ) : (
                    <>
                       <div className="flex items-center justify-center text-center p-4 bg-muted rounded-lg">
                           {lastLog ? (
                                <div>
                                    <p className="text-3xl font-bold">Day {dayOfCycle}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Last period started on {format(lastLog.date, 'MMMM d')}
                                    </p>
                                </div>
                           ) : (
                                <p className="text-muted-foreground">Log your period to start tracking.</p>
                           )}
                       </div>
                        <Button onClick={handleLogPeriod} disabled={isLogging}>
                            {isLogging ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
                            {isLogging ? 'Logging...' : 'I started my period today'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleGetInsight}
                            disabled={isGettingInsight || !todaysMood || !lastLog}
                        >
                            {isGettingInsight ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Droplets className="mr-2 h-4 w-4" />}
                            Get Today's Insight
                        </Button>
                        
                        {!todaysMood && lastLog && (
                             <Alert variant="destructive" className="text-center text-xs">
                                <AlertDescription>
                                    Log your mood today to get an insight.
                                </AlertDescription>
                            </Alert>
                        )}
                        {insight && (
                             <Alert>
                                <AlertDescription>{insight}</AlertDescription>
                            </Alert>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default CycleTracker;
