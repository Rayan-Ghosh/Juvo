
'use server';

/**
 * @fileOverview A flow to analyze the user's food diary and its potential connection to their mood and BMI.
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
});
export type FoodMoodAnalysisInput = z.infer<typeof FoodMoodAnalysisInputSchema>;

const FoodMoodAnalysisOutputSchema = z.object({
  analysis: z.string().describe('Gentle, non-judgmental feedback and a simple, actionable tip connecting the food to the mood, optionally considering their BMI.'),
});
export type FoodMoodAnalysisOutput = z.infer<typeof FoodMoodAnalysisOutputSchema>;

export async function foodMoodAnalysis(input: FoodMoodAnalysisInput): Promise<FoodMoodAnalysisOutput> {
  return foodMoodAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'foodMoodAnalysisPrompt',
  input: {schema: FoodMoodAnalysisInputSchema},
  output: {schema: FoodMoodAnalysisOutputSchema},
  prompt: `You are a "Nutritional Psychologist" AI. Your role is to provide gentle, non-judgmental, and encouraging feedback connecting a user's food intake with their mood. You should also subtly factor in their BMI category if it's provided.

You will receive a list of foods the user ate, their mood, and optionally their BMI category. Your task is to:
1.  **Acknowledge the user's BMI category first, if provided.** Start your response by stating their status, for example: "Based on your normal weight profile...". If no BMI is provided, skip this step.
2.  Briefly and positively acknowledge their food choices.
3.  Find a *possible* connection between their food and their mood. Avoid making definitive claims. Use phrases like "Sometimes, foods like X can influence..." or "It's interesting to see...".
4.  Provide one simple, actionable, and positive tip for the next day.
5.  Keep the entire response to 2-4 sentences. Be encouraging, not clinical.

**User's Mood Today:** {{{mood}}}
**User's Food Diary:**
{{{foodDiary}}}
{{#if bmiCategory}}
**User's BMI Category:** {{{bmiCategory}}}
{{/if}}

**Example Scenarios:**

*   **Mood: Stressed, Diary: Coffee, donut, pizza, coke. BMI: Overweight**
    *   *Good Response:* "Based on your overweight profile, it's common to reach for quick-energy foods when stressed. For tomorrow, perhaps having a piece of fruit on hand could offer a more sustained energy boost if you feel stress creeping in."
*   **Mood: Happy, Diary: Chicken salad, apple, water, yogurt. BMI: Normal weight**
    *   *Good Response:* "It's great to see your food choices for today! Given your normal weight profile, these balanced meals are excellent for supporting a positive mood and stable energy levels. Keep up the great work."
*   **Mood: Tired, Diary: Skipped breakfast, sandwich for lunch, pasta for dinner. BMI: Underweight**
    *   *Good Response:* "Based on your underweight profile, it makes sense to feel tired, especially on days where meals might be spaced far apart. A small, protein-rich breakfast tomorrow, like a boiled egg, could be a great way to start your day with more energy."

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
