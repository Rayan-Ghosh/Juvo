
'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppShell } from '@/components/app-shell';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { handleChatMessage, handleVoiceMessage } from '@/app/actions';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Loader2, Send, Mic, Square, Play, Phone, Users, MessageSquare, Languages, Sparkles, UserPlus, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, orderBy, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { useCollection, type WithId } from '@/firebase/firestore/use-collection';
import type { ChatMessage } from '@/services/chat';
import { getUserProfile, UserProfile } from '@/services/profile';
import { Card, CardContent } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar');
const aiAvatar = PlaceHolderImages.find((img) => img.id === 'ai-avatar');

// Helper function to add messages to Firestore
const addChatMessageToDb = async (firestore: any, userId: string, message: Omit<ChatMessage, 'timestamp'>) => {
  if (!userId) {
    console.error('User ID is required to add a chat message.');
    return;
  }
  try {
    const chatCollectionRef = collection(firestore, 'users', userId, 'chats');
    await addDoc(chatCollectionRef, {
      ...message,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding chat message to Firestore:', error);
    // In a real app, this should be handled more gracefully, perhaps with a toast
  }
};

const GUEST_MESSAGE_LIMIT = 5;

export default function ChatPage() {
  const isAuthReady = useAuthGuard({ allowAnonymous: true });
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [messages, setMessages] = useState<WithId<ChatMessage>[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showCrisisUI, setShowCrisisUI] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('Auto-detect');


  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const isGuest = user?.isAnonymous || false;
  const userMessageCount = useMemo(() => {
    return messages.filter((m) => m.role === 'user').length;
  }, [messages]);
  const isMessageLimitReached = isGuest && userMessageCount >= GUEST_MESSAGE_LIMIT;

  useEffect(() => {
    const fetchProfile = async () => {
        setIsProfileLoading(true);
        if (user && !user.isAnonymous && firestore) {
            const userProfile = await getUserProfile(firestore, user.uid);
            if (userProfile?.role === 'institution' || userProfile?.role === 'college-admin') {
                router.replace('/dashboard');
            } else {
                setProfile(userProfile);
            }
        }
        setIsProfileLoading(false);
    };

    if (isAuthReady) {
       if (user) {
        fetchProfile();
      } else {
        // If there's no user and auth is ready, it's likely a guest just signed in.
        setIsProfileLoading(false);
      }
    }
  }, [user?.uid, user?.isAnonymous, firestore, router, isAuthReady]);


  const chatMessagesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    const fortyEightHoursAgo = Timestamp.fromMillis(Date.now() - 48 * 60 * 60 * 1000);
    return query(
      collection(firestore, 'users', user.uid, 'chats'),
      where('timestamp', '>=', fortyEightHoursAgo),
      orderBy('timestamp', 'asc')
    );
  }, [firestore, user?.uid]);

  const { data: initialMessages, isLoading: isLoadingMessages } = useCollection<ChatMessage>(chatMessagesQuery);

  useEffect(() => {
    if (initialMessages) {
      const formattedMessages = initialMessages
        .map((m) => ({
          ...m,
          timestamp: (m.timestamp as unknown as Timestamp)?.toDate() || new Date(),
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      setMessages(formattedMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const showCrisisMessage = (sadnessLevel: 'normal' | 'high', showCrisisOptions: boolean) => {
    if (sadnessLevel === 'high') {
      toast({
        variant: 'destructive',
        title: 'A concern has been raised',
        description: "Based on the conversation, we've gently notified your caretaker to check in.",
      });
    }

    if (showCrisisOptions) {
      setShowCrisisUI(true);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user || !firestore || isMessageLimitReached) return;

    const userMessageContent = input;
    setInput('');

    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessageContent,
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, { ...newUserMessage, id: Math.random().toString() }]);
    addChatMessageToDb(firestore, user.uid, newUserMessage);

    setIsLoading(true);

    try {
      const chatHistory = [...messages, newUserMessage].slice(-10).map(({ role, content }) => ({ role, content }));
      
      const languageToSend = selectedLanguage === 'Auto-detect' ? undefined : selectedLanguage;
      const result = await handleChatMessage(userMessageContent, chatHistory, user.uid, languageToSend);


      const newAiMessage: ChatMessage = {
        role: 'bot',
        content: result.therapyResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, { ...newAiMessage, id: Math.random().toString() }]);
      addChatMessageToDb(firestore, user.uid, newAiMessage);

      showCrisisMessage(result.sadnessLevel, result.showCrisisOptions);
    } catch (error) {
      console.error('Error handling chat message:', error);
      const errorAiMessage: ChatMessage = {
        role: 'bot',
        content: "I'm sorry, I seem to be having trouble connecting. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, { ...errorAiMessage, id: Math.random().toString() }]);
      addChatMessageToDb(firestore, user.uid, errorAiMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    if (isMessageLimitReached) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          if (!user || !firestore) return;
          const base64Audio = reader.result as string;

          setIsLoading(true);

          try {
            const chatHistory = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
            const result = await handleVoiceMessage(base64Audio, chatHistory, user.uid);

            const newUserMessage: ChatMessage = { role: 'user', content: `"${result.transcript}"`, timestamp: new Date() };
            const newAiMessage: ChatMessage = {
              role: 'bot',
              content: result.therapyResponse,
              audioUrl: result.audioResponse,
              timestamp: new Date(),
            };

            setMessages((prev) => [
              ...prev,
              { ...newUserMessage, id: Math.random().toString() },
              { ...newAiMessage, id: Math.random().toString() },
            ]);
            addChatMessageToDb(firestore, user.uid, newUserMessage);
            addChatMessageToDb(firestore, user.uid, newAiMessage);

            showCrisisMessage(result.sadnessLevel, result.showCrisisOptions);
          } catch (error) {
            console.error('Error processing voice message:', error);
            const errorAiMessage: ChatMessage = {
              role: 'bot',
              content: "I'm sorry, I couldn't process your voice message. Please try again.",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, { ...errorAiMessage, id: Math.random().toString() }]);
            addChatMessageToDb(firestore, user.uid, errorAiMessage);
          } finally {
            setIsLoading(false);
          }
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        variant: 'destructive',
        title: 'Microphone Error',
        description: 'Could not access the microphone. Please check your browser permissions.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
    }
    const audio = new Audio(audioUrl);
    activeAudioRef.current = audio;
    audio.play();
  };

  if (!isAuthReady || isUserLoading || isLoadingMessages || isProfileLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AppShell>
       <div className="flex flex-col h-full items-center">
        <div className="w-full h-full max-w-4xl flex flex-col">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              <div className="space-y-6 max-w-3xl mx-auto">
                  {messages.length === 0 && !isLoadingMessages && (
                      <div className="flex flex-col h-full items-center justify-center text-center text-foreground py-20">
                          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                          Hello, there
                          </h1>
                          <p className="text-lg text-muted-foreground mt-2">How can I help you today?</p>
                          
                          {isGuest && (
                          <p className="text-sm text-neutral-500 mt-8">
                              You have {GUEST_MESSAGE_LIMIT - userMessageCount} free messages remaining.
                          </p>
                          )}
                      </div>
                  )}
                  {messages.map((message) => (
                  <div
                      key={message.id}
                      className={cn('flex items-start gap-4', message.role === 'user' ? 'justify-end' : '')}
                  >
                      {message.role === 'bot' && (
                      <Avatar>
                          {aiAvatar && <AvatarImage src={aiAvatar.imageUrl} alt="AI Avatar" />}
                          <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                      )}
                      <div
                      className={cn(
                          'rounded-xl p-3 max-w-lg whitespace-pre-wrap relative',
                          message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-card'
                      )}
                      >
                      <p>{message.content}</p>
                      {message.audioUrl && (
                          <Button
                          onClick={() => playAudio(message.audioUrl)}
                          variant="ghost"
                          size="icon"
                          className="absolute -bottom-2 -right-2 h-8 w-8 bg-muted rounded-full shadow-lg"
                          >
                          <Play className="h-4 w-4 text-foreground" />
                          </Button>
                      )}
                      </div>
                      {message.role === 'user' && (
                      <Avatar>
                          {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User Avatar" />}
                          <AvatarFallback>{user?.isAnonymous ? 'G' : user?.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      )}
                  </div>
                  ))}
                  {isLoading && (
                  <div className="flex items-start gap-4">
                      <Avatar>
                      {aiAvatar && <AvatarImage src={aiAvatar.imageUrl} alt="AI Avatar" />}
                      <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                      <div className="rounded-lg p-3 bg-card">
                        <Loader2 className="h-5 w-5 animate-spin text-foreground" />
                      </div>
                  </div>
                  )}
              </div>
          </ScrollArea>

          <div className="p-4 bg-background/50 border-t border-border">
              {showCrisisUI ? (
                  <div className="flex flex-col sm:flex-row gap-2 max-w-3xl mx-auto">
                      <Button variant="destructive" className="flex-1" asChild>
                      <a href="tel:1-800-891-4416">
                          <Phone className="mr-2 h-4 w-4" /> Call Tele-MANAS (1-800-891-4416)
                      </a>
                      </Button>
                      <Button variant="secondary" className="flex-1">
                      <Users className="mr-2 h-4 w-4" /> Call a Friend
                      </Button>
                      <Button variant="secondary" className="flex-1" onClick={() => setShowCrisisUI(false)}>
                      <MessageSquare className="mr-2 h-4 w-4" /> Continue Chat
                      </Button>
                  </div>
              ) : isMessageLimitReached ? (
                  <div className="max-w-3xl mx-auto text-center space-y-4">
                      <p className="font-semibold text-foreground">You've reached your free message limit.</p>
                      <p className="text-muted-foreground">Sign up to continue your conversation and unlock all of Juvo's features.</p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button asChild>
                          <Link href="/sign-up"><UserPlus className="mr-2"/>Sign Up for Free</Link>
                      </Button>
                      <Button variant="outline" asChild>
                          <Link href="/sign-in"><LogIn className="mr-2"/>I have an account</Link>
                      </Button>
                      </div>
                  </div>
              ) : (
                  <div className="flex items-center gap-4 max-w-3xl mx-auto relative">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="shrink-0 bg-card rounded-full">
                                  {selectedLanguage === 'Auto-detect' ? <Sparkles className="mr-2 h-4 w-4 text-purple-400"/> : <Languages className="mr-2 h-4 w-4" />}
                                  {selectedLanguage}
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                              <DropdownMenuItem onSelect={() => setSelectedLanguage('Auto-detect')}>
                                  <Sparkles className="mr-2 h-4 w-4 text-purple-400"/> Auto-detect
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setSelectedLanguage('English')}>English</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setSelectedLanguage('Hindi')}>Hindi</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setSelectedLanguage('Odia')}>Odia</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setSelectedLanguage('Kashmiri')}>Kashmiri</DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>

                      <form onSubmit={handleTextSubmit} className="flex-1 flex items-center relative">
                          <input
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              placeholder={isRecording ? 'Recording... speak now.' : "Share what's on your mind..."}
                              className="w-full bg-card text-foreground placeholder:text-muted-foreground rounded-full py-3 px-6 pr-24 border focus:ring-2 focus:ring-ring focus:outline-none"
                              disabled={isLoading || isRecording}
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
                                  onClick={isRecording ? stopRecording : startRecording}
                                  disabled={isLoading}
                                  >
                                  {isRecording ? <Square className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
                              </Button>
                              <Button type="submit" size="icon" className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-500" disabled={isLoading || isRecording || !input.trim()}>
                                  <Send className="h-5 w-5" />
                              </Button>
                          </div>
                      </form>
                  </div>
              )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
