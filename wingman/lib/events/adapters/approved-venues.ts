import { APPROVED_VENUE_NAMES, type AdapterContext, type AdapterFetchResult, type EventAdapter } from "@/lib/events/types";

/**
 * Approved venue calendars already live as admin/CSV/seed listings
 * (E11EVEN, LIV, Club Space, Factory Town, M2). This adapter does not
 * scrape those sites. Daily sync re-emits existing approved listings
 * so they are marked seen and do not go stale from remote-only runs.
 */
export const approvedVenuesAdapter: EventAdapter = {
  slug: "approved_venues",
  name: "Approved Miami venues",
  enabled: true,
  async fetch(ctx: AdapterContext): Promise<AdapterFetchResult> {
    const existing = ctx.existingForSource ?? [];
    return {
      status: "ok",
      events: existing.filter((event) =>
        APPROVED_VENUE_NAMES.some(
          (name) => name.toLowerCase() === event.venueName.toLowerCase() || event.venueName.toLowerCase().includes(name.toLowerCase().split(" ")[0]),
        ),
      ),
    };
  },
};

export const APPROVED_VENUE_OFFICIAL_URLS: Record<string, string> = {
  "E11EVEN Miami": "https://www.11miami.com/events",
  "LIV Nightclub": "https://www.livnightclub.com/miami/events/",
  "Club Space": "https://www.clubspace.com",
  "Factory Town": "https://factorytown.com",
  "M2 Miami": "https://www.m2-miami.com",
};
