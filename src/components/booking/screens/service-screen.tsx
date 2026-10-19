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
      step: 3,
    };
    updateState(next);
    const merged = { ...state, ...next };
    router.push(BOOKING_SCREEN_PATHS[getNextScreen("service", merged)]);
  };

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

  const addressLine = [state.line1, state.city].filter(Boolean).join(", ");

  return (
    <BookingFlowChrome
      screenId="service"
      title="New booking"
      subtitle="Choose a clean — final price confirmed before pay."
      hideCta
      locationSlot={
        addressLine ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-3">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-xl text-[var(--color-accent-foreground)]"
              style={{
                background:
                  "linear-gradient(145deg, rgb(8 224 212 / 0.35) 0%, #08e0d4 70%, #003474 160%)",
              }}
              aria-hidden
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {state.line1 || "Property"}
              </p>
              <p className="truncate text-xs text-[var(--ml-dark-ink-muted)]">
                {[state.city, state.state, state.postalCode].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
        ) : null
      }
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
