'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/voice-mood-detection.ts';
import '@/ai/flows/personalized-affirmations.ts';
import '@/ai/flows/chatbot-therapy.ts';
import '@/ai/flows/wellness-check-in.ts';
