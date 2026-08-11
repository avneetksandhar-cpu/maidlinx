"use client";

import Link from "next/link";
import { MotionReveal } from "@/components/motion/motion-reveal";
import { BookingStatusTimeline } from "@/components/booking/booking-status-timeline";
import { calculateDepositCents } from "@/lib/payments/deposit";
import { getBookingStatusLabel } from "@/lib/bookings/status";
import { getCustomerTimelineState } from "@/lib/bookings/status-timeline";
import { isBookingPaymentConfirmed } from "@/lib/bookings/client-api";
import type { StoredBooking } from "@/lib/bookings/repository";
import { Button, Heading, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { routes } from "@/config/site";

interface ConfirmationStepProps {
  booking: StoredBooking;
  accessToken?: string | null;
}

export function ConfirmationStep({ booking, accessToken }: ConfirmationStepProps) {
  const reference = booking.id.slice(0, 8).toUpperCase();
  const isPendingPayment = booking.status === "pending_payment";
  const isConfirmed = isBookingPaymentConfirmed(booking.status) || booking.quote_requested;
  const tokenQuery = accessToken ? `?token=${encodeURIComponent(accessToken)}` : "";
  const timeline = getCustomerTimelineState(booking.status);
  const cleanerName = booking.cleaner
    ? [booking.cleaner.firstName, booking.cleaner.lastName].filter(Boolean).join(" ")
    : null;

  return (
    <MotionReveal>
      <div
        className={`rounded-xl border p-4 text-center ${
          isPendingPayment ? "border-amber-200 bg-amber-50/40" : "border-accent/30 bg-accent-muted/40"
        }`}
      >
        <p className="text-sm font-medium text-ink">
          {booking.quote_requested
            ? "Quote requested"
            : isPendingPayment
              ? "Payment processing"
              : isConfirmed
                ? "Booking confirmed"
                : "Booking update"}
        </p>
        <p className="mt-1 text-xs text-ink-muted">Reference #{reference}</p>
      </div>

      <Heading as="h2" className="mt-6 text-2xl">
        {booking.quote_requested
          ? "We've got your quote request"
          : isPendingPayment
            ? "Almost there"
            : isConfirmed
              ? "You're all set"
              : "Booking saved"}
      </Heading>
      <Text muted className="mt-2">
        {booking.quote_requested
          ? "Our team will review the details and send your custom quote shortly."
          : isPendingPayment
            ? "Your payment is being confirmed. You'll receive an email shortly."
            : isConfirmed
              ? "We've received your deposit. A confirmation email is on its way."
              : "Check your email for the latest status on this booking."}
      </Text>

      {!booking.quote_requested && isConfirmed && timeline.findingProfessional ? (
        <p className="mt-4 rounded-xl bg-surface-muted px-4 py-3 text-sm font-medium text-ink">
          Finding your cleaning professional…
        </p>
      ) : null}

      {timeline.showCleaner && booking.cleaner ? (
        <div className="mt-4 rounded-xl border border-border p-4 text-sm">
          <p className="font-medium text-ink">{cleanerName || "Your cleaner"}</p>
          {booking.cleaner.ratingAverage !== null ? (
            <p className="mt-1 text-ink-muted">
              Rating {booking.cleaner.ratingAverage.toFixed(1)}
              {booking.cleaner.ratingCount
                ? ` · ${booking.cleaner.ratingCount} reviews`
                : null}
            </p>
          ) : null}
          {booking.estimated_eta_minutes !== null ? (
            <p className="mt-1 text-ink-muted">ETA ~{booking.estimated_eta_minutes} min</p>
          ) : null}
          <p className="mt-1 text-ink-muted">Status: {getBookingStatusLabel(booking.status)}</p>
        </div>
      ) : null}

      {!isPendingPayment ? (
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-ink-muted">Progress</p>
          <BookingStatusTimeline status={booking.status} />
        </div>
      ) : null}

      <dl className="mt-6 space-y-3 rounded-xl border border-border p-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Status</dt>
          <dd className="font-medium">{getBookingStatusLabel(booking.status)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Service</dt>
          <dd className="font-medium capitalize">{booking.service_type.replace(/_/g, " ")}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Scheduled</dt>
          <dd className="font-medium">{new Date(booking.scheduled_at).toLocaleString()}</dd>
        </div>
        {!isPendingPayment && !booking.quote_requested ? (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Deposit paid</dt>
            <dd className="font-medium">
              {formatCurrency(calculateDepositCents(booking.total_cents), booking.currency)}
            </dd>
          </div>
        ) : null}
        {!booking.quote_requested ? (
          <div className="flex justify-between gap-4">
            <dt className="text-ink-muted">Booking total</dt>
            <dd className="font-medium">
              {formatCurrency(booking.total_cents, booking.currency)}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Address</dt>
          <dd className="text-right font-medium">
            {booking.address_line1}, {booking.address_city}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href={`/booking/${booking.id}${tokenQuery}`} className="sm:flex-1">
          <Button variant="secondary" className="w-full">
            View confirmation page
          </Button>
        </Link>
        <Link href={routes.home} className="sm:flex-1">
          <Button className="w-full">Back to home</Button>
        </Link>
      </div>
    </MotionReveal>
  );
}
