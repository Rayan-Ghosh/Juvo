
"use server";

import { z } from 'zod';
import { chatbotTherapy } from "@/ai/flows/ai-therapist-chatbot";
import type { ChatbotTherapyInput, ChatbotTherapyOutput } from "@/ai/flows/ai-therapist-chatbot";
import { voiceMoodDetection } from "@/ai/flows/voice-mood-detection";
import type { VoiceMoodDetectionInput, VoiceMoodDetectionOutput } from "@/ai/flows/voice-mood-detection";
import { moderateCommunityPost } from "@/ai/flows/moderate-community-post";
import { moderateCommunityReply } from "@/ai/flows/moderate-community-reply";
import { collection, addDoc, serverTimestamp, getFirestore, updateDoc, doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';
import type { ModerateCommunityPostInput, ModerateCommunityPostOutput, ModerateCommunityReplyInput, ModerateCommunityReplyOutput, GenerateAffirmationInput, GenerateAffirmationOutput, FoodMoodAnalysisInput, FoodMoodAnalysisOutput, SleepStressAnalysisInput, SleepStressAnalysisOutput, CycleInsightInput, CycleInsightOutput } from '@/app/types';
import { getAdminApp } from '@/firebase/admin';
import { generateAffirmation } from '@/ai/flows/personalized-affirmations';
import { foodMoodAnalysis } from '@/ai/flows/food-mood-analysis';
import { sleepStressAnalysis } from '@/ai/flows/sleep-stress-analysis';
import { cycleInsights } from '@/ai/flows/cycle-insights';


// In a real application, you would fetch user data from Firestore
const getMockUserData = (userId: string) => {
  return {
    id: userId,
    email: 'test@test.com',
    createdAt: new Date().toISOString(),
    caretakerEmail: "caretaker@example.com",
  };
};

export async function handleChatMessage(
  message: string,
  chatHistory: ChatbotTherapyInput['chatHistory'],
  userId: string,
  language?: string
): Promise<ChatbotTherapyOutput> {
  const userData = getMockUserData(userId);

  try {
    const chatResponse = await chatbotTherapy({
      userInput: message,
      chatHistory,
      userProfile: userData,
      language,
    });
    return chatResponse;
  } catch (error) {
    console.error("Error in AI chat flow:", error);
    // Return a graceful error message to the user
    return {
      therapyResponse:
        "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
      sadnessLevel: 'normal',
      showCrisisOptions: false,
    };
  }
}

export async function handleVoiceMessage(
  audioDataUri: string,
  chatHistory: VoiceMoodDetectionInput['chatHistory'],
  userId: string
): Promise<VoiceMoodDetectionOutput> {
  const userData = getMockUserData(userId);
  try {
    const voiceResponse = await voiceMoodDetection({
      audioDataUri,
      chatHistory,
      userProfile: userData,
    });
    return voiceResponse;
  } catch (error) {
    console.error("Error in AI voice flow:", error);
    return {
      therapyResponse: "I'm sorry, I couldn't process the audio. Please try again.",
      sadnessLevel: 'normal',
      showCrisisOptions: false,
      mood: 'unknown',
      transcript: '',
      audioResponse: '',
    };
  }
}

export async function submitCommunityPost(
  postData: ModerateCommunityPostInput,
  userId: string
): Promise<ModerateCommunityPostOutput> {
  try {
    const moderationResult = await moderateCommunityPost(postData);

    if (moderationResult.isApproved) {
      // Logic to save the post to Firestore
      if (!getApps().length) {
        initializeApp(firebaseConfig);
      }
      const firestore = getFirestore(getApp());
      const postsCollection = collection(firestore, 'communityPosts');
      await addDoc(postsCollection, {
        ...postData,
        authorId: `anonymous_${userId.substring(0, 5)}`, // Anonymize user ID
        createdAt: serverTimestamp(),
        replyCount: 0
      });
    }

    return moderationResult;
  } catch (error) {
    console.error("Error submitting community post:", error);
    return {
      isApproved: false,
      reason: 'An unexpected error occurred. Please try again.',
    };
  }
}

export async function submitCommunityReply(
  replyData: ModerateCommunityReplyInput,
  postId: string,
  userId: string
): Promise<ModerateCommunityReplyOutput> {
    try {
        const moderationResult = await moderateCommunityReply(replyData);

        if (moderationResult.isApproved) {
            // Logic to save the reply to Firestore
            if (!getApps().length) {
                initializeApp(firebaseConfig);
            }
            const firestore = getFirestore(getApp());
            const repliesCollection = collection(firestore, 'communityPosts', postId, 'replies');
            await addDoc(repliesCollection, {
                content: replyData.replyContent,
                authorId: `anonymous_${userId.substring(0, 5)}`,
                createdAt: serverTimestamp(),
            });

            // Increment replyCount on the parent post
            const postRef = doc(firestore, 'communityPosts', postId);
            const postDoc = await getDoc(postRef);
            if(postDoc.exists()) {
                const currentCount = postDoc.data().replyCount || 0;
                await updateDoc(postRef, {
                    replyCount: currentCount + 1
                });
            }
        }
        return moderationResult;
    } catch (error) {
        console.error("Error submitting community reply:", error);
        return {
            isApproved: false,
            reason: 'An unexpected error occurred. Please try again.',
        };
    }
}


const createCounselorSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email("Invalid email address."),
  employeeId: z.string().min(1, "Employee ID is required."),
});

