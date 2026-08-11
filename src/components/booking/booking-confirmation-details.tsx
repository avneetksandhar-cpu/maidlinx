"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchBooking,
  isBookingPaymentConfirmed,
  pollBookingUntilConfirmed,
} from "@/lib/bookings/client-api";
import type { StoredBooking } from "@/lib/bookings/repository";
import { getBookingStatusLabel } from "@/lib/bookings/status";
import { getCustomerTimelineState } from "@/lib/bookings/status-timeline";
import { BookingMapPreview } from "@/components/booking/booking-map-preview";
import { BookingStatusTimeline } from "@/components/booking/booking-status-timeline";
import { LiveCleanerMap } from "@/components/booking/live-cleaner-map";
import { calculateDepositCents, getDepositPercent } from "@/lib/payments/deposit";
import { isLiveLocationStatus } from "@/lib/bookings/status";
import { Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { routes } from "@/config/site";

interface BookingConfirmationDetailsProps {
  booking: StoredBooking;
  accessToken?: string | null;
}

export function BookingConfirmationDetails({
  booking: initialBooking,
  accessToken,
}: BookingConfirmationDetailsProps) {
  const [booking, setBooking] = useState(initialBooking);
  const [polling, setPolling] = useState(initialBooking.status === "pending_payment");

  useEffect(() => {
    if (initialBooking.status !== "pending_payment") return;

    let cancelled = false;

    pollBookingUntilConfirmed(initialBooking.id, accessToken)
      .then((confirmed) => {
        if (!cancelled) {
          setBooking(confirmed);
          setPolling(false);
        }
      })
      .catch(() => {
        if (!cancelled) setPolling(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialBooking.id, initialBooking.status, accessToken]);

  useEffect(() => {
    if (booking.status === "pending_payment") return;

    const interval = window.setInterval(async () => {
      try {
        const latest = await fetchBooking(booking.id, accessToken);
        setBooking(latest);
      } catch {
        // Keep showing last known real state.
      }
    }, 8000);

    return () => window.clearInterval(interval);
  }, [booking.id, booking.status, accessToken]);

  useEffect(() => {
    if (!polling || booking.status !== "pending_payment") return;

    const interval = window.setInterval(async () => {
      try {
        const latest = await fetchBooking(booking.id, accessToken);
        setBooking(latest);
        if (isBookingPaymentConfirmed(latest.status)) {
          setPolling(false);
        }
      } catch {
        // Keep polling until timeout in primary effect.
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [polling, booking.id, booking.status, accessToken]);

  const isPendingPayment = booking.status === "pending_payment";
  const isCancelled = booking.status === "cancelled";
  const isConfirmed = isBookingPaymentConfirmed(booking.status) || booking.quote_requested;
  const depositCents = calculateDepositCents(booking.total_cents);
  const timeline = getCustomerTimelineState(booking.status);
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

  return (
    <>
      <div
        className={`rounded-xl border p-5 text-center ${
          isCancelled
            ? "border-error/30 bg-red-50/40"
            : isPendingPayment
              ? "border-amber-200 bg-amber-50/40"
              : "border-accent/30 bg-accent-muted/40"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {isCancelled
            ? "Cancelled"
            : booking.quote_requested
              ? "Quote requested"
              : isPendingPayment
                ? polling
                  ? "Confirming payment"
                  : "Payment pending"
                : "Confirmed"}
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink">
          {isCancelled
            ? "This booking was cancelled"
            : booking.quote_requested
              ? "Quote request received"
              : isPendingPayment
                ? polling
                  ? "Confirming your payment…"
                  : "Complete your payment"
                : "Your clean is booked"}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Reference #{booking.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      <p className="mt-6 text-ink-muted">
        {booking.quote_requested
          ? "We'll review your details and follow up with a custom quote."
          : isPendingPayment
            ? polling
              ? "We received your payment and are waiting for confirmation. This usually takes a few seconds."
              : "Your booking is saved. Finish payment to confirm your appointment."
            : isCancelled
              ? "Contact support if you need help rebooking."
              : `Thank you for booking with MaidLinx. We've sent a confirmation to ${
                  booking.customer_email ?? "your email"
                }.`}
      </p>

      {!booking.quote_requested && isConfirmed && timeline.findingProfessional ? (
        <p className="mt-4 rounded-xl bg-surface-muted px-4 py-3 text-sm font-medium text-ink">
          Finding your cleaning professional…
        </p>
      ) : null}

      {addressLabel && !isCancelled ? (
        <div className="mt-6">
          {isLiveLocationStatus(booking.status) ? (
            <LiveCleanerMap
              bookingId={booking.id}
              accessToken={accessToken}
              status={booking.status}
              customerLat={booking.address_latitude}
              customerLng={booking.address_longitude}
              addressLabel={addressLabel}
            />
          ) : (
            <BookingMapPreview
              latitude={booking.address_latitude}
              longitude={booking.address_longitude}
              label={addressLabel}
            />
          )}
        </div>
      ) : null}

      {timeline.showCleaner && booking.cleaner ? (
        <div className="mt-4 rounded-xl border border-border p-5">
          <p className="text-sm font-semibold text-ink">{cleanerName || "Your cleaner"}</p>
          {booking.cleaner.ratingAverage !== null ? (
            <p className="mt-1 text-sm text-ink-muted">
              Rating {booking.cleaner.ratingAverage.toFixed(1)}
              {booking.cleaner.ratingCount ? ` · ${booking.cleaner.ratingCount} reviews` : null}
            </p>
          ) : null}
          {booking.estimated_eta_minutes !== null ? (
            <p className="mt-1 text-sm text-ink-muted">ETA ~{booking.estimated_eta_minutes} min</p>
          ) : null}
          <p className="mt-1 text-sm text-ink-muted">
            Status: {getBookingStatusLabel(booking.status)}
          </p>
        </div>
      ) : null}

      {!isPendingPayment && !isCancelled ? (
        <div className="mt-8">
          <p className="mb-3 text-sm font-medium text-ink-muted">Progress</p>
          <BookingStatusTimeline status={booking.status} />
        </div>
      ) : null}

      <dl className="mt-8 space-y-4 rounded-xl border border-border p-6 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Status</dt>
          <dd className="font-medium">{getBookingStatusLabel(booking.status)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Service</dt>
          <dd className="font-medium capitalize">{booking.service_type.replace(/_/g, " ")}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Date</dt>
          <dd className="font-medium">{new Date(booking.scheduled_at).toLocaleString()}</dd>
        </div>
        {!isCancelled && !booking.quote_requested ? (
          <>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">
                {isPendingPayment ? "Deposit due" : `Deposit paid (${getDepositPercent()}%)`}
              </dt>
              <dd className="font-medium">
                {formatCurrency(depositCents, booking.currency)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Booking total</dt>
              <dd className="font-medium">
                {formatCurrency(booking.total_cents, booking.currency)}
              </dd>
            </div>
          </>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Address</dt>
          <dd className="text-right font-medium">
            {booking.address_line1}, {booking.address_city}, {booking.address_state}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {isPendingPayment ? (
          <Link
            href={`/book/payment?resume=${booking.id}${accessToken ? `&token=${encodeURIComponent(accessToken)}` : ""}`}
            className="sm:flex-1"
          >
            <Button className="w-full">Return to checkout</Button>
          </Link>
        ) : booking.status === "completed" ? (
          <Link
            href={`${routes.book}?${new URLSearchParams({
              rebook: "1",
              serviceType: booking.service_type,
              line1: booking.address_line1 ?? "",
              city: booking.address_city ?? "",
              state: booking.address_state ?? "",
            }).toString()}`}
            className="sm:flex-1"
          >
            <Button className="w-full">Book again</Button>
          </Link>
        ) : (
          <Link href={routes.dashboardBookings} className="sm:flex-1">
            <Button className="w-full">View my bookings</Button>
          </Link>
        )}
        <Link href={routes.home} className="sm:flex-1">
          <Button variant="secondary" className="w-full">
            Back to home
          </Button>
        </Link>
      </div>
    </>
  );
}
