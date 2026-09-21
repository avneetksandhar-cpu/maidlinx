import { applyAutomatedUpdate } from "@/lib/events/merge";
import { mergeKeyForIncoming } from "@/lib/events/normalize";
import { eventIsStale, markMissedSyncs, shouldMarkExpired } from "@/lib/events/stale";
import type {
  CanonicalEvent,
  NormalizedIncomingEvent,
  SourceRecord,
  SourceSlug,
  SyncRunSummary,
} from "@/lib/events/types";

export type EngineEvent = CanonicalEvent & { sourceRecords: SourceRecord[] };

export type MemoryStore = {
  events: EngineEvent[];
  nextId: number;
};

export function createMemoryStore(seed: EngineEvent[] = []): MemoryStore {
  return { events: seed.map((event) => ({ ...event, sourceRecords: [...event.sourceRecords] })), nextId: 1 };
}

function newId(store: MemoryStore, prefix: string): string {
  store.nextId += 1;
  return `${prefix}-${store.nextId}`;
}

function incomingToCanonical(
  store: MemoryStore,
  incoming: NormalizedIncomingEvent,
  mergeKey: string,
): EngineEvent {
  const id = newId(store, "evt");
  const externalId = `${incoming.sourceSlug}-${incoming.externalId}`.slice(0, 80);
  return {
    id,
    externalId,
    name: incoming.name,
    performer: incoming.performer,
    venueName: incoming.venueName,
    venueId: null,
    neighborhood: incoming.neighborhood,
    area: incoming.area,
    localDate: incoming.localDate,
    localTimeText: incoming.localTimeText,
    startsAt: incoming.startsAt,
    endsAt: incoming.endsAt,
    timezone: incoming.timezone,
    category: incoming.category,
    musicGenre: incoming.musicGenre,
    eventType: incoming.eventType,
    ageRequirement: incoming.ageRequirement,
    officialSourceUrl: incoming.officialSourceUrl,
    priceMinCents: incoming.priceMinCents,
    priceMaxCents: incoming.priceMaxCents,
    priceText: incoming.priceText,
    imageUrl: incoming.imageUsageVerified ? incoming.imageUrl : null,
    imageUsageVerified: incoming.imageUsageVerified,
    imageAttribution: incoming.imageUsageVerified ? incoming.imageAttribution : null,
    bookingStatus: incoming.cancelled ? "CANCELLED" : "DISCOVERY_ONLY",
    discoveryStatus: incoming.cancelled ? "cancelled" : "discovery_ready",
    importStatus: incoming.sourceSlug === "csv" ? "pending" : "approved",
    mergeKey,
    lastSyncedAt: new Date(),
    lastSeenAt: new Date(),
    missedSyncCount: 0,
    stale: false,
    hiddenAt: null,
    adminLockedFields: [],
    mergedIntoId: null,
    primarySourceSlug: incoming.sourceSlug,
    sourceVerifiedAt: new Date(),
    sourceRecords: [],
  };
}

export function applyIncomingEvent(
  store: MemoryStore,
  incoming: NormalizedIncomingEvent,
  now = new Date(),
): { event: EngineEvent; created: boolean; merged: boolean } {
  const mergeKey = mergeKeyForIncoming(incoming);
  const existingRecord = store.events
    .flatMap((event) => event.sourceRecords.map((record) => ({ event, record })))
    .find(
      (item) =>
        item.record.sourceSlug === incoming.sourceSlug &&
        item.record.externalId === incoming.externalId,
    );

  if (existingRecord) {
    Object.assign(existingRecord.event, applyAutomatedUpdate(existingRecord.event, incoming), {
      lastSyncedAt: now,
      lastSeenAt: now,
      mergeKey,
    });
    existingRecord.record.lastSeenAt = now;
    existingRecord.record.missedSyncCount = 0;
    existingRecord.record.status = incoming.cancelled ? "cancelled" : "active";
    if (incoming.cancelled) {
      existingRecord.event.bookingStatus = "CANCELLED";
      existingRecord.event.discoveryStatus = "cancelled";
    }
    return { event: existingRecord.event, created: false, merged: false };
  }

  const match = store.events.find(
    (event) => !event.mergedIntoId && event.mergeKey === mergeKey,
  );
  const target = match ?? incomingToCanonical(store, incoming, mergeKey);
  if (!match) store.events.push(target);
  else Object.assign(target, applyAutomatedUpdate(target, incoming), { lastSyncedAt: now, lastSeenAt: now });

  target.sourceRecords.push({
    id: newId(store, "rec"),
    sourceSlug: incoming.sourceSlug,
    externalId: incoming.externalId,
    eventId: target.id,
    lastSeenAt: now,
    missedSyncCount: 0,
    status: incoming.cancelled ? "cancelled" : "active",
  });
  if (incoming.cancelled) {
    target.bookingStatus = "CANCELLED";
    target.discoveryStatus = "cancelled";
  }
  return { event: target, created: !match, merged: Boolean(match) };
}

