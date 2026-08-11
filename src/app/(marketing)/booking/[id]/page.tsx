import { notFound, redirect } from "next/navigation";
import { BookingStatusScreen } from "@/components/booking/screens/booking-status-screen";
import { BookingProvider } from "@/components/booking/booking-provider";
import { BookingAccessError, assertBookingAccess } from "@/lib/bookings/access";
import { getBookingById } from "@/lib/bookings/repository";
import { routes } from "@/config/site";

interface BookingStatusPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function BookingStatusPage({
  params,
  searchParams,
}: BookingStatusPageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  let booking;
  try {
    booking = await getBookingById(id);
    if (!booking) notFound();
    await assertBookingAccess(booking, token ?? null);
  } catch (error) {
    if (error instanceof BookingAccessError) {
      redirect(`${routes.signIn}?redirect=/booking/${id}`);
    }
    notFound();
  }

  return (
    <BookingProvider>
      <BookingStatusScreen
        bookingId={id}
        accessToken={token ?? null}
        initialBooking={booking}
      />
    </BookingProvider>
  );
}
