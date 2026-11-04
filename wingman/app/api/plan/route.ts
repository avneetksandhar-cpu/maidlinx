import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { eventShowsBookWithWingman } from "@/lib/marketplace/offers";
import { mapPublicEvent } from "@/lib/marketplace/queries";
import { listPublicEvents } from "@/lib/marketplace/service";
import { buildNightPlan, validatePlanAnswers } from "@/lib/plan/itinerary";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit({ key: clientKey(request, "plan"), limit: 30, windowMs: 60_000 });
  if (!limited.ok) return jsonError("Too many plan requests. Try again shortly.", 429);
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request.", 400);
  }
  try {
    const answers = validatePlanAnswers({
      date: body.date ? String(body.date) : undefined,
      spendBand: body.spendBand ? String(body.spendBand) : undefined,
      music: body.music ? String(body.music) : undefined,
      groupSize: Number(body.groupSize),
      goal: body.goal ? String(body.goal) : undefined,
      kind: body.kind ? String(body.kind) : undefined,
    });
    const rows = await listPublicEvents();
    const events = rows.map((row) =>
      mapPublicEvent(
        row,
        eventShowsBookWithWingman({
          discoveryStatus: String(row.discovery_status),
          hasBookableOffer: Boolean(row.has_bookable_offer),
          bookingStatus: String(row.booking_status ?? "DISCOVERY_ONLY"),
        }),
      ),
    );
    const plan = buildNightPlan(answers, events);
    return NextResponse.json({
      ok: true,
      plan,
      note: "Three options from real discovery listings when they exist. No invented partnerships. Matching Wingmen: 0.",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not build a plan.", 400);
  }
}
