"use client";
import { cn } from "@/lib/utils";
import { Users, Stethoscope, Smile } from "lucide-react";

const steps = [
  { id: 1, name: "Caretakers", icon: Users },
  { id: 2, name: "Medical", icon: Stethoscope },
  { id: 3, name: "Mood", icon: Smile },
];

export function OnboardingStepper({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={cn("relative flex-1", {
              "pr-8 sm:pr-20": stepIdx !== steps.length - 1,
            })}
          >
            {step.id < currentStep ? (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-primary" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary"
                >
                  <step.icon className="h-5 w-5 text-primary-foreground" aria-hidden="true" />
                </div>
              </>
            ) : step.id === currentStep ? (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background"
                  aria-current="step"
                >
                  <step.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
              </>
            ) : (
              <>
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="h-0.5 w-full bg-gray-200" />
                </div>
                <div
                  className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-background"
                >
                  <step.icon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
              </>
            )}
            <p className="absolute -bottom-6 text-xs text-center w-full truncate">{step.name}</p>
          </li>
        ))}
      </ol>
    </nav>
  );
}

    