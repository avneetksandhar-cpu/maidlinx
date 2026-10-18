import type { Metadata } from "next";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { BookingPage } from "@/components/booking/booking-page";
import { MobileBottomNav } from "@/components/booking/mobile-bottom-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthControls } from "@/components/layout/auth-controls";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <>
      <SiteHeader authControls={<AuthControls />} />
      <main id="main-content" className="pb-20 lg:pb-0">
        <GoogleMapsProvider>
          <BookingPage showHero showMarketingSections />
        </GoogleMapsProvider>
      </main>
      <MobileBottomNav />
    </>
  );
}
