// src/services/notifications.ts
import { auth, getDb } from '@/lib/firebase';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  orderBy,
  limit,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: 'insight' | 'nudge' | 'reinforcement';
  read: boolean;
  createdAt: Date;
}

interface CreateNotificationDto {
    message: string;
    type: Notification['type'];
}

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be logged in to manage notifications.');
    return user.uid;
}

export const createNotification = async (data: CreateNotificationDto): Promise<void> => {
    try {
        const userId = getUserId();
        const db = await getDb();
        await addDoc(collection(db, 'notifications'), {
            userId,
            ...data,
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        // Fail silently as this is a background task
        console.error('Error creating notification:', error);
    }
}

export const getNotifications = async (notificationLimit: number = 10): Promise<Notification[]> => {
    try {
        const userId = getUserId();
        const db = await getDb();
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(notificationLimit)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
             const data = doc.data();
             return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as Timestamp).toDate(),
            } as Notification
        });
    } catch (error) {
        console.error('Error getting notifications:', error);
        return [];
    }
}

export const markNotificationsAsRead = async (): Promise<void> => {
    try {
        const userId = getUserId();
        const db = await getDb();
        
        // Find all unread notifications for the user
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', userId),
            where('read', '==', false)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return; // Nothing to update
        }

        // Use a batch write to update all of them at once
        const batch = writeBatch(db);
        querySnapshot.docs.forEach(doc => {
            batch.update(doc.ref, { read: true });
        });

        await batch.commit();

    } catch (error) {
        console.error('Error marking notifications as read:', error);
        // Do not throw, as this is not a critical user-facing error
    }
}
