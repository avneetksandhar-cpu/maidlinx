import { jsonError, jsonSuccess } from "@/lib/api/response";
import { checkRateLimit, clientIpFromRequest } from "@/lib/api/rate-limit";
import { acceptOffer } from "@/lib/matching/assignment";
import { requireProfessionalSession } from "@/lib/pro/dashboard/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const ip = clientIpFromRequest(request);
  const limit = checkRateLimit(`offer:accept:${ip}`, 40, 60_000);
  if (!limit.allowed) {
    return jsonError("Too many accept attempts.", 429, "RATE_LIMITED");
  }

  try {
    const { profile } = await requireProfessionalSession();
    const { id } = await context.params;
    await acceptOffer({
      offerId: id,
      cleanerUserId: profile.id,
    });
    return jsonSuccess({ accepted: true, offerId: id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to accept offer.";
    const status =
      message.includes("access") || message.includes("not found")
        ? 403
        : message.includes("another cleaner") || message.includes("expired")
          ? 409
          : 400;
    return jsonError(message, status);
  }
}
