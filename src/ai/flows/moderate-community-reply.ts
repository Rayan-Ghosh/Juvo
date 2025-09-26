
'use server';
/**
 * @fileOverview A Genkit flow for moderating user-submitted community replies.
 *
 * - moderateCommunityReply - A function that analyzes a reply to ensure it's safe and appropriate.
 */

import { ai } from '@/ai/genkit';
import { ModerateCommunityReplyInputSchema, ModerateCommunityReplyOutputSchema, type ModerateCommunityReplyInput, type ModerateCommunityReplyOutput } from '@/app/types';


export async function moderateCommunityReply(input: ModerateCommunityReplyInput): Promise<ModerateCommunityReplyOutput> {
  return moderateCommunityReplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateCommunityReplyPrompt',
  input: { schema: ModerateCommunityReplyInputSchema },
  output: { schema: ModerateCommunityReplyOutputSchema },
  prompt: `You are a fair and lenient safety moderator for "Juvo," an anonymous mental health support community. Your primary duty is to protect users from clear harm while allowing for genuine, good-faith discussions. You must evaluate replies to ensure they are safe and reasonably supportive.

**Your Goal: Approve any reply that is a good-faith attempt to help. Do NOT reject replies just because they are direct or not perfectly empathetic.**

A reply is UNACCEPTABLE and **MUST BE REJECTED** only if it contains ANY of the following:
-   **Encouragement of Self-Harm or Suicide**: Any statement that could be interpreted as encouraging, glorifying, or instructing on self-harm or suicide. This is the most critical rule.
    -   **Example to REJECT**: "Maybe it's better to just end it.", "If I were you, I'd give up."
-   **Aggression or Personal Attacks**: Any form of name-calling, insults, or direct aggression.
    -   **Example to REJECT**: "You're an idiot for feeling that way.", "That's a stupid thing to be sad about."
-   **Blatant Invalidation**: Replies that bluntly and completely dismiss the original poster's feelings without offering any value. This is for extreme cases.
    -   **Example to REJECT**: "Just get over it.", "That's not a real problem.", "You're being too dramatic."
-   **Profanity or Hate Speech**: Any explicit curse words or hate speech.
-   **Prescriptive Medical Advice**: Do not allow replies that prescribe specific medications or give definitive medical diagnoses.
    -   **Example to REJECT**: "You should take 50mg of Zoloft for that."
-   **Spam or Advertisements**: Any form of promotion.

A reply is **ACCEPTABLE** if it is a good-faith attempt to be supportive, share a personal experience, or offer gentle advice, even if it is not perfectly phrased. The goal is to allow conversation, not demand perfect therapeutic responses from peers.
-   **Examples of ACCEPTABLE content**:
    -   **Empathetic Support**: "I'm so sorry you're going through that. I've felt that way too.", "Thank you for sharing. It takes a lot of courage."
    -   **Sharing Personal Experience**: "What has helped me in similar situations is practicing mindfulness.", "I found that trying to balance my studies with a hobby really helps clear my head."
    -   **Gentle Suggestions**: "Have you considered talking to a therapist about this?", "Sometimes a short walk helps me clear my head. Maybe it could help you too."
    -   **Direct, Solution-Oriented Advice**: Direct advice is acceptable as long as it is not aggressive or invalidating.
        -   **APPROVE**: "you should better manage time and work"
        -   **APPROVE**: "It's important to find a balance. Taking small breaks might make things more manageable."
        -   **APPROVE**: "You should try to balance studies and play, it might help."

Your task:
- Analyze the following reply content.
- Set \`isApproved\` to \`true\` if it is a good-faith attempt at support and does not violate any of the "UNACCEPTABLE" rules.
- Set \`isApproved\` to \`false\` ONLY if it violates a rule above.
- If \`isApproved\` is \`false\`, provide a very brief, clear, and direct \`reason\` for the rejection.

**Reasoning Examples:**
- "This reply contains prohibited medical advice."
- "Encouraging self-harm is strictly forbidden."
- "This reply is aggressive and not supportive."

Reply Content:
"{{{replyContent}}}"
`,
});

const moderateCommunityReplyFlow = ai.defineFlow(
  {
    name: 'moderateCommunityReplyFlow',
    inputSchema: ModerateCommunityReplyInputSchema,
    outputSchema: ModerateCommunityReplyOutputSchema,
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
