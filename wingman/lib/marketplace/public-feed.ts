import { eventShowsBookWithWingman } from "@/lib/marketplace/offers";
import { mapPublicEvent, type PublicEvent } from "@/lib/marketplace/queries";
import { listPublicEvents } from "@/lib/marketplace/service";

export function mapEventRow(row: Record<string, unknown>): PublicEvent {
  return mapPublicEvent(
    row,
    eventShowsBookWithWingman({
      discoveryStatus: String(row.discovery_status),
      hasBookableOffer: Boolean(row.has_bookable_offer),
      bookingStatus: String(row.booking_status ?? "DISCOVERY_ONLY"),
    }),
  );
}

export async function loadMappedPublicEvents(): Promise<PublicEvent[]> {
  const rows = await listPublicEvents();
  return rows.map(mapEventRow);
}
