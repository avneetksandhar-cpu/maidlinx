"use client";

import { MotionReveal } from "@/components/motion/motion-reveal";
import { BookingPaymentForm } from "@/components/booking/booking-payment-form";
import { calculateDepositCents, getDepositPercent } from "@/lib/payments/deposit";
import type { StoredBooking } from "@/lib/bookings/repository";
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
      <div className="space-y-1 rounded-2xl border border-accent/45 bg-accent-muted px-4 py-4 text-[14px] leading-relaxed">
        <p className="font-semibold text-navy">
          Pay {getDepositPercent()}% deposit today
        </p>
        <p className="text-ink-muted">
          Stripe TEST checkout — MaidLinx never stores your card. Remaining balance is settled
          with support after the job.
        </p>
      </div>

      <div className="mt-5 space-y-2 rounded-2xl border border-border bg-surface p-4 text-[15px] shadow-soft">
        <div className="flex justify-between gap-4">
          <span className="text-ink-muted">Booking total</span>
          <span className="font-semibold tabular-nums text-navy">
            {formatCurrency(booking.total_cents, booking.currency)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-ink-muted">Due today ({getDepositPercent()}%)</span>
          <span className="font-semibold tabular-nums text-navy">
            {formatCurrency(deposit, booking.currency)}
          </span>
        </div>
        <p className="pt-1 text-xs text-ink-subtle">
          Booking #{booking.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      <p className="mt-5 text-center text-xs text-ink-subtle">
        Apple Pay, Google Pay, and Link available when your device supports them — card always works.
      </p>

      <div className="mt-4">
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
