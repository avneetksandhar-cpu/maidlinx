import { NextResponse } from "next/server";
import { isResponse, jsonError, requireOperator } from "@/lib/api/http";
import { listVenueApplications } from "@/lib/venues/service";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireOperator();
  if (isResponse(user)) return user;
  try {
    const applications = await listVenueApplications();
    return NextResponse.json({ applications });
  } catch {
    return jsonError("Venue applications are unavailable right now.", 503);
  }
}
