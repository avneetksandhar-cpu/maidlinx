"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { BookingMapPreview } from "@/components/booking/booking-map-preview";
import { PromoCodeField } from "@/components/booking/promo-code-field";
import { PriceSummary } from "@/components/booking/price-summary";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";
import { buildQuoteInput } from "@/lib/bookings/booking-helpers";
import { useBookingPricing } from "@/hooks/use-booking-pricing";
import { getPropertyType } from "@/config/property-types";
import { getBookingServiceLabel, BOOKING_EXTRAS } from "@/lib/bookings/constants";
import { calculateDepositCents, getDepositPercent } from "@/lib/payments/deposit";
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
    <div className="flex items-start justify-between gap-3 border-b border-[var(--ml-dark-border)] py-4 last:border-0">
      <div className="min-w-0">
        <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--ml-dark-ink-muted)]">
          {label}
        </p>
        <p className="mt-1 text-[15px] font-medium leading-snug text-[var(--ml-dark-ink)]">
          {value}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-[var(--ml-dark-mint)] transition-colors duration-200 hover:bg-[var(--ml-dark-surface-2)]"
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
      <div
        data-theme="ml-dark"
        className="flex min-h-[40dvh] items-center justify-center bg-[var(--ml-dark-bg)] text-sm text-[var(--ml-dark-ink-muted)]"
      >
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
  const frequencyLabel =
    state.recurringFrequency && state.recurringFrequency !== "one_time"
      ? state.recurringFrequency === "weekly"
        ? "Weekly"
        : state.recurringFrequency === "biweekly"
          ? "Every 2 weeks"
          : state.recurringFrequency === "monthly"
            ? "Monthly"
            : null
      : "One-time";
  const whenLabel = [state.date, state.arrivalWindow, frequencyLabel]
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

  const depositLabel =
    pricing && !pricing.quoteOnly
      ? formatCurrency(calculateDepositCents(pricing.totalCents), pricing.currency)
      : null;
  const depositPct = getDepositPercent();

  return (
    <BookingFlowChrome
      screenId="review"
      title="Confirm your clean"
      subtitle="Deposit today · balance after the job (Stripe TEST)."
      ctaLabel={
        loading
          ? "Verifying price…"
          : depositLabel
            ? `Confirm · ${depositLabel}`
            : "Confirm & pay"
      }
      ctaDisabled={loading || Boolean(pricingError)}
      ctaLoading={loading}
      onContinue={() => {
        if (loading || pricingError) return;
        updateState({ step: 10 });
        router.push(BOOKING_SCREEN_PATHS.payment);
      }}
      footerHint={
        totalLabel ? (
          <div className="space-y-1 text-[15px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[var(--ml-dark-ink-muted)]">Est. total</span>
              <span className="font-semibold tabular-nums text-[var(--ml-dark-ink)]">
                {totalLabel}
              </span>
            </div>
            {depositLabel ? (
              <p className="text-xs text-[var(--ml-dark-mint)]">
                Pay {depositPct}% deposit {depositLabel} today
              </p>
            ) : null}
          </div>
        ) : null
      }
    >
      <div className="space-y-5">
        <BookingMapPreview
          latitude={state.latitude}
          longitude={state.longitude}
          label={address}
        />

        <div className="rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4">
          <Row label="Service" value={serviceLabel} href={BOOKING_SCREEN_PATHS.service} />
          <Row label="Property type" value={propertyLabel} href={BOOKING_SCREEN_PATHS.property} />
          <Row label="Address" value={address} href={BOOKING_SCREEN_PATHS.address} />
          <Row label="Unit / suite" value={unitLabel} href={BOOKING_SCREEN_PATHS.details} />
          <Row
            label="Entry / parking / gate"
            value={accessLabel}
            href={BOOKING_SCREEN_PATHS.access}
          />
          <Row
            label="Details"
            value={`${state.bedrooms ?? 0} bed · ${state.bathrooms ?? 1} bath · ${state.squareFootage ?? "—"} sq ft`}
            href={BOOKING_SCREEN_PATHS.details}
          />
          <Row label="Add-ons" value={extrasLabel} href={BOOKING_SCREEN_PATHS.addons} />
          <Row label="When" value={whenLabel || "—"} href={BOOKING_SCREEN_PATHS.date} />
          <Row
            label="Frequency"
            value={frequencyLabel ?? "One-time"}
            href={BOOKING_SCREEN_PATHS.date}
          />
        </div>

        <PriceSummary
          pricing={pricing}
          loading={loading}
          isServerVerified={isServerVerified}
          showDeposit
          variant="embedded"
        />

        <PromoCodeField />

        {pricingError ? (
          <p
            className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300"
            role="alert"
          >
            {pricingError}
          </p>
        ) : null}
      </div>
    </BookingFlowChrome>
  );
}
