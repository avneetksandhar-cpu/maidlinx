"use client";

import { BookingStepShell } from "@/components/booking-flow/BookingStepShell";
import { PartySizeStepper } from "@/components/booking-flow/PartySizeStepper";
import { STEP_PATHS } from "@/lib/booking-flow/copy";
import { useNightBooking } from "@/lib/booking-flow/provider";
import { useRouter } from "next/navigation";
import { useStepGate } from "@/features/booking-flow/useStepGate";

export function PartyScreen() {
  const router = useRouter();
  const { state, hydrated } = useStepGate("party");
  const { patch } = useNightBooking();
  if (!hydrated) return <div className="min-h-dvh bg-[#050508]" />;

  return (
    <BookingStepShell
      title="Who’s coming?"
      step={4}
      backHref={STEP_PATHS.vibe}
      cta="Continue"
      onContinue={() => router.push(STEP_PATHS.budget)}
    >
      <div className="flex min-h-[40vh] items-center justify-center">
        <PartySizeStepper value={state.partySize} onChange={(partySize) => patch({ partySize })} />
      </div>
    </BookingStepShell>
  );
}
