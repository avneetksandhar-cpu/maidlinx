import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { listPublicVenues } from "@/lib/venues/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const venues = await listPublicVenues();
    return NextResponse.json({
      venues,
      count: venues.length,
      verifiedCount: venues.filter((item) => item.verified).length,
    });
  } catch {
    return jsonError("Venues are unavailable right now.", 503);
  }
}
