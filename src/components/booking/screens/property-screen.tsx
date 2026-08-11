"use client";

import { useRouter } from "next/navigation";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { PropertyTypeCards } from "@/components/booking/property-type-cards";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";
import { getPropertyType, type PropertyTypeId } from "@/config/property-types";
import type { ServiceAnswers } from "@/lib/services/questions";
import { trackBookingEvent } from "@/lib/analytics/booking";

export function PropertyScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("property");

  const selectProperty = (propertyType: PropertyTypeId) => {
    const property = getPropertyType(propertyType);
    trackBookingEvent("property_selected", { propertyType });
    const nextAnswers: ServiceAnswers = {
      ...(state.serviceAnswers ?? {}),
      propertyType,
    };
    if (
      propertyType === "retail" ||
      propertyType === "restaurant" ||
      propertyType === "office"
    ) {
      nextAnswers.businessType = propertyType;
    }

    updateState({
      propertyType,
      serviceAnswers: nextAnswers,
      serviceType: property?.defaultServiceType,
      serviceSlug: property?.defaultServiceSlug,
      serviceTierId: null,
      bedrooms: property?.questionSet === "commercial" ? 0 : (state.bedrooms ?? 2),
      bathrooms: state.bathrooms ?? (property?.questionSet === "commercial" ? 1 : 2),
      squareFootage: state.squareFootage ?? 1500,
      step: 3,
    });

    // Single-choice → auto-advance
    router.push(BOOKING_SCREEN_PATHS.details);
  };

  if (!hydrated || blocked) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  return (
    <BookingFlowChrome
      screenId="property"
      title="What are we cleaning?"
      subtitle="Pick the space type — we’ll ask the right questions next."
      hideCta
    >
      <PropertyTypeCards
        value={state.propertyType === "condo" ? "apartment" : state.propertyType}
        onChange={selectProperty}
      />
    </BookingFlowChrome>
  );
}
