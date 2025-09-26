
'use server';

/**
 * @fileOverview Analyzes a user's menstrual cycle day and mood.
 *
 * - cycleInsights - A function that performs the analysis.
 * - CycleInsightInput - The input type.
 * - CycleInsightOutput - The output type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CycleInsightInputSchema, CycleInsightOutputSchema, type CycleInsightInput, type CycleInsightOutput } from '@/app/types';


export async function cycleInsights(input: CycleInsightInput): Promise<CycleInsightOutput> {
  return cycleInsightFlow(input);
}


const prompt = ai.definePrompt({
  name: 'cycleInsightPrompt',
  input: { schema: CycleInsightInputSchema },
  output: { schema: CycleInsightOutputSchema },
  prompt: `You are a gentle and encouraging wellness assistant specializing in menstrual health. Your task is to analyze a user's current day in their menstrual cycle and their mood to provide a supportive insight.

**CRITICAL RULES:**
1.  **Never give medical advice.** Do not diagnose or make definitive claims. Use phrases like "It's common to feel...", "Some people find that...", "You might consider...".
2.  **Acknowledge the Cycle Day**: Relate your insight to the typical hormonal changes of that phase (Menstrual: days 1-5, Follicular: days 6-14, Ovulatory: days 15-18, Luteal: days 19-28).
3.  **Connect to Mood**: Directly address the user's stated mood within the context of the cycle phase.
4.  **Provide One Actionable Suggestion**: Offer a simple, supportive tip for self-care or symptom management.
5.  **Keep it Brief**: The entire insight should be 2-3 sentences.

**Analysis Context:**
-   **Day of Cycle:** {{{dayOfCycle}}}
-   **User's Mood:** {{{mood}}}

**Example Scenarios:**
-   **Input**: Day of Cycle: 2, Mood: "Tired"
-   **Good Output**: "It's completely normal to feel tired during the first few days of your period as your body is hard at work. Gentle activities like stretching or a warm bath can sometimes help ease discomfort and boost your energy levels."

-   **Input**: Day of Cycle: 25, Mood: "Anxious"
-   **Good Output**: "It's common to experience feelings of anxiety or stress in the late luteal phase before your period begins. You might find that mindfulness exercises or a calming cup of herbal tea helps to find a moment of peace."

Now, provide your analysis based on the user's input.
`,
});


const cycleInsightFlow = ai.defineFlow(
  {
    name: 'cycleInsightFlow',
    inputSchema: CycleInsightInputSchema,
    outputSchema: CycleInsightOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      return {
        insight: "I'm having a little trouble generating an insight right now. Please try again in a moment.",
      };
    }
    return output;
  }
);
