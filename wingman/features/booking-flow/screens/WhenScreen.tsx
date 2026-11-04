"use client";

import { BookingStepShell } from "@/components/booking-flow/BookingStepShell";
import { SelectionCard } from "@/components/booking-flow/SelectionCard";
import { STEP_PATHS, WHEN_OPTIONS } from "@/lib/booking-flow/copy";
import { dateForWhen } from "@/lib/booking-flow/dates";
import { useNightBooking } from "@/lib/booking-flow/provider";
import type { WhenChoice } from "@/lib/booking-flow/types";
import { miamiCalendarDate } from "@/lib/events/timezone";
import { useRouter } from "next/navigation";
import { useStepGate } from "@/features/booking-flow/useStepGate";

export function WhenScreen() {
  const router = useRouter();
  const { state, hydrated } = useStepGate("when");
  const { patch } = useNightBooking();
  if (!hydrated) return <div className="min-h-dvh bg-[#050508]" />;

  function select(when: WhenChoice) {
    const date = dateForWhen(when, state.date);
    patch({ when, date });
  }

  return (
    <BookingStepShell
      title="When?"
      step={1}
      backHref={STEP_PATHS.location}
      cta="Continue"
      ctaDisabled={!state.when}
      onContinue={() => router.push(STEP_PATHS.experience)}
    >
      <div className="space-y-3">
        {WHEN_OPTIONS.map((option) => (
          <SelectionCard
            key={option.id}
            title={option.label}
            selected={state.when === option.id}
            onSelect={() => select(option.id)}
          />
        ))}
        {state.when === "date" ? (
          <input
            type="date"
            min={miamiCalendarDate()}
            value={state.date ?? ""}
            onChange={(event) => patch({ when: "date", date: event.target.value })}
            className="mt-1 h-12 w-full rounded-[16px] border border-white/10 bg-transparent px-4 text-[16px] text-white"
          />
        ) : null}
      </div>
    </BookingStepShell>
  );
}
