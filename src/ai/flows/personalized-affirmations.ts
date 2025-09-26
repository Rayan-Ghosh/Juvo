
'use server';

/**
 * @fileOverview A Genkit flow for generating personalized affirmations.
 *
 * - generateAffirmation - A function that generates a positive affirmation based on user's mood and needs.
 */

import { ai } from '@/ai/genkit';
import { GenerateAffirmationInputSchema, GenerateAffirmationOutputSchema, type GenerateAffirmationInput, type GenerateAffirmationOutput } from '@/app/types';


export async function generateAffirmation(input: GenerateAffirmationInput): Promise<GenerateAffirmationOutput> {
  return generateAffirmationFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateAffirmationPrompt',
  input: { schema: GenerateAffirmationInputSchema },
  output: { schema: GenerateAffirmationOutputSchema },
  prompt: `You are an expert in crafting positive affirmations. Your task is to generate a short, powerful, and personal affirmation for a user.

The affirmation MUST be:
- In the first person (using "I" or "My").
- Positive and empowering.
- Directly related to the user's stated mood and needs.
- No more than 1-2 sentences long.

User's Mood: {{{mood}}}
User's Need: {{{needs}}}

Example:
Mood: Anxious about exams
Need: Calm and focus
Affirmation: "I am calm and focused. I am prepared to do my best."
`,
});


const generateAffirmationFlow = ai.defineFlow(
  {
    name: 'generateAffirmationFlow',
    inputSchema: GenerateAffirmationInputSchema,
    outputSchema: GenerateAffirmationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      return {
        affirmation: "I am capable of handling whatever comes my way.",
      };
    }
    return output;
  }
);
