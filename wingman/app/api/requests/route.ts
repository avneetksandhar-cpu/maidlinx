import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { SPEND_BANDS, type SpendBand } from "@/lib/marketplace/constants";
import {
  SERVICE_DISCLAIMER,
  containsForbiddenServiceRequest,
  normalizeRequestedServices,
} from "@/lib/marketplace/services";
import { createRequest } from "@/lib/marketplace/service";
import { includeTestFixturesInHistory } from "@/lib/account/history";
import { withUserContext } from "@/lib/db";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireSession();
  if (isResponse(user)) return user;
  const showFixtures = includeTestFixturesInHistory(user.email);
  try {
    const rows = await withUserContext(user, async (client) => {
      return client.query(
        `SELECT r.*, e.name AS event_name, e.external_id,
                COALESCE(r.is_test_fixture, false) AS is_test_fixture
         FROM booking_requests r
         LEFT JOIN events e ON e.id = r.event_id
         WHERE (
           r.customer_id = $1
           OR $2 IN ('admin', 'owner')
           OR EXISTS (SELECT 1 FROM wingmen w WHERE w.id = r.assigned_wingman_id AND w.user_id = $1)
         )
           AND (COALESCE(r.is_test_fixture, false) = false OR $3)
         ORDER BY r.created_at DESC`,
        [user.id, user.role, showFixtures],
      );
    });
    return NextResponse.json({ requests: rows.rows });
  } catch {
    return jsonError("Bookings are unavailable right now.", 503);
  }
}

export async function POST(request: Request) {
  const limited = rateLimit({ key: clientKey(request, "requests"), limit: 20, windowMs: 60_000 });
  if (!limited.ok) {
    return jsonError("Too many requests. Try again shortly.", 429);
  }
  const user = await requireSession();
  if (isResponse(user)) return user;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const spendBand = String(body.spendBand ?? "");
  if (!SPEND_BANDS.includes(spendBand as SpendBand)) {
    return jsonError("Choose a spending band: $500–$1.5K, $1.5K–$5K, or $5K+.", 400);
  }
  const groupSize = Number(body.groupSize);
  if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 20) {
    return jsonError("Group size must be between 1 and 20.", 400);
  }
  const occasion = String(body.occasion ?? "").trim();
  const atmosphere = String(body.atmosphere ?? "").trim();
  const area = String(body.area ?? "").trim();
  const startsAt = String(body.startsAt ?? "").trim();
  if (!occasion || !atmosphere || !area || !startsAt) {
    return jsonError("Occasion, atmosphere, area, and date/time are required.", 400);
  }
  if (containsForbiddenServiceRequest(`${occasion} ${atmosphere} ${String(body.specialRequests ?? "")}`)) {
    return jsonError(SERVICE_DISCLAIMER, 400);
  }

  try {
    const id = await createRequest(user, {
      source: (body.source as "event" | "wingman" | "plan_my_night") ?? "plan_my_night",
      eventId: body.eventId ? String(body.eventId) : null,
      requestedWingmanId: body.requestedWingmanId ? String(body.requestedWingmanId) : null,
      occasion,
      atmosphere,
      area,
      startsAt,
      groupSize,
      spendBand: spendBand as SpendBand,
      specialRequests: body.specialRequests ? String(body.specialRequests) : undefined,
      requestedServices: normalizeRequestedServices(body.requestedServices),
      nightGoal: body.nightGoal ? String(body.nightGoal) : undefined,
      nightPlan:
        body.nightPlan && typeof body.nightPlan === "object"
          ? (body.nightPlan as Record<string, unknown>)
          : null,
    });
    return NextResponse.json({ ok: true, id, status: "submitted" });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not submit request.", 400);
  }
}
