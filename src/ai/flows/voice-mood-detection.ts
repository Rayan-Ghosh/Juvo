'use server';

/**
 * @fileOverview A voice mood detection AI agent that passes the detected mood to the chatbot flow.
 *
 * - voiceMoodDetection - A function that handles the voice mood detection process.
 * - VoiceMoodDetectionInput - The input type for the voiceMoodDetection functionसुद्धा
 * - VoiceMoodDetectionOutput - The return type for the voiceMoodDetection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import { chatbotTherapy } from './chatbot-therapy';
import { getTodaysVitals } from '@/services/vitals';
import type { UserProfile } from '@/services/profile';

const VoiceMoodDetectionInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  transcript: z.string().describe('The transcript of the user audio.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'bot']),
    content: z.string(),
  })).optional().describe('The chat history of the conversation.'),
  userProfile: z.custom<Partial<UserProfile>>().optional().describe('The user\'s profile information, including caretaker details.'),
});
export type VoiceMoodDetectionInput = z.infer<typeof VoiceMoodDetectionInputSchema>;

const VoiceMoodDetectionOutputSchema = z.object({
  mood: z.string().describe('The detected mood of the user based on their voice and words. e.g., "Calm", "Anxious", "Sad", "Happy", "Extreme Sadness - Crisis"'),
  response: z.string().describe('A compassionate and empathetic response that acknowledges the user\'s detected mood and asks a follow-up question.'),
  audioResponse: z.string().describe('The data URI of the generated audio response in WAV format.'),
  sadnessLevel: z.enum(['normal', 'high']).describe('The detected level of sadness in the user\'s message.'),
});
export type VoiceMoodDetectionOutput = z.infer<typeof VoiceMoodDetectionOutputSchema>;

export async function voiceMoodDetection(input: VoiceMoodDetectionInput): Promise<VoiceMoodDetectionOutput> {
  return voiceMoodDetectionFlow(input);
}

const moodDetectionPrompt = ai.definePrompt({
  name: 'moodDetectionPrompt',
  input: {schema: z.object({transcript: z.string(), audioDataUri: z.string()})},
  output: {schema: z.object({
    mood: VoiceMoodDetectionOutputSchema.shape.mood,
  })},
  prompt: `You are an expert AI therapist specializing in vocal biomarker analysis. Your task is to analyze the user's speech and determine their mood.

Analyze the following transcript and the associated audio data. Your goal is to detect the user's true mood by considering a wide range of vocal cues. Pay attention to:
- **Tone**: Is the voice monotonous, strained, or warm?
- **Pitch**: Is it higher or lower than usual? Does it crack?
- **Pace**: Are they speaking quickly (a sign of anxiety) or slowly (a sign of sadness)?
- **Volume**: Are they speaking loudly or softly?
- **Signs of Distress**: Listen for trembling, sighing, or long pauses.

It's crucial to identify mismatches between words and voice. For example, if the user says "I'm fine," but their voice is trembling, you should identify the mood as "Anxious" or "Sad." If their voice indicates extreme distress, classify it as "Extreme Sadness - Crisis".

Based on your detailed analysis, determine the most accurate mood. Output ONLY the mood.

Transcript: {{{transcript}}}
Audio Data: {{media url=audioDataUri}}
`,
});


const voiceMoodDetectionFlow = ai.defineFlow(
  {
    name: 'voiceMoodDetectionFlow',
    inputSchema: VoiceMoodDetectionInputSchema,
    outputSchema: VoiceMoodDetectionOutputSchema,
  },
  async input => {
    // 1. Detect mood from voice and transcript
    const {output: moodDetectionOutput} = await moodDetectionPrompt({
        transcript: input.transcript,
        audioDataUri: input.audioDataUri,
    });

    if (!moodDetectionOutput) {
      throw new Error('No output from mood detection prompt');
    }
    
    // 2. Fetch today's vitals for additional context
    const vitals = await getTodaysVitals();
    
    // 3. Pass transcript, detected mood, and vitals to the main chatbot for a response
    const chatbotResponse = await chatbotTherapy({
        userInput: input.transcript,
        chatHistory: input.chatHistory,
        voiceMood: moodDetectionOutput.mood,
        userProfile: input.userProfile,
    });

    // 4. Generate audio for the final response from the chatbot
    const ttsResponse = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {voiceName: 'Umbriel'},
          },
        },
      },
      prompt: chatbotResponse.therapyResponse,
    });

    if (!ttsResponse.media) {
      throw new Error('No media returned from TTS model');
    }

    const audioBuffer = Buffer.from(
      ttsResponse.media.url.substring(ttsResponse.media.url.indexOf(',') + 1),
      'base64'
    );

    const wavDataUri = 'data:audio/wav;base64,' + (await toWav(audioBuffer));

    return {
      mood: moodDetectionOutput.mood,
      response: chatbotResponse.therapyResponse,
      sadnessLevel: chatbotResponse.sadnessLevel,
      audioResponse: wavDataUri,
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
