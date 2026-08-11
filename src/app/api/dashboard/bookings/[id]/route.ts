import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  cancelCustomerBooking,
  getCustomerBookings,
  rescheduleCustomerBooking,
} from "@/lib/dashboard/bookings";
import { requireCustomerSession } from "@/lib/dashboard/session";
import { cancelBookingSchema, rescheduleBookingSchema } from "@/lib/validations/dashboard";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request) {
  try {
    const { profile, email } = await requireCustomerSession();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") ?? "all";

    if (filter !== "upcoming" && filter !== "past" && filter !== "all") {
      return jsonError("Invalid filter.", 400);
    }

    const bookings = await getCustomerBookings(profile.id, email, filter);
    return jsonSuccess({ bookings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load bookings.";
    return jsonError(message, error instanceof Error && message.includes("Authentication") ? 401 : 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { profile, email } = await requireCustomerSession();
    const { id } = await context.params;
    const body = await request.json();
    const action = body.action as string;

    if (action === "cancel") {
      const parsed = cancelBookingSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(parsed.error.errors[0]?.message ?? "Invalid request.", 400);
      }
      await cancelCustomerBooking(id, profile.id, email, parsed.data.reason);
      return jsonSuccess({ cancelled: true });
    }

    if (action === "reschedule") {
      const parsed = rescheduleBookingSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(parsed.error.errors[0]?.message ?? "Invalid request.", 400);
      }
      await rescheduleCustomerBooking(
        id,
        profile.id,
        email,
        parsed.data.date,
        parsed.data.arrivalWindow,
      );
      return jsonSuccess({ rescheduled: true });
    }

    return jsonError("Unknown action.", 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update booking.";
    return jsonError(message, 400);
  }
}
