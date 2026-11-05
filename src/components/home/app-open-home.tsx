"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Building2, Home } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { AddressAutocomplete } from "@/components/booking/address-autocomplete";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { HomeActiveBookingCard } from "@/components/home/home-active-booking-card";
import { OverviewCoastalMap } from "@/components/home/overview-coastal-map";
import { WaitlistSignup } from "@/components/waitlist/waitlist-signup";
import { useBookingState } from "@/hooks/use-booking-state";
import { buildAddressStatePatch } from "@/lib/bookings/booking-helpers";
import {
  BOOKING_SCREEN_PATHS,
  isAddressComplete,
} from "@/lib/bookings/booking-routes";
import {
  isCustomerHomeBookableArea,
  isMarketBookingOpen,
  resolveCustomerHomeWaitlistReason,
} from "@/lib/markets/booking-availability";
import { resolveServiceArea } from "@/lib/service-area";
import { writeCommercialBookDraft } from "@/lib/commercial/book-draft";
import { routes } from "@/config/site";
import { trackBookingEvent } from "@/lib/analytics/booking";
import type { BookingState } from "@/lib/bookings/booking-state";
import { cn } from "@/lib/utils";

type PlaceKind = "home" | "business";

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
  const [hint, setHint] = useState<string | null>(null);
  /** Mockup default: Home selected; Business preserves commercial path. Address state shared. */
  const [placeKind, setPlaceKind] = useState<PlaceKind>("home");

  const waitlistReason = resolveCustomerHomeWaitlistReason({
    line1: state.line1,
    postalCode: state.postalCode,
    inServiceArea: state.inServiceArea,
    marketId: state.marketId,
  });

  const outsideFloridaHint =
    placeKind === "business"
      ? "We don’t serve this area yet. MaidLinx commercial cleaning is launching in South Florida — join the waitlist or request a quote."
      : "We don’t serve this area yet. MaidLinx home cleaning is launching in South Florida — join the waitlist.";

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
        if (inServiceArea === false || marketId) {
          setHint(outsideFloridaHint);
          return;
        }
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
    setHint(null);
    return true;
  };

  const persistCommercialAddress = (overrides?: Partial<BookingState>) => {
    const s = { ...state, ...overrides };
    const label =
      [s.line1, s.city, s.state, s.postalCode].filter(Boolean).join(", ") ||
      s.postalCode ||
      "Business address";
    writeCommercialBookDraft({
      siteId: null,
      siteLabel: label,
      serviceId: null,
      serviceLabel: null,
      frequency: null,
      preferredTimeId: null,
      preferredTimeLabel: null,
      proposalId: null,
      propertyType: null,
      line1: s.line1 ?? null,
      city: s.city ?? null,
      region: s.state ?? null,
      postalCode: s.postalCode ?? null,
      country: s.country ?? null,
      marketId: s.marketId ?? null,
      googlePlaceId: s.googlePlaceId ?? null,
    });
  };

  const enterCommercialFlow = () => {
    persistCommercialAddress();
    trackBookingEvent("booking_started", { entry: "commercial_home_check_availability" });
    router.push(routes.bookCommercialProperty);
  };

  const enterResidentialFlow = () => {
    trackBookingEvent("booking_started", { entry: "residential_home_check_availability" });
    if (
      isAddressComplete(state) &&
      state.inServiceArea &&
      isMarketBookingOpen(state.marketId)
    ) {
      router.push(BOOKING_SCREEN_PATHS.property);
      return;
    }
    if (
      isAddressComplete(state) &&
      isCustomerHomeBookableArea({
        inServiceArea: state.inServiceArea,
        marketId: state.marketId,
      })
    ) {
      router.push(BOOKING_SCREEN_PATHS.property);
      return;
    }
    router.push(routes.bookAddress);
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
      if (placeKind === "business") enterCommercialFlow();
      else enterResidentialFlow();
      return;
    }

    if (looksLikePostalOrZip(draft) || looksLikePostalOrZip(state.postalCode ?? "")) {
      const raw = looksLikePostalOrZip(draft) ? draft : (state.postalCode ?? "");
      const inFlorida = applyPostalCoverage(raw);
      if (!inFlorida) return;
      if (placeKind === "business") {
        persistCommercialAddress({ postalCode: normalizePostalDraft(raw) });
        trackBookingEvent("booking_started", { entry: "commercial_home_zip_check" });
        router.push(routes.bookCommercialProperty);
      } else {
        trackBookingEvent("booking_started", { entry: "residential_home_zip_check" });
        router.push(routes.bookAddress);
      }
      return;
    }

    if (
      state.postalCode?.trim() &&
      isCustomerHomeBookableArea({
        inServiceArea: state.inServiceArea,
        marketId: state.marketId,
      })
    ) {
      if (placeKind === "business") enterCommercialFlow();
      else enterResidentialFlow();
      return;
    }

    if (!draft) {
      setHint(
        placeKind === "business"
          ? "Enter a South Florida business address or ZIP to check availability."
          : "Enter a South Florida home address or ZIP to check availability.",
      );
      return;
    }

    setHint("Pick an address from the suggestions, or enter a South Florida ZIP.");
  };

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-x-hidden bg-white text-[#01193D]"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      {/* Deep navy header — circular mark + MaidLinx left; South Florida right */}
      <header className="relative z-20 flex items-center justify-between gap-3 bg-[#01193D] px-5 pt-[max(0.65rem,env(safe-area-inset-top))] pb-3">
        <BrandLockup href={routes.home} size="default" tone="onDark" priority />
        <p className="shrink-0 text-[13px] font-semibold tracking-tight text-white/90 sm:text-[14px]">
          South Florida
        </p>
      </header>

      <main className="relative z-10 flex flex-1 flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          {/* Upcoming clean takes priority above map + booking panel */}
          <HomeActiveBookingCard
            tone="light"
            title="Your next clean"
            className="mx-5 mt-3"
          />

          {/* Compact pale coastal map — shrinks first on short / narrow phones */}
          <OverviewCoastalMap
            className={cn(
              "pointer-events-none relative w-full shrink-0 overflow-hidden bg-[#EEF3EC]",
              "h-[128px]",
              "max-[390px]:h-[110px]",
              "max-[360px]:h-[96px]",
              "[@media(max-height:720px)]:h-[100px]",
              "[@media(max-height:640px)]:h-[80px]",
              "[@media(max-height:560px)]:h-[64px]",
              "sm:h-[148px]",
            )}
          />

          {/* White booking panel — usable from first frame (map is pointer-events none) */}
          <div className="relative z-20 -mt-3 flex flex-1 flex-col rounded-t-[1.5rem] bg-white px-5 pt-5 shadow-[0_-8px_24px_rgba(1,25,61,0.06)]">
            <h1 className="text-[1.4rem] leading-tight font-bold tracking-tight text-[#01193D] sm:text-[1.55rem]">
              Where do you need a clean?
            </h1>

            <div
              className="mt-3 grid grid-cols-2 gap-1 rounded-full border border-[#E2E8EE] bg-[#F4F7FA] p-1"
              role="tablist"
              aria-label="Home or business"
            >
              <PlaceTab
                active={placeKind === "home"}
                icon={<Home className="size-4" strokeWidth={2.25} aria-hidden />}
                label="Home"
                onClick={() => setPlaceKind("home")}
              />
              <PlaceTab
                active={placeKind === "business"}
                icon={<Building2 className="size-4" strokeWidth={2.25} aria-hidden />}
                label="Business"
                onClick={() => setPlaceKind("business")}
              />
            </div>

            <div className="relative z-20 mt-3">
              <AddressAutocomplete
                value={state}
                onChange={(value) => applyAddress(value)}
                onAddressSelected={(value) => {
                  applyAddress(value);
                  trackBookingEvent("address_selected", {
                    marketId: value.marketId ?? state.marketId,
                    placeId: value.googlePlaceId,
                    entry: placeKind === "business" ? "commercial_home" : "residential_home",
                  });
                }}
                variant="hero"
                hideLocate
                locationBiasMarket="SOUTH_FLORIDA"
                label="Address or ZIP code"
                placeholder="Enter address or ZIP code"
                className="[&_label]:sr-only [&_input]:h-12 [&_input]:rounded-xl [&_input]:border [&_input]:border-[#D8DEE6] [&_input]:bg-white [&_input]:pl-11 [&_input]:text-[16px] [&_input]:text-[#01193D] [&_input]:placeholder:text-[#8A93A3] [&_[data-hero-pin]]:text-[#04CED2]"
              />

              {hint ||
              (hydrated &&
                Boolean(state.postalCode?.trim() || state.line1?.trim()) &&
                !isCustomerHomeBookableArea({
                  inServiceArea: state.inServiceArea,
                  marketId: state.marketId,
                })) ? (
                <p className="mt-2 text-[13px] leading-snug text-[#5A6578]" role="status">
                  {hint ?? outsideFloridaHint}
                </p>
              ) : null}

              {waitlistReason ? (
                <div className="mt-2">
                  <WaitlistSignup
                    reason={waitlistReason}
                    marketId={state.marketId}
                    marketName={state.marketName}
                    source={placeKind === "business" ? "commercial_home" : "homepage_hero"}
                    page="/"
                    variant="compact"
                  />
                </div>
              ) : null}

              <button
                type="button"
                onClick={onCheckAvailability}
                className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#04CED2] text-[16px] font-semibold text-[#01193D] transition-opacity hover:opacity-95"
              >
                Check availability
              </button>

              {placeKind === "business" ? (
                <Link
                  href={routes.forBusinessQuote}
                  className="mt-3 block text-center text-[13px] font-medium text-[#01193D]/70 underline-offset-2 hover:text-[#01193D] hover:underline"
                >
                  Managing multiple properties? Request a quote
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </main>

      <CustomerBottomNav />
    </div>
  );
}

function PlaceTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold transition-colors",
        active
          ? "bg-[#04CED2] text-[#01193D] shadow-sm"
          : "bg-transparent text-[#01193D]/70 hover:text-[#01193D]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
