import type { Metadata } from "next";
import { Suspense } from "react";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { BookingProvider } from "@/components/booking/booking-provider";

/** Booking funnel steps are transactional — keep them out of organic search. */
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function BookLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GoogleMapsProvider>
      <BookingProvider>
        <div data-theme="ml-book" className="min-h-dvh bg-white text-[var(--ml-book-ink,#01193D)]">
          <Suspense fallback={<div className="min-h-dvh bg-white" aria-hidden />}>
            {children}
          </Suspense>
        </div>
      </BookingProvider>
    </GoogleMapsProvider>
  );
}
