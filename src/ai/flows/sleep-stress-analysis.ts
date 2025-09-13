
'use server';

/**
 * @fileOverview An AI flow to analyze the user's sleep patterns and their connection to stress and mood.
 *
 * - sleepStressAnalysis - A function that performs the analysis.
 * - SleepStressAnalysisInput - The input type for the function.
 * - SleepStressAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { UserProfile } from '@/services/profile';

const SleepStressAnalysisInputSchema = z.object({
  sleepSchedule: z.custom<UserProfile['sleepSchedule']>().optional().describe("The user's typical sleep schedule, including weekday and weekend wake/sleep times."),
  recentMoods: z.array(z.object({
    mood: z.string(),
    timestamp: z.string().describe("ISO 8601 timestamp of when the mood was logged. This should be ignored when generating the insight."),
  })).describe("A list of the user's mood logs from the last 48 hours, selected from the main dashboard (e.g., Happy, Good, Okay, Stressed, Anxious)."),
});
export type SleepStressAnalysisInput = z.infer<typeof SleepStressAnalysisInputSchema>;

const SleepStressAnalysisOutputSchema = z.object({
  analysis: z.string().describe('A concise and actionable insight connecting sleep patterns to recent moods, or a suggestion to fix an unhealthy schedule.'),
});
export type SleepStressAnalysisOutput = z.infer<typeof SleepStressAnalysisOutputSchema>;

export async function sleepStressAnalysis(input: SleepStressAnalysisInput): Promise<SleepStressAnalysisOutput> {
  return sleepStressAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sleepStressAnalysisPrompt',
  input: {schema: SleepStressAnalysisInputSchema},
  output: {schema: SleepStressAnalysisOutputSchema},
  prompt: `You are a sleep science and mental wellness expert. Your goal is to provide a simple, compassionate, and actionable insight based on a user's sleep schedule and their recent moods logged on the dashboard.

**Your Primary Task: First, validate the user's sleep schedule.**
Calculate the sleep duration from their bedtime to their wake-up time. Bedtime is when they go to sleep, and wake-up time is when they wake up the next day.
- Weekday Schedule: Bedtime {{{sleepSchedule.weekdaySleep}}} -> Wake-up {{{sleepSchedule.weekdayWake}}}
- Weekend Schedule: Bedtime {{{sleepSchedule.weekendSleep}}} -> Wake-up {{{sleepSchedule.weekendWake}}}

**CRITICAL RULE:**
If the calculated sleep duration for their weekday or weekend schedule is **less than 6 hours** or seems illogical (e.g., waking up before bedtime on the same day), your ONLY response should be to gently point this out in a warm, caring tone.
- **Unhealthy Schedule Example Response:** "I noticed your sleep schedule is quite short. Getting enough rest is so important for your well-being, so perhaps we could look at adjusting it to allow for at least 7-9 hours?"

**If, and ONLY if, the sleep schedule is healthy (6+ hours), proceed to the secondary task:**
Analyze the user's recent dashboard moods and connect them to their sleep habits.

**IMPORTANT RULE:** You MUST completely IGNORE the specific timestamp of when a mood was logged. Your analysis should ONLY connect the feeling (the mood) with the user's defined sleep habits (their schedule).

**Context for Healthy Schedule Analysis:**
- **User's Sleep Schedule:**
  - Weekday: {{{sleepSchedule.weekdaySleep}}} - {{{sleepSchedule.weekdayWake}}}
  - Weekend: {{{sleepSchedule.weekendSleep}}} - {{{sleepSchedule.weekendWake}}}
- **User's Recent Dashboard Moods (Focus on the feeling, not the time):**
  {{#each recentMoods}}
  - Mood: {{{this.mood}}}
  {{/each}}

**Your Task for Healthy Schedules:**
Based on the dashboard moods and the healthy sleep schedule, generate a single, gentle insight.

-   **If moods are negative (e.g., 'Tired', 'Stressed', 'Anxious'):** Connect this directly to the importance of their sleep schedule.
    -   *Example if mood is 'Tired':* "Feeling tired can often be linked to our sleep patterns. Aiming to wind down before your {{{sleepSchedule.weekdaySleep}}} bedtime could help improve your energy levels."
    -   *Example if mood is 'Stressed':* "When you're feeling stressed, a consistent sleep schedule like yours can be a powerful tool for managing it. Making sure to get your full rest can really help."
-   **If moods are positive (e.g., 'Happy', 'Good'):** Reinforce the connection between their good mood and their consistent sleep habits.
    -   *Example if mood is 'Good':* "It's wonderful that you're feeling good! A regular sleep schedule like yours is a fantastic foundation for maintaining that positive energy."

**DO NOT:**
-   **DO NOT** mention the time a mood was logged.
-   **DO NOT** make up any details.

Now, perform your primary task of validating the schedule, and then proceed only if it is healthy.`,
});

const sleepStressAnalysisFlow = ai.defineFlow(
  {
    name: 'sleepStressAnalysisFlow',
    inputSchema: SleepStressAnalysisInputSchema,
    outputSchema: SleepStressAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

