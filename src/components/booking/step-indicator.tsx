"use client";

import { BOOKING_STEP_COUNT, BOOKING_STEPS } from "@/lib/bookings/constants";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const current = BOOKING_STEPS.find((step) => step.id === currentStep);
  const progress = Math.round((currentStep / BOOKING_STEP_COUNT) * 100);

  return (
    <div className="space-y-3" aria-label="Booking progress">
      <div className="flex items-center justify-between gap-4 text-sm">
        <p className="font-medium text-ink">
          Step {currentStep} of {BOOKING_STEP_COUNT}
          {current ? `: ${current.label}` : ""}
        </p>
        <p className="text-ink-muted">{progress}%</p>
      </div>

      <div
        className="h-1.5 overflow-hidden rounded-full bg-border"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={BOOKING_STEP_COUNT}
        aria-label={`Booking step ${currentStep} of ${BOOKING_STEP_COUNT}`}
      >
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className="hidden flex-wrap gap-2 md:flex">
        {BOOKING_STEPS.map((step) => {
          const isActive = step.id === currentStep;
          const isComplete = step.id < currentStep;

          return (
            <li
              key={step.id}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                isActive && "border-ink bg-ink text-white",
                isComplete && "border-accent bg-accent-muted text-ink",
                !isActive && !isComplete && "border-border text-ink-subtle",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {step.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
