import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { reportIncident } from "@/lib/marketplace/test-booking";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireSession();
  if (isResponse(user)) return user;
  let body: { requestId?: string; category?: string; details?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return jsonError("Invalid request.", 400);
  }
  try {
    const result = await reportIncident(user, {
      requestId: body.requestId,
      category: String(body.category ?? ""),
      details: String(body.details ?? ""),
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not file incident.", 400);
  }
}
