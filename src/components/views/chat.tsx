'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ChatInterface from '@/components/chat-interface';
import { useAuth } from '@/context/auth-context';
import { chatbotTherapy } from '@/ai/flows/chatbot-therapy';
import { useToast } from '@/hooks/use-toast';
import { getFriends, Friend } from '@/services/friends';
import { getProfile, UserProfile } from '@/services/profile';
import { getChatHistory, saveChatHistory } from '@/services/chat';


export interface Message {
  role: 'user' | 'bot';
  content: string;
  isVoice?: boolean;
  showCrisisOptions?: boolean;
}

// Helper to create a serializable profile object
const getSerializableProfile = (profile: Partial<UserProfile> | null): Partial<UserProfile> | undefined => {
    if (!profile) return undefined;
    const { updatedAt, lastSeen, ...serializableProfile } = profile;
    return serializableProfile;
};

const ChatView = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [profile, setProfile] = useState<Partial<UserProfile> | null>(null);
  const { toast } = useToast();
  
  // Effect to load chat history, friends, and generate initial greeting
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      if (!user) {
          setMessages([{ role: 'bot', content: "Hello, I am Juvo. How has your day been?" }]);
          setIsLoading(false);
          return;
      }
      
      try {
        // Fetch friends, profile, and chat history in parallel
        const [friendsList, userProfile, storedMessages] = await Promise.all([
          getFriends(),
          getProfile(),
          getChatHistory(),
        ]);
        
        setFriends(friendsList);
        setProfile(userProfile);

        if (storedMessages && storedMessages.length > 0) {
          setMessages(storedMessages.map(m => ({ ...m, showCrisisOptions: false })));
        } else {
          // If no history, fetch a new greeting.
          const serializableProfile = getSerializableProfile(userProfile);
          const response = await chatbotTherapy({ chatHistory: [], userProfile: serializableProfile });
          const botMessage: Message = { role: 'bot', content: response.therapyResponse };
          setMessages([botMessage]);
        }
      } catch (error) {
        console.error("Failed to load initial chat data", error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load your session. Using a default greeting.',
        });
        setMessages([{ role: 'bot', content: "Hello, I am Juvo. How has your day been?" }]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    // The dependency array is intentionally limited to trigger only on user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Effect to save chat history to Firestore
  useEffect(() => {
    if (!user || messages.length === 0 || isLoading) {
        return;
    }

    const saveHistory = async () => {
        try {
            await saveChatHistory(messages);
        } catch (error) {
            console.error("Failed to save chat history to Firestore", error);
            // Optionally, show a non-intrusive toast
        }
    };
    
    saveHistory();
  }, [messages, user, isLoading]);


  return (
    <div className="h-[calc(100vh-4rem)] w-full">
        <ChatInterface 
            messages={messages}
            setMessages={setMessages}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            friends={friends}
            profile={profile}
        />
    </div>
  );
};

export default ChatView;
