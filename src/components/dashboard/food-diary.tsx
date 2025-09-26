
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { foodMoodAnalysis } from '@/ai/flows/food-mood-analysis';
import { Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import type { UserProfile } from '@/services/profile';

interface FoodDiaryProps {
    todaysMood: { mood: string; score: number; } | null;
    profile: Partial<UserProfile> | null;
}

const FoodDiary = ({ todaysMood, profile }: FoodDiaryProps) => {
    const { toast } = useToast();
    const [foodInput, setFoodInput] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const getBmiCategory = (heightCm?: number, weightKg?: number) => {
        if (heightCm && weightKg && heightCm > 0 && weightKg > 0) {
            const heightM = heightCm / 100;
            const bmiValue = weightKg / (heightM * heightM);
            if (bmiValue < 18.5) return 'Underweight';
            if (bmiValue < 25) return 'Normal weight';
            if (bmiValue < 30) return 'Overweight';
            return 'Obese';
        }
        return undefined;
    };

    const handleAnalyze = async () => {
        if (!foodInput.trim()) {
            toast({ title: 'Missing Input', description: 'Please log the food you have eaten today.', variant: 'destructive' });
            return;
        }
        if (!todaysMood) {
            toast({ title: 'Missing Mood', description: 'Please log your mood for today before analyzing your food.', variant: 'destructive' });
            return;
        }

        setIsLoading(true);
        setAnalysis('');
        try {
            const bmiCategory = getBmiCategory(profile?.height, profile?.weight);
            const result = await foodMoodAnalysis({
                foodDiary: foodInput,
                mood: todaysMood.mood,
                bmiCategory,
            });
            setAnalysis(result.analysis);
        } catch (error) {
            console.error('Food analysis error:', error);
            toast({ title: 'Analysis Failed', description: 'Could not analyze your food diary. Please try again.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="text-primary"/>
                    Food & Mood Diary
                </CardTitle>
                <CardDescription>Log your meals and let AI find connections to your mood.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea
                    placeholder="List the main things you've eaten today. e.g., &#10;- Coffee and a croissant for breakfast&#10;- Chicken salad for lunch&#10;- A few cookies in the afternoon&#10;- Pasta for dinner"
                    value={foodInput}
                    onChange={(e) => setFoodInput(e.target.value)}
                    rows={5}
                />
                <Button onClick={handleAnalyze} disabled={isLoading || !todaysMood || !foodInput} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Analyze My Day
                </Button>
                
                {!todaysMood && (
                    <Alert variant="destructive" className="text-center">
                        <AlertDescription>
                            Please log your mood today to enable analysis.
                        </AlertDescription>
                    </Alert>
                )}

                {analysis && (
                    <Alert>
                        <AlertDescription>
                            {analysis}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

export default FoodDiary;
