"use client";

import { useRouter } from "next/navigation";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { ServiceTierSelector } from "@/components/booking/service-tier-selector";
import { useBooking } from "@/components/booking/booking-provider";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { BOOKING_SCREEN_PATHS, getNextScreen } from "@/lib/bookings/booking-routes";
import { getServiceBySlug } from "@/config/services";
import type { ServiceTier } from "@/config/service-tiers";
import { resolveServiceAreaCurrency } from "@/lib/bookings/market-currency";
import { trackBookingEvent } from "@/lib/analytics/booking";

export function ServiceScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("service");
  const currency = resolveServiceAreaCurrency(state) ?? "USD";

  const selectTier = (tier: ServiceTier) => {
    const service = getServiceBySlug(tier.serviceSlug);
    trackBookingEvent("service_selected", {
      tierId: tier.id,
      serviceType: tier.serviceType,
    });
    const next = {
      serviceTierId: tier.id,
      serviceType: tier.serviceType,
      serviceSlug: service?.slug ?? tier.serviceSlug,
      serviceTile: (tier.serviceType === "office"
        ? "office"
        : tier.serviceType === "airbnb_turnover"
          ? "airbnb"
          : tier.serviceType.startsWith("move")
            ? "move"
            : tier.serviceType === "post_construction"
              ? "construction"
              : "home") as NonNullable<typeof state.serviceTile>,
      step: 5,
    };
    updateState(next);
    const nextScreen = getNextScreen("service", { ...state, ...next });
    router.push(BOOKING_SCREEN_PATHS[nextScreen]);
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
      screenId="service"
      title="What kind of clean?"
      subtitle="Each option shows an estimated price for your space."
      hideCta
    >
      <ServiceTierSelector
        propertyType={state.propertyType}
        value={state.serviceTierId}
        bedrooms={state.bedrooms}
        bathrooms={state.bathrooms}
        squareFootage={state.squareFootage}
        currency={currency}
        onChange={selectTier}
      />
    </BookingFlowChrome>
  );
}
