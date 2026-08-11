import { jsonError, jsonSuccess } from "@/lib/api/response";
import { requireAdminApiPermission } from "@/lib/admin/session";
import { createOffer, listOffersForBooking } from "@/lib/matching/assignment";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const createOfferSchema = z.object({
  cleanerId: z.string().uuid(),
  matchScore: z.number().min(0).max(100).optional(),
  scoreBreakdown: z.array(z.string()).optional(),
});

export async function GET(_request: Request, context: RouteContext) {
  try {
    await requireAdminApiPermission("bookings.read");
    const { id } = await context.params;
    const offers = await listOffersForBooking(id);
    return jsonSuccess({ bookingId: id, offers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load offers.";
    const status = message.includes("Insufficient") || message.includes("denied") ? 403 : 400;
    return jsonError(message, status);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminApiPermission("bookings.write");
    const { id } = await context.params;
    const body = await request.json();
    const parsed = createOfferSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid offer request.", 400);
    }

    const offer = await createOffer({
      bookingId: id,
      cleanerId: parsed.data.cleanerId,
      matchScore: parsed.data.matchScore,
      scoreBreakdown: parsed.data.scoreBreakdown,
      offeredBy: admin.id,
    });

    return jsonSuccess({ offer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create offer.";
    const status = message.includes("Insufficient") || message.includes("denied") ? 403 : 400;
    return jsonError(message, status);
  }
}
