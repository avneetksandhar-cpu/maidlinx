import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { GoogleMapsProvider } from "@/components/booking/google-maps-provider";
import { LiveJobShell } from "@/components/post-booking/live-job-shell";
import { PostBookingDashboard } from "@/components/post-booking/post-booking-dashboard";
import { BookingAccessError, assertBookingAccess } from "@/lib/bookings/access";
import { getBookingById } from "@/lib/bookings/repository";
import { routes } from "@/config/site";

export const metadata: Metadata = {
  title: "Your clean",
  robots: { index: false, follow: false },
};

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

/**
 * Live job status after pay — Uber arriving loop (real status only).
 * Commercial visits share the same booking from Home / Bookings → status detail
 * (confirmation + entry instructions). Refresh never creates a second charge.
 */
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

  // Same commercial booking surface as Jobs / post-approve redirect.
  if (booking.is_commercial || booking.service_order_id) {
    redirect(routes.dashboardBookStatus(id));
  }

  return (
    <LiveJobShell>
      <GoogleMapsProvider>
        <PostBookingDashboard
          bookingId={id}
          accessToken={token ?? null}
          initialBooking={booking}
          customerFirstName={booking.customer_first_name}
        />
      </GoogleMapsProvider>
    </LiveJobShell>
  );
}
