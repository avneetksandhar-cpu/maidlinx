"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MotionReveal } from "@/components/motion/motion-reveal";
import { BookingStatusTimeline } from "@/components/booking/booking-status-timeline";
import { getCustomerTimelineState } from "@/lib/bookings/status-timeline";
import { getBookingStatusLabel } from "@/lib/bookings/status";
import type { StoredBooking } from "@/lib/bookings/repository";
import { Button, Heading, Text } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { calculateDepositCents } from "@/lib/payments/deposit";
import { routes, siteConfig } from "@/config/site";
import { saveUsualClean } from "@/lib/bookings/usual-clean";
import type { BookingState } from "@/lib/bookings/booking-state";
import { trackBookingEvent } from "@/lib/analytics/booking";

interface MatchingStepProps {
  booking: StoredBooking;
  accessToken?: string | null;
  bookingState?: BookingState;
}

export function MatchingStep({ booking, accessToken, bookingState }: MatchingStepProps) {
  const [pulse, setPulse] = useState(0);
  const [savedUsual, setSavedUsual] = useState(false);
  const timeline = getCustomerTimelineState(booking.status);
  const finding = timeline.findingProfessional || booking.status === "awaiting_assignment";
  const tokenQuery = accessToken ? `?token=${encodeURIComponent(accessToken)}` : "";
  const reference = booking.id.slice(0, 8).toUpperCase();

  useEffect(() => {
    trackBookingEvent("booking_completed", {
      bookingId: booking.id,
      status: booking.status,
    });
  }, [booking.id, booking.status]);

  useEffect(() => {
    if (!finding) return;
    const id = window.setInterval(() => setPulse((n) => n + 1), 1200);
    return () => window.clearInterval(id);
  }, [finding]);

  const handleSaveUsual = () => {
    if (!bookingState) return;
    saveUsualClean(bookingState);
    setSavedUsual(true);
  };

  return (
    <MotionReveal>
      <div className="mx-auto max-w-[680px] text-center">
        {finding ? (
          <div className="relative mx-auto mb-8 flex size-28 items-center justify-center">
            <span
              className="absolute inset-0 rounded-full bg-accent/15 animate-ping"
              style={{ animationDuration: "1.8s" }}
              aria-hidden
            />
            <span
              className="absolute inset-3 rounded-full bg-accent/20"
              style={{ transform: `scale(${1 + (pulse % 3) * 0.02})` }}
              aria-hidden
            />
            <span className="relative flex size-16 items-center justify-center overflow-hidden rounded-full bg-[#07151B] ring-2 ring-white/30">
              <Image
                src="/brand/maidlinx-mark.png"
                alt={siteConfig.name}
                width={40}
                height={40}
                className="size-10 object-contain"
                priority
              />
            </span>
          </div>
        ) : (
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-[#F1F8F5] text-accent">
            <span className="text-2xl font-semibold">✓</span>
          </div>
        )}

        <Heading as="h2" className="text-[1.75rem] font-bold tracking-tight md:text-[2rem]">
          {finding ? "You’re booked" : "You’re all set"}
        </Heading>
        <Text muted className="mt-2 text-[16px] md:text-[17px]">
          {finding
            ? "Finding your MaidLinx Pro for this clean…"
            : "Your cleaner has been assigned. Check your email for details."}
        </Text>
        <p className="mt-3 inline-flex items-center rounded-full bg-[#F1F8F5] px-3.5 py-1.5 text-sm font-semibold tabular-nums text-accent">
          Booking #{reference}
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-[680px]">
        <p className="mb-3 text-sm font-medium text-ink-muted">Progress</p>
        <BookingStatusTimeline status={booking.status} />
      </div>

      <dl className="mx-auto mt-8 max-w-[680px] space-y-3 rounded-2xl border border-[#E2E9E6] bg-white p-5 text-[15px] shadow-soft">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Status</dt>
          <dd className="font-medium">{getBookingStatusLabel(booking.status)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">Service</dt>
          <dd className="font-medium capitalize">{booking.service_type.replace(/_/g, " ")}</dd>
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

      {bookingState && !savedUsual ? (
        <div className="mx-auto mt-6 max-w-[680px] rounded-2xl bg-[#F1F8F5] px-5 py-4 text-left">
          <p className="font-semibold text-ink">Save these details for next time?</p>
          <p className="mt-1 text-sm text-ink-muted">
            We’ll remember this property, service, and extras for faster rebooking.
          </p>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="accent" size="sm" onClick={handleSaveUsual}>
              Save my usual clean
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setSavedUsual(true)}>
              Not now
            </Button>
          </div>
        </div>
      ) : savedUsual ? (
        <p className="mx-auto mt-6 max-w-[680px] text-center text-sm text-accent">
          Saved — look for “Book your usual clean” next time.
        </p>
      ) : null}

      <div className="mx-auto mt-8 flex max-w-[680px] flex-col gap-3 sm:flex-row">
        <Link href={`/booking/${booking.id}${tokenQuery}`} className="sm:flex-1">
          <Button variant="secondary" className="h-12 w-full rounded-xl">
            View booking
          </Button>
        </Link>
        <Link href={routes.home} className="sm:flex-1">
          <Button className="h-12 w-full rounded-xl" variant="accent">
            Back to home
          </Button>
        </Link>
      </div>
    </MotionReveal>
  );
}
