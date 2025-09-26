
'use client';

// This file primarily defines the ChatMessage type for client-side usage.
// The logic for adding messages to Firestore has been moved to a server action
// in `src/app/actions.ts` to avoid client->server invocation errors.

export interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}
    