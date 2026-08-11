"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useBookingState } from "@/hooks/use-booking-state";
import { AddressAutocomplete } from "@/components/booking/address-autocomplete";
import { ReturningCustomerBanner } from "@/components/booking/returning-customer-banner";
import { SavedPlaceChips } from "@/components/booking/saved-place-chips";
import { HeroVisual } from "@/components/booking/hero-visual";
import { resolveServiceArea } from "@/lib/service-area";
import { Container } from "@/components/ui";
import { routes } from "@/config/site";
import type { BookingState } from "@/lib/bookings/booking-state";
import { BOOKING_SCREEN_PATHS, isAddressComplete } from "@/lib/bookings/booking-routes";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { trackBookingEvent } from "@/lib/analytics/booking";
import {
  readUsualClean,
  usualCleanToBookingPatch,
} from "@/lib/bookings/usual-clean";
import { cn } from "@/lib/utils";

const HowItWorks = dynamic(
  () => import("@/components/marketing/how-it-works").then((mod) => mod.HowItWorks),
  { loading: () => <section className="py-12" aria-hidden /> },
);
const ServiceSections = dynamic(
  () =>
    import("@/components/marketing/service-sections").then((mod) => ({
      default: mod.ServiceSections,
    })),
  { loading: () => <section className="py-12" aria-hidden /> },
);
const CleanerCTA = dynamic(
  () =>
    import("@/components/marketing/service-sections").then((mod) => ({
      default: mod.CleanerCTA,
    })),
  { loading: () => <section className="py-12" aria-hidden /> },
);
const FAQ = dynamic(() => import("@/components/marketing/faq").then((mod) => mod.FAQ), {
  loading: () => <section className="py-12" aria-hidden />,
});
const Footer = dynamic(() => import("@/components/marketing/footer").then((mod) => mod.Footer), {
  loading: () => null,
});

const SERVICE_CHIPS = [
  { label: "Residential", href: routes.bookAddress },
  { label: "Commercial", href: routes.bookAddress },
  { label: "Move-in/out", href: `${routes.book}?service=move_in` },
  { label: "Post-construction", href: `${routes.book}?service=post_construction` },
] as const;

interface BookingPageProps {
  showHero?: boolean;
  showMarketingSections?: boolean;
}

export function BookingPage({
  showHero = true,
  showMarketingSections = true,
}: BookingPageProps) {
  const { state, updateState } = useBookingState();
  const router = useRouter();

  const applyAddress = (value: Partial<BookingState>, autoAdvance = false) => {
    const area = resolveServiceArea({
      postalCode: value.postalCode,
      city: value.city,
      state: value.state,
      country: value.country,
    });
    updateState({
      ...value,
      marketId: area.marketId,
      zoneId: area.zoneId,
      inServiceArea: area.inServiceArea,
      marketName: area.marketName ?? null,
      step: area.inServiceArea ? 2 : 1,
    });

    if (autoAdvance && area.inServiceArea) {
      trackBookingEvent("address_selected", {
        marketId: area.marketId,
        source: "homepage_hero",
      });
      router.push(BOOKING_SCREEN_PATHS.property);
    }
  };

  const findCleaners = () => {
    if (isAddressComplete(state) && state.inServiceArea) {
      trackBookingEvent("address_selected", {
        marketId: state.marketId,
        source: "homepage_find_cleaners",
      });
      router.push(BOOKING_SCREEN_PATHS.property);
      return;
    }
    router.push(routes.bookAddress);
  };

  const applyUsual = (patch: Partial<BookingState>) => {
    const usual = readUsualClean();
    const full = usual ? usualCleanToBookingPatch(usual) : patch;
    const area = resolveServiceArea({
      postalCode: full.postalCode ?? patch.postalCode,
      city: full.city ?? patch.city,
      state: full.state ?? patch.state,
      country: full.country ?? patch.country,
    });
    updateState({
      ...full,
      marketId: area.marketId,
      zoneId: area.zoneId,
      inServiceArea: area.inServiceArea,
      marketName: area.marketName ?? null,
    });
    if (!area.inServiceArea) return;
    router.push(
      full.serviceType ? BOOKING_SCREEN_PATHS.review : BOOKING_SCREEN_PATHS.property,
    );
  };

  return (
    <GoogleMapsProvider>
      {showHero ? (
        <section className="relative overflow-hidden bg-background">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 60% 45% at 85% 15%, rgba(13,148,136,0.08), transparent 55%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(17,24,39,0.03), transparent 50%)",
            }}
            aria-hidden
          />
          <Container className="relative py-10 sm:py-14 lg:py-16">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
              <div className="animate-[fadeIn_0.35s_ease]">
                <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
                  MaidLinx
                </p>
                <h1 className="mt-3 font-display text-[2.35rem] leading-[1.05] font-semibold tracking-tight text-ink sm:text-5xl lg:text-[3.35rem]">
                  Cleaning, on demand.
                </h1>
                <p className="mt-3 max-w-md text-base text-ink-muted sm:text-lg">
                  Book trusted cleaning professionals in minutes.
                </p>

                <div className="mt-7 max-w-xl space-y-4">
                  <ReturningCustomerBanner onApply={applyUsual} />

                  <SavedPlaceChips
                    onSelect={(selection) => {
                      const { source: _source, ...address } = selection;
                      applyAddress(address, true);
                    }}
                  />

                  <AddressAutocomplete
                    value={state}
                    onChange={(value) => applyAddress(value)}
                    variant="hero"
                    label="Where do you need cleaning?"
                    placeholder="Enter your address"
                    onAddressSelected={(value) => applyAddress(value, true)}
                  />
                  <button
                    type="button"
                    onClick={findCleaners}
                    className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-accent px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-accent-hover sm:w-auto sm:min-w-[11rem]"
                  >
                    Find cleaners
                  </button>

                  {state.line1 && state.inServiceArea === false ? (
                    <p className="text-sm text-ink-muted">
                      We&apos;re not in your area yet.{" "}
                      <a
                        className="font-medium text-accent underline-offset-2 hover:underline"
                        href="mailto:support@maidlinx.com?subject=MaidLinx%20waitlist"
                      >
                        Join the waitlist
                      </a>
                    </p>
                  ) : null}

                  <ul className="flex flex-wrap gap-2 pt-1" aria-label="Services">
                    {SERVICE_CHIPS.map((chip) => (
                      <li key={chip.label}>
                        <button
                          type="button"
                          onClick={() => router.push(chip.href)}
                          className={cn(
                            "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-ink-muted",
                            "transition-colors duration-200 hover:border-accent/40 hover:text-ink",
                          )}
                        >
                          {chip.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <HeroVisual className="mx-auto hidden w-full max-w-md animate-[riseIn_0.5s_ease] lg:block lg:max-w-none" />
            </div>
          </Container>
        </section>
      ) : null}

      {showMarketingSections ? (
        <>
          <HowItWorks />
          <ServiceSections />
          <CleanerCTA />
          <FAQ />
          <Footer />
        </>
      ) : null}
    </GoogleMapsProvider>
  );
}
