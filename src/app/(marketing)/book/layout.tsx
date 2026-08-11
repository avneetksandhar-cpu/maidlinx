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
        <div className="min-h-dvh bg-background">{children}</div>
      </BookingProvider>
    </GoogleMapsProvider>
  );
}
