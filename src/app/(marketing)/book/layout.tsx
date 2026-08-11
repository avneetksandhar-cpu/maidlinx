import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { BookingProvider } from "@/components/booking/booking-provider";

export default function BookLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GoogleMapsProvider>
      <BookingProvider>
        <div className="min-h-[calc(100dvh-3.5rem)] bg-background py-4 sm:py-6">{children}</div>
      </BookingProvider>
    </GoogleMapsProvider>
  );
}
