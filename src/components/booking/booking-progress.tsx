"use client";

import { cn } from "@/lib/utils";

interface FlowStep {
  id: number;
  label: string;
  shortLabel?: string;
}

interface BookingProgressProps {
  currentStep: number;
  steps?: readonly FlowStep[];
  className?: string;
  variant?: "bar" | "dots";
}

export function BookingProgress({
  currentStep,
  steps = [],
  className,
  variant = "bar",
}: BookingProgressProps) {
  const progress = Math.round((currentStep / steps.length) * 100);

  if (variant === "dots") {
    return (
      <div
        className={cn("flex items-center justify-center gap-1.5", className)}
        aria-label={`Step ${currentStep} of ${steps.length}`}
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={steps.length}
      >
        {steps.map((step) => (
          <span
            key={step.id}
            className={cn(
              "h-1.5 rounded-full transition-all duration-200",
              step.id === currentStep
                ? "w-6 bg-accent"
                : step.id < currentStep
                  ? "w-1.5 bg-accent/50"
                  : "w-1.5 bg-border",
            )}
            aria-hidden
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(className)} aria-label="Booking progress">
      <div
        className="h-0.5 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={steps.length}
      >
        <div
          className="h-full rounded-full bg-accent transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
