'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getProfile, saveProfile, UserProfile } from '@/services/profile';
import { useAuth } from '@/context/auth-context';
import { Loader2, Calculator } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

const BMICalculator = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [profile, setProfile] = useState<Partial<UserProfile>>({});
    const [bmi, setBmi] = useState<number | null>(null);
    const [bmiCategory, setBmiCategory] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const getBmiCategory = (bmiValue: number) => {
        if (bmiValue < 18.5) return 'Underweight';
        if (bmiValue < 25) return 'Normal weight';
        if (bmiValue < 30) return 'Overweight';
        return 'Obese';
    };

    const calculateBmi = useCallback((heightCm?: number, weightKg?: number) => {
        if (heightCm && weightKg && heightCm > 0 && weightKg > 0) {
            const heightM = heightCm / 100;
            const bmiValue = weightKg / (heightM * heightM);
            setBmi(bmiValue);
            setBmiCategory(getBmiCategory(bmiValue));
        } else {
            setBmi(null);
            setBmiCategory('');
        }
    }, []);

    const fetchProfile = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        };
        setIsLoading(true);
        const userProfile = await getProfile();
        if (userProfile) {
            setProfile(userProfile);
            calculateBmi(userProfile.height, userProfile.weight);
        }
        setIsLoading(false);
    }, [user, calculateBmi]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setProfile(prev => ({ ...prev, [id]: value }));
    };
    
    const handleCalculateAndSave = async () => {
        calculateBmi(profile.height, profile.weight);
        setIsSaving(true);
        try {
            await saveProfile({ height: profile.height, weight: profile.weight });
            toast({ title: "Profile Updated", description: "Your height and weight have been saved." });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not save your data.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const getCategoryColor = () => {
        switch (bmiCategory) {
            case 'Underweight': return 'text-blue-500';
            case 'Normal weight': return 'text-green-500';
            case 'Overweight': return 'text-yellow-500';
            case 'Obese': return 'text-red-500';
            default: return 'text-foreground';
        }
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>BMI Calculator</CardTitle>
                <CardDescription>Assess your body mass index.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col space-y-4">
                {isLoading ? (
                    <div className="space-y-4">
                         <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-full" />
                         <Skeleton className="h-10 w-full" />
                    </div>
                ): (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="height">Height (cm)</Label>
                                <Input id="height" type="number" placeholder="e.g., 175" value={profile.height || ''} onChange={handleProfileChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="weight">Weight (kg)</Label>
                                <Input id="weight" type="number" placeholder="e.g., 70" value={profile.weight || ''} onChange={handleProfileChange} />
                            </div>
                        </div>
                        <div className="flex-grow" />
                        {bmi !== null && (
                            <div className="text-center p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">Your BMI is</p>

                                <div>
                                    <span className="text-3xl font-bold">{bmi.toFixed(1)}</span>
                                    <span className={`ml-2 font-semibold ${getCategoryColor()}`}>{bmiCategory}</span>
                                </div>
                            </div>
                        )}
                        <Button onClick={handleCalculateAndSave} disabled={isSaving || !profile.height || !profile.weight}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                            {isSaving ? 'Saving...' : 'Calculate & Save'}
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

export default BMICalculator;
