import {
  BACKUP_ESTIMATE_NOTE,
  BACKUP_LISTING_LABEL,
} from "@/lib/marketplace/host-copy";
import { eventShowsBookWithWingman } from "@/lib/marketplace/offers";
import { mapPublicEvent, type PublicEvent } from "@/lib/marketplace/queries";
import { listPublicEvents } from "@/lib/marketplace/service";

export type BackupListing = {
  eventId: string;
  externalId: string;
  name: string;
  venueName: string;
  neighborhood: string;
  localDate: string;
  localTimeText: string;
  estimatedSpending: string;
  estimateNote: string;
  officialSourceUrl: string;
  label: typeof BACKUP_LISTING_LABEL;
  partnershipClaimed: false;
};

export type BackupExclude = {
  id?: string | null;
  externalId?: string | null;
  venueName?: string | null;
};

function isExcluded(event: PublicEvent, exclude?: BackupExclude): boolean {
  if (!exclude) return false;
  if (exclude.id && event.id === exclude.id) return true;
  if (exclude.externalId && event.externalId === exclude.externalId) return true;
  return false;
}

function spendLabel(event: PublicEvent): string {
  return event.estimatedSpendText || event.priceText || "Estimate — venue sets prices";
}

export function toBackupListing(event: PublicEvent): BackupListing {
  return {
    eventId: event.id,
    externalId: event.externalId,
    name: event.name,
    venueName: event.venueName,
    neighborhood: event.neighborhood || event.area,
    localDate: event.localDate,
    localTimeText: event.localTimeText,
    estimatedSpending: spendLabel(event),
    estimateNote: BACKUP_ESTIMATE_NOTE,
    officialSourceUrl: event.officialSourceUrl,
    label: BACKUP_LISTING_LABEL,
    partnershipClaimed: false,
  };
}

export function chooseBackupEvent(
  events: PublicEvent[],
  exclude?: BackupExclude,
): BackupListing | null {
  const remaining = events.filter((event) => !isExcluded(event, exclude));
  if (remaining.length === 0) return null;

  const otherVenue = remaining.filter((event) => {
    if (!exclude?.venueName) return true;
    return event.venueName.toLowerCase() !== exclude.venueName.toLowerCase();
  });
  const pool = otherVenue.length > 0 ? otherVenue : remaining;
  const sorted = [...pool].sort((a, b) => {
    const date = a.localDate.localeCompare(b.localDate);
    if (date !== 0) return date;
    return a.name.localeCompare(b.name);
  });
  const picked = sorted[0];
  return picked ? toBackupListing(picked) : null;
}

export async function pickBackupListing(exclude?: BackupExclude): Promise<BackupListing | null> {
  const rows = await listPublicEvents();
  const events = rows.map((row) =>
    mapPublicEvent(
      row,
      eventShowsBookWithWingman({
        discoveryStatus: String(row.discovery_status),
        hasBookableOffer: Boolean(row.has_bookable_offer),
        bookingStatus: String(row.booking_status ?? "DISCOVERY_ONLY"),
      }),
    ),
  );
  const primary = events.find(
    (event) =>
      (exclude?.id && event.id === exclude.id) ||
      (exclude?.externalId && event.externalId === exclude.externalId),
  );
  return chooseBackupEvent(events, {
    ...exclude,
    venueName: exclude?.venueName ?? primary?.venueName ?? null,
  });
}
