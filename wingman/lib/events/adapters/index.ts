import { adminAdapter, csvAdapter } from "@/lib/events/adapters/internal";
import { approvedVenuesAdapter } from "@/lib/events/adapters/approved-venues";
import { partnerFeedAdapter } from "@/lib/events/adapters/partner-feed";
import { predictHqAdapter } from "@/lib/events/adapters/predicthq";
import { ticketmasterAdapter } from "@/lib/events/adapters/ticketmaster";
import type { EventAdapter, SourceSlug } from "@/lib/events/types";

export const EVENT_ADAPTERS: EventAdapter[] = [
  ticketmasterAdapter,
  predictHqAdapter,
  approvedVenuesAdapter,
  adminAdapter,
  csvAdapter,
  partnerFeedAdapter,
];

export function adapterFor(slug: SourceSlug): EventAdapter | undefined {
  return EVENT_ADAPTERS.find((adapter) => adapter.slug === slug);
}

export {
  adminAdapter,
  approvedVenuesAdapter,
  csvAdapter,
  partnerFeedAdapter,
  predictHqAdapter,
  ticketmasterAdapter,
};
