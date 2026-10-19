"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MapPin, ShieldCheck, CalendarClock, BadgeCheck } from "lucide-react";
import { SiteLogo } from "@/components/brand/site-logo";
import { Button, Input } from "@/components/ui";
import { AuthControls } from "@/components/layout/auth-controls";
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
import {
  PRICE_DRIVER_COPY,
  typicalHomeEstimateForAddress,
  typicalHomeEstimateForMarket,
} from "@/lib/pricing/starting-estimate";
import { useAuthSession } from "@/hooks/use-auth-session";
import { formatCurrency } from "@/lib/utils";
import { routes } from "@/config/site";
import { trackBookingEvent } from "@/lib/analytics/booking";
import type { BookingState } from "@/lib/bookings/booking-state";

const STANDARD_CLEAN_CHECKLIST = [
  "Kitchen surfaces, sink, and appliance exteriors",
  "Bathrooms — sinks, toilets, showers/tubs, mirrors",
  "Living areas and bedrooms — dust, floors, tidy surfaces",
  "Extras (fridge, oven, laundry, windows) priced separately at checkout",
] as const;

/**
 * App-open home — benefit-led first screen with real service-area + quote preview.
 * Persists address into the same booking draft the /book funnel reads.
 * Address-first + auth gate: complete place → easy sign-in → resume at /book/property.
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
  const [postalDraft, setPostalDraft] = useState("");
  const [postalHint, setPostalHint] = useState<string | null>(null);

  const waitlistReason = resolveWaitlistReason({
    line1: state.line1,
    postalCode: state.postalCode,
    inServiceArea: state.inServiceArea,
    marketId: state.marketId,
  });

  const gtaFrom = useMemo(() => typicalHomeEstimateForMarket("TORONTO_GTA"), []);
  const flFrom = useMemo(() => typicalHomeEstimateForMarket("SOUTH_FLORIDA"), []);

  const addressEstimate = useMemo(() => {
    if (!state.inServiceArea || !state.postalCode?.trim() || !state.city?.trim() || !state.state?.trim()) {
      return null;
    }
    try {
      return typicalHomeEstimateForAddress({
        line1: state.line1,
        city: state.city,
        state: state.state,
        postalCode: state.postalCode,
        country: state.country || "US",
      });
    } catch {
      return null;
    }
  }, [state.city, state.country, state.inServiceArea, state.line1, state.postalCode, state.state]);

  const applyAddress = (value: Partial<BookingState>) => {
    const next = buildAddressStatePatch(state, value);
    updateState(next);
    setPostalHint(null);
  };

  const checkPostalOnly = () => {
    const postal = postalDraft.trim();
    if (!postal) {
      setPostalHint("Enter a postal or ZIP code to check coverage.");
      return;
    }
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
      setPostalHint(
        "MaidLinx does not serve that postal code yet. We currently cover Toronto / GTA and South Florida.",
      );
    } else if (!isMarketBookingOpen(area.marketId)) {
      setPostalHint(
        `You’re in ${area.marketName ?? "a MaidLinx market"} — on-demand booking isn’t open there yet. Join the waitlist below or continue to save your address.`,
      );
    } else {
      setPostalHint(`Yes — MaidLinx serves ${area.marketName ?? "your area"}.`);
    }
  };

  /**
   * Address first → mandatory easy auth → resume at property.
   * Draft lives in sessionStorage (useBookingState) across the auth redirect.
   */
  const bookingHref = useMemo(() => {
    if (isAddressComplete(state)) {
      if (authStatus === "authenticated") return BOOKING_RESUME_AFTER_AUTH;
      if (authStatus === "guest") return bookingSignInHref(BOOKING_RESUME_AFTER_AUTH);
      // Still resolving session — land on address slide (safe, draft intact).
      return BOOKING_SCREEN_PATHS.address;
    }
    if (state.postalCode && state.inServiceArea) {
      return getBookingEntryPath({ prefillAddress: true });
    }
    return getBookingEntryPath();
  }, [state, authStatus]);

  const openBooking = (entry: string) => {
    trackBookingEvent("booking_started", { entry });
    router.push(bookingHref);
  };

  const areaStatus = (() => {
    if (!hydrated) return null;
    if (!state.postalCode?.trim() && !state.line1?.trim()) return null;
    if (state.inServiceArea === false) {
      return {
        tone: "out" as const,
        title: "Outside our service area",
        body: "MaidLinx currently serves Toronto / GTA (CAD) and South Florida (USD). We don’t pretend coverage elsewhere.",
      };
    }
    if (state.inServiceArea && state.marketId) {
      const open = isMarketBookingOpen(state.marketId);
      return {
        tone: open ? ("ok" as const) : ("wait" as const),
        title: open
          ? `We serve ${state.marketName ?? "your area"}`
          : `We serve ${state.marketName ?? "your area"} — booking not open yet`,
        body: open
          ? "On-demand home cleaning is available to book for this address when supply is online."
          : "You’re in a MaidLinx market. Leave your email for launch notice, or continue to save this address for when booking opens.",
      };
    }
    return null;
  })();

  return (
    <div
      data-theme="ml-dark"
      className="relative flex min-h-dvh flex-col overflow-x-hidden bg-[var(--ml-dark-bg)] text-[var(--ml-dark-ink)]"
      style={{ fontFamily: "var(--ml-font-ios)" }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <Image
          src="/booking/welcome-living.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--ml-dark-bg)]/75 via-[var(--ml-dark-bg)]/70 to-[var(--ml-dark-bg)]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_45%_at_50%_10%,rgb(8_224_212_/_0.14),transparent_55%)]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <SiteLogo variant="mark" tone="brand" href={routes.home} priority />
        <div className="[&_a]:text-[var(--ml-dark-ink-muted)] [&_button]:text-[var(--ml-dark-ink-muted)]">
          <AuthControls />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col px-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-5">
        <div className="booking-shell-enter mx-auto w-full max-w-md space-y-8">
          {/* 1. Benefit-led first viewport */}
          <section className="text-center">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-[var(--ml-dark-mint)] uppercase">
              MaidLinx
            </p>
            <h1 className="mt-3 text-[1.85rem] font-semibold leading-tight tracking-tight text-white sm:text-[2.15rem]">
              Come home to clean.
            </h1>
            <p className="mx-auto mt-2 max-w-[22rem] text-[15px] leading-snug text-[var(--ml-dark-ink-muted)]">
              Book reliable home cleaning in your area, see your price upfront, and choose a time
              that works.
            </p>
          </section>

          {/* 2. Service area before deep booking */}
          <section className="space-y-3 rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)]/90 p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ml-dark-mint)]/15 text-[var(--ml-dark-mint)]">
                <MapPin className="size-5" strokeWidth={2.25} aria-hidden />
              </span>
              <div className="min-w-0 text-left">
                <p className="text-[15px] font-semibold text-white">
                  What&apos;s your address or postal code?
                </p>
                <p className="mt-0.5 text-sm text-[var(--ml-dark-ink-muted)]">
                  We&apos;ll tell you if MaidLinx serves that area (Toronto / GTA + South Florida).
                </p>
              </div>
            </div>

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
                // Persist then slide to auth (or property if already signed in).
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
              label="Address"
              placeholder="Street address or neighborhood"
              className="[&_label]:text-[var(--ml-dark-ink-muted)] [&_input]:border-[var(--ml-dark-border)] [&_input]:bg-[var(--ml-dark-bg)] [&_input]:text-white"
            />

            <div className="flex gap-2">
              <Input
                value={postalDraft}
                onChange={(e) => setPostalDraft(e.target.value)}
                placeholder="Or postal / ZIP"
                aria-label="Postal or ZIP code"
                className="h-11 border-[var(--ml-dark-border)] bg-[var(--ml-dark-bg)] text-white placeholder:text-[var(--ml-dark-ink-muted)]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    checkPostalOnly();
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                className="h-11 shrink-0 rounded-xl border-[var(--ml-dark-border)] bg-transparent text-white hover:bg-white/5"
                onClick={checkPostalOnly}
              >
                Check
              </Button>
            </div>

            {postalHint ? (
              <p className="text-sm leading-snug text-[var(--ml-dark-ink-muted)]" role="status">
                {postalHint}
              </p>
            ) : null}

            {areaStatus ? (
              <div
                className={
                  areaStatus.tone === "ok"
                    ? "rounded-xl border border-[var(--ml-dark-mint)]/35 bg-[var(--ml-dark-mint)]/10 px-3 py-2.5 text-left"
                    : areaStatus.tone === "wait"
                      ? "rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2.5 text-left"
                      : "rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-left"
                }
                role="status"
              >
                <p className="text-sm font-semibold text-white">{areaStatus.title}</p>
                <p className="mt-1 text-xs leading-snug text-[var(--ml-dark-ink-muted)]">
                  {areaStatus.body}
                </p>
              </div>
            ) : null}

            {waitlistReason ? (
              <WaitlistSignup
                reason={waitlistReason}
                marketId={state.marketId}
                marketName={state.marketName}
                source="app_open_home"
                page="/"
                variant="compact"
              />
            ) : null}

            {/* Primary CTA — Link for reliable desktop + mobile navigation */}
            <Link
              href={bookingHref}
              onClick={() => trackBookingEvent("booking_started", { entry: "app_open_check_availability" })}
              className="booking-cta-btn inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--ml-dark-mint)] text-base font-semibold text-[var(--ml-dark-bg)] shadow-[0_0_28px_rgb(8_224_212_/_0.28)] transition-opacity hover:opacity-95"
            >
              Check availability
              <span aria-hidden>→</span>
            </Link>
            <p className="text-center text-xs text-[var(--ml-dark-ink-muted)]">
              Address first, then a quick sign-in (Google / Apple / email link). Your place stays
              saved so you can track your cleaner.
            </p>
          </section>

          {/* 3. Price preview — same engine as checkout */}
          <section className="rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)]/80 p-4 text-left">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--ml-dark-mint)] uppercase">
              Starting estimate
            </p>
            {addressEstimate ? (
              <p className="mt-2 text-2xl font-semibold text-white">
                From {formatCurrency(addressEstimate.totalCents, addressEstimate.currency)}
              </p>
            ) : (
              <p className="mt-2 text-lg font-semibold leading-snug text-white">
                From {formatCurrency(gtaFrom.totalCents, gtaFrom.currency)} in Toronto / GTA
                <span className="text-[var(--ml-dark-ink-muted)]"> · </span>
                From {formatCurrency(flFrom.totalCents, flFrom.currency)} in South Florida
              </p>
            )}
            <p className="mt-1 text-sm text-[var(--ml-dark-ink-muted)]">
              Typical standard clean: 2 bedrooms, 1 bathroom, up to 1,000 sq ft — including platform
              fee. {PRICE_DRIVER_COPY}
            </p>
          </section>

          {/* 4. Trust beside CTA — only real product promises */}
          <section className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: BadgeCheck,
                title: "Screened Pros",
                body: "Cleaners complete MaidLinx onboarding and screening gates before jobs.",
              },
              {
                icon: ShieldCheck,
                title: "Insurance attestation",
                body: "Pros attest to liability insurance; ops reviews docs. Not a blanket MaidLinx insurance guarantee.",
              },
              {
                icon: CalendarClock,
                title: "Policies you can open",
                body: "Reschedule from your booking. Cancellation & refund rules are published under Legal.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)]/70 p-3.5 text-left"
              >
                <Icon className="size-5 text-[var(--ml-dark-mint)]" strokeWidth={1.75} aria-hidden />
                <p className="mt-2 text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs leading-snug text-[var(--ml-dark-ink-muted)]">{body}</p>
              </div>
            ))}
            <p className="sm:col-span-3 text-xs text-[var(--ml-dark-ink-muted)]">
              <Link href={routes.legal.cancellation} className="underline-offset-2 hover:underline">
                Cancellation
              </Link>
              {" · "}
              <Link href={routes.legal.refund} className="underline-offset-2 hover:underline">
                Refund
              </Link>
              {" · "}
              <Link href={routes.legal.damage} className="underline-offset-2 hover:underline">
                Damage claims
              </Link>
              {" — draft policies pending legal review."}
            </p>
          </section>

          {/* 5. Real proof — no sample ratings; checklist + real photos */}
          <section className="space-y-3 text-left">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[var(--ml-dark-mint)] uppercase">
              What a standard clean covers
            </p>
            <p className="text-sm text-[var(--ml-dark-ink-muted)]">
              We don&apos;t show sample ratings. Customer reviews appear only when real bookings
              leave them.
            </p>
            <ul className="space-y-2">
              {STANDARD_CLEAN_CHECKLIST.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-white">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-[var(--ml-dark-mint)]"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span className="text-[var(--ml-dark-ink-muted)]">{item}</span>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  src="/booking/welcome-living.jpg"
                  alt="Living room ready after a home clean"
                  fill
                  sizes="(max-width: 480px) 50vw, 220px"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image
                  src="/booking/cat-home.jpg"
                  alt="Home cleaning category"
                  fill
                  sizes="(max-width: 480px) 50vw, 220px"
                  className="object-cover"
                />
              </div>
            </div>
          </section>

          {/* 6. Separate home vs business */}
          <section className="rounded-2xl border border-[var(--ml-dark-border)] bg-[var(--ml-dark-surface)]/70 p-4 text-left">
            <p className="text-sm font-semibold text-white">Home or business?</p>
            <p className="mt-1 text-sm leading-snug text-[var(--ml-dark-ink-muted)]">
              This path is for residential cleans. Workplaces, retail, restaurants, and property
              managers use a separate estimate flow.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <button
                type="button"
                className="font-medium text-[var(--ml-dark-mint)] underline-offset-4 hover:underline"
                onClick={() => openBooking("app_open_home_continue")}
              >
                Continue home booking
              </button>
              <Link
                href={routes.forBusiness}
                className="font-medium text-[var(--ml-dark-mint)] underline-offset-4 hover:underline"
              >
                For business
              </Link>
              <Link
                href={routes.becomeCleaner}
                className="font-medium text-[var(--ml-dark-mint)] underline-offset-4 hover:underline"
              >
                Earn with MaidLinx
              </Link>
            </div>
          </section>
        </div>
      </main>

      <CustomerBottomNav />
    </div>
  );
}
