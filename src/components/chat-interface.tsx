'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { chatbotTherapy } from '@/ai/flows/chatbot-therapy';
import { voiceMoodDetection } from '@/ai/flows/voice-mood-detection';
import { useToast } from '@/hooks/use-toast';
import { Send, Mic, Square, Loader2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from './views/chat';
import { Avatar, AvatarFallback } from './ui/avatar';
import CrisisOptions from './crisis-options';
import type { Friend } from '@/services/friends';
import type { UserProfile } from '@/services/profile';

interface ChatInterfaceProps {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    friends: Friend[];
    profile: Partial<UserProfile> | null;
}

// Helper to create a serializable profile object by removing Firestore Timestamps
const getSerializableProfile = (profile: Partial<UserProfile> | null): Partial<UserProfile> | undefined => {
  if (!profile) return undefined;
  const { updatedAt, lastSeen, ...serializableProfile } = profile;
  return serializableProfile;
};

const ChatInterface = ({ messages, setMessages, isLoading, setIsLoading, friends, profile }: ChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [finalTranscript, setFinalTranscript] = useState('');
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);

  const [speechRecognition, setSpeechRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = true;
        recognitionInstance.interimResults = true;
        
        recognitionInstance.onresult = (event) => {
          let interimTranscript = '';
          let final = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          if(final) setFinalTranscript(final);
          setInput(interimTranscript);
        };

        setSpeechRecognition(recognitionInstance);
    }
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageContent };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const serializableProfile = getSerializableProfile(profile);

      const response = await chatbotTherapy({ 
        userInput: messageContent, 
        chatHistory,
        userProfile: serializableProfile,
      });
      
      const botMessage: Message = { 
        role: 'bot', 
        content: response.therapyResponse,
        showCrisisOptions: response.showCrisisOptions,
      };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response from Juvo.',
      });
      setMessages((prev) => [...prev, { role: 'bot', content: "I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSendVoiceMessage = async (audioData: string, transcript: string) => {
      if (!transcript.trim()) {
        toast({ title: "Couldn't hear you", description: "Please try speaking again.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const userMessage: Message = { role: 'user', content: transcript, isVoice: true };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);
      
      try {
        const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
        const serializableProfile = getSerializableProfile(profile);
        
        const result = await voiceMoodDetection({ 
            audioDataUri: audioData, 
            transcript, 
            chatHistory,
            userProfile: serializableProfile,
        });
        
        const botMessage: Message = { 
            role: 'bot', 
            content: result.response, 
            showCrisisOptions: result.sadnessLevel === 'high' 
        };
        setMessages((prev) => [...prev, botMessage]);

        if(result.audioResponse) {
            const audio = new Audio(result.audioResponse);
            audio.play();
        }
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to process voice input.',
        });
      } finally {
        setIsLoading(false);
        setAudioDataUri(null);
        setFinalTranscript('');
      }
  };

  useEffect(() => {
    if(audioDataUri && finalTranscript) {
        handleSendVoiceMessage(audioDataUri, finalTranscript);
    }
    // This effect should only run when both audio and transcript are ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioDataUri, finalTranscript]);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({ variant: 'destructive', title: 'Error', description: 'Voice recording is not supported by your browser.' });
      return;
    }
    if (!speechRecognition) {
      toast({ variant: 'destructive', title: 'Error', description: 'Speech recognition is not supported by your browser.' });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setFinalTranscript(''); 
      setAudioDataUri(null);
      
      speechRecognition.start();

      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.start();
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Permission Denied', description: 'Microphone access is required for voice chat.' });
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsLoading(true);
    
    if (speechRecognition) {
      speechRecognition.stop();
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result as string;
          setAudioDataUri(base64Audio);
        };
      };
      mediaRecorderRef.current.stop();
    } else {
        setIsLoading(false);
    }
  };
  
  const handleMicClick = () => {
      if (isRecording) {
          stopRecording();
      } else {
          startRecording();
      }
  }
  
  const handleCrisisOptionDismiss = () => {
    setMessages(prevMessages => prevMessages.map(msg => 
        msg.showCrisisOptions ? { ...msg, showCrisisOptions: false } : msg
    ));
  };


  return (
    <div className="flex h-full flex-col bg-muted/20">
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-6 sm:p-6">
          {messages.map((message, index) => (
            <div key={index}>
              <div className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : '')}>
                {message.role === 'bot' && (
                  <Avatar className="h-8 w-8 border bg-card">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        <Bot size={18} />
                      </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn('max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl shadow-sm', message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground')}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-card text-muted-foreground text-sm border">
                        <User size={18} />
                      </AvatarFallback>
                  </Avatar>
                )}
              </div>
              {message.role === 'bot' && message.showCrisisOptions && (
                  <div className="flex justify-start pl-11 pt-2">
                     <CrisisOptions friends={friends} onDismiss={handleCrisisOptionDismiss} />
                  </div>
              )}
            </div>
          ))}
          {isLoading && messages.length > 0 && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 border bg-card">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  <Bot size={18} />
                </AvatarFallback>
              </Avatar>
              <div className="bg-card p-3 rounded-xl shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
           {isLoading && messages.length === 0 && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="border-t bg-background p-2 sm:p-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(input);}} className="relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isRecording ? "Listening..." : "Message Juvo..."}
            className="pr-20 bg-card border-border h-11"
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleMicClick}
              disabled={isLoading}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              className="text-muted-foreground hover:text-foreground"
            >
              {isRecording ? <Square className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              disabled={isLoading || isRecording || !input.trim()}
              className="text-primary disabled:text-muted-foreground hover:text-primary"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;

    
