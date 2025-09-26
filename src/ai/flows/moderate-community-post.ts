
'use server';
/**
 * @fileOverview A Genkit flow for moderating user-submitted community posts.
 *
 * - moderateCommunityPost - A function that analyzes a post to ensure it's appropriate.
 */

import { ai } from '@/ai/genkit';
import { ModerateCommunityPostInputSchema, ModerateCommunityPostOutputSchema, type ModerateCommunityPostInput, type ModerateCommunityPostOutput } from '@/app/types';


export async function moderateCommunityPost(input: ModerateCommunityPostInput): Promise<ModerateCommunityPostOutput> {
  return moderateCommunityPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateCommunityPostPrompt',
  input: { schema: ModerateCommunityPostInputSchema },
  output: { schema: ModerateCommunityPostOutputSchema },
  prompt: `You are a strict but fair content moderator for "Juvo," an anonymous mental health support community. Your primary responsibility is to ensure that every post is directly related to mental health and is appropriate for a supportive, safe environment.

You must evaluate the post based on these two CRITICAL criteria:
1.  **Relevance**: Is the post about a personal mental health struggle, question, feeling, or experience? It should be a genuine request for support or a sharing of a personal journey. This includes feelings of stress, sadness, or anxiety related to common life events like exams, work, or relationships.
    -   **Examples of ACCEPTABLE content**: "I've been feeling so anxious lately, I don't know how to cope.", "Does anyone have tips for dealing with social anxiety at work?", "I feel so alone in my depression.", "I'm feeling sad and overwhelmed by my physics exam."
    -   **Examples of UNACCEPTABLE content**: "What's the best pizza place?", "I'm bored, anyone want to chat?", "Political rant about current events.", "Selling my old bike."

2.  **Appropriateness**: Does the post contain profanity, hate speech, spam, advertisements, personal attacks, or any form of explicit or harmful content?
    -   **Examples of ACCEPTABLE content**: "My PTSD is triggered by loud noises."
    -   **Examples of UNACCEPTABLE content**: "I hate my boss, he is a [profanity].", "Buy my new self-help book!", "Everyone who thinks [X] is stupid."

Your task:
- Analyze the following post.
- Set \`isApproved\` to \`true\` if it meets BOTH criteria.
- Set \`isApproved\` to \`false\` if it fails EITHER criterion.
- If \`isApproved\` is \`false\`, provide a brief, clear, and non-judgmental \`reason\` for the user. Be direct.

**Reasoning Examples:**
- If irrelevant: "This post does not seem to be about a mental health topic."
- If it contains profanity: "This post contains inappropriate language."
- If it's an advertisement: "Advertisements are not allowed in this community."

**Post to Analyze:**
-   **Title**: {{{title}}}
-   **Content**: {{{content}}}
`,
});

const moderateCommunityPostFlow = ai.defineFlow(
  {
    name: 'moderateCommunityPostFlow',
    inputSchema: ModerateCommunityPostInputSchema,
    outputSchema: ModerateCommunityPostOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      return {
        isApproved: false,
        reason: 'The content could not be verified at this time.',
      };
    }
    return output;
  }
);
