"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookingReviewCard } from "@/components/post-booking/booking-review-card";
import {
  BookingDetailsCard,
  bookingTaskLabels,
} from "@/components/post-booking/booking-details-card";
import { LiveStatusCard } from "@/components/post-booking/live-status-card";
import { UpcomingBookingCard } from "@/components/post-booking/upcoming-booking-card";
import { useCustomerBookingLive } from "@/hooks/use-customer-booking-live";
import {
  fetchBooking,
  isBookingPaymentConfirmed,
} from "@/lib/bookings/client-api";
import type { StoredBooking } from "@/lib/bookings/repository";
import { getCustomerTimelineState } from "@/lib/bookings/status-timeline";
import {
  readUsualClean,
  saveUsualClean,
  usualCleanToBookingPatch,
} from "@/lib/bookings/usual-clean";
import { BOOKING_SCREEN_PATHS, getFurthestScreenPath } from "@/lib/bookings/booking-routes";
import { buildAddressStatePatch } from "@/lib/bookings/booking-helpers";
import type { BookingExtraId, BookingServiceId } from "@/lib/bookings/constants";
import { useBookingState } from "@/hooks/use-booking-state";
import { routes, siteConfig } from "@/config/site";
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

export function PostBookingDashboard({
  bookingId,
  accessToken,
  initialBooking = null,
  customerFirstName,
}: PostBookingDashboardProps) {
  const router = useRouter();
  const { state, updateState } = useBookingState();
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
        <span className="mb-4 flex size-14 items-center justify-center overflow-hidden rounded-full bg-[var(--ml-dark-surface,#102B49)] ring-1 ring-white/15">
          <Image
            src="/brand/maidlinx-mark.png"
            alt="MaidLinx"
            width={48}
            height={48}
            className="size-12 animate-pulse object-cover"
            priority
          />
        </span>
        <p className="text-xl font-semibold text-white">Finding your cleaner</p>
        <p className="mt-2 text-sm text-[var(--ml-dark-ink-muted)]">
          {error ?? "Loading your booking…"}
        </p>
      </div>
    );
  }

  if (!isBookingPaymentConfirmed(booking.status) && !booking.quote_requested) {
    if (booking.status === "pending_payment") {
      return (
        <div className="mx-auto max-w-lg py-12 text-center">
          <h1 className="text-2xl font-bold text-white">Confirming payment…</h1>
          <p className="mt-2 text-[var(--ml-dark-ink-muted)]">This usually takes a few seconds.</p>
          <Button
            variant="secondary"
            className="mt-6 rounded-2xl border-[var(--ml-dark-border-strong)] bg-transparent text-white hover:bg-[var(--ml-dark-surface-2)]"
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
  const timeline = getCustomerTimelineState(booking.status);
  const finding = timeline.findingProfessional || !booking.cleaner;
  const completedTasks = bookingTaskLabels(booking);

  function bookUsualClean() {
    // Nested fn: re-narrow — TS does not keep the outer `!booking` guard here.
    if (!booking) return;
    const active = booking;
    // Restore real scope from this booking (or saved usual). Price/availability rechecked on When/Review.
    let profile = readUsualClean();
    if (!profile?.line1 && active.address_line1 && active.service_type) {
      const seeded = {
        ...state,
        line1: active.address_line1,
        line2: active.address_line2 ?? undefined,
        city: active.address_city ?? undefined,
        state: active.address_state ?? undefined,
        postalCode: active.address_postal_code ?? undefined,
        country: active.address_country ?? "US",
        latitude: active.address_latitude ?? undefined,
        longitude: active.address_longitude ?? undefined,
        googlePlaceId: active.google_place_id ?? undefined,
        serviceType: active.service_type as BookingServiceId,
        bedrooms: active.bedrooms,
        bathrooms: active.bathrooms,
        squareFootage: active.square_footage ?? undefined,
        extras: active.extras as BookingExtraId[],
        preferredCleanerId: active.professional_profile_id ?? undefined,
      };
      saveUsualClean(seeded);
      profile = readUsualClean();
    }

    if (!profile?.line1) {
      const params = new URLSearchParams({
        rebook: "1",
        sourceBookingId: active.id,
      });
      if (active.professional_profile_id) {
        params.set("preferredCleanerId", active.professional_profile_id);
      }
      router.push(`${BOOKING_SCREEN_PATHS.date}?${params.toString()}`);
      return;
    }

    const patch = {
      ...usualCleanToBookingPatch(profile),
      preferredCleanerId: active.professional_profile_id ?? undefined,
    };
    const next = buildAddressStatePatch(state, patch);
    updateState({ ...next, ...patch });
    const path =
      getFurthestScreenPath({ ...state, ...next, ...patch }) || BOOKING_SCREEN_PATHS.date;
    router.push(path);
  }

  return (
    <div className="text-white">
      <div className="space-y-5">
        <header className="space-y-1">
          <p className="text-sm text-[var(--ml-dark-ink-muted)]">Hi, {name}</p>
          <h1 className="text-[1.55rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.75rem]">
            {booking.status === "completed"
              ? "Your clean is complete"
              : finding
                ? "Finding your cleaner"
                : "Your clean is confirmed"}
          </h1>
          <p className="text-[14px] text-[var(--ml-dark-ink-muted)]">
            {booking.status === "completed"
              ? "Here’s what was included, your receipt, and an easy way to book again."
              : finding
                ? "We’ll notify you when someone accepts."
                : "Live status updates as your Pro is on the way, arrives, and finishes."}
          </p>
          <p className="text-xs tabular-nums text-[var(--ml-dark-ink-subtle)]">
            Booking #{booking.id.slice(0, 8).toUpperCase()}
          </p>
        </header>

        <LiveStatusCard booking={booking} accessToken={accessToken} />

        <BookingDetailsCard booking={booking} />

        {booking.status !== "completed" ? (
          <UpcomingBookingCard booking={booking} showViewAll />
        ) : null}

        {booking.status === "completed" ? (
          <div className="space-y-4 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface,#102B49)] p-5 shadow-[var(--shadow-card)]">
            <div className="flex flex-col items-center text-center">
              <div
                className="mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--ml-dark-mint,#04CED2)] text-[var(--ml-app-header-ink,#01193D)]"
                aria-hidden
              >
                <span className="text-2xl font-bold leading-none">✓</span>
              </div>
              <h2 className="text-xl font-semibold text-white">Your clean is complete</h2>
              <p className="mt-2 text-sm text-[var(--ml-dark-ink-muted)]">
                Rate your Pro, grab your receipt, or book your usual clean.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-white">What was included</p>
              <ul className="mt-2 space-y-2">
                {completedTasks.map((task) => (
                  <li
                    key={task}
                    className="flex items-start gap-2 rounded-xl bg-[var(--ml-dark-surface-2)] px-3 py-2 text-sm text-white"
                  >
                    <span
                      className="mt-0.5 font-bold text-[var(--ml-dark-mint,#04CED2)]"
                      aria-hidden
                    >
                      ✓
                    </span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>

            <BookingReviewCard bookingId={booking.id} />

            <div className="grid gap-2">
              <Button
                type="button"
                variant="primary"
                className="booking-cta-btn w-full rounded-2xl bg-[var(--ml-dark-mint,#04CED2)] text-[var(--ml-app-header-ink,#01193D)]"
                onClick={bookUsualClean}
              >
                Book my usual clean
              </Button>
              <div className="grid gap-2 sm:grid-cols-2">
                <Link href={routes.dashboardInvoices}>
                  <Button
                    variant="secondary"
                    className="w-full rounded-2xl border-[var(--ml-dark-border-strong)] bg-transparent text-white hover:bg-[var(--ml-dark-surface-2)]"
                  >
                    View receipt
                  </Button>
                </Link>
                <Link href={routes.dashboardSupport}>
                  <Button
                    variant="secondary"
                    className="w-full rounded-2xl border-[var(--ml-dark-border-strong)] bg-transparent text-white hover:bg-[var(--ml-dark-surface-2)]"
                  >
                    Report an issue
                  </Button>
                </Link>
              </div>
              <a
                href={siteConfig.links.support}
                className="text-center text-sm font-semibold text-[var(--ml-dark-ink-muted)]"
              >
                Email support
              </a>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <Link href={routes.dashboardBookings}>
              <Button
                variant="secondary"
                className="w-full rounded-2xl border-[var(--ml-dark-border-strong)] bg-transparent text-white hover:bg-[var(--ml-dark-surface-2)]"
              >
                View request
              </Button>
            </Link>
            <Link href={routes.book}>
              <Button
                variant="primary"
                className="booking-cta-btn w-full rounded-2xl bg-[var(--ml-dark-mint,#04CED2)] text-[var(--ml-app-header-ink,#01193D)]"
              >
                Book another
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