export function finishSourceSync(
  store: MemoryStore,
  sourceSlug: SourceSlug,
  seenExternalIds: Set<string>,
  now = new Date(),
): number {
  let staleCount = 0;
  for (const event of store.events) {
    const fromSource = event.sourceRecords.filter((record) => record.sourceSlug === sourceSlug);
    if (fromSource.length === 0) continue;
    const updated = markMissedSyncs(fromSource, seenExternalIds, now);
    event.sourceRecords = event.sourceRecords.map((record) => {
      const next = updated.find((item) => item.id === record.id);
      return next ?? record;
    });
    event.stale = eventIsStale(event.sourceRecords);
    event.missedSyncCount = Math.max(...event.sourceRecords.map((record) => record.missedSyncCount), 0);
    if (event.stale) staleCount += 1;
    if (shouldMarkExpired(event, now) && event.discoveryStatus !== "cancelled") {
      event.discoveryStatus = "expired";
      event.hiddenAt = event.hiddenAt ?? now;
    }
  }
  return staleCount;
}

export function runEngineSync(
  store: MemoryStore,
  sourceSlug: SourceSlug,
  incoming: NormalizedIncomingEvent[],
  now = new Date(),
): Pick<
  SyncRunSummary,
  | "fetchedCount"
  | "upsertedCount"
  | "createdCount"
  | "updatedCount"
  | "mergedCount"
  | "staleCount"
  | "cancelledCount"
> {
  let upserted = 0;
  let created = 0;
  let updated = 0;
  let merged = 0;
  let cancelled = 0;
  const seen = new Set<string>();
  for (const item of incoming) {
    seen.add(item.externalId);
    const result = applyIncomingEvent(store, item, now);
    upserted += 1;
    if (result.created) created += 1;
    else updated += 1;
    if (result.merged) merged += 1;
    if (item.cancelled) cancelled += 1;
  }
  const staleCount = finishSourceSync(store, sourceSlug, seen, now);
  return {
    fetchedCount: incoming.length,
    upsertedCount: upserted,
    createdCount: created,
    updatedCount: updated,
    mergedCount: merged,
    staleCount,
    cancelledCount: cancelled,
  };
}

export function mergeEvents(store: MemoryStore, keepId: string, dropId: string): boolean {
  const keep = store.events.find((event) => event.id === keepId);
  const drop = store.events.find((event) => event.id === dropId);
  if (!keep || !drop || keep.id === drop.id) return false;
  drop.mergedIntoId = keep.id;
  drop.hiddenAt = new Date();
  for (const record of drop.sourceRecords) {
    record.eventId = keep.id;
    keep.sourceRecords.push(record);
  }
  drop.sourceRecords = [];
  return true;
}

export function unmergeEvent(store: MemoryStore, eventId: string, sourceSlug: SourceSlug, externalId: string): boolean {
  const event = store.events.find((item) => item.id === eventId);
  if (!event) return false;
  const index = event.sourceRecords.findIndex(
    (record) => record.sourceSlug === sourceSlug && record.externalId === externalId,
  );
  if (index === -1) return false;
  const [record] = event.sourceRecords.splice(index, 1);
  const clone = incomingToCanonical(
    store,
    {
      sourceSlug,
      externalId,
      name: event.name,
      performer: event.performer,
      venueName: event.venueName,
      neighborhood: event.neighborhood,
      area: event.area,
      localDate: event.localDate,
      localTimeText: event.localTimeText,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      timezone: "America/New_York",
      category: event.category,
      musicGenre: event.musicGenre,
      eventType: event.eventType,
      ageRequirement: event.ageRequirement,
      officialSourceUrl: event.officialSourceUrl,
      priceMinCents: event.priceMinCents,
      priceMaxCents: event.priceMaxCents,
      priceText: event.priceText,
      imageUrl: null,
      imageUsageVerified: false,
      imageAttribution: null,
      cancelled: false,
      raw: {},
    },
    `${event.mergeKey}-unmerged-${externalId}`,
  );
  clone.sourceRecords = [{ ...record, eventId: clone.id }];
  store.events.push(clone);
  return true;
}
