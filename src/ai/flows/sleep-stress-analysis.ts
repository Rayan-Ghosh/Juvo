
'use server';

/**
 * @fileOverview Analyzes a user's sleep schedule and recent moods to find connections.
 *
 * - sleepStressAnalysis - A function that performs the analysis.
 * - SleepStressAnalysisInput - The input type.
 * - SleepStressAnalysisOutput - The output type.
 */

import { ai } from '@/ai/genkit';
import { SleepStressAnalysisInputSchema, SleepStressAnalysisOutputSchema, type SleepStressAnalysisInput, type SleepStressAnalysisOutput } from '@/app/types';
import { handleSleepStressAnalysis } from '@/app/actions';


export async function sleepStressAnalysis(input: SleepStressAnalysisInput): Promise<SleepStressAnalysisOutput> {
  return sleepStressAnalysisFlow(input);
}


const prompt = ai.definePrompt({
  name: 'sleepStressAnalysisPrompt',
  input: { schema: SleepStressAnalysisInputSchema },
  output: { schema: SleepStressAnalysisOutputSchema },
  prompt: `You are a wellness expert specializing in circadian rhythms and their effect on mood. Your task is to analyze a user's sleep schedule and their recent mood logs to identify potential connections between their sleep habits and stress levels.

Your tone should be gentle, informative, and encouraging. Avoid making definitive medical claims. Use phrases like "It seems like...", "You might notice...", or "It could be helpful to consider...".

**CRITICAL RULES:**
1.  **Acknowledge Consistency or Inconsistency**: Start by commenting on the user's sleep schedule. Is it regular? Is there a big difference between weekdays and weekends?
2.  **Connect to Mood**: Look at the \`recentMoods\`. Is there a pattern? For example, did a 'Stressed' or 'Anxious' mood follow a late night?
3.  **Provide One Actionable Insight**: Offer one simple, clear suggestion based on your analysis. This should be a practical tip, not a generic "get more sleep."
4.  **Keep it Brief**: The entire analysis should be 2-4 sentences.

**Analysis Context:**
-   **User's Sleep Schedule:**
    -   Weekday Wake: {{{sleepSchedule.weekdayWake}}}
    -   Weekday Bedtime: {{{sleepSchedule.weekdaySleep}}}
    -   Weekend Wake: {{{sleepSchedule.weekendWake}}}
    -   Weekend Bedtime: {{{sleepSchedule.weekendSleep}}}
-   **Recent Moods (last 48 hours):**
    {{#each recentMoods}}
    -   Mood: {{{this.mood}}} at {{{this.timestamp}}}
    {{/each}}

**Example Scenarios:**
-   **Input**: Weekday sleep at "01:00", weekday wake at "07:00". Mood logs show "Tired" and "Stressed" in the afternoons.
-   **Good Output**: "It looks like your weekday sleep schedule is quite consistent, which is great. However, going to bed a bit later might be contributing to those feelings of tiredness and stress in the afternoon. It could be interesting to see if shifting your bedtime 30 minutes earlier makes a difference in your daytime energy levels."

-   **Input**: Weekday sleep "23:00", Weekend sleep "03:00". Mood logs show "Anxious" on Monday morning.
-   **Good output**: "I notice there's a significant shift in your sleep schedule between weekdays and weekends, which is sometimes called 'social jetlag'. This shift can sometimes make Monday mornings feel more difficult or anxious. Aiming to keep your weekend wake-up time within an hour of your weekday schedule could help ease that transition."

Now, provide your analysis based on the user's input.
`,
});


const sleepStressAnalysisFlow = ai.defineFlow(
  {
    name: 'sleepStressAnalysisFlow',
    inputSchema: SleepStressAnalysisInputSchema,
    outputSchema: SleepStressAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      return {
        analysis: "I'm having a little trouble analyzing your sleep patterns right now. Please try again in a moment.",
      };
    }
    return output;
  }
);

    