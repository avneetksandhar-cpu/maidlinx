"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MatchingStep } from "@/components/booking/matching-step";
import { BookingStatusTimeline } from "@/components/booking/booking-status-timeline";
import {
  fetchBooking,
  isBookingPaymentConfirmed,
  pollBookingUntilConfirmed,
} from "@/lib/bookings/client-api";
import type { StoredBooking } from "@/lib/bookings/repository";
import { getBookingStatusLabel } from "@/lib/bookings/status";
import { getCustomerTimelineState } from "@/lib/bookings/status-timeline";
import { Button, Heading, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { calculateDepositCents } from "@/lib/payments/deposit";
import { routes } from "@/config/site";
import { trackFunnelStep } from "@/lib/analytics/booking-funnel";
import { useBooking } from "@/components/booking/booking-provider";

interface BookingStatusScreenProps {
  bookingId: string;
  accessToken?: string | null;
  initialBooking?: StoredBooking | null;
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
      <div className="mx-auto flex min-h-[50dvh] max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="mb-6 flex size-20 items-center justify-center overflow-hidden rounded-full bg-navy ring-2 ring-white/20">
          {/* eslint-disable-next-line @next/next/no-img-element -- compact brand mark */}
          <img
            src="/brand/maidlinx-mark.png"
            alt=""
            width={44}
            height={44}
            className="size-11 object-contain"
          />
        </div>
        <Heading as="h1" className="text-2xl">
          Finding your MaidLinx Pro…
        </Heading>
        <Text muted className="mt-2">
          {error ?? "Loading your booking…"}
        </Text>
      </div>
    );
  }

  if (!isBookingPaymentConfirmed(booking.status) && !booking.quote_requested) {
    if (booking.status === "pending_payment") {
      return (
        <div className="mx-auto max-w-lg px-4 py-12 text-center">
          <Heading as="h1" className="text-2xl">
            Confirming payment…
          </Heading>
          <Text muted className="mt-2">
            This usually takes a few seconds.
          </Text>
        </div>
      );
    }
  }

  const timeline = getCustomerTimelineState(booking.status);
  const cleanerName = booking.cleaner
    ? [booking.cleaner.firstName, booking.cleaner.lastName].filter(Boolean).join(" ")
    : null;

  // Prefer dedicated matching UI while waiting; show assigned profile when real cleaner exists.
  if (timeline.findingProfessional || !booking.cleaner) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <MatchingStep booking={booking} accessToken={accessToken} bookingState={state} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-accent-muted text-accent">
          <span className="text-2xl font-semibold">✓</span>
        </div>
        <Heading as="h1" className="text-2xl tracking-tight">
          Your MaidLinx Pro is assigned
        </Heading>
        <Text muted className="mt-2">
          Reference #{booking.id.slice(0, 8).toUpperCase()}
        </Text>
      </div>

      <div className="mt-8 rounded-2xl border border-border p-5">
        <p className="font-display text-xl font-semibold text-ink">
          {cleanerName || "Your cleaner"}
        </p>
        {booking.cleaner.ratingAverage !== null ? (
          <p className="mt-1 text-sm text-ink-muted">
            Rating {booking.cleaner.ratingAverage.toFixed(1)}
            {booking.cleaner.ratingCount
              ? ` · ${booking.cleaner.ratingCount} reviews`
              : null}
          </p>
        ) : null}
        {booking.estimated_eta_minutes !== null ? (
          <p className="mt-2 text-sm font-medium text-accent">
            ETA ~{booking.estimated_eta_minutes} min
          </p>
        ) : null}
        <p className="mt-2 text-sm text-ink-muted">
          Status: {getBookingStatusLabel(booking.status)}
        </p>
      </div>

      <div className="mt-8">
        <p className="mb-3 text-sm font-medium text-ink-muted">Progress</p>
        <BookingStatusTimeline status={booking.status} />
      </div>

      <dl className="mt-8 space-y-3 rounded-2xl border border-border p-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Service</dt>
          <dd className="font-medium capitalize">
            {booking.service_type.replace(/_/g, " ")}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Deposit paid</dt>
          <dd className="font-medium">
            {formatCurrency(calculateDepositCents(booking.total_cents), booking.currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Address</dt>
          <dd className="text-right font-medium">
            {booking.address_line1}, {booking.address_city}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href={routes.dashboardBookings} className="sm:flex-1">
          <Button variant="accent" className="w-full">
            View my bookings
          </Button>
        </Link>
        <Link href={routes.home} className="sm:flex-1">
          <Button variant="secondary" className="w-full">
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}
