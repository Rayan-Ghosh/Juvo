// src/services/friends.ts
import { auth, getDb } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

export interface Friend {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

const getUserId = () => {
    const user = auth.currentUser;
    if (!user) throw new Error('You must be logged in to manage friends.');
    return user.uid;
}


export const addFriend = async (name: string, email: string, phone?: string): Promise<void> => {
  try {
    const userId = getUserId();
    const db = await getDb();
    await addDoc(collection(db, 'friends'), {
      userId,
      name,
      email,
      phone,
    });
  } catch (error) {
    console.error('Error adding friend: ', error);
    throw new Error('Failed to add friend.');
  }
};

export const getFriends = async (): Promise<Friend[]> => {
  try {
    const userId = getUserId();
    const db = await getDb();
    const q = query(
      collection(db, 'friends'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    const friends: Friend[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => ({
      id: doc.id,
      ...doc.data()
    } as Friend));
    
    return friends;
  } catch (error) {
    console.error('Error getting friends: ', error);
    return [];
  }
};

export const removeFriend = async (friendId: string): Promise<void> => {
    try {
        const db = await getDb();
        await deleteDoc(doc(db, 'friends', friendId));
    } catch (error) {
        console.error('Error removing friend: ', error);
        throw new Error('Failed to remove friend.');
    }
};
