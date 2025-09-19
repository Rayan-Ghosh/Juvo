'use server';

/**
 * @fileOverview A flow to generate personalized wellness insights based on the user's menstrual cycle day and mood.
 *
 * - cycleInsights - A function that generates the insight.
 * - CycleInsightsInput - The input type for the function.
 * - CycleInsightsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import { createNotification } from '@/services/notifications';
import {z} from 'genkit';

const CycleInsightsInputSchema = z.object({
  dayOfCycle: z.number().describe("The current day of the user's menstrual cycle (e.g., 1, 14, 25)."),
  mood: z.string().describe("The user's self-reported mood for the day (e.g., 'Happy', 'Stressed', 'Anxious', 'Tired')."),
});
export type CycleInsightsInput = z.infer<typeof CycleInsightsInputSchema>;

const CycleInsightsOutputSchema = z.object({
  insight: z.string().describe('A compassionate and actionable insight connecting their cycle day and mood.'),
});
export type CycleInsightsOutput = z.infer<typeof CycleInsightsOutputSchema>;

export async function cycleInsights(input: CycleInsightsInput): Promise<CycleInsightsOutput> {
  return cycleInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'cycleInsightsPrompt',
  input: {schema: CycleInsightsInputSchema},
  output: {schema: CycleInsightsOutputSchema},
  prompt: `You are an empathetic wellness AI specializing in menstrual health. Your goal is to provide a concise, supportive, and actionable insight based on the user's cycle day and current mood.

Your response should:
1. Acknowledge the user's feelings and the current phase of their cycle.
2. Provide a simple scientific or wellness-based explanation for why they might be feeling this way.
3. Offer one small, gentle, and actionable tip.
4. Keep the entire response to 2-3 sentences. Be warm and supportive, not overly clinical.

**User's Current Mood:** {{{mood}}}
**Day of Menstrual Cycle:** Day {{{dayOfCycle}}}

**General Cycle Phases (for your context):**
-   **Menstrual Phase (Days 1-5):** Low estrogen/progesterone. Can cause fatigue, cramps, low mood.
-   **Follicular Phase (Days 6-14):** Estrogen rises. Energy and mood often improve.
-   **Ovulatory Phase (Around Day 14):** Peak estrogen. High energy, peak mood.
-   **Luteal Phase (Days 15-28):** Progesterone rises, then both hormones fall before menstruation. Can cause PMS symptoms like irritability, anxiety, bloating, and low energy.

**Example Scenarios:**

*   **Mood: Anxious, Day: 25**
    *   *Good Response:* "It's very common to feel anxious as hormone levels dip late in your cycle. Be extra gentle with yourself. A warm, calming cup of herbal tea might feel really comforting right now."
*   **Mood: Tired, Day: 2**
    *   *Good 'Response:* "Feeling tired makes perfect sense on day 2, as your body is working hard and hormones are low. Prioritizing rest is key. Consider a short, 10-minute nap if you can find a moment."
*   **Mood: Happy, Day: 12**
    *   *Good Response:* "It's wonderful that you're feeling happy! Your energy is likely rising as you approach ovulation. It's a great day to channel that positive energy into a walk or a creative activity."

Now, generate your insight based on the user's input.`,
});

const cycleInsightsFlow = ai.defineFlow(
  {
    name: 'cycleInsightsFlow',
    inputSchema: CycleInsightsInputSchema,
    outputSchema: CycleInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate cycle insight.');
    }
    
    // Create a notification for the user
    await createNotification({
        message: output.insight,
        type: 'insight'
    });

    return output;
  }
);
