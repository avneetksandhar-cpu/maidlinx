"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, UserRound } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { AddressAutocomplete } from "@/components/booking/address-autocomplete";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { WaitlistSignup } from "@/components/waitlist/waitlist-signup";
import { FloorPlanArt } from "@/components/home/floor-plan-art";
import { HomeResumeCard } from "@/components/home/home-resume-card";
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
import { isLiveUpcoming, resolveHomeResumeCta } from "@/lib/home/resume-cta";
import { readUsualClean } from "@/lib/bookings/usual-clean";

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
  const [hasUsualClean, setHasUsualClean] = useState(false);

  useEffect(() => {
    const usual = readUsualClean();
    setHasUsualClean(Boolean(usual?.line1 && usual.serviceType));
  }, [hydrated]);

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
      })
      .catch(() => {
        if (!cancelled) setUpcoming(null);
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

  const resume = hydrated
    ? resolveHomeResumeCta({ upcoming, draft: state, hasUsualClean })
    : null;

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#01193D] text-white"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <header className="relative z-10 flex items-center justify-between gap-2 px-5 pt-[max(0.65rem,env(safe-area-inset-top))] pb-1">
        <BrandLockup href={routes.home} size="default" tone="onDark" priority />
        <Link
          href={accountHref}
          aria-label={authStatus === "authenticated" ? "Account" : "Sign in"}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white"
        >
          <UserRound className="size-5" strokeWidth={1.85} aria-hidden />
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col px-5 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-2">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          {/* One primary resume tap — urgency: on the way > upcoming > finish > usual */}
          {resume ? (
            <HomeResumeCard resume={resume} upcoming={upcoming} className="mb-3" />
          ) : null}

          {/* Floor plan — shrinks on short phones so address+CTA stay visible */}
          <div className="mx-auto w-full max-w-[280px] py-1 max-[390px]:max-w-[220px] max-[700px]:max-h-[22vh] max-[700px]:overflow-hidden">
            <FloorPlanArt className="h-auto w-full max-h-[22vh] min-[701px]:max-h-none" />
          </div>

          <Link
            href={routes.dashboardSites}
            className="mb-3 inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#04CED2]/70 text-[15px] font-semibold text-[#04CED2]"
          >
            Business sites · commercial cleaning
          </Link>

          <h1 className="mt-1 text-[1.375rem] font-semibold tracking-tight text-white">
            Home cleaning
          </h1>
          <p className="mt-1 text-[13px] text-white/55">
            Residential path (secondary). Businesses use Sites for offices and storefronts.
          </p>

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
