"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { ScheduleWhenSelector } from "@/components/booking/schedule-when-selector";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { BOOKING_SCREEN_PATHS, isScheduleComplete } from "@/lib/bookings/booking-routes";
import { step5ScheduleSchema, fieldErrors } from "@/lib/bookings/booking-helpers";
import type { SchedulePreset } from "@/lib/bookings/booking-state";
import type { ArrivalWindowId } from "@/lib/bookings/constants";
import { trackBookingEvent } from "@/lib/analytics/booking";

export function ScheduleScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("schedule");
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
      screenId="schedule"
      title="When should we come?"
      subtitle="ASAP, today, tomorrow, or pick a date and window."
      ctaLabel="Continue"
      ctaDisabled={!isScheduleComplete(state)}
      onContinue={() => {
        if (!state.schedulePreset) {
          setErrors({ schedulePreset: "Choose when you need cleaning." });
          return;
        }
        const parsed = step5ScheduleSchema.safeParse(state);
        if (!parsed.success) {
          setErrors(fieldErrors(parsed.error));
          return;
        }
        setErrors({});
        trackBookingEvent("date_selected", {
          preset: state.schedulePreset,
          date: state.date,
          window: state.arrivalWindow,
        });
        updateState({ step: 7 });
        router.push(BOOKING_SCREEN_PATHS.review);
      }}
    >
      <ScheduleWhenSelector
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
