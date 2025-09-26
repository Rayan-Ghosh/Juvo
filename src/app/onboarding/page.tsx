
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import { CaretakerForm } from "@/components/onboarding/caretaker-form";
import { MedicalForm } from "@/components/onboarding/medical-form";
import { MoodForm } from "@/components/onboarding/mood-form";
import { useToast } from "@/hooks/use-toast";
import { saveUserProfile } from "@/services/profile";

export type OnboardingData = {
  caretakers: { email: string; phone: string }[];
  medical: {
    hasConditions: "yes" | "no" | undefined;
    details?: string;
  };
  mood: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({
    caretakers: [{ email: "", phone: "" }],
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleCaretakerSubmit = (data: { caretakers: { email: string; phone: string }[] }) => {
    setOnboardingData((prev) => ({ ...prev, ...data }));
    nextStep();
  };

  const handleMedicalSubmit = (data: OnboardingData['medical']) => {
    setOnboardingData((prev) => ({ ...prev, medical: data }));
    nextStep();
  };
  
  const handleFinalSubmit = async (mood: string) => {
    const finalData = { ...onboardingData, mood };
    setOnboardingData(finalData);
    setIsLoading(true);

    if (user && firestore) {
        try {
            // Name, role, and IDs are now set during sign-up
            await saveUserProfile(firestore, user.uid, {
                caretakerEmail: finalData.caretakers?.[0]?.email,
                caretakerPhone: finalData.caretakers?.[0]?.phone,
                hasStressCondition: finalData.medical?.hasConditions === 'yes',
                stressConditionDetails: finalData.medical?.details || '',
                initialMood: finalData.mood
            });
    
            toast({
              title: "Onboarding Complete!",
              description: "Welcome to Juvo. We're glad you're here.",
            });
        
            router.push("/chat");

        } catch (error) {
            console.error("Failed to save onboarding data", error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Could not save your information. Please try again."
            });
        } finally {
            setIsLoading(false);
        }
    } else {
        toast({
            variant: 'destructive',
            title: "Authentication Error",
            description: "Could not identify user. Please sign in again."
        });
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-headline">
            Let's Get You Set Up
          </CardTitle>
          <CardDescription className="text-center">
            This will help us provide you with the best support.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingStepper currentStep={step} />
          <div className="mt-8">
            {step === 1 && <CaretakerForm onSubmit={handleCaretakerSubmit} defaultValues={onboardingData.caretakers} />}
            {step === 2 && <MedicalForm onSubmit={handleMedicalSubmit} onBack={prevStep} defaultValues={onboardingData.medical} />}
            {step === 3 && (
                <MoodForm 
                    onSubmit={handleFinalSubmit} 
                    onBack={prevStep} 
                    isLoading={isLoading} 
                />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
