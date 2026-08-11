"use client";

import { usePathname } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { isBookingFlowPathname } from "@/lib/bookings/booking-routes";

interface MarketingChromeProps {
  children: React.ReactNode;
  authControls: React.ReactNode;
}

export function MarketingChrome({ children, authControls }: MarketingChromeProps) {
  const pathname = usePathname() ?? "";
  const bookingFlow = isBookingFlowPathname(pathname);

  // Full-screen booking: chrome lives in BookingFlowChrome (logo / Help / Account).
  if (bookingFlow) {
    return (
      <main id="main-content" className="bg-background">
        {children}
      </main>
    );
  }

  return (
    <>
      <SiteHeader authControls={authControls} />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </>
  );
}
