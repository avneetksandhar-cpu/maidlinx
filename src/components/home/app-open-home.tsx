"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, UserRound } from "lucide-react";
import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { AddressAutocomplete } from "@/components/booking/address-autocomplete";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { WaitlistSignup } from "@/components/waitlist/waitlist-signup";
import { FloorPlanArt } from "@/components/home/floor-plan-art";
import { HomeUsualCleanCard } from "@/components/home/home-usual-clean-card";
import { useBookingState } from "@/hooks/use-booking-state";
import { buildAddressStatePatch } from "@/lib/bookings/booking-helpers";
import {
  BOOKING_SCREEN_PATHS,
  getBookingEntryPath,
  isAddressComplete,
} from "@/lib/bookings/booking-routes";
import {
  isCustomerHomeBookableArea,
  isMarketBookingOpen,
  resolveCustomerHomeWaitlistReason,
} from "@/lib/markets/booking-availability";
import { isCustomerHomeMarket } from "@/config/markets";
import { resolveServiceArea } from "@/lib/service-area";
import { useAuthSession } from "@/hooks/use-auth-session";
import { routes } from "@/config/site";
import { trackBookingEvent } from "@/lib/analytics/booking";
import type { BookingState } from "@/lib/bookings/booking-state";
import type { DashboardBooking } from "@/lib/dashboard/bookings";
import { getCustomerFriendlyStatusLabel } from "@/lib/bookings/status-timeline";
import { normalizeBookingStatus } from "@/lib/bookings/status";

const STANDARD_CLEAN_CHECKLIST = [
  "Kitchen surfaces, sink, and appliance exteriors",
  "Bathrooms — sinks, toilets, showers/tubs, mirrors",
  "Living areas and bedrooms — dust, floors, tidy surfaces",
  "Extras (fridge, oven, laundry, windows) priced separately",
] as const;

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

function isCleanerOnTheWay(status: string): boolean {
  const n = normalizeBookingStatus(status);
  return n === "on_the_way" || n === "arrived" || n === "in_progress";
}

