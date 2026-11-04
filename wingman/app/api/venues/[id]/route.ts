import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { eventShowsBookWithWingman } from "@/lib/marketplace/offers";
import { mapPublicEvent } from "@/lib/marketplace/queries";
import { listPublicEvents } from "@/lib/marketplace/service";
import { getPublicVenue } from "@/lib/venues/service";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const venue = await getPublicVenue(id);
    if (!venue) return jsonError("Venue not found.", 404);
    const rows = await listPublicEvents();
    const events = rows
      .filter((row) => String(row.venue_id) === venue.id || String(row.venue_name) === venue.name)
      .map((row) =>
        mapPublicEvent(
          row,
          eventShowsBookWithWingman({
            discoveryStatus: String(row.discovery_status),
            hasBookableOffer: Boolean(row.has_bookable_offer),
            bookingStatus: String(row.booking_status ?? "DISCOVERY_ONLY"),
          }),
        ),
      );
    return NextResponse.json({ venue, events });
  } catch {
    return jsonError("Venue is unavailable right now.", 503);
  }
}
