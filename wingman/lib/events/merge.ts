import type { AutomatedEventField, CanonicalEvent, NormalizedIncomingEvent } from "@/lib/events/types";
import { AUTOMATED_EVENT_FIELDS } from "@/lib/events/types";

const FIELD_MAP: Record<AutomatedEventField, keyof CanonicalEvent | "venueName"> = {
  name: "name",
  performer: "performer",
  venueName: "venueName",
  startsAt: "startsAt",
  localDate: "localDate",
  localTimeText: "localTimeText",
  officialSourceUrl: "officialSourceUrl",
  neighborhood: "neighborhood",
  area: "area",
  category: "category",
  musicGenre: "musicGenre",
  eventType: "eventType",
  ageRequirement: "ageRequirement",
  priceMinCents: "priceMinCents",
  priceMaxCents: "priceMaxCents",
  priceText: "priceText",
};

export function incomingValue(
  incoming: NormalizedIncomingEvent,
  field: AutomatedEventField,
): unknown {
  switch (field) {
    case "venueName":
      return incoming.venueName;
    case "startsAt":
      return incoming.startsAt;
    default:
      return incoming[field];
  }
}

/** Automated data never overwrites fields an admin has verified/corrected. */
export function applyAutomatedUpdate(
  existing: CanonicalEvent,
  incoming: NormalizedIncomingEvent,
): Partial<CanonicalEvent> {
  const locked = new Set(existing.adminLockedFields);
  const next: Partial<CanonicalEvent> = {};
  for (const field of AUTOMATED_EVENT_FIELDS) {
    if (locked.has(field)) continue;
    const value = incomingValue(incoming, field);
    const target = FIELD_MAP[field];
    (next as Record<string, unknown>)[target] = value;
  }
  if (!locked.has("officialSourceUrl") && incoming.officialSourceUrl) {
    next.officialSourceUrl = incoming.officialSourceUrl;
  }
  if (incoming.cancelled) {
    next.bookingStatus = "CANCELLED";
    next.discoveryStatus = "cancelled";
  }
  if (incoming.imageUsageVerified && incoming.imageUrl) {
    next.imageUrl = incoming.imageUrl;
    next.imageUsageVerified = true;
    next.imageAttribution = incoming.imageAttribution;
  } else if (!existing.imageUsageVerified) {
    next.imageUrl = null;
    next.imageUsageVerified = false;
    next.imageAttribution = existing.imageAttribution ?? null;
  }
  return next;
}

export function lockFieldsFromAdminEdit(previous: string[], edited: string[]): string[] {
  return Array.from(new Set([...previous, ...edited]));
}

export function fieldsChangedByAdmin(
  before: Partial<Record<AutomatedEventField, unknown>>,
  after: Partial<Record<AutomatedEventField, unknown>>,
): AutomatedEventField[] {
  return AUTOMATED_EVENT_FIELDS.filter((field) => {
    if (!(field in after)) return false;
    return JSON.stringify(before[field]) !== JSON.stringify(after[field]);
  });
}
