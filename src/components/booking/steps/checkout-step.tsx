"use client";

import { MotionReveal } from "@/components/motion/motion-reveal";
import { BookingPaymentForm } from "@/components/booking/booking-payment-form";
import { getPaymentTimingCopy, isPayAfterCleaningEnabled } from "@/lib/payments/pay-after";
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
  const timing = getPaymentTimingCopy(booking.total_cents);
  const payAfter = isPayAfterCleaningEnabled();

  useEffect(() => {
    trackBookingEvent("payment_started", {
      bookingId: booking.id,
      depositCents: timing.dueNowCents,
      timingModel: timing.model,
    });
  }, [booking.id, timing.dueNowCents, timing.model]);

  return (
    <MotionReveal>
      <div className="space-y-1 rounded-2xl border border-accent/45 bg-accent-muted px-4 py-4 text-[14px] leading-relaxed">
        <p className="font-semibold text-navy">{timing.requestHeadline}</p>
        <p className="text-ink-muted">{timing.requestDetail}</p>
      </div>

      <div className="mt-5 space-y-2 rounded-2xl border border-border bg-surface p-4 text-[15px] shadow-soft">
        <div className="flex justify-between gap-4">
          <span className="text-ink-muted">Booking total</span>
          <span className="font-semibold tabular-nums text-navy">
            {formatCurrency(booking.total_cents, booking.currency)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-ink-muted">Due now</span>
          <span className="font-semibold tabular-nums text-navy">
            {formatCurrency(timing.dueNowCents, booking.currency)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-ink-muted">
            {payAfter ? "Charged after your clean" : "Due after clean"}
          </span>
          <span className="font-semibold tabular-nums text-navy">
            {formatCurrency(timing.dueLaterCents, booking.currency)}
          </span>
        </div>
        <p className="pt-1 text-xs text-ink-subtle">
          Booking #{booking.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      <p className="mt-5 text-center text-xs text-ink-subtle">
        Apple Pay, Google Pay, and Link available when your device supports them — card always
        works.
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
