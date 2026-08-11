import { jsonError, jsonSuccess } from "@/lib/api/response";
import { bulkUpdateBookings, listBookings } from "@/lib/admin/bookings";
import { requireAdminApiPermission } from "@/lib/admin/session";
import { bulkBookingActionSchema, bookingFiltersSchema } from "@/lib/validations/admin";

export async function GET(request: Request) {
  try {
    await requireAdminApiPermission("bookings.read");
    const { searchParams } = new URL(request.url);
    const parsed = bookingFiltersSchema.safeParse(Object.fromEntries(searchParams));
    const filters = parsed.success ? parsed.data : {};

    const result = await listBookings(filters);
    return jsonSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load bookings.";
    return jsonError(message, 403);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminApiPermission("bookings.write");
    const body = await request.json();
    const parsed = bulkBookingActionSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid request.", 400);
    }

    const count = await bulkUpdateBookings(admin.id, parsed.data.ids, parsed.data.action);
    return jsonSuccess({ updated: count });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bulk action failed.";
    return jsonError(message, 400);
  }
}
