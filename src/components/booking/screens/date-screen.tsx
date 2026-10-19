"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { ScheduleWhenSelector } from "@/components/booking/schedule-when-selector";
import { RecurringFrequencyPicker } from "@/components/booking/recurring-frequency-picker";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import {
  BOOKING_SCREEN_PATHS,
  getNextScreen,
  isDateComplete,
} from "@/lib/bookings/booking-routes";
import type { SchedulePreset } from "@/lib/bookings/booking-state";
import type { ArrivalWindowId } from "@/lib/bookings/constants";
import type { RecurringFrequencyId } from "@/lib/recurring/frequencies";
import { trackBookingEvent } from "@/lib/analytics/booking";

export function DateScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("date");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!hydrated || blocked) {
    return (
      <div
        data-theme="ml-dark"
        className="flex min-h-[40dvh] items-center justify-center bg-[var(--ml-dark-bg)] text-sm text-[var(--ml-dark-ink-muted)]"
      >
        Loading…
      </div>
    );
  }

  const needsCalendar = state.schedulePreset === "date";
  const showContinue = needsCalendar;

  const advance = (merged: typeof state) => {
    trackBookingEvent("date_selected", {
      preset: merged.schedulePreset,
      date: merged.date,
      window: merged.arrivalWindow,
    });
    updateState({ step: 6 });
    router.push(BOOKING_SCREEN_PATHS[getNextScreen("date", merged)]);
  };

  return (
    <BookingFlowChrome
      screenId="date"
      title="When do you need us?"
      subtitle="One tap to pick a day."
      hideCta={!showContinue}
      ctaLabel="Continue"
      ctaDisabled={!isDateComplete(state)}
      onContinue={() => {
        if (!state.schedulePreset || !state.date) {
          setErrors({ schedulePreset: "Choose when you need cleaning." });
          return;
        }
        setErrors({});
        advance(state);
      }}
    >
      <div className="space-y-5">
        <ScheduleWhenSelector
          mode="date"
          schedulePreset={state.schedulePreset}
          date={state.date}
          arrivalWindow={state.arrivalWindow}
          marketId={state.marketId}
          onPresetChange={(preset: SchedulePreset, resolved) => {
            const patch = {
              schedulePreset: preset,
              date: resolved.date,
              arrivalWindow: resolved.arrivalWindow,
            };
            updateState(patch);
            // Auto-advance on ASAP / Today / Tomorrow — calendar needs Continue
            if (preset !== "date" && resolved.date) {
              advance({ ...state, ...patch });
            }
          }}
          onDateChange={(date) => updateState({ date, schedulePreset: "date" })}
          onWindowChange={(arrivalWindow: ArrivalWindowId) => updateState({ arrivalWindow })}
          errors={errors}
        />
        <RecurringFrequencyPicker
          variant="toggle"
          value={(state.recurringFrequency as RecurringFrequencyId) ?? "one_time"}
          onChange={(recurringFrequency) => updateState({ recurringFrequency })}
        />
      </div>
    </BookingFlowChrome>
  );
}
