"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { ScheduleWhenSelector } from "@/components/booking/schedule-when-selector";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import {
  BOOKING_SCREEN_PATHS,
  isTimeComplete,
} from "@/lib/bookings/booking-routes";
import type { ArrivalWindowId } from "@/lib/bookings/constants";
import { trackBookingEvent } from "@/lib/analytics/booking";

export function TimeScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("time");
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
      screenId="time"
      title="What time works best?"
      subtitle="Pick an arrival window — we’ll treat it as your preference."
      ctaLabel="Continue"
      ctaDisabled={!isTimeComplete(state)}
      onContinue={() => {
        if (!state.arrivalWindow) {
          setErrors({ arrivalWindow: "Choose an arrival window." });
          return;
        }
        setErrors({});
        trackBookingEvent("date_selected", {
          preset: state.schedulePreset,
          date: state.date,
          window: state.arrivalWindow,
        });
        updateState({ step: 7 });
        router.push(BOOKING_SCREEN_PATHS.access);
      }}
    >
      <ScheduleWhenSelector
        mode="time"
        schedulePreset={state.schedulePreset}
        date={state.date}
        arrivalWindow={state.arrivalWindow}
        marketId={state.marketId}
        onPresetChange={() => {
          /* date step owns presets */
        }}
        onDateChange={() => {
          /* date step owns date */
        }}
        onWindowChange={(arrivalWindow: ArrivalWindowId) => updateState({ arrivalWindow })}
        errors={errors}
      />
    </BookingFlowChrome>
  );
}
