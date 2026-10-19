"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteLogo } from "@/components/brand/site-logo";
import { MatchingStep } from "@/components/booking/matching-step";
import { BookingMapPreview } from "@/components/booking/booking-map-preview";
import { BookingStatusTimeline } from "@/components/booking/booking-status-timeline";
import { LiveCleanerMap } from "@/components/booking/live-cleaner-map";
import {
  fetchBooking,
  isBookingPaymentConfirmed,
  pollBookingUntilConfirmed,
} from "@/lib/bookings/client-api";
import type { StoredBooking } from "@/lib/bookings/repository";
import { getBookingStatusLabel, isLiveLocationStatus, normalizeBookingStatus } from "@/lib/bookings/status";
import { getCustomerStatusHeadline, getCustomerTimelineState } from "@/lib/bookings/status-timeline";
import { Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { calculateDepositCents } from "@/lib/payments/deposit";
import { routes } from "@/config/site";
import { trackFunnelStep } from "@/lib/analytics/booking-funnel";
import { useBooking } from "@/components/booking/booking-provider";
import { formatBookingDate, formatBookingTimeRange } from "@/lib/dashboard/display";

interface BookingStatusScreenProps {
  bookingId: string;
  accessToken?: string | null;
  initialBooking?: StoredBooking | null;
}

function statusVariant(
  status: string,
): "confirmed" | "assigned" | "on_the_way" | "in_progress" | "completed" | "other" {
  const normalized = normalizeBookingStatus(status);
  switch (normalized) {
    case "confirmed":
    case "awaiting_assignment":
    case "offered":
      return "confirmed";
    case "assigned":
    case "accepted":
      return "assigned";
    case "on_the_way":
    case "arrived":
      return "on_the_way";
    case "in_progress":
      return "in_progress";
    case "completed":
      return "completed";
    default:
      return "other";
  }
}

function DarkShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="ml-dark"
      className="min-h-[50dvh] bg-[var(--ml-dark-bg)] text-[var(--ml-dark-ink)]"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      {children}
    </div>
  );
}

