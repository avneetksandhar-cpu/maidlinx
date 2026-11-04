"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, UserRound } from "lucide-react";
import { SiteLogo } from "@/components/brand/site-logo";
import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { AddressAutocomplete } from "@/components/booking/address-autocomplete";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { WaitlistSignup } from "@/components/waitlist/waitlist-signup";
import { useBookingState } from "@/hooks/use-booking-state";
import { buildAddressStatePatch } from "@/lib/bookings/booking-helpers";
import {
  BOOKING_SCREEN_PATHS,
  getBookingEntryPath,
  isAddressComplete,
} from "@/lib/bookings/booking-routes";
import {
  BOOKING_RESUME_AFTER_AUTH,
  bookingSignInHref,
} from "@/lib/bookings/booking-auth";
import {
  isMarketBookingOpen,
  resolveWaitlistReason,
} from "@/lib/markets/booking-availability";
import { resolveServiceArea } from "@/lib/service-area";
import { useAuthSession } from "@/hooks/use-auth-session";
import { routes } from "@/config/site";
import { trackBookingEvent } from "@/lib/analytics/booking";
import type { BookingState } from "@/lib/bookings/booking-state";
import type { DashboardBooking } from "@/lib/dashboard/bookings";

const STANDARD_CLEAN_CHECKLIST = [
  "Kitchen surfaces, sink, and appliance exteriors",
  "Bathrooms — sinks, toilets, showers/tubs, mirrors",
  "Living areas and bedrooms — dust, floors, tidy surfaces",
  "Extras (fridge, oven, laundry, windows) priced separately at checkout",
] as const;

/** US ZIP or Canadian postal — used when the single field is postal-only. */
function looksLikePostalOrZip(raw: string): boolean {
  const t = raw.trim().toUpperCase().replace(/[\s-]/g, "");
  if (!t) return false;
  if (/^\d{5}(\d{4})?$/.test(t)) return true;
  return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(t);
}

function normalizePostalDraft(raw: string): string {
  const trimmed = raw.trim().toUpperCase();
  const compact = trimmed.replace(/[\s-]/g, "");
  if (/^\d{5}(\d{4})?$/.test(compact)) {
    return compact.length === 9 ? `${compact.slice(0, 5)}-${compact.slice(5)}` : compact.slice(0, 5);
  }
  if (/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(compact)) {
    return `${compact.slice(0, 3)} ${compact.slice(3)}`;
  }
  return trimmed;
}

function formatUpcomingWhen(booking: DashboardBooking): { dateLabel: string; windowLabel: string } {
  const start = booking.arrivalWindowStart
    ? new Date(booking.arrivalWindowStart)
    : new Date(booking.scheduledAt);
  const end = booking.arrivalWindowEnd ? new Date(booking.arrivalWindowEnd) : null;
  const dateLabel = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const fmt = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const windowLabel = end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
  return { dateLabel, windowLabel };
}

/**
 * App-open home — premium navy South Florida launch screen.
 * Booking draft persists into the same /book funnel (logic unchanged).
 */
export function AppOpenHome() {
  return (
    <GoogleMapsProvider>
      <AppOpenHomeInner />
    </GoogleMapsProvider>
  );
}

