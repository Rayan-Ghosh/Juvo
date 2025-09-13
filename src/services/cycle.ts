// src/services/cycle.ts
import { auth, getDb } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be logged in to manage your cycle.');
    return user.uid;
}

export const addCycleLog = async (): Promise<void> => {
  try {
    const userId = getUserId();
    const db = await getDb();
    await addDoc(collection(db, 'cycleEntries'), {
      userId,
      startDate: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error adding cycle log: ', error);
    throw new Error('Failed to log cycle start.');
  }
};

export const getLatestCycleLog = async (): Promise<{ date: Date } | null> => {
    try {
        const userId = getUserId();
        const db = await getDb();
        const q = query(
            collection(db, 'cycleEntries'),
            where('userId', '==', userId),
            orderBy('startDate', 'desc'),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            return {
                date: (data.startDate as Timestamp).toDate(),
            };
        }
        return null;
    } catch (error) {
        console.error("Error getting latest cycle log:", error);
        return null;
    }
};
