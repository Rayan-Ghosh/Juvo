
import { z } from 'zod';

// Zod schemas and types for Community Post
export const ModerateCommunityPostInputSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters.' }).max(150),
  content: z.string().min(10, { message: 'Post content must be at least 10 characters.' }),
});
export type ModerateCommunityPostInput = z.infer<typeof ModerateCommunityPostInputSchema>;

export const ModerateCommunityPostOutputSchema = z.object({
  isApproved: z.boolean().describe('Whether the post is approved and can be published.'),
  reason: z
    .string()
    .optional()
    .describe('The reason for rejection, if the post is not approved. This will be shown to the user.'),
});
export type ModerateCommunityPostOutput = z.infer<typeof ModerateCommunityPostOutputSchema>;


// Zod schemas and types for Community Reply
export const ModerateCommunityReplyInputSchema = z.object({
  replyContent: z.string().min(1, { message: 'Reply cannot be empty.' }).max(2000),
});
export type ModerateCommunityReplyInput = z.infer<typeof ModerateCommunityReplyInputSchema>;

export const ModerateCommunityReplyOutputSchema = z.object({
  isApproved: z.boolean().describe('Whether the reply is approved and can be published.'),
  reason: z
    .string()
    .optional()
    .describe('The reason for rejection, if the reply is not approved. This will be shown to the user.'),
});
export type ModerateCommunityReplyOutput = z.infer<typeof ModerateCommunityReplyOutputSchema>;

// Zod schemas and types for Affirmation Generator
export const GenerateAffirmationInputSchema = z.object({
  mood: z.string().describe("The user's current mood, e.g., 'Anxious', 'Tired'"),
  needs: z.string().describe("What the user feels they need right now, e.g., 'Confidence', 'Peace'"),
});
export type GenerateAffirmationInput = z.infer<typeof GenerateAffirmationInputSchema>;

export const GenerateAffirmationOutputSchema = z.object({
  affirmation: z.string().describe('A short, positive, first-person affirmation.'),
});
export type GenerateAffirmationOutput = z.infer<typeof GenerateAffirmationOutputSchema>;

// Zod schemas and types for Food/Mood Analysis
export const FoodMoodAnalysisInputSchema = z.object({
  foodDiary: z.string().describe("A list of foods and drinks the user consumed today."),
  mood: z.string().describe("The user's self-reported mood for the day (e.g., 'Happy', 'Stressed')."),
  bmiCategory: z.string().optional().describe("The user's calculated BMI category (e.g., 'Underweight', 'Normal weight', 'Overweight')."),
});
export type FoodMoodAnalysisInput = z.infer<typeof FoodMoodAnalysisInputSchema>;

export const FoodMoodAnalysisOutputSchema = z.object({
  analysis: z.string().describe("A brief, helpful, and non-judgmental analysis (2-3 sentences) connecting the food diary to the user's mood. Provide one concrete, actionable suggestion. Phrase it as a general tip, not a command."),
});
export type FoodMoodAnalysisOutput = z.infer<typeof FoodMoodAnalysisOutputSchema>;


// Zod schemas and types for Sleep/Stress Analysis
export const SleepStressAnalysisInputSchema = z.object({
  sleepSchedule: z
    .object({
      weekdayWake: z.string().optional(),
      weekdaySleep: z.string().optional(),
      weekendWake: z.string().optional(),
      weekendSleep: z.string().optional(),
    })
    .optional()
    .describe('The user\'s typical sleep schedule.'),
  recentMoods: z
    .array(
      z.object({
        mood: z.string(),
        timestamp: z.string().describe('ISO 8601 timestamp'),
      })
    )
    .describe('A list of mood logs from the last 48 hours.'),
});
export type SleepStressAnalysisInput = z.infer<typeof SleepStressAnalysisInputSchema>;


export const SleepStressAnalysisOutputSchema = z.object({
    analysis: z.string().describe('A brief, insightful analysis connecting sleep patterns and recent moods. Provide one actionable piece of advice.'),
});
export type SleepStressAnalysisOutput = z.infer<typeof SleepStressAnalysisOutputSchema>;


// Zod schemas and types for Cycle Insight
export const CycleInsightInputSchema = z.object({
    dayOfCycle: z.number().describe("The current day of the user's menstrual cycle (e.g., day 1, day 14)."),
    mood: z.string().describe("The user's self-reported mood for the day (e.g., 'Happy', 'Stressed', 'Anxious')."),
});
export type CycleInsightInput = z.infer<typeof CycleInsightInputSchema>;

export const CycleInsightOutputSchema = z.object({
    insight: z.string().describe("A brief, helpful, and non-judgmental insight connecting the day of the cycle to the user's mood. Provide one concrete, actionable suggestion related to self-care or symptom management."),
});
export type CycleInsightOutput = z.infer<typeof CycleInsightOutputSchema>;
