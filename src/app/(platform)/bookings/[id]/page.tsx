import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CustomerShell } from "@/components/customer/customer-shell";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { PostBookingDashboard } from "@/components/post-booking/post-booking-dashboard";
import { BookingAccessError, assertBookingAccess } from "@/lib/bookings/access";
import { getBookingById } from "@/lib/bookings/repository";
import { routes } from "@/config/site";

export const metadata: Metadata = {
  title: "Your booking",
  robots: { index: false, follow: false },
};

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: BookingDetailPageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  let booking;
  try {
    booking = await getBookingById(id);
    if (!booking) notFound();
    await assertBookingAccess(booking, token ?? null);
  } catch (error) {
    if (error instanceof BookingAccessError) {
      redirect(`${routes.signIn}?redirect=${encodeURIComponent(`/bookings/${id}`)}`);
    }
    notFound();
  }

  return (
    <CustomerShell>
      <GoogleMapsProvider>
        <PostBookingDashboard
          bookingId={id}
          accessToken={token ?? null}
          initialBooking={booking}
          customerFirstName={booking.customer_first_name}
        />
      </GoogleMapsProvider>
    </CustomerShell>
  );
}
