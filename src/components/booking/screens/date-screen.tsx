"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { ScheduleWhenSelector } from "@/components/booking/schedule-when-selector";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import {
  BOOKING_SCREEN_PATHS,
  getNextScreen,
  isDateComplete,
} from "@/lib/bookings/booking-routes";
import type { SchedulePreset } from "@/lib/bookings/booking-state";
import type { ArrivalWindowId } from "@/lib/bookings/constants";
import { trackBookingEvent } from "@/lib/analytics/booking";

export function DateScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("date");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!hydrated || blocked) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  return (
    <BookingFlowChrome
      screenId="date"
      title="Which day works?"
      subtitle="ASAP, today, tomorrow — or pick a date on the calendar."
      ctaLabel="Continue"
      ctaDisabled={!isDateComplete(state)}
      onContinue={() => {
        if (!state.schedulePreset || !state.date) {
          setErrors({ schedulePreset: "Choose when you need cleaning." });
          return;
        }
        setErrors({});
        trackBookingEvent("date_selected", {
          preset: state.schedulePreset,
          date: state.date,
          window: state.arrivalWindow,
        });
        const next = getNextScreen("date", state);
        updateState({ step: 6 });
        router.push(BOOKING_SCREEN_PATHS[next]);
      }}
    >
      <ScheduleWhenSelector
        mode="date"
        schedulePreset={state.schedulePreset}
        date={state.date}
        arrivalWindow={state.arrivalWindow}
        marketId={state.marketId}
        onPresetChange={(preset: SchedulePreset, resolved) => {
          updateState({
            schedulePreset: preset,
            date: resolved.date,
            arrivalWindow: resolved.arrivalWindow,
          });
        }}
        onDateChange={(date) => updateState({ date, schedulePreset: "date" })}
        onWindowChange={(arrivalWindow: ArrivalWindowId) => updateState({ arrivalWindow })}
        errors={errors}
      />
    </BookingFlowChrome>
  );
}