function isLiveUpcoming(status: string): boolean {
  const n = normalizeBookingStatus(status);
  return (
    n === "confirmed" ||
    n === "awaiting_assignment" ||
    n === "offered" ||
    n === "assigned" ||
    n === "accepted" ||
    isCleanerOnTheWay(n)
  );
}

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
  const [lastCompleted, setLastCompleted] = useState(false);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setUpcoming(null);
      setLastCompleted(false);
      return;
    }
    let cancelled = false;
    void fetch("/api/dashboard")
      .then(async (res) => {
        if (!res.ok) return null;
        const json = (await res.json()) as {
          data?: { upcoming?: DashboardBooking[]; past?: DashboardBooking[] };
          upcoming?: DashboardBooking[];
          past?: DashboardBooking[];
        };
        return {
          upcoming: json.data?.upcoming ?? json.upcoming ?? [],
          past: json.data?.past ?? json.past ?? [],
        };
      })
      .then((payload) => {
        if (cancelled || !payload) return;
        const live = (payload.upcoming ?? []).find((b) => isLiveUpcoming(b.status));
        setUpcoming(live ?? null);
        setLastCompleted(
          !live &&
            (payload.past ?? []).some(
              (b) => normalizeBookingStatus(b.status) === "completed",
            ),
        );
      })
      .catch(() => {
        if (!cancelled) {
          setUpcoming(null);
          setLastCompleted(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  const waitlistReason = resolveCustomerHomeWaitlistReason({
    line1: state.line1,
    postalCode: state.postalCode,
    inServiceArea: state.inServiceArea,
    marketId: state.marketId,
  });

  const outsideFloridaHint =
    "We don’t serve this area yet. MaidLinx is launching in South Florida — join the waitlist for updates.";

  const applyAddress = (value: Partial<BookingState>) => {
    const patched = buildAddressStatePatch(state, value);
    updateState(patched);
    if (
      patched.marketId != null ||
      patched.inServiceArea === false ||
      (patched.postalCode ?? state.postalCode)
    ) {
      const marketId = patched.marketId ?? state.marketId;
      const inServiceArea =
        patched.inServiceArea !== undefined ? patched.inServiceArea : state.inServiceArea;
      if (!isCustomerHomeBookableArea({ inServiceArea, marketId })) {
        if (inServiceArea === false || (marketId && !isCustomerHomeMarket(marketId))) {
          setHint(outsideFloridaHint);
          return;
        }
      } else if (!isMarketBookingOpen(marketId)) {
        setHint(
          "We serve South Florida — booking isn’t open yet (no bookable cleaners online).",
        );
        return;
      }
    }
    setHint(null);
  };

  const applyPostalCoverage = (raw: string): boolean => {
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

    if (!isCustomerHomeBookableArea({ inServiceArea: area.inServiceArea, marketId: area.marketId })) {
      setHint(outsideFloridaHint);
      return false;
    }
    if (!isMarketBookingOpen(area.marketId)) {
      setHint(
        "We serve South Florida — booking isn’t open yet (no bookable cleaners online).",
      );
      return true;
    }
    setHint("Yes — MaidLinx serves South Florida.");
    return true;
  };

  const bookingHref = useMemo(() => {
    const flOk = isCustomerHomeBookableArea({
      inServiceArea: state.inServiceArea,
      marketId: state.marketId,
    });
    if (isAddressComplete(state) && flOk) return BOOKING_SCREEN_PATHS.service;
    if (state.postalCode && flOk) return getBookingEntryPath({ prefillAddress: true });
    return getBookingEntryPath();
  }, [state]);

  const continueIntoBooking = () => {
    trackBookingEvent("booking_started", { entry: "app_open_check_availability" });
    router.push(bookingHref);
  };

  const onCheckAvailability = () => {
    const draft = (state.line1 ?? "").trim();

    if (isAddressComplete(state)) {
      if (
        !isCustomerHomeBookableArea({
          inServiceArea: state.inServiceArea,
          marketId: state.marketId,
        })
      ) {
        setHint(outsideFloridaHint);
        return;
      }
      continueIntoBooking();
      return;
    }

    if (looksLikePostalOrZip(draft) || looksLikePostalOrZip(state.postalCode ?? "")) {
      const raw = looksLikePostalOrZip(draft) ? draft : (state.postalCode ?? "");
      const inFlorida = applyPostalCoverage(raw);
      trackBookingEvent("booking_started", { entry: "app_open_zip_check" });
      if (!inFlorida) return;
      router.push(getBookingEntryPath({ prefillAddress: true }));
      return;
    }

    if (
      state.postalCode?.trim() &&
      isCustomerHomeBookableArea({
        inServiceArea: state.inServiceArea,
        marketId: state.marketId,
      })
    ) {
      continueIntoBooking();
      return;
    }

    if (!draft) {
      setHint("Enter a South Florida street address or ZIP to check availability.");
      return;
    }

    setHint("Pick an address from the suggestions, or enter a South Florida ZIP.");
  };

  const accountHref =
    authStatus === "authenticated" ? routes.dashboardProfile : routes.signIn;
  const upcomingWhen = upcoming ? formatUpcomingWhen(upcoming) : null;
  const trackFirst = upcoming && isCleanerOnTheWay(upcoming.status);
  const showUsual = !upcoming && (lastCompleted || authStatus !== "authenticated");

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#01193D] text-white"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <header className="relative z-10 flex items-center justify-between px-5 pt-[max(0.65rem,env(safe-area-inset-top))] pb-1">
        <div className="flex items-center gap-3">
          <Link href={routes.home} aria-label="MaidLinx home" className="inline-flex">
            <Image
              src="/brand/maidlinx-mark.png"
              alt="MaidLinx"
              width={48}
              height={48}
              className="size-12 rounded-full object-cover"
              priority
            />
          </Link>
          <span className="h-6 w-px bg-white/30" aria-hidden />
          <span className="text-[15px] font-medium text-white">South Florida</span>
        </div>
        <Link
          href={accountHref}
          aria-label={authStatus === "authenticated" ? "Account" : "Sign in"}
          className="inline-flex size-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white"
        >
          <UserRound className="size-5" strokeWidth={1.85} aria-hidden />
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col px-5 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-2">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          {/* Returning: Track my clean first when cleaner on the way */}
          {upcoming && upcomingWhen ? (
            <Link
              href={routes.bookingDetail(upcoming.id)}
              className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[#102B49] px-3.5 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[#04CED2] uppercase">
                  {trackFirst ? "Cleaner on the way" : "Upcoming clean"}
                </p>
                <p className="mt-0.5 truncate text-[16px] font-semibold text-white">
                  {upcomingWhen.dateLabel}
                </p>
                <p className="truncate text-[15px] text-white/70">{upcomingWhen.windowLabel}</p>
                <p className="mt-1 text-xs font-medium text-[#04CED2]">
                  {getCustomerFriendlyStatusLabel(upcoming.status)}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-[#04CED2]">
                {trackFirst ? "Track my clean" : "View my booking"}
                <ChevronRight className="size-4" aria-hidden />
              </span>
            </Link>
          ) : showUsual ? (
            <HomeUsualCleanCard className="mb-3" />
          ) : null}

          {/* Floor plan — shrinks on short phones so address+CTA stay visible */}
          <div className="mx-auto w-full max-w-[280px] py-1 max-[390px]:max-w-[220px] max-[700px]:max-h-[22vh] max-[700px]:overflow-hidden">
            <FloorPlanArt className="h-auto w-full max-h-[22vh] min-[701px]:max-h-none" />
          </div>

          <h1 className="mt-1 text-[1.375rem] font-semibold tracking-tight text-white">
            Where are we cleaning?
          </h1>

          <div className="mt-3 rounded-xl border border-white/70 bg-transparent px-1 py-1">
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
                const marketId = patched.marketId ?? state.marketId;
                if (
                  isCustomerHomeBookableArea({
                    inServiceArea: patched.inServiceArea,
                    marketId,
                  }) &&
                  isMarketBookingOpen(marketId) &&
                  patched.line1 &&
                  patched.city &&
                  patched.postalCode
                ) {
                  router.push(BOOKING_SCREEN_PATHS.service);
                }
              }}
              variant="hero"
              hideLocate
              locationBiasMarket="SOUTH_FLORIDA"
              label="Address or ZIP"
              placeholder="South Florida address or ZIP"
              className="[&_label]:sr-only [&_input]:h-12 [&_input]:rounded-xl [&_input]:border-0 [&_input]:bg-transparent [&_input]:pl-11 [&_input]:text-[16px] [&_input]:text-white [&_input]:placeholder:text-white/40 [&_[data-hero-pin]]:text-[#04CED2]"
            />
          </div>

          {hint ||
          (hydrated &&
            Boolean(state.postalCode?.trim() || state.line1?.trim()) &&
            !isCustomerHomeBookableArea({
              inServiceArea: state.inServiceArea,
              marketId: state.marketId,
            })) ? (
            <p className="mt-2 text-[15px] leading-snug text-white/70" role="status">
              {hint ?? outsideFloridaHint}
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
            className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#04CED2] text-[16px] font-semibold text-[#01193D]"
          >
            Check availability
          </button>

          <section className="mt-2" id="whats-included">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 py-3 text-left"
              aria-expanded={includedOpen}
              onClick={() => setIncludedOpen((v) => !v)}
            >
              <span className="text-[15px] font-semibold text-[#04CED2]">What&apos;s included?</span>
              <ChevronRight
                className={`size-4 shrink-0 text-[#04CED2] transition-transform ${includedOpen ? "rotate-90" : ""}`}
                aria-hidden
              />
            </button>
            {includedOpen ? (
              <ul className="space-y-2 pb-2">
                {STANDARD_CLEAN_CHECKLIST.map((item) => (
                  <li key={item} className="text-[15px] leading-snug text-white/70">
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      </main>

      <CustomerBottomNav />
    </div>
  );
}
