'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from './ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { getMoodForLast48Hours, MoodLog } from '@/services/mood';

const moodOptions: { [key: number]: string } = {
  5: 'Happy',
  4: 'Good',
  3: 'Okay',
  2: 'Stressed',
  1: 'Anxious',
};

const moodColors: { [key: number]: string } = { 
    5: 'hsl(var(--chart-1))', 
    4: 'hsl(var(--chart-2))', 
    3: 'hsl(var(--chart-3))', 
    2: 'hsl(var(--chart-4))', 
    1: 'hsl(var(--chart-5))',
};


const WellnessCheck = () => {
    const { user } = useAuth();
    const [moodData, setMoodData] = useState<MoodLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMood = async () => {
            if (!user) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const data = await getMoodForLast48Hours();
            setMoodData(data);
            setIsLoading(false);
        };

        fetchMood();
    }, [user]);

    const chartData = useMemo(() => {
        return moodData.map(log => ({
            time: log.createdAt.getTime(),
            mood: log.mood,
            moodName: log.moodName,
            formattedTime: format(log.createdAt, 'MMM d, h:mm a'),
        }));
    }, [moodData]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>48-Hour Mood Trend</CardTitle>
                <CardDescription>Your mood fluctuations over the last two days.</CardDescription>
            </CardHeader>
            <CardContent className="h-48">
                {isLoading ? (
                    <Skeleton className="h-full w-full" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {chartData.length > 0 ? (
                            <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="time"
                                    type="number"
                                    domain={['dataMin', 'dataMax']}
                                    tickFormatter={(unixTime) => format(new Date(unixTime), 'h a')}
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis 
                                    domain={[1, 5]} 
                                    tickCount={5} 
                                    tickFormatter={(value) => moodOptions[value] || ''} 
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    width={70}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                    <div className="flex flex-col">
                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">Mood</span>
                                                        <span className="font-bold" style={{ color: moodColors[data.mood] }}>
                                                            {data.moodName}
                                                        </span>
                                                         <span className="text-xs text-muted-foreground pt-1">
                                                            {data.formattedTime}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                     cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="mood"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    dot={{
                                        r: 4,
                                        fill: 'hsl(var(--primary))',
                                    }}
                                    activeDot={{
                                        r: 6,
                                        stroke: 'hsl(var(--card))',
                                        strokeWidth: 2,
                                    }}
                                />
                            </LineChart>
                        ) : (
                            <div className="flex h-full w-full items-center justify-center">
                                <p className="text-sm text-muted-foreground">No mood data logged in the last 48 hours.</p>
                            </div>
                        )}
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}

export default WellnessCheck;
