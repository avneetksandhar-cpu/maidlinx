"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { ScheduleWhenSelector } from "@/components/booking/schedule-when-selector";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";
import type { ArrivalWindowId } from "@/lib/bookings/constants";
import { trackBookingEvent } from "@/lib/analytics/booking";

export function TimeScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("time");
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

  const selectWindow = (arrivalWindow: ArrivalWindowId) => {
    updateState({ arrivalWindow, step: 7 });
    trackBookingEvent("date_selected", {
      preset: state.schedulePreset,
      date: state.date,
      window: arrivalWindow,
    });
    setErrors({});
    router.push(BOOKING_SCREEN_PATHS.access);
  };

  return (
    <BookingFlowChrome
      screenId="time"
      title="Choose a time"
      subtitle="Morning, afternoon, or evening — unavailable windows stay disabled."
      hideCta
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
        onWindowChange={selectWindow}
        errors={errors}
      />
    </BookingFlowChrome>
  );
}
