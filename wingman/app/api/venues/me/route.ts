import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { listMyVenueDesk } from "@/lib/venues/service";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireSession();
  if (isResponse(user)) return user;
  try {
    const desk = await listMyVenueDesk(user.id);
    return NextResponse.json(desk);
  } catch {
    return jsonError("Venue desk is unavailable right now.", 503);
  }
}
