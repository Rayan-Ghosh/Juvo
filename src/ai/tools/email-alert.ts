'use server';

/**
 * @fileOverview AI chatbot that provides personalized therapy and console based on the user's input.
 *
 * - chatbotTherapy - A function that handles the chatbot therapy process.
 * - ChatbotTherapyInput - The input type for the chatbotTherapy function.
 * - ChatbotTherapyOutput - The return type for the chatbotTherapy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type {UserProfile} from '@/services/profile';
import {sendEmail} from '@/services/email';
import {getTodaysVitals} from '@/services/vitals';

const ChatbotTherapyInputSchema = z.object({
  userInput: z.string().optional().describe('The user input for the therapy session.'),
  chatHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'bot']),
        content: z.string(),
      })
    )
    .optional()
    .describe('The chat history of the conversation.'),
  voiceMood: z.string().optional().describe("The mood detected from the user's voice, if available."),
  userProfile: z.custom<Partial<UserProfile>>().optional().describe("The user's profile information, including caretaker details."),
});
export type ChatbotTherapyInput = z.infer<typeof ChatbotTherapyInputSchema>;

const ChatbotTherapyOutputSchema = z.object({
  therapyResponse: z.string().describe('The therapy response from the chatbot.'),
  sadnessLevel: z.enum(['none', 'medium', 'high']).describe('The detected level of sadness in the user\'s message.'),
  showCrisisOptions: z.boolean().describe("Set to true ONLY if the sadness level is 'high' to indicate that crisis intervention options should be shown to the user."),
  alertError: z.string().optional().describe("If sending an alert email fails, this will contain the error message."),
});
export type ChatbotTherapyOutput = z.infer<typeof ChatbotTherapyOutputSchema>;

export async function chatbotTherapy(input: ChatbotTherapyInput): Promise<ChatbotTherapyOutput> {
  return chatbotTherapyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'chatbotTherapyPrompt',
  input: {
    schema: z.object({
      userInput: ChatbotTherapyInputSchema.shape.userInput,
      chatHistory: ChatbotTherapyInputSchema.shape.chatHistory,
      voiceMood: ChatbotTherapyInputSchema.shape.voiceMood,
      vitals: z.any().optional(), // Vitals are for context only
      alertError: z.string().optional(), // Include error information if an alert failed
    }),
  },
  output: {
    schema: z.object({
      therapyResponse: ChatbotTherapyOutputSchema.shape.therapyResponse,
      sadnessLevel: ChatbotTherapyOutputSchema.shape.sadnessLevel,
    }),
  },
  prompt: `You are a compassionate and empathetic AI therapist named Juvo. Your primary role is to create a safe, non-judgmental space for the user. 
  
  Your first task is to analyze the user's message and determine their level of sadness. Categorize it into one of three levels: 'none', 'medium', or 'high'.

  - 'none': The user seems okay, content, or is just making small talk.
  - 'medium': The user is expressing clear signs of sadness, stress, or emotional pain.
  - 'high': The user is in significant distress, expressing feelings of hopelessness, crisis, or talking about being in a very dark place.

  You will then generate a supportive and therapeutic response.

  {{#if voiceMood}}
  An analysis of the user's voice has detected a mood of: **{{{voiceMood}}}**. You MUST factor this vocal analysis into your assessment of their sadness level and your response. The user's tone can often reveal more than their words.
  {{/if}}

  {{#if vitals}}
  The user has also logged the following health vitals today. Use this data as a strong indicator of their physiological state.
  - Blood Pressure: {{{vitals.bp}}}
  - Stress Level: {{{vitals.stress}}} / 100
  - SpO2: {{{vitals.spo2}}}%
  A high stress level, or abnormal BP/SpO2 could indicate underlying distress even if their words seem calm.
  {{/if}}

  {{#if alertError}}
  IMPORTANT: The system tried to send a caretaker alert but failed. You MUST gently inform the user about this. The error was: '{{{alertError}}}'. Frame it compassionately, for example: "I want to be transparent that a system I use to send alerts encountered an issue: {{{alertError}}}." Then, continue with your normal therapeutic response.
  {{/if}}

  **Conversation History:**
  Always consider the 'chatHistory' to understand the context and what has already been discussed. Do not repeat yourself. Your main goal is to be a consistent, helpful companion.

  {{#if userInput}}
    Here's the user's latest message: {{{userInput}}}
  {{else}}
    {{#if chatHistory}}
      Generate a short, friendly, and personalized "welcome back" message based on the previous conversation. Set sadnessLevel to 'none'.
    {{else}}
      Generate a welcoming message for a new user. Introduce yourself as Juvo and ask how their day has been. Set sadnessLevel to 'none'.
    {{/if}}
  {{/if}}

  Here's the full chat history, if it exists:
  {{#if chatHistory}}
    {{#each chatHistory}}
      {{role}}: {{content}}
    {{/each}}
  {{else}}
    No chat history available.
  {{/if}}

  Now, analyze the user's input, determine the sadness level, and generate your therapeutic response.
`,
});

const chatbotTherapyFlow = ai.defineFlow(
  {
    name: 'chatbotTherapyFlow',
    inputSchema: ChatbotTherapyInputSchema,
    outputSchema: ChatbotTherapyOutputSchema,
  },
  async input => {
    let alertError: string | undefined;

    // 1. Get initial analysis from the AI
    const vitals = await getTodaysVitals();
    const {output: initialOutput} = await prompt({
      userInput: input.userInput,
      chatHistory: input.chatHistory,
      voiceMood: input.voiceMood,
      vitals: vitals ?? undefined,
    });

    if (!initialOutput) {
      return {
        therapyResponse: "I'm not sure how to respond to that. Could you tell me more?",
        sadnessLevel: 'none',
        showCrisisOptions: false,
      };
    }

    const {sadnessLevel} = initialOutput;
    let therapyResponse = initialOutput.therapyResponse;

    // 2. If sadness is medium or high, the code (not the AI) sends the alert.
    if (sadnessLevel === 'medium' || sadnessLevel === 'high') {
      const profile = input.userProfile;

      if (!profile || !profile.caretakerEmail) {
        alertError = "No caretaker email is configured in the profile.";
      } else if (!input.userInput) {
        alertError = "Cannot send an alert without a user message.";
      } else {
        try {
          const subject =
            sadnessLevel === 'high'
              ? 'High Urgency Alert: Immediate Attention Recommended for Your Loved One'
              : 'Medium Urgency Alert: Check-in Recommended for Your Loved One';

          const body = `
            <p>This is an automated alert from Juvo, the AI mental wellness companion.</p>
            <p>An interaction with the user has been flagged as requiring your attention. The urgency has been assessed as: <strong>${sadnessLevel.toUpperCase()}</strong>.</p>
            <p>The message that triggered this alert was:</p>
            <blockquote style="border-left: 4px solid #ccc; padding-left: 1rem; font-style: italic;">
              "${input.userInput}"
            </blockquote>
            <p>We recommend checking in with them when you have a moment.</p>
            <p>Sincerely,<br/>The Juvo Team</p>
          `;

          await sendEmail({
            to: profile.caretakerEmail,
            subject,
            html: body,
          });
          console.log(`[chatbotTherapyFlow] Successfully sent ${sadnessLevel} alert to ${profile.caretakerEmail}`);
        } catch (error) {
          console.error('[chatbotTherapyFlow] Failed to send email alert:', error);
          alertError = error instanceof Error ? error.message : String(error);
        }
      }
    }

    // 3. If there was an error, get a new response from the AI that includes the error.
    if (alertError) {
      const {output: errorHandlingOutput} = await prompt({
        ...input,
        alertError,
        vitals: vitals ?? undefined,
      });
      if (errorHandlingOutput) {
        therapyResponse = errorHandlingOutput.therapyResponse;
      }
    }

    // 4. Return the final result
    return {
      therapyResponse,
      sadnessLevel,
      showCrisisOptions: sadnessLevel === 'high',
      alertError,
    };
  }
);