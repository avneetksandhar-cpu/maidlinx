"use client";

import { MotionReveal } from "@/components/motion/motion-reveal";
import { BookingPaymentForm } from "@/components/booking/booking-payment-form";
import { calculateDepositCents, getDepositPercent } from "@/lib/payments/deposit";
import type { StoredBooking } from "@/lib/bookings/repository";
import { Heading, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { trackBookingEvent } from "@/lib/analytics/booking";
import { useEffect } from "react";

interface CheckoutStepProps {
  booking: StoredBooking;
  accessToken?: string | null;
  onSuccess: () => void;
}

export function CheckoutStep({ booking, accessToken, onSuccess }: CheckoutStepProps) {
  const deposit = calculateDepositCents(booking.total_cents);

  useEffect(() => {
    trackBookingEvent("payment_started", {
      bookingId: booking.id,
      depositCents: deposit,
    });
  }, [booking.id, deposit]);

  return (
    <MotionReveal>
      <Heading as="h2" className="text-2xl tracking-tight">
        Secure checkout
      </Heading>
      <Text muted className="mt-2">
        Pay a {getDepositPercent()}% deposit now. The remaining balance is due after your clean.
      </Text>

      <div className="mt-5 space-y-2 rounded-2xl border border-border bg-surface-muted/50 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-ink-muted">Booking total</span>
          <span className="font-semibold tabular-nums">
            {formatCurrency(booking.total_cents, booking.currency)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-ink-muted">Due today ({getDepositPercent()}%)</span>
          <span className="font-semibold tabular-nums">
            {formatCurrency(deposit, booking.currency)}
          </span>
        </div>
        <p className="pt-1 text-xs text-ink-subtle">
          Reference #{booking.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      {/* Wallet pay UI scaffold — Stripe Payment Request Button can wire here later */}
      <div className="mt-5 grid gap-2 sm:grid-cols-2" aria-hidden>
        <button
          type="button"
          disabled
          className="flex h-12 items-center justify-center rounded-xl bg-ink text-sm font-medium text-white opacity-40"
          title="Apple Pay coming soon"
        >
          Apple Pay
        </button>
        <button
          type="button"
          disabled
          className="flex h-12 items-center justify-center rounded-xl border border-border bg-surface text-sm font-medium text-ink opacity-40"
          title="Google Pay coming soon"
        >
          Google Pay
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-ink-subtle">
        Apple Pay &amp; Google Pay coming soon — card checkout below.
      </p>

      <div className="mt-6">
        <BookingPaymentForm
          bookingId={booking.id}
          accessToken={accessToken}
          totalCents={booking.total_cents}
          onSuccess={onSuccess}
        />
      </div>
    </MotionReveal>
  );
}
