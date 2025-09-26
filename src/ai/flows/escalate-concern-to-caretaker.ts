'use server';
/**
 * @fileOverview This file defines a Genkit flow to escalate concerns to caretakers.
 *
 * - escalateConcernToCaretaker - A function that takes conversation history and user info and escalates concerns to caretakers if necessary.
 * - EscalateConcernToCaretakerInput - The input type for the escalateConcernToCaretaker function.
 * - EscalateConcernToCaretakerOutput - The return type for the escalateConcernToCaretaker function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EscalateConcernToCaretakerInputSchema = z.object({
  conversationHistory: z.string().describe('The history of the conversation with the user.'),
  userInfo: z.object({
    userId: z.string().describe('The unique ID of the user.'),
    caretakerEmails: z.array(z.string()).describe('The list of caretaker email addresses.'),
    caretakerPhoneNumbers: z.array(z.string()).describe('The list of caretaker phone numbers.'),
  }).describe('User information including caretaker contact details.'),
});
export type EscalateConcernToCaretakerInput = z.infer<typeof EscalateConcernToCaretakerInputSchema>;

const EscalateConcernToCaretakerOutputSchema = z.object({
  escalationNeeded: z.boolean().describe('Whether or not the concern needs to be escalated to caretakers.'),
  reason: z.string().optional().describe('The reason for escalation, if any.'),
});
export type EscalateConcernToCaretakerOutput = z.infer<typeof EscalateConcernToCaretakerOutputSchema>;

export async function escalateConcernToCaretaker(
  input: EscalateConcernToCaretakerInput
): Promise<EscalateConcernToCaretakerOutput> {
  return escalateConcernToCaretakerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'escalateConcernToCaretakerPrompt',
  input: {
    schema: EscalateConcernToCaretakerInputSchema,
  },
  output: {
    schema: EscalateConcernToCaretakerOutputSchema,
  },
  prompt: `You are an AI assistant that analyzes conversation history to determine if there is a need to escalate concerns to the user's caretakers.

  Here is the conversation history:
  {{conversationHistory}}

  Based on the conversation, determine if the user is exhibiting persistent negative sentiment, high distress, or mentioning concerning keywords that suggest they need immediate help.

  Respond with JSON. Set escalationNeeded to true if there is a need to escalate, and false otherwise. If escalationNeeded is true, provide a brief reason for the escalation.
`,
});

const escalateConcernToCaretakerFlow = ai.defineFlow(
  {
    name: 'escalateConcernToCaretakerFlow',
    inputSchema: EscalateConcernToCaretakerInputSchema,
    outputSchema: EscalateConcernToCaretakerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
