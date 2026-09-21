export const MIAMI_TIMEZONE = "America/New_York" as const;
export const STALE_AFTER_MISSED_SYNCS = 2;
export const HIDE_AFTER_END_HOURS = 6;
export const SYNC_LOOKAHEAD_DAYS = 30;

export const BOOKING_STATUSES = ["DISCOVERY_ONLY", "VERIFIED_AVAILABLE", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const IMPORT_STATUSES = ["pending", "approved", "rejected"] as const;
export type ImportStatus = (typeof IMPORT_STATUSES)[number];

export const SOURCE_SLUGS = [
  "ticketmaster",
  "predicthq",
  "approved_venues",
  "admin",
  "csv",
  "partner_feed",
] as const;
export type SourceSlug = (typeof SOURCE_SLUGS)[number];

export const APPROVED_VENUE_NAMES = [
  "E11EVEN Miami",
  "LIV Nightclub",
  "Club Space",
  "Factory Town",
  "M2 Miami",
] as const;

export const AUTOMATED_EVENT_FIELDS = [
  "name",
  "performer",
  "venueName",
  "startsAt",
  "localDate",
  "localTimeText",
  "officialSourceUrl",
  "neighborhood",
  "area",
  "category",
  "musicGenre",
  "eventType",
  "ageRequirement",
  "priceMinCents",
  "priceMaxCents",
  "priceText",
] as const;
export type AutomatedEventField = (typeof AUTOMATED_EVENT_FIELDS)[number];

export type NormalizedIncomingEvent = {
  sourceSlug: SourceSlug;
  externalId: string;
  name: string;
  performer: string | null;
  venueName: string;
  neighborhood: string;
  area: string;
  localDate: string;
  localTimeText: string;
  startsAt: Date;
  endsAt: Date | null;
  timezone: typeof MIAMI_TIMEZONE;
  category: string;
  musicGenre: string | null;
  eventType: string | null;
  ageRequirement: string;
  officialSourceUrl: string;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  priceText: string | null;
  imageUrl: string | null;
  imageUsageVerified: boolean;
  imageAttribution: string | null;
  cancelled: boolean;
  raw: Record<string, unknown>;
};

export type CanonicalEvent = {
  id: string;
  externalId: string;
  name: string;
  performer: string | null;
  venueName: string;
  venueId: string | null;
  neighborhood: string;
  area: string;
  localDate: string;
  localTimeText: string;
  startsAt: Date;
  endsAt: Date | null;
  timezone: string;
  category: string;
  musicGenre: string | null;
  eventType: string | null;
  ageRequirement: string;
  officialSourceUrl: string;
  priceMinCents: number | null;
  priceMaxCents: number | null;
  priceText: string | null;
  imageUrl: string | null;
  imageUsageVerified: boolean;
  imageAttribution: string | null;
  bookingStatus: BookingStatus;
  discoveryStatus: string;
  importStatus: ImportStatus;
  mergeKey: string;
  lastSyncedAt: Date | null;
  lastSeenAt: Date | null;
  missedSyncCount: number;
  stale: boolean;
  hiddenAt: Date | null;
  adminLockedFields: string[];
  mergedIntoId: string | null;
  primarySourceSlug: SourceSlug | null;
  sourceVerifiedAt: Date | null;
};

export type SourceRecord = {
  id: string;
  sourceSlug: SourceSlug;
  externalId: string;
  eventId: string;
  lastSeenAt: Date;
  missedSyncCount: number;
  status: "active" | "cancelled" | "stale";
};

export type AdapterContext = {
  now: Date;
  ticketmasterApiKey: string | null;
  predictHqToken: string | null;
  fetchImpl?: typeof fetch;
  existingForSource?: NormalizedIncomingEvent[];
};

export type AdapterFetchResult =
  | {
      status: "ok";
      events: NormalizedIncomingEvent[];
      rejectedCount?: number;
      failedImageCount?: number;
    }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string; retryable: boolean };

export type EventAdapter = {
  slug: SourceSlug;
  name: string;
  enabled: boolean;
  fetch(ctx: AdapterContext): Promise<AdapterFetchResult>;
};

export type SyncRunSummary = {
  sourceSlug: SourceSlug;
  status: "success" | "failed" | "skipped";
  fetchedCount: number;
  upsertedCount: number;
  createdCount: number;
  updatedCount: number;
  rejectedCount: number;
  failedImageCount: number;
  mergedCount: number;
  staleCount: number;
  cancelledCount: number;
  errorMessage: string | null;
  logs: Array<Record<string, unknown>>;
  skippedReason?: string;
};

export type PublicEventFilters = {
  when?: "tonight" | "tomorrow" | "weekend" | "all" | "now" | "today";
  neighborhood?: string;
  venue?: string;
  music?: string;
  type?: string;
  price?: "free" | "low" | "mid" | "high" | "unknown";
  sort?: "relevance" | "start";
};
