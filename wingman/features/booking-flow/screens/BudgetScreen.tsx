"use client";

import { BookingStepShell } from "@/components/booking-flow/BookingStepShell";
import { BudgetCard } from "@/components/booking-flow/BudgetCard";
import { BUDGET_OPTIONS, STEP_PATHS } from "@/lib/booking-flow/copy";
import { useNightBooking } from "@/lib/booking-flow/provider";
import { useRouter } from "next/navigation";
import { useStepGate } from "@/features/booking-flow/useStepGate";

export function BudgetScreen() {
  const router = useRouter();
  const { state, hydrated } = useStepGate("budget");
  const { patch } = useNightBooking();
  if (!hydrated) return <div className="min-h-dvh bg-[#050508]" />;

  return (
    <BookingStepShell
      title="What’s your budget?"
      step={5}
      backHref={STEP_PATHS.party}
      cta="Continue"
      ctaDisabled={!state.budget}
      onContinue={() => router.push(STEP_PATHS.matches)}
    >
      <div className="space-y-3">
        {BUDGET_OPTIONS.map((option) => (
          <BudgetCard
            key={option.id}
            label={option.label}
            selected={state.budget === option.id}
            onSelect={() => patch({ budget: option.id })}
          />
        ))}
      </div>
    </BookingStepShell>
  );
}
