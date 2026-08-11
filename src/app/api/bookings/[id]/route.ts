import { BookingAccessError, assertBookingAccess } from "@/lib/bookings/access";
import { getBookingById } from "@/lib/bookings/repository";
import { jsonError, jsonSuccess } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

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

    return jsonSuccess({ booking });
  } catch (error) {
    if (error instanceof BookingAccessError) {
      return jsonError(error.message, 403);
    }
    return jsonError("Unable to fetch booking.", 500);
  }
}
