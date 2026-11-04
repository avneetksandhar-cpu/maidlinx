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
  retryBookingCharge,
} from "@/lib/bookings/client-api";
import type { StoredBooking } from "@/lib/bookings/repository";
import { getCustomerTimelineState } from "@/lib/bookings/status-timeline";
import { normalizeBookingStatus } from "@/lib/bookings/status";
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
import { formatCurrency } from "@/lib/utils";
import { BOOKING_EXTRAS, getBookingServiceLabel } from "@/lib/bookings/constants";

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

function panelHeadline(booking: StoredBooking, finding: boolean): string {
  const status = normalizeBookingStatus(booking.status);
  if (status === "completed") {
    return booking.payment_status === "paid"
      ? "Your clean is complete"
      : "Your clean is complete";
  }
  if (finding || !booking.cleaner) return "Finding your cleaner";
  if (status === "on_the_way") {
    const first = booking.cleaner.firstName?.trim();
    return first ? `${first} is on the way` : "Your Pro is on the way";
  }
  if (status === "arrived") {
    const first = booking.cleaner.firstName?.trim();
    return first ? `${first} has arrived` : "Your Pro has arrived";
  }
  if (status === "in_progress") return "Cleaning in progress";
  const first = booking.cleaner.firstName?.trim();
  return first ? `${first} confirmed your clean` : "Your clean is confirmed";
}

function panelSubcopy(booking: StoredBooking, finding: boolean): string {
  const status = normalizeBookingStatus(booking.status);
  if (status === "completed") {
    if (booking.payment_status === "paid") {
      return "Paid — here’s your checklist and receipt.";
    }
    if (booking.payment_status === "failed") {
      return "Cleaning finished, but payment needs attention.";
    }
    return "Finishing payment…";
  }
  if (finding || !booking.cleaner) {
    return "We’ll notify you when someone accepts.";
  }
  if (status === "on_the_way" || status === "arrived" || status === "in_progress") {
    return "Live status updates from your Pro.";
  }
  return "Window, address, and entry details for your visit.";
}

