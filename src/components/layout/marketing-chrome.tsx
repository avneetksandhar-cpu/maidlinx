"use client";

import { usePathname } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout";
import { isBookingFlowPathname } from "@/lib/bookings/booking-routes";

interface MarketingChromeProps {
  children: React.ReactNode;
  authControls: React.ReactNode;
}

function isCleanerRecruitPathname(pathname: string): boolean {
  return (
    pathname === "/earn" ||
    pathname.startsWith("/earn/") ||
    pathname === "/become-a-cleaner" ||
    pathname === "/cleaner/signup" ||
    pathname === "/pro/signup"
  );
}

export function MarketingChrome({ children, authControls }: MarketingChromeProps) {
  const pathname = usePathname() ?? "";
  const bookingFlow = isBookingFlowPathname(pathname);
  const cleanerRecruit = isCleanerRecruitPathname(pathname);

  // Full-screen booking: chrome lives in BookingFlowChrome (logo / Help / Account).
  // Cleaner recruit (/earn): dark shell owned by the page — no light marketing header.
  if (bookingFlow || cleanerRecruit) {
    return (
      <main id="main-content" className="bg-[var(--ml-dark-bg)]">
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
