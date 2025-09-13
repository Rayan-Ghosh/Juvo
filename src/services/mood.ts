'use client';
// src/services/mood.ts
import { auth, getDb } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { startOfWeek, endOfWeek, format, startOfDay, endOfDay, eachDayOfInterval, isSameDay } from 'date-fns';

export interface MoodEntry {
  day: string; // e.g., 'Mon', 'Tue'
  mood: number;
  date: Date;
}

export interface MoodLog {
    id: string;
    mood: number;
    moodName: string;
    createdAt: Date;
}

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) {
        // Return a dummy user ID for logged-out users to prevent errors,
        // though in a real app you might handle this more gracefully.
        return 'anonymous-user';
    }
    return user.uid;
}


export const addMoodEntry = async (mood: number, moodName: string): Promise<void> => {
  try {
    const userId = getUserId();
    const db = await getDb();
    await addDoc(collection(db, 'moodEntries'), {
      userId: userId,
      mood: mood,
      moodName: moodName,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding mood entry: ', error);
    throw new Error('Failed to log mood.');
  }
};

export const getTodaysMood = async (): Promise<MoodLog | null> => {
    try {
        const userId = getUserId();
        if (userId === 'anonymous-user') return null;
        
        const db = await getDb();
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        const q = query(
            collection(db, 'moodEntries'),
            where('userId', '==', userId),
            where('createdAt', '>=', todayStart),
            where('createdAt', '<=', todayEnd),
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            return {
                id: doc.id,
                mood: data.mood,
                moodName: data.moodName,
                createdAt: (data.createdAt as Timestamp).toDate(),
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting today\'s mood:', error);
        return null;
    }
}

export const getMoodEntries = async (): Promise<MoodLog[]> => {
    try {
        const userId = getUserId();
        if (userId === 'anonymous-user') return [];

        const db = await getDb();
        const q = query(
            collection(db, 'moodEntries'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                mood: data.mood,
                moodName: data.moodName,
                createdAt: (data.createdAt as Timestamp).toDate(),
            };
        });
    } catch (error) {
        console.error('Error getting mood entries:', error);
        return [];
    }
}

export const getWeeklyMood = async (): Promise<MoodEntry[]> => {
  try {
    const userId = getUserId();
    const now = new Date();
    // Use Sunday as the start of the week to match the UI
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    if (userId === 'anonymous-user') {
      return daysInWeek.map(day => ({
        day: format(day, 'E'),
        mood: 0,
        date: day,
      }));
    }

    const db = await getDb();
    const q = query(
      collection(db, 'moodEntries'),
      where('userId', '==', userId),
      where('createdAt', '>=', weekStart),
      where('createdAt', '<=', weekEnd)
    );

    const querySnapshot = await getDocs(q);
    const moodLogs: MoodLog[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as any),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
    })).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // Sort chronologically

    // Use a map to store only the latest mood for each day
    const moodDataMap = new Map<string, number>(); // Key: 'yyyy-MM-dd', Value: mood
    moodLogs.forEach(log => {
        const dayKey = format(log.createdAt, 'yyyy-MM-dd');
        moodDataMap.set(dayKey, log.mood); // Overwrites earlier entries for the same day
    });
    
    // Create the final array for the chart
    const weeklyMoodData = daysInWeek.map(day => {
        const dayKey = format(day, 'yyyy-MM-dd');
        const moodValue = moodDataMap.get(dayKey) || 0;
        return {
            day: format(day, 'E'), // 'Sun', 'Mon', etc.
            mood: moodValue,
            date: day,
        };
    });

    return weeklyMoodData;

  } catch (error) {
    console.error('Error getting weekly mood: ', error);
    // Return an empty week structure on error
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return daysOfWeek.map(day => ({
        day,
        mood: 0,
        date: new Date(),
      }));
  }
};

export const getMoodForLast48Hours = async (): Promise<MoodLog[]> => {
    try {
        const userId = getUserId();
        if (userId === 'anonymous-user') return [];

        const now = new Date();
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

        const db = await getDb();
        const q = query(
            collection(db, 'moodEntries'),
            where('userId', '==', userId),
            where('createdAt', '>=', fortyEightHoursAgo),
            orderBy('createdAt', 'asc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                mood: data.mood,
                moodName: data.moodName,
                createdAt: (data.createdAt as Timestamp).toDate(),
            };
        });
    } catch (error) {
        console.error('Error getting mood for last 48 hours:', error);
        return [];
    }
};