function lineItems(booking: StoredBooking): Array<{ label: string; cents: number }> {
  const items: Array<{ label: string; cents: number }> = [];
  const snapshot = booking.pricing_snapshot as
    | { lineItems?: Array<{ label?: string; totalCents?: number }> }
    | null;
  if (snapshot?.lineItems?.length) {
    for (const line of snapshot.lineItems) {
      if (line.label && typeof line.totalCents === "number") {
        items.push({ label: line.label, cents: line.totalCents });
      }
    }
  }
  if (items.length === 0) {
    items.push({
      label: getBookingServiceLabel(booking.service_type),
      cents: Math.max(0, booking.subtotal_cents),
    });
    for (const extraId of booking.extras) {
      const extra = BOOKING_EXTRAS.find((e) => e.id === extraId);
      if (extra) items.push({ label: extra.label, cents: extra.priceCents });
    }
  }
  return items;
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
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

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
          <h1 className="text-2xl font-bold text-white">Saving your card…</h1>
          <p className="mt-2 text-[var(--ml-dark-ink-muted)]">
            Stripe TEST · nothing charged yet. This usually takes a few seconds.
          </p>
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
  const status = normalizeBookingStatus(booking.status);
  const paidComplete = status === "completed" && booking.payment_status === "paid";
  const paymentNeedsAttention =
    status === "completed" && booking.payment_status === "failed";
  const savedCardLabel = booking.card_last4
    ? `${booking.card_brand ? booking.card_brand.charAt(0).toUpperCase() + booking.card_brand.slice(1) : "Card"} •••• ${booking.card_last4}`
    : null;

  function bookUsualClean() {
    if (!booking) return;
    const active = booking;
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

  async function handleRetryCharge() {
    setRetrying(true);
    setRetryError(null);
    try {
      const latest = await retryBookingCharge(bookingId, accessToken);
      setBooking(latest);
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : "Unable to retry payment.");
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="text-white">
      <div className="space-y-5">
        <header className="space-y-1">
          <p className="text-sm text-[var(--ml-dark-ink-muted)]">Hi, {name}</p>
          <h1 className="text-[1.55rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.75rem]">
            {panelHeadline(booking, finding)}
          </h1>
          <p className="text-[14px] text-[var(--ml-dark-ink-muted)]">
            {panelSubcopy(booking, finding)}
          </p>
          <p className="text-xs tabular-nums text-[var(--ml-dark-ink-subtle)]">
            Booking #{booking.id.slice(0, 8).toUpperCase()}
          </p>
        </header>

        <LiveStatusCard booking={booking} accessToken={accessToken} />

        {!paidComplete ? <BookingDetailsCard booking={booking} /> : null}

        {booking.status !== "completed" ? (
          <UpcomingBookingCard booking={booking} showViewAll />
        ) : null}

        {paidComplete ? (
          <div className="space-y-4 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface,#102B49)] p-5 shadow-[var(--shadow-card)]">
            <div className="rounded-2xl bg-[var(--ml-dark-mint,#04CED2)] px-4 py-5 text-[var(--ml-app-header-ink,#01193D)]">
              <p className="text-2xl font-bold tabular-nums">
                Paid {formatCurrency(booking.total_cents, booking.currency)}
              </p>
              {savedCardLabel ? (
                <p className="mt-1 text-sm font-medium opacity-80">{savedCardLabel}</p>
              ) : null}
            </div>

            <ul className="space-y-2 text-sm">
              {lineItems(booking).map((item) => (
                <li key={`${item.label}-${item.cents}`} className="flex justify-between gap-3">
                  <span className="text-[var(--ml-dark-ink-muted)]">{item.label}</span>
                  <span className="tabular-nums text-white">
                    {formatCurrency(item.cents, booking.currency)}
                  </span>
                </li>
              ))}
            </ul>

            <div>
              <p className="text-sm font-semibold text-white">Completed</p>
              <ul className="mt-2 space-y-2">
                {completedTasks.map((task) => (
                  <li
                    key={task}
                    className="flex items-start gap-2 rounded-xl bg-[var(--ml-dark-surface-2)] px-3 py-2 text-sm text-white"
                  >
                    <span
                      className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--ml-dark-mint,#04CED2)] text-[10px] font-bold text-[var(--ml-app-header-ink,#01193D)]"
                      aria-hidden
                    >
                      ✓
                    </span>
                    {task} completed
                  </li>
                ))}
              </ul>
            </div>

            <BookingReviewCard bookingId={booking.id} />

            <div className="grid gap-2">
              {booking.stripe_receipt_url ? (
                <a href={booking.stripe_receipt_url} target="_blank" rel="noreferrer">
                  <Button
                    variant="primary"
                    className="booking-cta-btn w-full rounded-2xl bg-[var(--ml-dark-mint,#04CED2)] text-[var(--ml-app-header-ink,#01193D)]"
                  >
                    View receipt
                  </Button>
                </a>
              ) : (
                <Link href={routes.dashboardInvoices}>
                  <Button
                    variant="primary"
                    className="booking-cta-btn w-full rounded-2xl bg-[var(--ml-dark-mint,#04CED2)] text-[var(--ml-app-header-ink,#01193D)]"
                  >
                    View receipt
                  </Button>
                </Link>
              )}
              <Button
                type="button"
                variant="secondary"
                className="w-full rounded-2xl border-[var(--ml-dark-border-strong)] bg-transparent text-white hover:bg-[var(--ml-dark-surface-2)]"
                onClick={bookUsualClean}
              >
                Book my usual clean
              </Button>
              <div className="flex flex-wrap justify-center gap-4 pt-1 text-sm">
                <span className="font-semibold text-[var(--ml-dark-ink-muted)]">Add a tip</span>
                <Link
                  href={routes.dashboardSupport}
                  className="font-semibold text-[var(--ml-dark-mint,#04CED2)]"
                >
                  Report an issue
                </Link>
              </div>
              <p className="text-center text-xs text-[var(--ml-dark-ink-subtle)]">
                Tips are not available in Stripe TEST yet.
              </p>
            </div>
          </div>
        ) : null}

        {paymentNeedsAttention ? (
          <div className="space-y-3 rounded-2xl border border-amber-400/40 bg-[var(--ml-dark-surface,#102B49)] p-5">
            <h2 className="text-lg font-semibold text-white">Payment needs attention</h2>
            <p className="text-sm text-[var(--ml-dark-ink-muted)]">
              Your clean is marked complete, but we couldn&apos;t charge{" "}
              {formatCurrency(booking.total_cents, booking.currency)}
              {savedCardLabel ? ` on ${savedCardLabel}` : ""}. Update your card, then retry —
              we only charge once.
            </p>
            {retryError ? <p className="text-sm text-red-300">{retryError}</p> : null}
            <div className="grid gap-2">
              <Button
                type="button"
                variant="primary"
                className="booking-cta-btn w-full rounded-2xl bg-[var(--ml-dark-mint,#04CED2)] text-[var(--ml-app-header-ink,#01193D)]"
                disabled={retrying}
                onClick={() => void handleRetryCharge()}
              >
                {retrying ? "Retrying…" : "Retry payment"}
              </Button>
              <Link href={routes.dashboardSupport}>
                <Button
                  variant="secondary"
                  className="w-full rounded-2xl border-[var(--ml-dark-border-strong)] bg-transparent text-white hover:bg-[var(--ml-dark-surface-2)]"
                >
                  Update payment method / get help
                </Button>
              </Link>
            </div>
          </div>
        ) : null}

        {status !== "completed" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Link href={routes.dashboardBookings}>
              <Button
                variant="primary"
                className="booking-cta-btn w-full rounded-2xl bg-[var(--ml-dark-mint,#04CED2)] text-[var(--ml-app-header-ink,#01193D)]"
              >
                View booking
              </Button>
            </Link>
            <Link href={routes.book}>
              <Button
                variant="secondary"
                className="w-full rounded-2xl border-[var(--ml-dark-border-strong)] bg-transparent text-white hover:bg-[var(--ml-dark-surface-2)]"
              >
                Book another
              </Button>
            </Link>
          </div>
        ) : null}

        <a
          href={siteConfig.links.support}
          className="block text-center text-sm font-semibold text-[var(--ml-dark-ink-muted)]"
        >
          Email support
        </a>
      </div>
    </div>
  );
}
