'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/voice-mood-detection.ts';
import '@/ai/flows/personalized-affirmations.ts';
import '@/ai/flows/chatbot-therapy.ts';
import '@/ai/flows/food-mood-analysis.ts';
import '@/ai/flows/cycle-insights.ts';
import '@/ai/flows/sleep-stress-analysis.ts';
