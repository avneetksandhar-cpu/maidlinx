import { HIDE_AFTER_END_HOURS, STALE_AFTER_MISSED_SYNCS } from "@/lib/events/types";
import type { CanonicalEvent, SourceRecord } from "@/lib/events/types";

export function markMissedSyncs(
  records: SourceRecord[],
  seenExternalIds: Set<string>,
  now: Date,
): SourceRecord[] {
  return records.map((record) => {
    if (seenExternalIds.has(record.externalId)) {
      return {
        ...record,
        lastSeenAt: now,
        missedSyncCount: 0,
        status: record.status === "cancelled" ? "cancelled" : "active",
      };
    }
    const missed = record.missedSyncCount + 1;
    return {
      ...record,
      missedSyncCount: missed,
      status: missed >= STALE_AFTER_MISSED_SYNCS ? "stale" : record.status,
    };
  });
}

export function eventIsStale(records: SourceRecord[]): boolean {
  if (records.length === 0) return false;
  return records.every(
    (record) => record.status === "stale" || record.missedSyncCount >= STALE_AFTER_MISSED_SYNCS,
  );
}

export function shouldHideFromPublic(event: CanonicalEvent, now = new Date()): boolean {
  if (event.hiddenAt) return true;
  if (event.mergedIntoId) return true;
  if (event.importStatus !== "approved") return true;
  if (event.stale) return true;
  if (event.bookingStatus === "CANCELLED") return true;
  if (event.discoveryStatus === "cancelled" || event.discoveryStatus === "expired") return true;
  if (event.discoveryStatus === "draft") return true;
  const end = event.endsAt ?? event.startsAt;
  return now.getTime() > end.getTime() + HIDE_AFTER_END_HOURS * 60 * 60 * 1000;
}

export function shouldMarkExpired(event: CanonicalEvent, now = new Date()): boolean {
  const end = event.endsAt ?? event.startsAt;
  return now.getTime() > end.getTime() + HIDE_AFTER_END_HOURS * 60 * 60 * 1000;
}
