'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Plus, Minus, GlassWater, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { addHydrationLog, getTodaysHydration } from '@/services/hydration';
import { getProfile } from '@/services/profile';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const HydrationTracker = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [glasses, setGlasses] = useState(0);
    const [goal, setGoal] = useState(8);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update time every minute
        return () => clearInterval(timer);
    }, []);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        if (user) {
            try {
                const [profile, todaysLog] = await Promise.all([getProfile(), getTodaysHydration()]);
                if (profile?.hydrationGoal) {
                    setGoal(profile.hydrationGoal);
                }
                if (todaysLog) {
                    setGlasses(todaysLog.glasses);
                }
            } catch (error) {
                toast({ title: "Error", description: "Could not load hydration data.", variant: "destructive" });
            }
        }
        setIsLoading(false);
    }, [user, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdate = async (newCount: number) => {
        if (!user) {
            toast({ title: "Not logged in", description: "You must be logged in to track hydration.", variant: "destructive" });
            return;
        }
        setIsUpdating(true);
        const newGlassesCount = Math.max(0, newCount);
        try {
            await addHydrationLog(newGlassesCount);
            setGlasses(newGlassesCount);
        } catch (error) {
            toast({ title: 'Error', description: 'Could not update hydration log.', variant: 'destructive' });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const getMotivationalMessage = () => {
        const percentage = (glasses / goal) * 100;
        if (percentage >= 100) return "Goal achieved! You're a hydration hero!";

        const hoursPassed = currentTime.getHours();
        const idealGlasses = Math.floor((hoursPassed / 24) * goal);

        const remaining = goal - glasses;

        if (glasses > idealGlasses) {
            return `You're on fire! Only ${remaining} to go.`;
        }

        if (hoursPassed > 18 && glasses < goal / 2) {
            return `The day's almost over! Let's get to it. ${remaining} more to go.`;
        }
        
        return `${remaining} more to go. You can do it!`;
    };
    
    const progress = Math.min(100, (glasses / goal) * 100);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Hydration Tracker</CardTitle>
                <CardDescription>{getMotivationalMessage()}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center space-y-4">
                {isLoading ? (
                    <>
                        <Skeleton className="h-32 w-32 rounded-full" />
                        <Skeleton className="h-10 w-full" />
                    </>
                ) : (
                    <>
                        <div className="relative h-36 w-36">
                            <CircularProgressbar
                                value={progress}
                                strokeWidth={8}
                                styles={buildStyles({
                                    pathColor: `hsl(var(--primary))`,
                                    trailColor: `hsl(var(--muted))`,
                                    pathTransitionDuration: 0.5,
                                })}
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                 <p className="text-4xl font-bold">{glasses}</p>
                                <p className="text-sm text-muted-foreground">/ {goal} glasses</p>
                            </div>
                        </div>

                        <div className="flex w-full items-center justify-center gap-4 pt-2">
                             <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleUpdate(glasses - 1)}
                                disabled={isUpdating || glasses === 0}
                                className="h-12 w-12 rounded-full"
                            >
                                {isUpdating && glasses > 0 ? <Loader2 className="h-6 w-6 animate-spin" /> : <Minus className="h-6 w-6" />}
                            </Button>
                            <div className={cn(
                                "text-primary transition-transform duration-300",
                                isUpdating && "animate-pulse"
                            )}>
                                <GlassWater size={40} strokeWidth={1.5}/>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleUpdate(glasses + 1)}
                                disabled={isUpdating}
                                className="h-12 w-12 rounded-full"
                            >
                                 {isUpdating ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

export default HydrationTracker;
