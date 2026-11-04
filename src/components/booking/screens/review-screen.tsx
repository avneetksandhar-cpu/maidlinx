"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookingFlowChrome } from "@/components/booking/booking-flow-chrome";
import { PromoCodeField } from "@/components/booking/promo-code-field";
import { PriceSummary } from "@/components/booking/price-summary";
import { useBookingGuard } from "@/components/booking/use-booking-guard";
import { bookingEditPath, BOOKING_SCREEN_PATHS } from "@/lib/bookings/booking-routes";
import {
  formatBookingDateShort,
  formatWindowRangeShort,
} from "@/lib/bookings/arrival-labels";
import { buildQuoteInput } from "@/lib/bookings/booking-helpers";
import { useBookingPricing } from "@/hooks/use-booking-pricing";
import { getBookingServiceLabel, BOOKING_EXTRAS } from "@/lib/bookings/constants";
import { getPaymentTimingCopy } from "@/lib/payments/pay-after";
import { formatCurrency } from "@/lib/utils";
import { useBooking } from "@/components/booking/booking-provider";
import { useFinishBookingTitle } from "@/components/booking/use-finish-booking-title";
import { trackFunnelStep } from "@/lib/analytics/booking-funnel";
import {
  captureReviewSnapshot,
  describeReviewChanges,
  readReviewSnapshot,
  writeReviewSnapshot,
} from "@/lib/bookings/review-snapshot";

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
    <div className="flex items-start justify-between gap-3 border-b border-[var(--ml-book-border)] py-4 last:border-0">
      <div className="min-w-0">
        <p className="text-[12px] font-semibold tracking-wide text-[var(--ml-book-ink-muted)] uppercase">
          {label}
        </p>
        <p className="mt-1 text-[16px] font-medium leading-snug text-white">{value}</p>
      </div>
      <Link
        href={href}
        className="shrink-0 px-1 py-1 text-[15px] font-semibold text-[var(--ml-book-primary,#04CED2)]"
      >
        Edit
      </Link>
    </div>
  );
}

