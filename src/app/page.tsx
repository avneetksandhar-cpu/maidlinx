import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { BookingPage } from "@/components/booking/booking-page";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthControls } from "@/components/layout/auth-controls";

export default function HomePage() {
  return (
    <>
      <SiteHeader authControls={<AuthControls />} />
      <main id="main-content">
        <GoogleMapsProvider>
          <BookingPage showHero showMarketingSections />
        </GoogleMapsProvider>
      </main>
    </>
  );
}
