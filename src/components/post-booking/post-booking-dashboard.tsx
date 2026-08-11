"use client";

import { useState } from "react";
import Link from "next/link";
import { BookingReviewCard } from "@/components/post-booking/booking-review-card";
import { LiveStatusCard } from "@/components/post-booking/live-status-card";
import { UpcomingBookingCard } from "@/components/post-booking/upcoming-booking-card";
import { useCustomerBookingLive } from "@/hooks/use-customer-booking-live";
import {
  fetchBooking,
  isBookingPaymentConfirmed,
} from "@/lib/bookings/client-api";
import type { StoredBooking } from "@/lib/bookings/repository";
import { getCustomerTimelineState } from "@/lib/bookings/status-timeline";
import { routes } from "@/config/site";
import { Button } from "@/components/ui";

interface PostBookingDashboardProps {
  bookingId: string;
  accessToken?: string | null;
  initialBooking?: StoredBooking | null;
  customerFirstName?: string | null;
}

function greetingName(booking: StoredBooking | null, fallback?: string | null): string {
  const fromBooking = booking?.customer_first_name?.trim();
  if (fromBooking) return fromBooking;
  if (fallback?.trim()) return fallback.trim();
  return "there";
}

function hasCleaningToday(booking: StoredBooking): boolean {
  const scheduled = new Date(booking.scheduled_at);
  if (Number.isNaN(scheduled.getTime())) return false;
  const now = new Date();
  return (
    scheduled.getFullYear() === now.getFullYear() &&
    scheduled.getMonth() === now.getMonth() &&
    scheduled.getDate() === now.getDate()
  );
}

export function PostBookingDashboard({
  bookingId,
  accessToken,
  initialBooking = null,
  customerFirstName,
}: PostBookingDashboardProps) {
  const [booking, setBooking] = useState<StoredBooking | null>(initialBooking);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initialBooking);

  useCustomerBookingLive({
    bookingId,
    accessToken,
    initialBooking,
    onBooking: (latest) => {
      setBooking(latest);
      setLoading(false);
      setError(null);
    },
    onError: (message) => {
      setError(message);
      setLoading(false);
    },
  });

  if (loading || !booking) {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 size-10 animate-pulse rounded-full bg-[var(--maidlinx-mint)]" />
        <p className="font-display text-xl font-semibold text-[var(--maidlinx-ink)]">
          Finding your MaidLinx Pro…
        </p>
        <p className="mt-2 text-sm text-[var(--maidlinx-muted)]">
          {error ?? "Loading your booking…"}
        </p>
      </div>
    );
  }

  if (!isBookingPaymentConfirmed(booking.status) && !booking.quote_requested) {
    if (booking.status === "pending_payment") {
      return (
        <div className="mx-auto max-w-lg py-12 text-center">
          <h1 className="font-display text-2xl font-bold">Confirming payment…</h1>
          <p className="mt-2 text-[var(--maidlinx-muted)]">This usually takes a few seconds.</p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => {
              void fetchBooking(bookingId, accessToken).then(setBooking);
            }}
          >
            Refresh
          </Button>
        </div>
      );
    }
  }

  const name = greetingName(booking, customerFirstName);
  const cleaningToday = hasCleaningToday(booking);
  const timeline = getCustomerTimelineState(booking.status);

  return (
    <div className="space-y-6 lg:mx-auto lg:grid lg:max-w-[1100px] lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start lg:gap-8 lg:space-y-0">
      <div className="space-y-6">
        <header className="space-y-1">
          <p className="text-base text-[var(--maidlinx-text)]">Hi, {name}</p>
          <h1 className="font-display text-[1.65rem] font-bold leading-tight tracking-tight text-[var(--maidlinx-ink)] sm:text-[1.85rem]">
            {cleaningToday
              ? "You’ve got a cleaning today."
              : timeline.findingProfessional
                ? "You’re booked."
                : "Your cleaning is on the calendar."}
          </h1>
          <p className="text-[15px] text-[var(--maidlinx-muted)]">
            Sit back, we’ve got it from here.
          </p>
        </header>

        <div className="flex items-center gap-3 overflow-hidden rounded-2xl bg-[var(--maidlinx-mint)] p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--maidlinx-green)]">
            <ShieldIcon />
          </span>
          <p className="text-sm leading-snug text-[var(--maidlinx-text)]">
            Your home, your time. We handle the cleaning so you can focus on what matters.
          </p>
        </div>

        <LiveStatusCard booking={booking} accessToken={accessToken} />
        {booking.status === "completed" ? (
          <BookingReviewCard bookingId={booking.id} />
        ) : null}
      </div>

      <div className="space-y-6">
        <UpcomingBookingCard booking={booking} showViewAll />

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Link href={routes.dashboardBookings} className="sm:flex-1">
            <Button variant="secondary" className="w-full">
              View my bookings
            </Button>
          </Link>
          <Link href={routes.book} className="sm:flex-1">
            <Button variant="accent" className="w-full">
              Book another clean
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M9.5 12.5 11 14l3.5-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
