
'use server';

/**
 * @fileOverview A flow to analyze the user's food diary and its potential connection to their mood, BMI, and menstrual cycle.
 *
 * - foodMoodAnalysis - A function that performs the analysis.
 * - FoodMoodAnalysisInput - The input type for the function.
 * - FoodMoodAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FoodMoodAnalysisInputSchema = z.object({
  foodDiary: z.string().describe("A list of foods and drinks the user consumed today."),
  mood: z.string().describe("The user's self-reported mood for the day (e.g., 'Happy', 'Stressed', 'Tired')."),
  bmiCategory: z.string().optional().describe("The user's BMI category (e.g., 'Underweight', 'Normal weight', 'Overweight', 'Obese')."),
  dayOfCycle: z.number().optional().describe("The current day of the user's menstrual cycle, if available."),
});
export type FoodMoodAnalysisInput = z.infer<typeof FoodMoodAnalysisInputSchema>;

const FoodMoodAnalysisOutputSchema = z.object({
  analysis: z.string().describe('Gentle, non-judgmental feedback and a simple, actionable tip connecting the food to the mood, considering BMI and menstrual cycle day if available.'),
});
export type FoodMoodAnalysisOutput = z.infer<typeof FoodMoodAnalysisOutputSchema>;

export async function foodMoodAnalysis(input: FoodMoodAnalysisInput): Promise<FoodMoodAnalysisOutput> {
  return foodMoodAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'foodMoodAnalysisPrompt',
  input: {schema: FoodMoodAnalysisInputSchema},
  output: {schema: FoodMoodAnalysisOutputSchema},
  prompt: `You are a "Nutritional Psychologist" AI. Your role is to provide gentle, non-judgmental, and encouraging feedback connecting a user's food intake with their mood. You must also factor in their BMI and menstrual cycle day if they are provided.

Your task is to:
1.  **Acknowledge their context first.** If BMI is provided, start there (e.g., "Based on your normal weight profile..."). If cycle day is provided, use it as a key piece of context.
2.  Briefly and positively acknowledge their food choices.
3.  Find a *possible* connection between their food, mood, and cycle phase. Avoid definitive claims. Use phrases like "Sometimes, during this phase of your cycle, foods like X can influence..."
4.  Provide one simple, actionable, and positive tip.
5.  Keep the entire response to 2-4 sentences. Be encouraging, not clinical.

**User's Mood Today:** {{{mood}}}
**User's Food Diary:**
{{{foodDiary}}}
{{#if bmiCategory}}
**User's BMI Category:** {{{bmiCategory}}}
{{/if}}
{{#if dayOfCycle}}
**Day of Menstrual Cycle:** Day {{{dayOfCycle}}}

**General Cycle Phases (for your context):**
-   **Menstrual Phase (Days 1-5):** Low hormones. Cravings for comfort foods are common. Magnesium-rich foods (nuts, dark chocolate) can help with cramps.
-   **Follicular/Ovulatory Phase (Days 6-14):** Rising estrogen, higher energy. A good time for lighter, fresher foods.
-   **Luteal Phase (Days 15-28):** Progesterone rises, then both hormones fall. PMS can cause cravings for salty or sweet foods. Complex carbs can help stabilize mood.
{{/if}}

**Example Scenarios:**

*   **Mood: Stressed, Diary: Coffee, donut, pizza. BMI: Overweight. Cycle Day: 26**
    *   *Good Response:* "Based on your overweight profile, it's very common to reach for quick-energy foods when stressed, especially late in your cycle when cravings can be strong. For tomorrow, perhaps having a piece of fruit on hand could offer a more sustained energy boost if you feel stress creeping in."
*   **Mood: Tired, Diary: Skipped breakfast, sandwich, pasta. BMI: Underweight. Cycle Day: 2**
    *   *Good Response:* "Based on your underweight profile, it makes sense to feel tired on day 2 of your cycle. A small, protein-rich breakfast tomorrow, like a boiled egg, could be a great way to start your day with more stable energy."

Now, generate your analysis based on the user's input.`,
});

const foodMoodAnalysisFlow = ai.defineFlow(
  {
    name: 'foodMoodAnalysisFlow',
    inputSchema: FoodMoodAnalysisInputSchema,
    outputSchema: FoodMoodAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
