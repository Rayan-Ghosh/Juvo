
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell, CartesianGrid } from 'recharts';
import { getWeeklyMood, getTodaysMood, addMoodEntry, MoodLog, MoodEntry } from '@/services/mood';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Smile, Meh, Frown, ExternalLink } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import MoodLogger from '../mood-logger';
import HealthVitals from '../health-vitals';
import ResourcesView from '../resources-view';
import { getProfile, updateUserLastSeen, UserProfile } from '@/services/profile';
import { cn } from '@/lib/utils';
import BMICalculator from '../bmi-calculator';
import FoodDiary from '../food-diary';
import CycleTracker from '../cycle-tracker';
import SleepTracker from '../sleep-tracker';
import HydrationTracker from '../hydration-tracker';
import BMIDisplay from '../bmi-display';
import type { View } from '../dashboard';


const moodColors: { [key: number]: string } = { 1: 'hsl(var(--chart-5))', 2: 'hsl(var(--chart-4))', 3: 'hsl(var(--chart-3))', 4: 'hsl(var(--chart-2))', 5: 'hsl(var(--chart-1))', 0: 'hsl(var(--muted))' };

const moodOptions = [
    { level: 5, label: 'Happy' },
    { level: 4, label: 'Good' },
    { level: 3, label: 'Okay' },
    { level: 2, label: 'Stressed' },
    { level: 1, label: 'Anxious' },
];

interface OverviewProps {
    setActiveView: (view: View) => void;
}

const Overview = ({ setActiveView }: OverviewProps) => {
    const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);
    const [todaysMood, setTodaysMood] = useState<MoodLog | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [loggingMood, setLoggingMood] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchDashboardData = useCallback(async () => {
        setIsDataLoading(true);
        if (!user) {
            const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const emptyData = daysOfWeek.map(day => ({
                day,
                mood: 0,
                date: new Date(),
            }));
            setMoodHistory(emptyData);
            setTodaysMood(null);
            setProfile(null);
        } else {
            await updateUserLastSeen();
            const [weeklyData, todayData, userProfile] = await Promise.all([
                getWeeklyMood(),
                getTodaysMood(),
                getProfile(),
            ]);
            setMoodHistory(weeklyData);
            setTodaysMood(todayData);
            setProfile(userProfile);
        }
        setIsDataLoading(false);
    }, [user]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleMoodSelect = async (moodName: string, moodValue: number) => {
        if (todaysMood || loggingMood) return;

        setLoggingMood(moodName);
        try {
            await addMoodEntry(moodValue, moodName);
            toast({
                title: 'Mood Logged',
                description: `You've logged your mood as: ${moodName}.`,
            });
            fetchDashboardData(); // Refetch data to update the UI
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not log your mood. Please try again.',
            });
        } finally {
            setLoggingMood(null);
        }
    };
    
    const AnimatedDiv = ({ className, style, children }: { className?: string, style?: React.CSSProperties, children: React.ReactNode }) => (
        <div className={cn(className, "animate-in fade-in-0 slide-in-from-bottom-4 duration-500")} style={style}>
            {children}
        </div>
    )

    return (
        <div className="p-4 sm:p-6 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnimatedDiv>
                    <MoodLogger 
                        todaysMood={todaysMood} 
                        handleMoodSelect={handleMoodSelect}
                        isLoading={isDataLoading}
                        loggingMood={loggingMood}
                    />
                </AnimatedDiv>
                <AnimatedDiv style={{ animationDelay: '100ms' }}>
                    <HealthVitals />
                </AnimatedDiv>
                 <AnimatedDiv style={{ animationDelay: '200ms' }}>
                    <HydrationTracker />
                </AnimatedDiv>
                <AnimatedDiv style={{ animationDelay: '300ms' }}>
                    {profile?.gender === 'female' ? <CycleTracker /> : <BMICalculator />}
                </AnimatedDiv>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AnimatedDiv className="lg:col-span-2" style={{ animationDelay: '400ms' }}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Your Weekly Mood Journey</CardTitle>
                            <CardDescription>Visualizing your mood patterns from the last 7 days.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-80">
                            {isDataLoading ? <Skeleton className="w-full h-full" /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart 
                                        data={moodHistory} 
                                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                                        onMouseMove={(state) => {
                                            if (state.isTooltipActive) {
                                              setActiveIndex(state.activeTooltipIndex!);
                                            }
                                          }}
                                        onMouseLeave={() => setActiveIndex(null)}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis 
                                            stroke="hsl(var(--muted-foreground))" 
                                            fontSize={12} 
                                            domain={[0, 5]} 
                                            tickCount={6} 
                                            tickFormatter={(value) => {
                                                if (value === 0) return '';
                                                return moodOptions.find(m => m.level === value)?.label || ''
                                            }}
                                            tickLine={false} 
                                            axisLine={false}
                                            width={70}
                                        />
                                        <RechartsTooltip
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--card))', 
                                                border: '1px solid hsl(var(--border))', 
                                                borderRadius: 'var(--radius)',
                                                boxShadow: '0 4px 12px hsla(var(--foreground) / 0.1)',
                                            }}
                                            labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: '600' }}
                                            formatter={(value: number, name, props) => {
                                                if (value === 0) return ['Not Logged', 'Mood'];
                                                const moodLabel = moodOptions.find(m => m.level === value)?.label || 'Unknown';
                                                return [moodLabel, 'Mood'];
                                            }}
                                            cursor={{ fill: 'hsla(var(--primary), 0.1)' }}
                                        />
                                        <Bar dataKey="mood" radius={[4, 4, 0, 0]}>
                                            {moodHistory.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={moodColors[entry.mood] || moodColors[0]}
                                                    style={{
                                                        transition: 'opacity 0.2s ease-in-out',
                                                        opacity: activeIndex === null || activeIndex === index ? 1 : 0.5,
                                                    }}
                                                />
                                            ))}
                                         </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </AnimatedDiv>
                
                <AnimatedDiv className="lg:col-span-1" style={{ animationDelay: '500ms' }}>
                    <ResourcesView />
                </AnimatedDiv>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <AnimatedDiv style={{ animationDelay: '600ms' }}>
                    <FoodDiary todaysMood={todaysMood} profile={profile} />
                </AnimatedDiv>
                <AnimatedDiv style={{ animationDelay: '700ms' }}>
                     <SleepTracker setActiveView={setActiveView} />
                </AnimatedDiv>
                 <AnimatedDiv style={{ animationDelay: '800ms' }}>
                     <BMIDisplay />
                </AnimatedDiv>
            </div>
        </div>
    );
};

export default Overview;
