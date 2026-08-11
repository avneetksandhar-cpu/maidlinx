"use client";

import { useRouter } from "next/navigation";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { BookingMapPreview } from "@/components/booking/booking-map-preview";
import { Label, Textarea } from "@/components/ui";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";

export function AccessScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("access");

  if (!hydrated || blocked) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  const addressLabel =
    state.formattedAddress ||
    [state.line1, state.city, state.state, state.postalCode].filter(Boolean).join(", ");

  return (
    <BookingFlowChrome
      screenId="access"
      title="How do we get in?"
      subtitle="Optional — buzzer, gate, parking, or pet notes."
      ctaLabel="Continue"
      onContinue={() => {
        updateState({ step: 9 });
        router.push(BOOKING_SCREEN_PATHS.review);
      }}
    >
      <div className="space-y-5">
        <BookingMapPreview
          latitude={state.latitude}
          longitude={state.longitude}
          label={addressLabel || "Cleaning address"}
        />

        <div>
          <Label htmlFor="accessNotes" className="text-sm text-ink-muted">
            Entry, parking, or gate instructions
          </Label>
          <Textarea
            id="accessNotes"
            value={state.accessNotes ?? ""}
            onChange={(e) => updateState({ accessNotes: e.target.value })}
            placeholder="Buzzer/gate code, parking spot, pet notes…"
            className="mt-2 rounded-xl"
            rows={5}
          />
          <p className="mt-2 text-sm text-ink-subtle">You can skip this if nothing special.</p>
        </div>
      </div>
    </BookingFlowChrome>
  );
}
