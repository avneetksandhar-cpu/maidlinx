import { BookingAccessError, assertBookingAccess } from "@/lib/bookings/access";
import { getBookingById } from "@/lib/bookings/repository";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getCustomerLiveLocationView } from "@/lib/location/live-location";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Customer read of assigned cleaner live location.
 * Only when booking is on_the_way / arrived and the requester owns the booking.
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const booking = await getBookingById(id);

    if (!booking) {
      return jsonError("Booking not found.", 404);
    }

    const { searchParams } = new URL(request.url);
    const accessToken =
      searchParams.get("token") ?? request.headers.get("x-booking-access-token");

    await assertBookingAccess(booking, accessToken);

    const view = await getCustomerLiveLocationView({
      bookingId: booking.id,
      status: booking.status,
      hasAssignedCleaner: Boolean(booking.cleaner || booking.professional_profile_id),
      customerLat: booking.address_latitude,
      customerLng: booking.address_longitude,
    });

    return jsonSuccess({ location: view });
  } catch (error) {
    if (error instanceof BookingAccessError) {
      return jsonError(error.message, 403);
    }
    return jsonError("Unable to load live location.", 500);
  }
}
