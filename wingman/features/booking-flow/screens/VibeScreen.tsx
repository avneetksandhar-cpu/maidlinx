"use client";

import { BookingStepShell } from "@/components/booking-flow/BookingStepShell";
import { SelectionCard } from "@/components/booking-flow/SelectionCard";
import { STEP_PATHS, VIBE_OPTIONS } from "@/lib/booking-flow/copy";
import { useNightBooking } from "@/lib/booking-flow/provider";
import { useRouter } from "next/navigation";
import { useStepGate } from "@/features/booking-flow/useStepGate";

export function VibeScreen() {
  const router = useRouter();
  const { state, hydrated } = useStepGate("vibe");
  const { patch } = useNightBooking();
  if (!hydrated) return <div className="min-h-dvh bg-[#050508]" />;

  return (
    <BookingStepShell
      title="What’s your vibe?"
      step={3}
      backHref={STEP_PATHS.experience}
      cta="Continue"
      ctaDisabled={!state.vibe}
      onContinue={() => router.push(STEP_PATHS.party)}
    >
      <div className="space-y-3">
        {VIBE_OPTIONS.map((option) => (
          <SelectionCard
            key={option.id}
            title={option.label}
            selected={state.vibe === option.id}
            onSelect={() => patch({ vibe: option.id })}
          />
        ))}
      </div>
    </BookingStepShell>
  );
}
