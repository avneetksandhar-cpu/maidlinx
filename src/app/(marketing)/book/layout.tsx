import type { Metadata } from "next";
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
        <div className="min-h-dvh bg-background">{children}</div>
      </BookingProvider>
    </GoogleMapsProvider>
  );
}
