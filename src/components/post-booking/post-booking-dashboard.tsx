"use client";

import { useState } from "react";
import Link from "next/link";
import { SiteLogo } from "@/components/brand/site-logo";
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
      <div
        data-theme="ml-dark"
        className="flex min-h-[50dvh] flex-col items-center justify-center bg-[var(--ml-dark-bg)] px-4 text-center"
        style={{ fontFamily: "var(--ml-font-ios)" }}
      >
        <SiteLogo variant="mark" tone="brand" href={routes.home} className="mb-4 animate-pulse" />
        <p className="text-xl font-semibold text-white">Finding your MaidLinx Pro…</p>
        <p className="mt-2 text-sm text-[var(--ml-dark-ink-muted)]">
          {error ?? "Loading your booking…"}
        </p>
      </div>
    );
  }

  if (!isBookingPaymentConfirmed(booking.status) && !booking.quote_requested) {
    if (booking.status === "pending_payment") {
      return (
        <div
          data-theme="ml-dark"
          className="mx-auto max-w-lg bg-[var(--ml-dark-bg)] py-12 text-center"
          style={{ fontFamily: "var(--ml-font-ios)" }}
        >
          <h1 className="text-2xl font-bold text-white">Confirming payment…</h1>
          <p className="mt-2 text-[var(--ml-dark-ink-muted)]">This usually takes a few seconds.</p>
          <Button
            variant="secondary"
            className="mt-6 border-[var(--ml-dark-border-strong)] bg-transparent text-white hover:bg-[var(--ml-dark-surface-2)]"
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
    <div
      data-theme="ml-dark"
      className="min-h-[50dvh] bg-[var(--ml-dark-bg)] text-[var(--ml-dark-ink)]"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <div className="space-y-6 px-1 lg:mx-auto lg:grid lg:max-w-[1100px] lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:items-start lg:gap-8 lg:space-y-0">
        <div className="space-y-6">
          <header className="space-y-1">
            <p className="text-base text-[var(--ml-dark-ink-muted)]">Hi, {name}</p>
            <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.85rem]">
              {cleaningToday
                ? "You’ve got a cleaning today."
                : timeline.findingProfessional
                  ? "You’re booked."
                  : "Your cleaning is on the calendar."}
            </h1>
            <p className="text-[15px] text-[var(--ml-dark-ink-muted)]">
              Sit back, we’ve got it from here.
            </p>
          </header>

          <div className="flex items-center gap-3 overflow-hidden rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--ml-dark-mint)] text-[var(--color-accent-foreground)]">
              <ShieldIcon />
            </span>
            <p className="text-sm leading-snug text-[var(--ml-dark-ink-muted)]">
              Your home, your time. We handle the cleaning so you can focus on what matters.
            </p>
          </div>

          <LiveStatusCard booking={booking} accessToken={accessToken} />

          {booking.status === "completed" ? (
            <div className="space-y-4 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)] p-5 shadow-[var(--shadow-card)]">
              <div className="flex flex-col items-center text-center">
                <div
                  className="mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--ml-dark-mint)] text-[var(--color-accent-foreground)] shadow-[0_0_24px_rgb(8_224_212_/_0.3)]"
                  aria-hidden
                >
                  <span className="text-2xl font-bold leading-none">✓</span>
                </div>
                <h2 className="text-xl font-semibold text-white">Cleaning completed!</h2>
                <p className="mt-2 text-sm text-[var(--ml-dark-ink-muted)]">
                  Thanks for booking with MaidLinx. Rate your cleaners, view your invoice, or book
                  again.
                </p>
              </div>

              <BookingReviewCard bookingId={booking.id} />

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
          ) : null}
        </div>

        <div className="space-y-6">
          <UpcomingBookingCard booking={booking} showViewAll />

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link href={routes.dashboardBookings} className="sm:flex-1">
              <Button
                variant="secondary"
                className="w-full rounded-2xl border-[var(--ml-dark-border-strong)] bg-transparent text-white hover:bg-[var(--ml-dark-surface-2)]"
              >
                View my bookings
              </Button>
            </Link>
            <Link href={routes.book} className="sm:flex-1">
              <Button variant="primary" className="booking-cta-btn w-full rounded-2xl">
                Book another clean
              </Button>
            </Link>
          </div>
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
