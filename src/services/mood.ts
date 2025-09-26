
'use client';

import { 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs,
    addDoc,
    serverTimestamp,
    Timestamp,
    Firestore,
    limit
} from 'firebase/firestore';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, subHours, startOfMonth, endOfMonth } from 'date-fns';


export interface MoodLog {
    id?: string;
    userId: string;
    mood: string; // The name of the mood, e.g., "Happy"
    score: number;
    timestamp: Timestamp;
}

export interface MoodLogWithDate extends MoodLog {
    date: Date;
}


export interface MoodEntry {
    day: string;
    mood: number; // The score of the mood
    date: Date;
}


/**
 * Saves a new mood log to Firestore.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user.
 * @param moodData The mood data to save (mood name and score).
 */
export async function saveMoodLog(
    firestore: Firestore,
    userId: string,
    moodData: { mood: string; score: number }
): Promise<void> {
    const moodLogRef = collection(firestore, 'users', userId, 'mood_logs');
    await addDoc(moodLogRef, {
        ...moodData,
        userId: userId,
        timestamp: serverTimestamp(),
    });
}

/**
 * Fetches the mood logs for a user for the current week (Sun-Sat).
 * @param firestore The Firestore instance.
 * @param userId The ID of the user.
 * @returns An array of mood entries for the chart.
 */
export async function getWeeklyMood(
    firestore: Firestore,
    userId: string
): Promise<MoodEntry[]> {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 }); // Saturday

    const moodLogRef = collection(firestore, 'users', userId, 'mood_logs');
    const q = query(
        moodLogRef,
        where('timestamp', '>=', weekStart),
        where('timestamp', '<=', weekEnd),
        orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const moodLogs: MoodLog[] = [];
    querySnapshot.forEach((doc) => {
        moodLogs.push({ id: doc.id, ...doc.data() } as MoodLog);
    });

    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return daysOfWeek.map(day => {
        const logForDay = moodLogs.find(log => isSameDay(log.timestamp.toDate(), day));
        return {
            day: format(day, 'EEE'),
            mood: logForDay ? logForDay.score : 0, // Return score or 0 if not logged
            date: day,
        };
    });
}

/**
 * Fetches all mood logs for a given month and year.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user.
 * @param year The full year (e.g., 2025).
 * @param month The month index (0-11).
 * @returns An array of mood logs with a JS Date object.
 */
export async function getMonthlyMoodLogs(
    firestore: Firestore,
    userId: string,
    year: number,
    month: number
): Promise<MoodLogWithDate[]> {
    const monthStart = startOfMonth(new Date(year, month));
    const monthEnd = endOfMonth(new Date(year, month));

    const moodLogRef = collection(firestore, 'users', userId, 'mood_logs');
    const q = query(
        moodLogRef,
        where('timestamp', '>=', monthStart),
        where('timestamp', '<=', monthEnd)
    );

    const querySnapshot = await getDocs(q);
    const moodLogs: MoodLogWithDate[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data() as MoodLog;
        moodLogs.push({ 
            ...data, 
            id: doc.id,
            date: data.timestamp.toDate() 
        });
    });

    return moodLogs;
}


/**
 * Fetches mood logs for the last 48 hours for a user.
 * @param firestore The Firestore instance.
 * @param userId The ID of the user.
 * @returns An array of mood logs from the last 48 hours.
 */
export async function getMoodForLast48Hours(
    firestore: Firestore,
    userId: string,
): Promise<MoodLog[]> {
    const now = new Date();
    const fortyEightHoursAgo = subHours(now, 48);

    const moodLogRef = collection(firestore, 'users', userId, 'mood_logs');
    const q = query(
        moodLogRef,
        where('timestamp', '>=', fortyEightHoursAgo),
        orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const moodLogs: MoodLog[] = [];
    querySnapshot.forEach((doc) => {
        moodLogs.push({ id: doc.id, ...doc.data() } as MoodLog);
    });

    return moodLogs;
}
