"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { CustomerBottomNav } from "@/components/customer/customer-bottom-nav";
import { AddressAutocomplete } from "@/components/booking/address-autocomplete";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { WaitlistSignup } from "@/components/waitlist/waitlist-signup";
import { useBookingState } from "@/hooks/use-booking-state";
import { buildAddressStatePatch } from "@/lib/bookings/booking-helpers";
import { isAddressComplete } from "@/lib/bookings/booking-routes";
import {
  isCustomerHomeBookableArea,
  resolveCustomerHomeWaitlistReason,
} from "@/lib/markets/booking-availability";
import { resolveServiceArea } from "@/lib/service-area";
import { useAuthSession } from "@/hooks/use-auth-session";
import { writeCommercialBookDraft } from "@/lib/commercial/book-draft";
import { routes } from "@/config/site";
import { trackBookingEvent } from "@/lib/analytics/booking";
import type { BookingState } from "@/lib/bookings/booking-state";

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

  const waitlistReason = resolveCustomerHomeWaitlistReason({
    line1: state.line1,
    postalCode: state.postalCode,
    inServiceArea: state.inServiceArea,
    marketId: state.marketId,
  });

  const outsideFloridaHint =
    "We don’t serve this area yet. MaidLinx commercial cleaning is launching in South Florida — join the waitlist or request a quote.";

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
      enterCommercialFlow();
      return;
    }

    if (looksLikePostalOrZip(draft) || looksLikePostalOrZip(state.postalCode ?? "")) {
      const raw = looksLikePostalOrZip(draft) ? draft : (state.postalCode ?? "");
      const inFlorida = applyPostalCoverage(raw);
      if (!inFlorida) return;
      persistCommercialAddress({ postalCode: normalizePostalDraft(raw) });
      trackBookingEvent("booking_started", { entry: "commercial_home_zip_check" });
      router.push(routes.bookCommercialProperty);
      return;
    }

    if (
      state.postalCode?.trim() &&
      isCustomerHomeBookableArea({
        inServiceArea: state.inServiceArea,
        marketId: state.marketId,
      })
    ) {
      enterCommercialFlow();
      return;
    }

    if (!draft) {
      setHint("Enter a South Florida business address or ZIP to check availability.");
      return;
    }

    setHint("Pick an address from the suggestions, or enter a South Florida ZIP.");
  };

  const accountHref =
    authStatus === "authenticated" ? routes.dashboardProfile : routes.signIn;

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[#01193D] text-white"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <header className="relative z-10 flex items-start justify-between gap-2 px-5 pt-[max(0.65rem,env(safe-area-inset-top))] pb-1">
        <BrandLockup
          href={routes.home}
          size="default"
          tone="onDark"
          priority
          subtitle="South Florida"
        />
        <Link
          href={accountHref}
          aria-label={authStatus === "authenticated" ? "Account" : "Sign in"}
          className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white"
        >
          <UserRound className="size-5" strokeWidth={1.85} aria-hidden />
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col px-5 pb-[calc(5.25rem+env(safe-area-inset-bottom))] pt-2">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <h1 className="mt-2 text-[1.45rem] leading-tight font-semibold tracking-tight text-white sm:text-[1.6rem]">
            Find a cleaning team for your workplace.
          </h1>
          <p className="mt-1.5 text-[14px] leading-snug text-white/65">
            Book a one-time or recurring clean for your office, storefront, or managed
            property.
          </p>

          <div className="mt-4 rounded-2xl border border-white/15 bg-[#0A2348] px-3 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <AddressAutocomplete
              value={state}
              onChange={(value) => applyAddress(value)}
              onAddressSelected={(value) => {
                applyAddress(value);
                trackBookingEvent("address_selected", {
                  marketId: value.marketId ?? state.marketId,
                  placeId: value.googlePlaceId,
                  entry: "commercial_home",
                });
              }}
              variant="hero"
              hideLocate
              locationBiasMarket="SOUTH_FLORIDA"
              label="Business address or ZIP code"
              placeholder="Business address or ZIP code"
              className="[&_label]:mb-1.5 [&_label]:block [&_label]:text-[11px] [&_label]:font-semibold [&_label]:tracking-wide [&_label]:text-white/55 [&_label]:uppercase [&_input]:h-12 [&_input]:rounded-xl [&_input]:border-0 [&_input]:bg-white/5 [&_input]:pl-11 [&_input]:text-[16px] [&_input]:text-white [&_input]:placeholder:text-white/40 [&_[data-hero-pin]]:text-[#04CED2]"
            />

            {hint ||
            (hydrated &&
              Boolean(state.postalCode?.trim() || state.line1?.trim()) &&
              !isCustomerHomeBookableArea({
                inServiceArea: state.inServiceArea,
                marketId: state.marketId,
              })) ? (
              <p className="mt-2 text-[13px] leading-snug text-white/70" role="status">
                {hint ?? outsideFloridaHint}
              </p>
            ) : null}

            {waitlistReason ? (
              <div className="mt-2">
                <WaitlistSignup
                  reason={waitlistReason}
                  marketId={state.marketId}
                  marketName={state.marketName}
                  source="commercial_home"
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

            <Link
              href={routes.forBusinessQuote}
              className="mt-3 block text-center text-[13px] font-medium text-[#04CED2] underline-offset-2 hover:underline"
            >
              Managing multiple properties? Request a quote
            </Link>
          </div>

          <div className="relative mt-5 aspect-[16/9] w-full overflow-hidden rounded-2xl">
            <Image
              src="/booking/cat-office.jpg"
              alt="South Florida office ready for a commercial clean"
              fill
              className="object-cover"
              sizes="(max-width: 430px) 100vw, 430px"
              priority
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#01193D]/50 via-transparent to-transparent"
              aria-hidden
            />
          </div>

          <p className="mt-4 text-center text-[13px] text-white/50">
            Looking for home cleaning?{" "}
            <Link
              href={routes.bookWelcome}
              className="font-medium text-white/75 underline-offset-2 hover:text-white hover:underline"
            >
              Come home to clean
            </Link>
          </p>
        </div>
      </main>

      <CustomerBottomNav />
    </div>
  );
}
