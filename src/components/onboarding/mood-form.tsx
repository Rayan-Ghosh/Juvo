"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type MoodFormProps = {
  onSubmit: (mood: string) => void;
  onBack: () => void;
  isLoading: boolean;
};

const moods = [
  { name: "Happy", emoji: "😊" },
  { name: "Calm", emoji: "😌" },
  { name: "Anxious", emoji: "😟" },
  { name: "Sad", emoji: "😢" },
  { name: "Overwhelmed", emoji: "🤯" },
];

export function MoodForm({ onSubmit, onBack, isLoading }: MoodFormProps) {
  return (
    <div className="space-y-8 text-center">
      <h3 className="text-base font-semibold">How are you feeling right now?</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {moods.map((mood) => (
          <Button
            key={mood.name}
            variant="outline"
            className="flex flex-col h-24 text-lg"
            onClick={() => onSubmit(mood.name)}
            disabled={isLoading}
          >
            <span className="text-4xl">{mood.emoji}</span>
            <span>{mood.name}</span>
          </Button>
        ))}
      </div>
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
        >
          Back
        </Button>
        {isLoading && (
          <div className="flex items-center text-muted-foreground">
             <Loader2 className="mr-2 h-4 w-4 animate-spin" />
             Finalizing...
          </div>
        )}
      </div>
    </div>
  );
}
