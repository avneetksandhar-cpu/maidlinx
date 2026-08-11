"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { DynamicServiceQuestions } from "@/components/booking/dynamic-service-questions";
import { Input, Label } from "@/components/ui";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";
import { getPropertyQuestions } from "@/config/property-types";
import { validateDetailsState } from "@/lib/bookings/booking-helpers";
import type { ServiceAnswers } from "@/lib/services/questions";

export function DetailsScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("details");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!hydrated || blocked || !state.propertyType) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  const handleAnswers = (answers: ServiceAnswers, mapped: Record<string, unknown>) => {
    updateState({
      serviceAnswers: answers,
      ...mapped,
    });
  };

  const handleContinue = () => {
    let nextState = state;
    // Sync move direction onto service type before tiers.
    if (state.propertyType === "move") {
      const raw = state.serviceAnswers?.moveDirection;
      const serviceType =
        raw === "move_in" || raw === "move_out" ? (raw as "move_in" | "move_out") : null;
      if (serviceType) {
        nextState = {
          ...state,
          serviceType,
          serviceSlug: serviceType === "move_in" ? "move-in" : "move-out",
        };
        updateState({
          serviceType,
          serviceSlug: serviceType === "move_in" ? "move-in" : "move-out",
        });
      }
    }

    const result = validateDetailsState(nextState);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    // Persist coalesced beds/baths/sqft so the service guard's isDetailsComplete matches.
    updateState({ ...(result.synced ?? {}), step: 4 });
    router.push(BOOKING_SCREEN_PATHS.service);
  };

  return (
    <BookingFlowChrome
      screenId="details"
      title="A few details about the space"
      subtitle="Helps us price accurately — you can edit these later."
      ctaLabel="Continue"
      onContinue={handleContinue}
    >
      <div className="space-y-6">
        <DynamicServiceQuestions
          serviceType={state.serviceType}
          serviceSlug={state.serviceSlug}
          answers={{
            ...(state.serviceAnswers ?? {}),
            ...(state.bedrooms !== undefined ? { bedrooms: state.bedrooms } : {}),
            ...(state.bathrooms !== undefined ? { bathrooms: state.bathrooms } : {}),
            squareFootage: String(
              state.squareFootage ?? state.serviceAnswers?.squareFootage ?? 1500,
            ),
            propertyType: state.propertyType,
          }}
          onChange={handleAnswers}
          errors={errors}
          questionsOverride={getPropertyQuestions(state.propertyType)}
        />

        <div>
          <Label htmlFor="line2" className="text-sm text-ink-muted">
            Unit / suite (optional)
          </Label>
          <Input
            id="line2"
            value={state.line2 ?? ""}
            onChange={(e) => updateState({ line2: e.target.value })}
            placeholder="Apt, suite, floor…"
            className="mt-2 rounded-xl"
          />
        </div>
      </div>
    </BookingFlowChrome>
  );
}
