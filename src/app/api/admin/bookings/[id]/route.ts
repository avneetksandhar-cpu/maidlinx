import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  assignProfessional,
  cancelAssignment,
  cancelBooking,
  getBookingDetail,
  reassignProfessional,
  updateBookingStatus,
} from "@/lib/admin/bookings";
import { requireAdminApiPermission } from "@/lib/admin/session";
import { listBookingEvents } from "@/lib/bookings/events";
import {
  assignCleanerSchema,
  cancelAssignmentSchema,
  cancelBookingSchema,
  updateBookingStatusSchema,
} from "@/lib/validations/admin";
import { normalizeBookingStatus, type BookingStatus } from "@/lib/bookings/status";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminApiPermission("bookings.read");
    const { id } = await context.params;
    const booking = await getBookingDetail(id);

    if (!booking) {
      return jsonError("Booking not found.", 404);
    }

    const events = await listBookingEvents(id);
    return jsonSuccess({ booking, events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load booking.";
    const status = message.includes("Insufficient") || message.includes("denied") ? 403 : 400;
    return jsonError(message, status);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminApiPermission("bookings.write");
    const { id } = await context.params;
    const body = await request.json();

    if (body.action === "assign") {
      const parsed = assignCleanerSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(parsed.error.errors[0]?.message ?? "Invalid assign request.", 400);
      }
      const detail = await getBookingDetail(id);
      if (detail?.professionalProfileId) {
        await reassignProfessional(admin.id, id, parsed.data.professionalProfileId);
      } else {
        await assignProfessional(admin.id, id, parsed.data.professionalProfileId);
      }
      const booking = await getBookingDetail(id);
      const events = await listBookingEvents(id);
      return jsonSuccess({ booking, events });
    }

    if (body.action === "cancel_assignment") {
      const parsed = cancelAssignmentSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(parsed.error.errors[0]?.message ?? "Invalid cancel assignment.", 400);
      }
      await cancelAssignment(admin.id, id, parsed.data.reason);
      const booking = await getBookingDetail(id);
      const events = await listBookingEvents(id);
      return jsonSuccess({ booking, events });
    }

    if (body.action === "cancel") {
      const parsed = cancelBookingSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(parsed.error.errors[0]?.message ?? "Invalid cancel request.", 400);
      }
      await cancelBooking(admin.id, id, parsed.data.reason);
      const booking = await getBookingDetail(id);
      const events = await listBookingEvents(id);
      return jsonSuccess({ booking, events });
    }

    const parsed = updateBookingStatusSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid status.", 400);
    }

    const status = normalizeBookingStatus(parsed.data.status) as BookingStatus;
    await updateBookingStatus(admin.id, id, status);
    const booking = await getBookingDetail(id);
    const events = await listBookingEvents(id);
    return jsonSuccess({ booking, events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    const status = message.includes("Insufficient") || message.includes("denied") ? 403 : 400;
    return jsonError(message, status);
  }
}
