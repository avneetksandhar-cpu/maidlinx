import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { isOperator } from "@/lib/auth/permissions";
import { isResponse, jsonError, requireOperator } from "@/lib/api/http";
import { withUserContext } from "@/lib/db";
import { INTEREST_DISCLAIMER } from "@/lib/marketplace/interest";
import { recordInterest } from "@/lib/marketplace/service";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireOperator();
  if (isResponse(user)) return user;
  const rows = await withUserContext(user, async (client) => {
    return client.query(
      `SELECT id, email, name, source, event_id, notes, created_at
       FROM interest_signups
       ORDER BY created_at DESC
       LIMIT 200`,
    );
  });
  return NextResponse.json({ signups: rows.rows, count: rows.rows.length });
}

export async function POST(request: Request) {
  const limited = rateLimit({ key: clientKey(request, "interest"), limit: 8, windowMs: 60_000 });
  if (!limited.ok) return jsonError("Too many requests. Try again shortly.", 429);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request.", 400);
  }

  const user = await getCurrentUser();
  try {
    const result = await recordInterest({
      email: String(body.email ?? ""),
      name: body.name ? String(body.name) : undefined,
      source: body.source ? String(body.source) : undefined,
      eventId: body.eventId ? String(body.eventId) : null,
      notes: body.notes ? String(body.notes) : undefined,
      userId: user && !isOperator(user) ? user.id : user?.id ?? null,
    });
    return NextResponse.json({
      ok: true,
      recorded: !result.duplicate,
      alreadyRecorded: result.duplicate,
      charged: false,
      accessPromised: false,
      disclaimer: INTEREST_DISCLAIMER,
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not record interest.", 400);
  }
}
