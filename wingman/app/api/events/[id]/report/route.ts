import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { reportEvent } from "@/lib/events/ops";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const limited = rateLimit({ key: clientKey(request, "event-report"), limit: 8, windowMs: 60_000 });
  if (!limited.ok) return jsonError("Too many reports. Try again shortly.", 429);
  const { id } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const message = String(body.message ?? "").trim();
  if (message.length < 8) return jsonError("Describe what is incorrect.", 400);
  try {
    await reportEvent(id, message, body.email ? String(body.email) : undefined);
    return NextResponse.json({
      ok: true,
      note: "Report received. This does not change the listing until an operator reviews it.",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not save the report.", 400);
  }
}
