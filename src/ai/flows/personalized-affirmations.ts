// src/ai/flows/personalized-affirmations.ts
'use server';

/**
 * @fileOverview A flow to generate personalized affirmations based on user input.
 *
 * - generateAffirmation - A function that generates personalized affirmations.
 * - PersonalizedAffirmationInput - The input type for the generateAffirmation function.
 * - PersonalizedAffirmationOutput - The return type for the generateAffirmation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedAffirmationInputSchema = z.object({
  mood: z.string().describe('The current mood of the user.'),
  needs: z.string().describe('The specific needs of the user.'),
});
export type PersonalizedAffirmationInput = z.infer<typeof PersonalizedAffirmationInputSchema>;

const PersonalizedAffirmationOutputSchema = z.object({
  affirmation: z.string().describe('A personalized affirmation for the user.'),
});
export type PersonalizedAffirmationOutput = z.infer<typeof PersonalizedAffirmationOutputSchema>;

export async function generateAffirmation(input: PersonalizedAffirmationInput): Promise<PersonalizedAffirmationOutput> {
  return personalizedAffirmationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedAffirmationPrompt',
  input: {schema: PersonalizedAffirmationInputSchema},
  output: {schema: PersonalizedAffirmationOutputSchema},
  prompt: `You are a personalized affirmation generator. Generate a single affirmation based on the user's current mood and needs.

Mood: {{{mood}}}
Needs: {{{needs}}}

Affirmation:`,
});

const personalizedAffirmationFlow = ai.defineFlow(
  {
    name: 'personalizedAffirmationFlow',
    inputSchema: PersonalizedAffirmationInputSchema,
    outputSchema: PersonalizedAffirmationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
