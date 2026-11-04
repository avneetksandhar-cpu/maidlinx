import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { SPEND_BANDS, type SpendBand } from "@/lib/marketplace/constants";
import { createNightServiceBooking, NIGHT_SERVICE_TOTAL_CENTS } from "@/lib/marketplace/night-service";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit({ key: clientKey(request, "night-book"), limit: 10, windowMs: 60_000 });
  if (!limited.ok) {
    return jsonError("Too many booking attempts. Try again shortly.", 429);
  }
  const user = await requireSession();
  if (isResponse(user)) return user;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request.", 400);
  }

  try {
    const booking = await createNightServiceBooking(user, {
      scopeConductAck: Boolean(body.scopeConductAck),
      eventId: body.eventId ? String(body.eventId) : null,
      eventExternalId: body.eventExternalId ? String(body.eventExternalId) : null,
      occasion: body.occasion ? String(body.occasion) : undefined,
      atmosphere: body.atmosphere ? String(body.atmosphere) : undefined,
      area: body.area ? String(body.area) : undefined,
      startsAt: body.startsAt ? String(body.startsAt) : undefined,
      groupSize: body.groupSize ? Number(body.groupSize) : undefined,
      specialRequests: body.specialRequests ? String(body.specialRequests) : undefined,
      repeatRequestId: body.repeatRequestId ? String(body.repeatRequestId) : null,
      spendBand:
        typeof body.spendBand === "string" && SPEND_BANDS.includes(body.spendBand as SpendBand)
          ? (body.spendBand as SpendBand)
          : undefined,
    });
    return NextResponse.json({
      ok: true,
      ...booking,
      amountUsd: NIGHT_SERVICE_TOTAL_CENTS / 100,
      stripeMode: "test",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not start the $500 booking.", 400);
  }
}
