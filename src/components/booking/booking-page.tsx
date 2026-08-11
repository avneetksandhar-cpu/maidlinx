"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useBookingState } from "@/hooks/use-booking-state";
import { HomeHero } from "@/components/home/home-hero";
import { resolveServiceArea } from "@/lib/service-area";
import { routes } from "@/config/site";
import type { BookingState } from "@/lib/bookings/booking-state";
import { BOOKING_SCREEN_PATHS, isAddressComplete } from "@/lib/bookings/booking-routes";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { trackBookingEvent } from "@/lib/analytics/booking";

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

  return (
    <GoogleMapsProvider>
      {showHero ? (
        <HomeHero
          state={state}
          onAddressChange={(value) => applyAddress(value)}
          onAddressSelected={(value) => applyAddress(value, true)}
          onFindCleaners={findCleaners}
        />
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