// This action simulates inviting a counselor.
// In a real app with a backend, this would likely trigger an email invitation.
// Here, we'll save the details to a 'pending_users' collection for the sign-up flow to check.
export async function createCounselorAccount(
  formData: FormData,
  institutionId: string,
): Promise<{ success: boolean; message: string; }> {
  try {
    const validatedFields = createCounselorSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      employeeId: formData.get('employeeId'),
    });
    
    if (!validatedFields.success) {
      return {
        success: false,
        message: "Invalid form data. Please check the fields and try again.",
      };
    }
    
    const { name, email, employeeId } = validatedFields.data;

    if (!getApps().length) {
      initializeApp(firebaseConfig);
    }
    const firestore = getFirestore(getApp());
    const pendingUsersCollection = collection(firestore, 'pending_users');

    await addDoc(pendingUsersCollection, {
      name,
      email,
      identificationId: employeeId,
      institutionId: institutionId,
      role: 'college-admin',
      createdAt: serverTimestamp(),
    });

    return {
      success: true,
      message: `${name} has been invited. They can now sign up with the email ${email} to complete their registration.`,
    };

  } catch (error: any) {
    console.error("Error creating counselor invitation:", error);
    // Generic error for other issues
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
}


export async function handleGenerateAffirmation(input: GenerateAffirmationInput): Promise<GenerateAffirmationOutput> {
  try {
    const result = await generateAffirmation(input);
    return result;
  } catch (error) {
    console.error("Error generating affirmation:", error);
    return {
      affirmation: "I am strong and capable of overcoming challenges.",
    };
  }
}

export async function handleFoodMoodAnalysis(input: FoodMoodAnalysisInput): Promise<FoodMoodAnalysisOutput> {
    try {
        const result = await foodMoodAnalysis(input);
        return result;
    } catch (error) {
        console.error("Error analyzing food and mood:", error);
        return {
            analysis: "Sorry, I was unable to analyze your food diary at this time. Please try again."
        };
    }
}

export async function handleSleepStressAnalysis(input: SleepStressAnalysisInput): Promise<SleepStressAnalysisOutput> {
    try {
        const result = await sleepStressAnalysis(input);
        return result;
    } catch (error) {
        console.error("Error analyzing sleep and stress:", error);
        return {
            analysis: "Sorry, I was unable to analyze your sleep patterns at this time. Please try again."
        };
    }
}

export async function handleCycleInsight(input: CycleInsightInput): Promise<CycleInsightOutput> {
    try {
        const result = await cycleInsights(input);
        return result;
    } catch (error) {
        console.error("Error analyzing cycle:", error);
        return {
            insight: "Sorry, I was unable to generate an insight for your cycle at this time. Please try again."
        };
    }
}
    