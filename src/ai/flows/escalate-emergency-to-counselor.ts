'use server';
/**
 * @fileOverview Escalates a chat to a university counselor in case of emergency.
 *
 * - escalateEmergencyToCounselor - A function that escalates the emergency to the counselor.
 * - EscalateEmergencyToCounselorInput - The input type for the escalateEmergencyToCounselor function.
 * - EscalateEmergencyToCounselorOutput - The return type for the escalateEmergencyToCounselor function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EscalateEmergencyToCounselorInputSchema = z.object({
  chatContent: z.string().describe('The content of the current chat session.'),
});
export type EscalateEmergencyToCounselorInput = z.infer<typeof EscalateEmergencyToCounselorInputSchema>;

const EscalateEmergencyToCounselorOutputSchema = z.object({
  messageToUser: z.string().describe('A message to display to the user in the chat.'),
  caretakerAlertSent: z.boolean().describe('Whether an alert was sent to the caretakers.'),
  counselorAlertSent: z.boolean().describe('Whether an alert was sent to the university counselor.'),
});
export type EscalateEmergencyToCounselorOutput = z.infer<typeof EscalateEmergencyToCounselorOutputSchema>;

export async function escalateEmergencyToCounselor(
  input: EscalateEmergencyToCounselorInput
): Promise<EscalateEmergencyToCounselorOutput> {
  return escalateEmergencyToCounselorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'escalateEmergencyToCounselorPrompt',
  input: {schema: EscalateEmergencyToCounselorInputSchema},
  output: {schema: EscalateEmergencyToCounselorOutputSchema},
  prompt: `You are an AI assistant that determines the need to escalate a user's chat to a university counselor.

  Given the following chat content, determine if the situation warrants immediate attention due to the user expressing thoughts of self-harm, suicide, or violence towards others. If so, generate a message to display to the user with resources like a crisis hotline number and a button to directly contact the university counselor. Also, indicate that alerts should be sent to caretakers and the university counselor.

  If the situation does not seem to be an emergency, return an empty messageToUser and set both caretakerAlertSent and counselorAlertSent to false.

  Chat Content: {{{chatContent}}}

  Respond in JSON format.
  `,
});

const escalateEmergencyToCounselorFlow = ai.defineFlow(
  {
    name: 'escalateEmergencyToCounselorFlow',
    inputSchema: EscalateEmergencyToCounselorInputSchema,
    outputSchema: EscalateEmergencyToCounselorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