function AppOpenHomeInner() {
  const router = useRouter();
  const { state, updateState, hydrated } = useBookingState();
  const authStatus = useAuthSession();
  const [hint, setHint] = useState<string | null>(null);
  const [includedOpen, setIncludedOpen] = useState(false);
  const [upcoming, setUpcoming] = useState<DashboardBooking | null>(null);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setUpcoming(null);
      return;
    }
    let cancelled = false;
    void fetch("/api/dashboard")
      .then(async (res) => {
        if (!res.ok) return null;
        const json = (await res.json()) as {
          data?: { upcoming?: DashboardBooking[] };
          upcoming?: DashboardBooking[];
        };
        return json.data?.upcoming ?? json.upcoming ?? null;
      })
      .then((list) => {
        if (cancelled) return;
        setUpcoming(Array.isArray(list) && list.length > 0 ? list[0]! : null);
      })
      .catch(() => {
        if (!cancelled) setUpcoming(null);
      });
    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  const waitlistReason = resolveWaitlistReason({
    line1: state.line1,
    postalCode: state.postalCode,
    inServiceArea: state.inServiceArea,
    marketId: state.marketId,
  });

  const applyAddress = (value: Partial<BookingState>) => {
    updateState(buildAddressStatePatch(state, value));
    setHint(null);
  };

  const applyPostalCoverage = (raw: string) => {
    const postal = normalizePostalDraft(raw);
    const area = resolveServiceArea({ postalCode: postal });
    updateState({
      postalCode: postal,
      marketId: area.marketId,
      zoneId: area.zoneId,
      inServiceArea: area.inServiceArea,
      marketName: area.marketName ?? null,
      country: area.currency === "CAD" ? "CA" : area.currency === "USD" ? "US" : state.country,
    });

    if (!area.inServiceArea) {
      setHint(
        "MaidLinx does not serve that area yet. South Florida is our launch market — join the waitlist for updates.",
      );
      return;
    }
    if (!isMarketBookingOpen(area.marketId)) {
      setHint(
        area.marketId === "SOUTH_FLORIDA"
          ? "We serve South Florida — booking isn’t open yet (no bookable cleaners online)."
          : `We recognize ${area.marketName ?? "your area"} — booking isn’t open there yet.`,
      );
      return;
    }
    setHint(
      area.marketId === "SOUTH_FLORIDA"
        ? "Yes — MaidLinx serves South Florida."
        : `Yes — MaidLinx serves ${area.marketName ?? "your area"}.`,
    );
  };

  const bookingHref = useMemo(() => {
    if (isAddressComplete(state)) {
      if (authStatus === "authenticated") return BOOKING_RESUME_AFTER_AUTH;
      if (authStatus === "guest") return bookingSignInHref(BOOKING_RESUME_AFTER_AUTH);
      return BOOKING_SCREEN_PATHS.address;
    }
    if (state.postalCode && state.inServiceArea) {
      return getBookingEntryPath({ prefillAddress: true });
    }
    return getBookingEntryPath();
  }, [state, authStatus]);

  const continueIntoBooking = () => {
    trackBookingEvent("booking_started", { entry: "app_open_check_availability" });
    router.push(bookingHref);
  };

  const onCheckAvailability = () => {
    const draft = (state.line1 ?? "").trim();

    if (isAddressComplete(state)) {
      continueIntoBooking();
      return;
    }

    if (looksLikePostalOrZip(draft) || looksLikePostalOrZip(state.postalCode ?? "")) {
      const raw = looksLikePostalOrZip(draft) ? draft : (state.postalCode ?? "");
      applyPostalCoverage(raw);
      trackBookingEvent("booking_started", { entry: "app_open_zip_check" });
      router.push(getBookingEntryPath({ prefillAddress: true }));
      return;
    }

    if (state.postalCode?.trim() && state.inServiceArea) {
      continueIntoBooking();
      return;
    }

    if (!draft) {
      setHint("Enter a street address or ZIP code to check if MaidLinx serves your home.");
      return;
    }

    setHint("Pick an address from the suggestions, or enter a ZIP / postal code.");
  };

  const accountHref =
    authStatus === "authenticated" ? routes.dashboardProfile : routes.signIn;

  const upcomingWhen = upcoming ? formatUpcomingWhen(upcoming) : null;

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#003474] text-white"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-4 pt-[max(0.65rem,env(safe-area-inset-top))] pb-1">
        <SiteLogo variant="horizontal" tone="onDark" href={routes.home} priority />
        <Link
          href={accountHref}
          aria-label={authStatus === "authenticated" ? "Account" : "Sign in"}
          className="inline-flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white/15"
        >
          <UserRound className="size-5" strokeWidth={1.85} aria-hidden />
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col px-4 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          {/* Returning upcoming booking — above new-booking panel */}
          {upcoming && upcomingWhen ? (
            <Link
              href={routes.bookingDetail(upcoming.id)}
              className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[#08e0d4] uppercase">
                  Upcoming clean
                </p>
                <p className="mt-0.5 truncate text-[15px] font-semibold text-white">
                  {upcomingWhen.dateLabel}
                </p>
                <p className="truncate text-sm text-white/70">{upcomingWhen.windowLabel}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-[#08e0d4]">
                View booking
                <ChevronRight className="size-4" aria-hidden />
              </span>
            </Link>
          ) : null}

          {/* Main heading — left aligned */}
          <h1 className="max-w-[14ch] text-[2rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-[2.25rem]">
            Come home to clean.
          </h1>
          <p className="mt-1.5 text-[13px] font-medium text-white/65">South Florida</p>

          {/* Booking panel — light surface; field + CTA above fold on 375×667 */}
          <section className="mt-4 rounded-2xl bg-white p-3.5 text-[#003474]">
            <p className="text-[13px] font-semibold text-[#003474]">Where are we cleaning?</p>

            <div className="mt-2.5">
              <AddressAutocomplete
                value={state}
                onChange={(value) => applyAddress(value)}
                onAddressSelected={(value) => {
                  applyAddress(value);
                  trackBookingEvent("address_selected", {
                    marketId: value.marketId ?? state.marketId,
                    placeId: value.googlePlaceId,
                    entry: "app_open",
                  });
                  const patched = buildAddressStatePatch(state, value);
                  if (
                    patched.inServiceArea &&
                    isMarketBookingOpen(patched.marketId ?? state.marketId) &&
                    patched.line1 &&
                    patched.city &&
                    patched.postalCode
                  ) {
                    if (authStatus === "authenticated") {
                      router.push(BOOKING_RESUME_AFTER_AUTH);
                    } else if (authStatus === "guest") {
                      router.push(bookingSignInHref(BOOKING_RESUME_AFTER_AUTH));
                    }
                  }
                }}
                variant="hero"
                hideLocate
                label="Address or ZIP"
                placeholder="Street address or ZIP"
                className="[&_label]:sr-only [&_input]:h-12 [&_input]:rounded-xl [&_input]:border-slate-200 [&_input]:bg-[#f7f9fc] [&_input]:pl-11 [&_input]:text-[15px] [&_input]:text-[#003474] [&_input]:placeholder:text-slate-400 [&_[data-hero-pin]]:text-[#003474]/55"
              />
            </div>

            {hint || (hydrated && state.inServiceArea === false) ? (
              <p className="mt-2 text-[13px] leading-snug text-slate-600" role="status">
                {hint ??
                  "Outside our service area — South Florida is our launch market."}
              </p>
            ) : null}

            {waitlistReason ? (
              <div className="mt-2">
                <WaitlistSignup
                  reason={waitlistReason}
                  marketId={state.marketId}
                  marketName={state.marketName}
                  source="app_open_home"
                  page="/"
                  variant="compact"
                />
              </div>
            ) : null}

            <button
              type="button"
              onClick={onCheckAvailability}
              className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#08e0d4] text-[15px] font-semibold text-[#003474] transition-opacity hover:opacity-95 active:opacity-90"
            >
              Check availability
            </button>
          </section>

          {/* Included checklist — single row, not a feature grid */}
          <section className="mt-3">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 py-3 text-left"
              aria-expanded={includedOpen}
              onClick={() => setIncludedOpen((v) => !v)}
            >
              <span className="text-[14px] font-medium text-white/85">
                What&apos;s included in a standard clean?
              </span>
              <ChevronDown
                className={`size-4 shrink-0 text-white/55 transition-transform ${includedOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>
            {includedOpen ? (
              <ul className="space-y-2 pb-2">
                {STANDARD_CLEAN_CHECKLIST.map((item) => (
                  <li key={item} className="text-[13px] leading-snug text-white/70">
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {/* Secondary links — text only, below fold OK */}
          <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-6 text-[13px] text-white/55">
            <Link href={routes.forBusiness} className="hover:text-white/80">
              Business cleaning
            </Link>
            <Link href={routes.becomeCleaner} className="hover:text-white/80">
              Become a cleaner
            </Link>
          </div>
        </div>
      </main>

      <CustomerBottomNav />
    </div>
  );
}