export function ReviewScreen() {
  const router = useRouter();
  const { updateState } = useBooking();
  const { state, hydrated, blocked } = useBookingGuard("review");
  const title = useFinishBookingTitle("Review your clean");
  const [changeLines, setChangeLines] = useState<string[]>([]);

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

  // Surface exact changes after Edit (unit / extras / time / price).
  useEffect(() => {
    if (!hydrated || blocked) return;
    const prev = readReviewSnapshot();
    const total = pricing && !pricing.quoteOnly ? pricing.totalCents : undefined;
    const currency = pricing && !pricing.quoteOnly ? pricing.currency : undefined;
    setChangeLines(describeReviewChanges(prev, state, total, currency));
    writeReviewSnapshot(captureReviewSnapshot(state, total, currency));
  }, [
    hydrated,
    blocked,
    state.line1,
    state.line2,
    state.serviceType,
    state.extras,
    state.date,
    state.arrivalWindow,
    pricing?.totalCents,
    pricing?.currency,
  ]);

  if (!hydrated || blocked) {
    return (
      <div
        data-theme="ml-book"
        className="flex min-h-[40dvh] items-center justify-center bg-[var(--ml-book-bg,#01193D)] text-sm text-[var(--ml-book-ink-muted)]"
      >
        Loading…
      </div>
    );
  }

  const homeLine = [state.line1, state.line2].filter(Boolean).join(", ");
  const cityLine = [state.city, state.state, state.postalCode].filter(Boolean).join(", ");
  const homeValue = [homeLine, cityLine].filter(Boolean).join(" · ") || "—";

  const serviceName =
    state.serviceTierId === "standard" || state.serviceType === "standard"
      ? "Standard clean"
      : state.serviceTierId === "deep" || state.serviceType === "deep"
        ? "Deep clean"
        : state.serviceType
          ? getBookingServiceLabel(state.serviceType)
          : null;
  const serviceBits = [
    serviceName,
    state.bedrooms != null ? `${state.bedrooms} bedroom${state.bedrooms === 1 ? "" : "s"}` : null,
    state.bathrooms != null ? `${state.bathrooms} bath` : null,
  ].filter(Boolean);
  const serviceValue = serviceBits.join(" · ") || "—";

  const arrivalValue = [
    formatBookingDateShort(state.date),
    formatWindowRangeShort(state.arrivalWindow),
  ]
    .filter((x) => x && x !== "—")
    .join(" · ");

  const extrasLines =
    pricing && !pricing.quoteOnly
      ? (state.extras ?? [])
          .map((id) => {
            const extra = BOOKING_EXTRAS.find((e) => e.id === id);
            return extra
              ? {
                  label: extra.label,
                  cents: pricing.extrasBreakdown?.[id] ?? 0,
                }
              : null;
          })
          .filter((row): row is { label: string; cents: number } => Boolean(row))
      : [];

  const totalLabel =
    pricing && !pricing.quoteOnly
      ? formatCurrency(pricing.totalCents, pricing.currency)
      : loading
        ? "…"
        : null;

  const timing =
    pricing && !pricing.quoteOnly ? getPaymentTimingCopy(pricing.totalCents) : null;

  const edit = (screen: "address" | "date" | "service" | "details") =>
    bookingEditPath(screen, { fromReview: true });

  return (
    <BookingFlowChrome
      screenId="review"
      title={title}
      subtitle="Edit anything — we refresh your quote before checkout."
      ctaLabel={loading ? "Verifying price…" : "Request clean"}
      ctaDisabled={loading || Boolean(pricingError) || !totalLabel}
      ctaLoading={loading}
      backHref={BOOKING_SCREEN_PATHS.date}
      hideDefaultTotal
      footerHint={
        <div className="space-y-1.5 text-[15px]">
          {timing && totalLabel ? (
            <p className="text-[14px] leading-snug text-[var(--ml-book-ink-muted)]">
              {timing.model === "pay_after_cleaning"
                ? `Due now $0 · charged after clean ${formatCurrency(timing.dueLaterCents, pricing?.currency)}`
                : `${timing.depositPercent}% deposit ${formatCurrency(timing.dueNowCents, pricing?.currency)} today · balance after the job`}
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[var(--ml-book-ink-muted)]">Total</span>
            <span className="text-lg font-bold tabular-nums text-white">
              {totalLabel ?? "—"}
            </span>
          </div>
        </div>
      }
      onContinue={() => {
        if (loading || pricingError) return;
        updateState({ step: 10 });
        router.push(BOOKING_SCREEN_PATHS.payment);
      }}
    >
      <div className="space-y-5">
        {changeLines.length > 0 ? (
          <div
            className="rounded-2xl border border-[var(--ml-book-primary,#04CED2)]/40 bg-[var(--ml-book-selected,#163556)] px-4 py-3 text-[15px] text-white"
            role="status"
          >
            <p className="font-semibold text-[var(--ml-book-primary,#04CED2)]">Updated</p>
            <ul className="mt-1.5 space-y-1 text-white/85">
              {changeLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rounded-2xl border border-[var(--ml-book-border)] bg-[var(--ml-book-surface,#102B49)] px-4">
          <Row label="Address" value={homeValue} href={edit("address")} />
          <Row label="Scope" value={serviceValue} href={edit("details")} />
          <Row label="Arrival" value={arrivalValue || "—"} href={edit("date")} />
          <Row label="Total" value={totalLabel ?? "—"} href={edit("details")} />
        </div>

        {state.accessNotes?.trim() ? (
          <div className="rounded-2xl border border-[var(--ml-book-border)] bg-[var(--ml-book-surface,#102B49)] px-4">
            <Row
              label="Instructions"
              value={state.accessNotes.trim()}
              href={edit("date")}
            />
          </div>
        ) : null}

        <div className="rounded-2xl border border-[var(--ml-book-border)] bg-[var(--ml-book-surface,#102B49)] px-4 py-3">
          <p className="text-[12px] font-semibold tracking-wide text-[var(--ml-book-ink-muted)] uppercase">
            Cost breakdown
          </p>
          {pricing && !pricing.quoteOnly ? (
            <ul className="mt-3 space-y-2 text-[15px] text-white">
              <li className="flex justify-between gap-3">
                <span>
                  {pricing.serviceLabel ??
                    (state.serviceType ? getBookingServiceLabel(state.serviceType) : "Clean")}
                </span>
                <span className="tabular-nums">
                  {formatCurrency(
                    pricing.baseCents +
                      pricing.bedroomCents +
                      pricing.bathroomCents +
                      pricing.squareFootageCents,
                    pricing.currency,
                  )}
                </span>
              </li>
              {extrasLines.map((extra) => (
                <li key={extra.label} className="flex justify-between gap-3">
                  <span>{extra.label}</span>
                  <span className="tabular-nums">
                    {formatCurrency(extra.cents, pricing.currency)}
                  </span>
                </li>
              ))}
              {(pricing.feesCents ?? pricing.platformFeeCents) > 0 ? (
                <li className="flex justify-between gap-3 text-[var(--ml-book-ink-muted)]">
                  <span>Service fee</span>
                  <span className="tabular-nums">
                    {formatCurrency(
                      pricing.feesCents ?? pricing.platformFeeCents,
                      pricing.currency,
                    )}
                  </span>
                </li>
              ) : null}
              {(pricing.discountLines && pricing.discountLines.length > 0
                ? pricing.discountLines.filter((line) => line.amountCents > 0)
                : (pricing.discountCents ?? 0) > 0
                  ? [
                      {
                        label:
                          state.recurringFrequency &&
                          state.recurringFrequency !== "one_time"
                            ? "Recurring discount"
                            : "Discount",
                        amountCents: pricing.discountCents ?? 0,
                      },
                    ]
                  : []
              ).map((line) => (
                <li
                  key={`${line.label}-${line.amountCents}`}
                  className="flex justify-between gap-3 text-[var(--ml-book-ink-muted)]"
                >
                  <span>{line.label}</span>
                  <span className="tabular-nums">
                    −{formatCurrency(line.amountCents, pricing.currency)}
                  </span>
                </li>
              ))}
              <li className="flex justify-between gap-3 border-t border-[var(--ml-book-border)] pt-2 text-base font-bold">
                <span>Total</span>
                <span className="tabular-nums">{totalLabel}</span>
              </li>
            </ul>
          ) : (
            <PriceSummary
              pricing={pricing}
              loading={loading}
              isServerVerified={isServerVerified}
              showDeposit
              variant="embedded"
            />
          )}
        </div>

        <PromoCodeField />

        {pricingError ? (
          <p
            className="rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200"
            role="alert"
          >
            {pricingError}
          </p>
        ) : null}
      </div>
    </BookingFlowChrome>
  );
}
