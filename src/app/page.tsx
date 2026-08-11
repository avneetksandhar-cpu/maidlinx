import type { Metadata } from "next";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { BookingPage } from "@/components/booking/booking-page";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthControls } from "@/components/layout/auth-controls";
import { siteConfig } from "@/config/site";

const homeTitle = `${siteConfig.name} | Book Cleaning On Demand`;

export const metadata: Metadata = {
  title: {
    absolute: homeTitle,
  },
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: siteConfig.name,
    title: homeTitle,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: siteConfig.description,
  },
};

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
