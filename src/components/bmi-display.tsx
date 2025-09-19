'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { getProfile, UserProfile } from '@/services/profile';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { Scale } from 'lucide-react';

const BMIDisplay = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [bmiCategory, setBmiCategory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const getBmiCategory = useCallback((heightCm?: number, weightKg?: number) => {
        if (heightCm && weightKg && heightCm > 0 && weightKg > 0) {
            const heightM = heightCm / 100;
            const bmiValue = weightKg / (heightM * heightM);
            if (bmiValue < 18.5) return 'Underweight';
            if (bmiValue < 25) return 'Normal Weight';
            if (bmiValue < 30) return 'Overweight';
            return 'Obese';
        }
        return null;
    }, []);

    const fetchProfile = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        const userProfile = await getProfile(user.uid);
        if (userProfile) {
            setProfile(userProfile);
            setBmiCategory(getBmiCategory(userProfile.height, userProfile.weight));
        }
        setIsLoading(false);
    }, [user, getBmiCategory]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);
    
    const getCategoryColor = () => {
        switch (bmiCategory) {
            case 'Underweight': return 'text-blue-500';
            case 'Normal Weight': return 'text-green-500';
            case 'Overweight': return 'text-yellow-500';
            case 'Obese': return 'text-red-500';
            default: return 'text-muted-foreground';
        }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Your BMI Status</CardTitle>
                <CardDescription>Based on your latest profile data.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
                 {isLoading ? (
                    <>
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <Skeleton className="h-6 w-32" />
                    </>
                ) : (
                    <>
                        <div className={cn('p-4 rounded-full bg-primary/10')}>
                            <Scale className={cn('h-8 w-8 text-primary')} />
                        </div>
                        <p className={cn("text-2xl font-bold", getCategoryColor())}>
                           {bmiCategory || "Not Calculated"}
                        </p>
                         <p className="text-sm text-muted-foreground">
                            {bmiCategory ? 'Keep up the healthy habits!' : 'Update your height & weight in Settings.'}
                         </p>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

export default BMIDisplay;
