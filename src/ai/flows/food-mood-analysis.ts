
'use server';

/**
 * @fileOverview Analyzes a user's food diary in the context of their mood.
 *
 * - foodMoodAnalysis - A function that performs the analysis.
 * - FoodMoodAnalysisInput - The input type.
 * - FoodMoodAnalysisOutput - The output type.
 */

import { ai } from '@/ai/genkit';
import { FoodMoodAnalysisInputSchema, FoodMoodAnalysisOutputSchema, type FoodMoodAnalysisInput, type FoodMoodAnalysisOutput } from '@/app/types';


export async function foodMoodAnalysis(input: FoodMoodAnalysisInput): Promise<FoodMoodAnalysisOutput> {
  return foodMoodAnalysisFlow(input);
}


const prompt = ai.definePrompt({
  name: 'foodMoodAnalysisPrompt',
  input: { schema: FoodMoodAnalysisInputSchema },
  output: { schema: FoodMoodAnalysisOutputSchema },
  prompt: `You are a gentle and encouraging wellness assistant. Your task is to analyze a user's food diary and their current mood to find potential connections. Your tone should be supportive and curious, not prescriptive or clinical.

  **CRITICAL RULES:**
  1.  **Never give medical advice.** Do not diagnose, treat, or make definitive claims.
  2.  Use phrases like "Sometimes, certain foods can influence...", "You might notice...", "It could be interesting to see if...".
  3.  Keep the analysis brief (2-3 sentences).
  4.  Provide **one** simple, actionable suggestion.
  5.  If the user's mood is positive (e.g., "Happy", "Good"), acknowledge that and look for what might be supporting it.
  6.  If a BMI category is provided, gently incorporate it into the context if relevant (e.g., for energy levels), but do not focus on weight loss.

  **Analysis Context:**
  -   **User's Mood:** {{{mood}}}
  -   **User's Food Diary:** {{{foodDiary}}}
  {{#if bmiCategory}}-   **User's BMI Category:** {{{bmiCategory}}}{{/if}}

  **Example Scenarios:**
  -   **Input**: Mood: "Stressed", Food Diary: "Coffee, energy drink, skipped lunch, pizza for dinner"
  -   **Good Output**: "High caffeine intake and skipping meals can sometimes contribute to feelings of stress and anxiety. It might be interesting to see if incorporating a balanced lunch, perhaps with some protein, could help support more stable energy levels throughout the day."

  -   **Input**: Mood: "Tired", Food Diary: "Sugary cereal for breakfast, pasta for lunch, cookies"
  -   **Good Output**: "It looks like your day included several sources of quick-burning carbohydrates. While these can give a fast energy boost, they can sometimes lead to a crash later on. Pairing these with a source of protein or fiber can often help sustain energy for longer."

  -   **Input**: Mood: "Happy", Food Diary: "Oatmeal with berries, chicken salad, apple with peanut butter, grilled fish with veggies"
  -   **Good Output**: "It's wonderful that you're feeling happy today! Your food diary is full of balanced meals with protein, fiber, and healthy fats, which is a fantastic way to support stable energy and mood."

  Now, provide your analysis based on the user's input.
  `,
});


const foodMoodAnalysisFlow = ai.defineFlow(
  {
    name: 'foodMoodAnalysisFlow',
    inputSchema: FoodMoodAnalysisInputSchema,
    outputSchema: FoodMoodAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      return {
        analysis: "I'm having a little trouble analyzing that right now. Please try again in a moment.",
      };
    }
    return output;
  }
);
