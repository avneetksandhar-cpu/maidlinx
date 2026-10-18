import { publicSourceLabel } from "@/lib/events/normalize";
import { toIsoDate } from "@/lib/events/timezone";

export type PublicEvent = {
  id: string;
  externalId: string;
  name: string;
  venueName: string;
  area: string;
  neighborhood: string;
  category: string;
  musicGenre: string | null;
  eventType: string | null;
  atmosphere: string | null;
  dressCode: string | null;
  estimatedSpendText: string | null;
  priceText: string | null;
  ageRequirement: string;
  localDate: string;
  localTimeText: string;
  timezone: string;
  officialSourceUrl: string;
  sourceLabel: string;
  lastVerified: string | null;
  lastUpdated: string | null;
  discoveryStatus: string;
  bookingStatus: string;
  availableServices: string[];
  bookable: boolean;
  bookingStatusNote: string;
  imageUsageVerified: boolean;
  imageUrl: string | null;
  imageAttribution: string | null;
};

export type PublicOffer = {
  id: string;
  serviceType: string;
  tablePackageName: string | null;
  maxGroupSize: number | null;
  minimumSpendCents: number | null;
  serviceFeeCents: number;
  taxesAndFeesCents: number;
  arrivalWindow: string | null;
  dressRequirement: string | null;
  ageRequirement: string | null;
  cancellationTerms: string;
  terms: string;
  expiresAt: string;
  wingman: {
    id: string;
    displayName: string;
    photoUrl: string | null;
    areas: string[];
    specialties: string[];
  };
};

export function mapPublicEvent(row: Record<string, unknown>, bookable: boolean): PublicEvent {
  return {
    id: String(row.id),
    externalId: String(row.external_id),
    name: String(row.name),
    venueName: String(row.venue_name ?? row.venueName ?? ""),
    area: String(row.area),
    neighborhood: String(row.neighborhood ?? row.area ?? ""),
    category: String(row.category),
    musicGenre: row.music_genre ? String(row.music_genre) : null,
    eventType: row.event_type ? String(row.event_type) : null,
    atmosphere: row.atmosphere ? String(row.atmosphere) : null,
    dressCode: row.dress_code ? String(row.dress_code) : null,
    estimatedSpendText: row.estimated_spend_text ? String(row.estimated_spend_text) : row.price_text ? String(row.price_text) : null,
    priceText: row.price_text ? String(row.price_text) : null,
    ageRequirement: String(row.age_requirement),
    localDate: toIsoDate(row.local_date),
    localTimeText: String(row.local_time_text),
    timezone: String(row.timezone ?? "America/New_York"),
    officialSourceUrl: String(row.official_source_url),
    sourceLabel: publicSourceLabel(row.source_slug ? String(row.source_slug) : null),
    lastVerified: row.source_verified_at ? String(row.source_verified_at) : null,
    lastUpdated: row.last_synced_at ? String(row.last_synced_at) : row.updated_at ? String(row.updated_at) : null,
    discoveryStatus: String(row.discovery_status),
    bookingStatus: String(row.booking_status ?? "DISCOVERY_ONLY"),
    availableServices: Array.isArray(row.available_services) ? (row.available_services as string[]) : [],
    bookable,
    bookingStatusNote: String(row.booking_status_note ?? ""),
    imageUsageVerified: Boolean(row.image_usage_verified),
    imageUrl:
      Boolean(row.image_usage_verified) && row.image_url ? String(row.image_url) : null,
    imageAttribution:
      Boolean(row.image_usage_verified) && row.image_attribution
        ? String(row.image_attribution)
        : null,
  };
}
