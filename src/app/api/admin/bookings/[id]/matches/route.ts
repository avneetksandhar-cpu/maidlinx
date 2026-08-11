import { jsonError, jsonSuccess } from "@/lib/api/response";
import { getRankedMatchesForBooking } from "@/lib/admin/matches";
import { requireAdminApiPermission } from "@/lib/admin/session";
import { DEFAULT_MATCH_LIMIT } from "@/lib/matching/config";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireAdminApiPermission("bookings.read");
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit") ?? DEFAULT_MATCH_LIMIT);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(1, Math.floor(limitParam)), 25)
      : DEFAULT_MATCH_LIMIT;

    const result = await getRankedMatchesForBooking(id, limit);
    return jsonSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load matches.";
    const status = message === "Booking not found." ? 404 : 403;
    return jsonError(message, status);
  }
}
