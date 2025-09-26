'use server';

/**
 * @fileOverview A voice mood detection AI agent that passes the detected mood to the chatbot flow.
 *
 * - voiceMoodDetection - A function that handles the voice mood detection process.
 * - VoiceMoodDetectionInput - The input type for the voiceMoodDetection function
 * - VoiceMoodDetectionOutput - The return type for the voiceMoodDetection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';
import { chatbotTherapy, type ChatbotTherapyOutput } from './ai-therapist-chatbot';
import type { UserProfile } from '@/services/profile';

const VoiceMoodDetectionInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "Audio data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'bot']),
    content: z.string(),
  })).optional().describe('The chat history of the conversation.'),
  userProfile: z.custom<Partial<UserProfile>>().optional().describe('The user\'s profile information, including caretaker details.'),
});
export type VoiceMoodDetectionInput = z.infer<typeof VoiceMoodDetectionInputSchema>;

export type VoiceMoodDetectionOutput = ChatbotTherapyOutput & {
  mood: string;
  transcript: string;
  audioResponse: string;
};

export async function voiceMoodDetection(input: VoiceMoodDetectionInput): Promise<VoiceMoodDetectionOutput> {
  return voiceMoodDetectionFlow(input);
}

const transcriptionAndMoodPrompt = ai.definePrompt({
  name: 'transcriptionAndMoodPrompt',
  input: {schema: z.object({audioDataUri: z.string()})},
  output: {schema: z.object({
    transcript: z.string().describe('The verbatim transcript of the user audio.'),
    mood: z.string().describe('The detected mood of the user based on their voice and words. e.g., "Calm", "Anxious", "Sad", "Happy", "Extreme Sadness - Crisis"'),
  })},
  prompt: `You are an expert AI therapist specializing in vocal biomarker analysis. Your task is to transcribe the user's speech and determine their mood.

Analyze the following audio data. Your goal is to detect the user's true mood by considering a wide range of vocal cues. Pay attention to:
- **Tone**: Is the voice monotonous, strained, or warm?
- **Pitch**: Is it higher or lower than usual? Does it crack?
- **Pace**: Are they speaking quickly (a sign of anxiety) or slowly (a sign of sadness)?
- **Volume**: Are they speaking loudly or softly?
- **Signs of Distress**: Listen for trembling, sighing, or long pauses.

It's crucial to identify mismatches between words and voice. For example, if the user says "I'm fine," but their voice is trembling, you should identify the mood as "Anxious" or "Sad." If their voice indicates extreme distress, classify it as "Extreme Sadness - Crisis".

First, provide a verbatim transcript of the user's words.
Then, based on your detailed analysis of the audio, determine the most accurate mood.

Audio Data: {{media url=audioDataUri}}
`,
});


const voiceMoodDetectionFlow = ai.defineFlow(
  {
    name: 'voiceMoodDetectionFlow',
    inputSchema: VoiceMoodDetectionInputSchema,
    outputSchema: z.custom<VoiceMoodDetectionOutput>(),
  },
  async input => {
    // 1. Transcribe and detect mood from voice
    const {output: transcriptionOutput} = await transcriptionAndMoodPrompt({
        audioDataUri: input.audioDataUri,
    });

    if (!transcriptionOutput) {
      throw new Error('No output from transcription and mood prompt');
    }
    const { transcript, mood } = transcriptionOutput;
    
    // 2. Pass transcript and detected mood to the main chatbot for a text response
    const chatbotResponse = await chatbotTherapy({
        userInput: transcript,
        chatHistory: input.chatHistory,
        voiceMood: mood,
        userProfile: input.userProfile,
    });

    // 3. Generate audio for the final response from the chatbot
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
      ...chatbotResponse,
      mood: mood,
      transcript: transcript,
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

    const bufs: Buffer[] = [];
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
