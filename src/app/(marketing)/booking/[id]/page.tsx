import { redirect } from "next/navigation";
import { bookingStatusPath } from "@/lib/bookings/booking-routes";

interface LegacyBookingStatusPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

/** Legacy `/booking/[id]` → canonical post-booking `/bookings/[id]`. */
export default async function LegacyBookingStatusPage({
  params,
  searchParams,
}: LegacyBookingStatusPageProps) {
  const { id } = await params;
  const { token } = await searchParams;
  redirect(bookingStatusPath(id, token));
}
