import type { AdapterContext, AdapterFetchResult, EventAdapter } from "@/lib/events/types";

/**
 * Disabled stub for a future Tabler partner feed.
 * No scrape. Do not enable until an approved API exists.
 */
export const partnerFeedAdapter: EventAdapter = {
  slug: "partner_feed",
  name: "Partner feed (Tabler — disabled)",
  enabled: false,
  async fetch(_ctx: AdapterContext): Promise<AdapterFetchResult> {
    return {
      status: "skipped",
      reason:
        "Partner feed is disabled. Future Tabler access requires an approved API. No scrape is implemented.",
    };
  },
};
