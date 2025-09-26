
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
  language: z.string().optional().describe("The language the user has explicitly selected for the conversation."),
});
export type ChatbotTherapyInput = z.infer<typeof ChatbotTherapyInputSchema>;

const ChatbotTherapyOutputSchema = z.object({
  therapyResponse: z.string().describe('The therapy response from the chatbot.'),
  sadnessLevel: z.enum(['normal', 'high']).describe('The detected level of sadness in the user\'s message.'),
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
      language: ChatbotTherapyInputSchema.shape.language,
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
  prompt: `You are a compassionate and empathetic AI therapist named Juvo. Your primary role is to create a safe, non-judgmental space for the user. You are a multilingual AI and can understand and respond in Hindi, English, Hinglish, Odia, Urdu, and Kashmiri.

  **CRITICAL RULE**: Prioritize the user's chosen language.
  {{#if language}}
  The user has explicitly selected **{{{language}}}**. You MUST respond in this language.
  {{else}}
  You MUST respond in the exact same language and script the user uses. If the user writes in Hinglish (Hindi words with English letters), you MUST reply in Hinglish. Do not switch to the Devanagari script. For example, if the user says, "Main theek nahi hu," your reply should be something like, "Main samajh sakta hu," NOT "मैं समझ सकता हूँ." The same applies to Odia-English (Odia words with English letters).
  {{/if}}

  Your first task is to analyze the user's message and determine their level of sadness. Categorize it into one of two levels: 'normal' or 'high'.

  **IMPORTANT RULE**: If a user makes a vague statement about feeling unwell (e.g., "I'm not feeling good," "I feel off," "I'm down"), **always** classify it as 'normal' sadness unless there are other clear and strong indicators of a crisis in the *same* message. Do not escalate based on vague feelings alone.

  ### Normal / Slightly Distressed
  This category covers everyday negative emotions, temporary stress, or mild sadness where the user still shows signs of coping or resilience. The distress is manageable. Vague statements of feeling unwell without further crisis indicators belong here.
  **Examples:**
  - "I'm not feeling good today."
  - "I feel a bit down."
  - “I’m feeling okay today.”
  - “Work was a little stressful, but I’m fine.”
  - “I wish I had more energy, but it’s just one of those days.”
  - “The exams were a bit stressful but I don't want to think about it anymore.”
  - “I feel a bit tired after a long day.”
  - “I’m annoyed by that mistake, but I’ll get over it.”
  - “Things are a bit tough, but I’m managing.”
  - “Sometimes I get frustrated with the traffic.”
  - “I feel disappointed that my plans changed.”
  - “I’m a bit anxious about my exam, but I’m prepared.”
  - “I just need a short break to clear my head.”
  - “I’m bored at home today.”
  - “Feeling a little let down, but I know it’ll pass.”
  - “I’m trying to stay positive, even though this week’s been rough.”
  - “Wish I could relax more, life’s a little overwhelming sometimes.”
  - “It’s a dull day, but nothing’s seriously wrong.”

  ### High Level of Sadness
  This category is for significant distress, feelings of hopelessness, crisis, or being in a very dark place. The user may show an inability to cope with their feelings. Any mention of self-harm, not wanting to exist, or being completely overwhelmed by emotion falls into this category.
  **Examples:**
  - “I can’t stop crying and I feel hopeless.”
  - “Everything feels pointless right now.”
  - “The weight of sadness is crushing me.”
  - “I feel empty and nothing brings me joy anymore.”
  - “Getting out of bed feels impossible.”
  - “All I want to do is hide from everyone.”
  - “My feelings of distress are so intense that they completely take over.”
  - “I constantly think about how bad I feel.”
  - “I’m drowning in my own misery.”
  - “I have lost interest in everything I once enjoyed.”
  - “Every day feels like a major ordeal.”
  - “Nothing seems to get better, no matter what I try.”
  - “I’m ashamed of myself when I feel this sad.”
  - “I’ll do anything to stop feeling so distressed.”
  - “I feel completely alone with my pain.”

  You will then generate a supportive and therapeutic response tailored to the detected level.

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
      Generate a short, friendly, and personalized "welcome back" message based on the previous conversation. Set sadnessLevel to 'normal'.
    {{else}}
      Generate a welcoming message for a new user. Introduce yourself as Juvo and ask how their day has been. Set sadnessLevel to 'normal'.
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

  Now, analyze the user's input based on the detailed definitions and examples, determine the sadness level ('normal' or 'high'), and generate your therapeutic response.
`,
});

const chatbotTherapyFlow = ai.defineFlow(
  {
    name: 'chatbotTherapyFlow',
    inputSchema: ChatbotTherapyInputSchema,
    outputSchema: ChatbotTherapyOutputSchema,
  },
  async (input) => {
    let alertError: string | undefined;

    // 1. Get initial analysis from the AI
    const {output: initialOutput} = await prompt({
      userInput: input.userInput,
      chatHistory: input.chatHistory,
      voiceMood: input.voiceMood,
      language: input.language,
    });

    if (!initialOutput) {
      return {
        therapyResponse: "I'm not sure how to respond to that. Could you tell me more?",
        sadnessLevel: 'normal',
        showCrisisOptions: false,
      };
    }

    const {sadnessLevel} = initialOutput;
    let therapyResponse = initialOutput.therapyResponse;

    // 2. If sadness is high, the code (not the AI) sends the alert.
    if (sadnessLevel === 'high') {
      const profile = input.userProfile;

      if (!profile || !profile.caretakerEmail) {
        alertError = "No caretaker email is configured in the profile.";
      } else if (!input.userInput) {
        alertError = "Cannot send an alert without a user message.";
      } else {
        try {
          const subject = 'High Urgency Alert: Immediate Attention Recommended for Your Loved One';
          
          const body = `
            <p>This is an automated alert from Juvo, the AI mental wellness companion.</p>
            <p>An interaction with the user has been flagged as requiring your attention. The urgency has been assessed as: <strong>HIGH</strong>.</p>
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
