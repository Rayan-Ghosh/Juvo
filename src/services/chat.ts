// src/services/chat.ts
import { auth, getDb } from '@/lib/firebase';
import { doc, setDoc, getDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import type { Message } from '@/components/views/chat';

const CHAT_EXPIRATION_HOURS = 48;

/**
 * Saves the user's chat history to Firestore.
 * @param messages The array of messages to save.
 */
export const saveChatHistory = async (messages: Message[]): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    // Fail silently if no user is logged in
    return;
  }

  try {
    const db = await getDb();
    const chatRef = doc(db, 'chats', user.uid);
    
    // We only want to store the core message data, not transient UI state
    const storableMessages = messages.map(({ role, content, isVoice }) => ({
        role,
        content,
        ...(isVoice && { isVoice }),
    }));

    await setDoc(chatRef, {
      messages: storableMessages,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error saving chat history:', error);
    // We don't throw here to avoid disrupting the user experience for a background save failure.
  }
};

/**
 * Retrieves the user's chat history from Firestore if it's not expired.
 * @returns An array of messages or null if no valid history is found.
 */
export const getChatHistory = async (): Promise<Message[] | null> => {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  try {
    const db = await getDb();
    const chatRef = doc(db, 'chats', user.uid);
    const docSnap = await getDoc(chatRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const savedTimestamp = data.timestamp as Timestamp;
      
      const now = new Date().getTime();
      const savedTime = savedTimestamp.toDate().getTime();
      const hoursDiff = (now - savedTime) / (1000 * 60 * 60);

      if (hoursDiff < CHAT_EXPIRATION_HOURS) {
        return data.messages as Message[];
      }
    }
    
    // Return null if document doesn't exist or is expired
    return null;
  } catch (error) {
    console.error('Error getting chat history:', error);
    return null;
  }
};
