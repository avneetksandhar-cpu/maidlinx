import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { createVenueInquiry } from "@/lib/venues/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await requireSession();
  if (isResponse(user)) return user;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request.", 400);
  }
  try {
    const id = await createVenueInquiry({
      venueId: String(body.venueId ?? ""),
      customerId: user.id,
      kind: String(body.kind ?? "access"),
      message: String(body.message ?? ""),
      partySize: body.partySize ? Number(body.partySize) : undefined,
      dateText: body.dateText ? String(body.dateText) : undefined,
    });
    return NextResponse.json({ ok: true, id, status: "requested" });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Could not send the inquiry.", 400);
  }
}
