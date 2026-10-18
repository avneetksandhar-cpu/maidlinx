import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api/http";
import { filterAndSortEvents } from "@/lib/events/filters";
import { toIsoDate } from "@/lib/events/timezone";
import { eventShowsBookWithWingman } from "@/lib/marketplace/offers";
import { mapPublicEvent } from "@/lib/marketplace/queries";
import { listPublicEvents, listPublicWingmen } from "@/lib/marketplace/service";
import type { CanonicalEvent, PublicEventFilters } from "@/lib/events/types";

export const runtime = "nodejs";

function rowToCanonical(row: Record<string, unknown>): CanonicalEvent {
  return {
    id: String(row.id),
    externalId: String(row.external_id),
    name: String(row.name),
    performer: row.performer ? String(row.performer) : null,
    venueName: String(row.venue_name ?? ""),
    venueId: row.venue_id ? String(row.venue_id) : null,
    neighborhood: String(row.neighborhood ?? row.area ?? ""),
    area: String(row.area ?? ""),
    localDate: toIsoDate(row.local_date),
    localTimeText: String(row.local_time_text),
    startsAt: new Date(String(row.starts_at)),
    endsAt: row.ends_at ? new Date(String(row.ends_at)) : null,
    timezone: String(row.timezone ?? "America/New_York"),
    category: String(row.category),
    musicGenre: row.music_genre ? String(row.music_genre) : null,
    eventType: row.event_type ? String(row.event_type) : null,
    ageRequirement: String(row.age_requirement),
    officialSourceUrl: String(row.official_source_url),
    priceMinCents: row.price_min_cents == null ? null : Number(row.price_min_cents),
    priceMaxCents: row.price_max_cents == null ? null : Number(row.price_max_cents),
    priceText: row.price_text ? String(row.price_text) : null,
    imageUrl: Boolean(row.image_usage_verified) && row.image_url ? String(row.image_url) : null,
    imageUsageVerified: Boolean(row.image_usage_verified),
    imageAttribution:
      Boolean(row.image_usage_verified) && row.image_attribution
        ? String(row.image_attribution)
        : null,
    bookingStatus: (row.booking_status as CanonicalEvent["bookingStatus"]) ?? "DISCOVERY_ONLY",
    discoveryStatus: String(row.discovery_status),
    importStatus: (row.import_status as CanonicalEvent["importStatus"]) ?? "approved",
    mergeKey: String(row.merge_key ?? ""),
    lastSyncedAt: row.last_synced_at ? new Date(String(row.last_synced_at)) : null,
    lastSeenAt: row.last_seen_at ? new Date(String(row.last_seen_at)) : null,
    missedSyncCount: Number(row.missed_sync_count ?? 0),
    stale: Boolean(row.stale),
    hiddenAt: row.hidden_at ? new Date(String(row.hidden_at)) : null,
    adminLockedFields: Array.isArray(row.admin_locked_fields) ? (row.admin_locked_fields as string[]) : [],
    mergedIntoId: row.merged_into_id ? String(row.merged_into_id) : null,
    primarySourceSlug: row.source_slug ? (String(row.source_slug) as CanonicalEvent["primarySourceSlug"]) : null,
    sourceVerifiedAt: row.source_verified_at ? new Date(String(row.source_verified_at)) : null,
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters: PublicEventFilters = {
      when: (url.searchParams.get("when") as PublicEventFilters["when"]) || "all",
      neighborhood: url.searchParams.get("neighborhood") || undefined,
      venue: url.searchParams.get("venue") || undefined,
      music: url.searchParams.get("music") || undefined,
      type: url.searchParams.get("type") || undefined,
      price: (url.searchParams.get("price") as PublicEventFilters["price"]) || undefined,
      sort: (url.searchParams.get("sort") as PublicEventFilters["sort"]) || "relevance",
    };
    const rows = await listPublicEvents();
    const visible = filterAndSortEvents(rows.map(rowToCanonical), filters);
    const allowed = new Set(visible.map((item) => item.id));
    const events = rows
      .filter((row) => allowed.has(String(row.id)))
      .map((row) => {
        const bookable = eventShowsBookWithWingman({
          discoveryStatus: String(row.discovery_status),
          hasBookableOffer: Boolean(row.has_bookable_offer),
          bookingStatus: String(row.booking_status ?? "DISCOVERY_ONLY"),
        });
        return mapPublicEvent(row, bookable);
      })
      .sort((a, b) => {
        const order = visible.map((item) => item.id);
        return order.indexOf(a.id) - order.indexOf(b.id);
      });
    const wingmen = await listPublicWingmen();
    return NextResponse.json({
      events,
      bookableCount: events.filter((item) => item.bookable).length,
      verifiedWingmanCount: wingmen.length,
      discoveryOnly: true,
      note: "Discovery listings are official-calendar events. They are not Wingman partnerships.",
    });
  } catch {
    return jsonError("Events are unavailable right now.", 503);
  }
}
