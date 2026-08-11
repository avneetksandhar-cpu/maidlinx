"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { BookingMapPreview } from "@/components/booking/booking-map-preview";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";
import { buildQuoteInput } from "@/lib/bookings/booking-helpers";
import { useBookingPricing } from "@/hooks/use-booking-pricing";
import { getPropertyType } from "@/config/property-types";
import { getBookingServiceLabel, BOOKING_EXTRAS } from "@/lib/bookings/constants";
import { formatCurrency } from "@/lib/utils";
import { useBooking } from "@/components/booking/booking-provider";
import { trackFunnelStep } from "@/lib/analytics/booking-funnel";

function Row({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/70 py-4 last:border-0">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="mt-1 text-sm font-medium text-ink">{value}</p>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent"
      >
        <Pencil className="size-3.5" aria-hidden />
        Edit
      </Link>
    </div>
  );
}

export function ReviewScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("review");

  const quoteInput = useMemo(
    () => buildQuoteInput(state, { requireAddress: true }),
    [state],
  );
  const { pricing, loading, error: pricingError, isServerVerified } = useBookingPricing({
    quoteInput,
    enabled: Boolean(quoteInput),
  });

  useEffect(() => {
    if (!pricing || pricing.quoteOnly) return;
    trackFunnelStep("estimate", {
      totalCents: pricing.totalCents,
      currency: pricing.currency,
      verified: isServerVerified,
    });
  }, [pricing, isServerVerified]);

  if (!hydrated || blocked) {
    return (
      <div className="flex min-h-[40dvh] items-center justify-center text-sm text-ink-muted">
        Loading…
      </div>
    );
  }

  const address =
    state.formattedAddress ||
    [state.line1, state.line2, state.city, state.state, state.postalCode]
      .filter(Boolean)
      .join(", ");
  const propertyLabel =
    getPropertyType(state.propertyType)?.label ?? state.propertyType ?? "—";
  const serviceLabel = state.serviceType
    ? getBookingServiceLabel(state.serviceType)
    : "—";
  const extrasLabel =
    (state.extras?.length ?? 0) === 0
      ? "None"
      : (state.extras ?? [])
          .map((id) => BOOKING_EXTRAS.find((e) => e.id === id)?.label ?? id)
          .join(", ");
  const whenLabel = [state.date, state.arrivalWindow, state.schedulePreset]
    .filter(Boolean)
    .join(" · ");
  const accessLabel = state.accessNotes?.trim() || "None added";
  const unitLabel = state.line2?.trim() || "None";

  const totalLabel =
    pricing && !pricing.quoteOnly
      ? formatCurrency(pricing.totalCents, pricing.currency)
      : loading
        ? "…"
        : null;

  return (
    <BookingFlowChrome
      screenId="review"
      title="Ready to clean?"
      subtitle="Confirm the details, then continue to payment."
      ctaLabel={
        loading
          ? "Verifying price…"
          : totalLabel
            ? `Continue · ${totalLabel}`
            : "Continue to payment"
      }
      ctaDisabled={loading || Boolean(pricingError)}
      ctaLoading={loading}
      onContinue={() => {
        if (loading || pricingError) return;
        updateState({ step: 10 });
        router.push(BOOKING_SCREEN_PATHS.payment);
      }}
    >
      <div className="space-y-5">
        <BookingMapPreview
          latitude={state.latitude}
          longitude={state.longitude}
          label={address}
        />

        <div className="rounded-2xl border border-border bg-surface px-4">
          <Row label="Address" value={address} href={BOOKING_SCREEN_PATHS.address} />
          <Row label="Unit / suite" value={unitLabel} href={BOOKING_SCREEN_PATHS.details} />
          <Row
            label="Entry / parking / gate"
            value={accessLabel}
            href={BOOKING_SCREEN_PATHS.access}
          />
          <Row label="Property" value={propertyLabel} href={BOOKING_SCREEN_PATHS.property} />
          <Row
            label="Details"
            value={`${state.bedrooms ?? 0} bed · ${state.bathrooms ?? 1} bath · ${state.squareFootage ?? "—"} sq ft`}
            href={BOOKING_SCREEN_PATHS.details}
          />
          <Row label="Service" value={serviceLabel} href={BOOKING_SCREEN_PATHS.service} />
          <Row label="Add-ons" value={extrasLabel} href={BOOKING_SCREEN_PATHS.addons} />
          <Row label="When" value={whenLabel || "—"} href={BOOKING_SCREEN_PATHS.date} />
        </div>

        {pricingError ? (
          <p
            className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-error"
            role="alert"
          >
            {pricingError}
          </p>
        ) : totalLabel ? (
          <p className="text-center text-sm text-ink-muted">
            Estimated total{" "}
            <span className="font-semibold text-ink">{totalLabel}</span>
            {isServerVerified ? (
              <span className="mt-1 block text-xs text-ink-subtle">Server-verified price</span>
            ) : loading ? (
              <span className="mt-1 block text-xs text-ink-subtle">Verifying with server…</span>
            ) : null}
          </p>
        ) : null}
      </div>
    </BookingFlowChrome>
  );
}