export function BookingStatusScreen({
  bookingId,
  accessToken,
  initialBooking = null,
}: BookingStatusScreenProps) {
  const { state } = useBooking();
  const [booking, setBooking] = useState<StoredBooking | null>(initialBooking);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialBooking);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!initialBooking) {
          const latest = await fetchBooking(bookingId, accessToken);
          if (!cancelled) {
            setBooking(latest);
            setLoading(false);
          }
        }

        if (initialBooking?.status === "pending_payment" || booking?.status === "pending_payment") {
          const confirmed = await pollBookingUntilConfirmed(bookingId, accessToken);
          if (!cancelled) setBooking(confirmed);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load booking.");
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, [bookingId, accessToken]);

  const bookingStatus = booking?.status;
  const cleanerId = booking?.cleaner?.id;

  useEffect(() => {
    if (!bookingStatus || bookingStatus === "pending_payment") return;

    const interval = window.setInterval(async () => {
      try {
        const latest = await fetchBooking(bookingId, accessToken);
        setBooking(latest);
      } catch {
        // Keep last known real state.
      }
    }, 8000);

    return () => window.clearInterval(interval);
  }, [bookingStatus, bookingId, accessToken]);

  useEffect(() => {
    if (!booking) return;
    const timeline = getCustomerTimelineState(booking.status);
    if (timeline.findingProfessional) {
      trackFunnelStep("assign", { bookingId: booking.id, status: booking.status });
    } else if (booking.cleaner) {
      trackFunnelStep("track", { bookingId: booking.id, status: booking.status });
    }
    // Track on status / cleaner assignment changes only.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: avoid re-firing on every poll tick
  }, [booking?.id, bookingStatus, cleanerId]);

  if (loading || !booking) {
    return (
      <DarkShell>
        <div className="mx-auto flex min-h-[50dvh] max-w-lg flex-col items-center justify-center px-4 text-center">
          <SiteLogo variant="mark" tone="brand" href={routes.home} className="mb-6 scale-110" />
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Finding your MaidLinx Pro…
          </h1>
          <p className="mt-2 text-sm text-[var(--ml-dark-ink-muted)]">
            {error ?? "Loading your booking…"}
          </p>
        </div>
      </DarkShell>
    );
  }

  if (!isBookingPaymentConfirmed(booking.status) && !booking.quote_requested) {
    if (booking.status === "pending_payment") {
      return (
        <DarkShell>
          <div className="mx-auto max-w-lg px-4 py-12 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Confirming payment…
            </h1>
            <p className="mt-2 text-sm text-[var(--ml-dark-ink-muted)]">
              This usually takes a few seconds.
            </p>
          </div>
        </DarkShell>
      );
    }
  }

  const timeline = getCustomerTimelineState(booking.status);
  const variant = statusVariant(booking.status);
  const cleanerName = booking.cleaner
    ? [booking.cleaner.firstName, booking.cleaner.lastName].filter(Boolean).join(" ")
    : null;
  const addressLabel = [
    booking.address_line1,
    booking.address_line2,
    booking.address_city,
    booking.address_state,
    booking.address_postal_code,
  ]
    .filter(Boolean)
    .join(", ");
  const showLiveProgress =
    variant === "on_the_way" || variant === "in_progress" || variant === "completed";
  const showMintCheck = variant === "confirmed" || variant === "assigned" || variant === "completed";

  // Prefer dedicated matching UI while waiting; show assigned profile when real cleaner exists.
  if (timeline.findingProfessional || !booking.cleaner) {
    return (
      <DarkShell>
        <div className="mx-auto max-w-lg px-4 py-8">
          <MatchingStep booking={booking} accessToken={accessToken} bookingState={state} />
          {addressLabel ? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--ml-dark-border)]">
              <BookingMapPreview
                latitude={booking.address_latitude}
                longitude={booking.address_longitude}
                label={addressLabel}
              />
            </div>
          ) : null}
        </div>
      </DarkShell>
    );
  }

  const headline =
    variant === "completed"
      ? "Cleaning completed!"
      : variant === "in_progress"
        ? "Cleaning in progress"
        : variant === "on_the_way"
          ? "Your cleaners are on the way"
          : variant === "assigned"
            ? "Your MaidLinx Pro is assigned"
            : getCustomerStatusHeadline(booking.status);

  return (
    <DarkShell>
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="text-center">
          {showMintCheck ? (
            <div
              className="mx-auto mb-5 flex size-[4.5rem] items-center justify-center rounded-full bg-[var(--ml-dark-mint)] text-[var(--color-accent-foreground)] shadow-[0_0_28px_rgb(8_224_212_/_0.35)]"
              aria-hidden
            >
              <span className="text-3xl font-bold leading-none">✓</span>
            </div>
          ) : (
            <div className="mb-5 flex justify-center">
              <SiteLogo variant="mark" tone="brand" href={routes.home} />
            </div>
          )}
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-white md:text-[2rem]">
            {headline}
          </h1>
          <p className="mt-2 text-[15px] text-[var(--ml-dark-ink-muted)]">
            Booking #{booking.id.slice(0, 8).toUpperCase()}
          </p>
          {booking.scheduled_at ? (
            <p className="mt-3 text-sm text-[var(--ml-dark-ink-muted)]">
              {formatBookingDate(booking.scheduled_at)}
              {" · "}
              {formatBookingTimeRange(
                booking.scheduled_at,
                booking.arrival_window_start,
                booking.arrival_window_end,
              )}
            </p>
          ) : null}
          {addressLabel ? (
            <p className="mt-1 text-sm text-[var(--ml-dark-ink-subtle)]">{addressLabel}</p>
          ) : null}
        </div>

        <div className="mt-8 space-y-4">
          {isLiveLocationStatus(booking.status) ? (
            <div className="overflow-hidden rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)]">
              <LiveCleanerMap
                bookingId={booking.id}
                accessToken={accessToken}
                status={booking.status}
                customerLat={booking.address_latitude}
                customerLng={booking.address_longitude}
                addressLabel={addressLabel}
              />
            </div>
          ) : addressLabel ? (
            <div className="overflow-hidden rounded-2xl border border-[var(--ml-dark-border)]">
              <BookingMapPreview
                latitude={booking.address_latitude}
                longitude={booking.address_longitude}
                label={addressLabel}
              />
            </div>
          ) : null}
        </div>

        {/* Real cleaner only — never invent names, ratings, or photos */}
        {booking.cleaner ? (
          <div className="mt-6 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--ml-dark-mint)]/15 text-sm font-bold text-[var(--ml-dark-mint)]">
                {(cleanerName ?? "P").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {cleanerName || "Your MaidLinx Pro"}
                </p>
                {booking.cleaner.ratingAverage !== null ? (
                  <p className="mt-0.5 text-sm text-[var(--ml-dark-ink-muted)]">
                    <span className="text-[var(--ml-dark-mint)]">★</span>{" "}
                    {booking.cleaner.ratingAverage.toFixed(1)}
                    {booking.cleaner.ratingCount
                      ? ` · ${booking.cleaner.ratingCount} reviews`
                      : null}
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm text-[var(--ml-dark-ink-muted)]">MaidLinx Pro</p>
                )}
              </div>
            </div>
            {/* ETA only when backend provides a real value — never invent */}
            {booking.estimated_eta_minutes != null &&
            Number.isFinite(booking.estimated_eta_minutes) ? (
              <p className="mt-3 text-sm font-medium text-[var(--ml-dark-mint)]">
                ETA ~{booking.estimated_eta_minutes} min
              </p>
            ) : null}
            <p className="mt-2 text-sm text-[var(--ml-dark-ink-muted)]">
              Status: {getBookingStatusLabel(booking.status)}
            </p>
          </div>
        ) : null}

        {showLiveProgress ? (
          <div className="mt-8 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] px-4 py-5">
            <p className="mb-4 text-center text-xs font-medium tracking-wide text-[var(--ml-dark-ink-muted)] uppercase">
              Progress
            </p>
            <BookingStatusTimeline status={booking.status} variant="live" />
          </div>
        ) : (
          <div className="mt-8">
            <p className="mb-3 text-sm font-medium text-[var(--ml-dark-ink-muted)]">Progress</p>
            <BookingStatusTimeline status={booking.status} />
          </div>
        )}

        <dl className="mt-8 space-y-3 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-5 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ml-dark-ink-muted)]">Service</dt>
            <dd className="font-medium capitalize text-white">
              {booking.service_type.replace(/_/g, " ")}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ml-dark-ink-muted)]">Deposit paid</dt>
            <dd className="font-medium text-white">
              {formatCurrency(calculateDepositCents(booking.total_cents), booking.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ml-dark-ink-muted)]">Address</dt>
            <dd className="text-right font-medium text-white">
              {booking.address_line1}, {booking.address_city}
            </dd>
          </div>
        </dl>

        {variant === "completed" ? (
          <div className="mt-8 space-y-3">
            <Link href={routes.dashboardBookings} className="block">
              <Button variant="primary" className="booking-cta-btn w-full rounded-2xl">
                Rate your cleaners
              </Button>
            </Link>
            <div className="grid gap-2 sm:grid-cols-2">
              <Link href={routes.dashboardInvoices}>
                <Button
                  variant="secondary"
                  className="w-full rounded-2xl border-[var(--ml-dark-border-strong)] bg-transparent text-white hover:bg-[var(--ml-dark-surface-2)]"
                >
                  View invoice
                </Button>
              </Link>
              <Link href={`${routes.book}?rebook=1`}>
                <Button
                  variant="secondary"
                  className="w-full rounded-2xl border-[var(--ml-dark-border-strong)] bg-transparent text-white hover:bg-[var(--ml-dark-surface-2)]"
                >
                  Book again
                </Button>
              </Link>
            </div>
            <p className="text-center text-xs text-[var(--ml-dark-ink-subtle)]">
              Tips are not available in TEST checkout yet — leave a review to thank your team.
            </p>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={routes.dashboardBookings} className="sm:flex-1">
              <Button variant="primary" className="booking-cta-btn w-full rounded-2xl">
                View my bookings
              </Button>
            </Link>
            <Link href={routes.home} className="sm:flex-1">
              <Button
                variant="secondary"
                className="w-full rounded-2xl border-[var(--ml-dark-border-strong)] bg-transparent text-white hover:bg-[var(--ml-dark-surface-2)]"
              >
                Back to home
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DarkShell>
  );
}
