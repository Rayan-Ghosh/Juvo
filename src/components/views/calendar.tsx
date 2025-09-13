'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { getMoodEntries, MoodLog } from '@/services/mood';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '../ui/skeleton';
import { parseISO } from 'date-fns';

const moodConfig: { [key: number]: { name: string; color: string; class: string } } = {
  5: { name: 'Happy', color: '#4ade80', class: 'day-happy' },
  4: { name: 'Good', color: '#a3e635', class: 'day-good' },
  3: { name: 'Okay', color: '#facc15', class: 'day-okay' },
  2: { name: 'Stressed', color: '#f97316', class: 'day-stressed' },
  1: { name: 'Anxious', color: '#ef4444', class: 'day-anxious' },
};

const moodClasses = Object.values(moodConfig)
  .map(
    (mood) => `
    .${mood.class}::after {
      content: '';
      position: absolute;
      bottom: 6px;
      left: 50%;
      transform: translateX(-50%);
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: ${mood.color};
    }
  `
  )
  .join('\n');

const CalendarView = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchMoods = useCallback(async () => {
    if (!user) {
      setMoodLogs([]);
      setIsLoading(false);
      return;
    };
    setIsLoading(true);
    const entries = await getMoodEntries();
    setMoodLogs(entries);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMoods();
  }, [fetchMoods]);
  
  const moodModifiers = moodLogs.reduce((acc, log) => {
    const moodClass = moodConfig[log.mood]?.class;
    if (moodClass) {
      if (!acc[moodClass]) {
        acc[moodClass] = [];
      }
      // The `createdAt` is already a Date object from the service
      acc[moodClass].push(log.createdAt);
    }
    return acc;
  }, {} as Record<string, Date[]>);


  return (
    <>
      <style>{moodClasses}</style>
      <Card className="m-6">
        <CardHeader>
          <CardTitle>Mood Calendar</CardTitle>
          <CardDescription>View your mood history at a glance. A colored dot represents the mood you logged on that day.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {isLoading ? (
              <Skeleton className="w-[350px] h-[380px] rounded-md" />
          ) : (
              <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border p-4"
                  modifiers={moodModifiers}
                  modifiersClassNames={
                    Object.keys(moodModifiers).reduce((acc, key) => {
                      acc[key] = key;
                      return acc;
                    }, {} as Record<string,string>)
                  }
              />
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default CalendarView;
