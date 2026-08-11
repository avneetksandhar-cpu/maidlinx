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
      <div className="space-y-2 rounded-2xl border border-[#E2E9E6] bg-[#F1F8F5] px-4 py-3.5 text-[14px] leading-relaxed">
        <p className="font-semibold text-ink">Pay securely with Stripe</p>
        <p className="text-ink-muted">
          MaidLinx never stores your card number. You pay a {getDepositPercent()}% deposit now;
          any remaining balance is settled with support after the job.
        </p>
      </div>

      <div className="mt-5 space-y-2 rounded-2xl border border-[#E2E9E6] bg-white p-4 text-[15px] shadow-soft">
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
          Booking #{booking.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      <p className="mt-5 text-center text-xs text-ink-subtle">
        Apple Pay &amp; Google Pay coming soon — use card checkout below.
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
