import { addCalendarDays, miamiCalendarDate, weekendRange } from "@/lib/events/timezone";
import { shouldHideFromPublic } from "@/lib/events/stale";
import type { CanonicalEvent, PublicEventFilters } from "@/lib/events/types";

export function priceBucket(minCents: number | null, maxCents: number | null): PublicEventFilters["price"] {
  const value = minCents ?? maxCents;
  if (value == null) return "unknown";
  if (value === 0) return "free";
  if (value < 5000) return "low";
  if (value < 15000) return "mid";
  return "high";
}

export function isHappeningNow(event: Pick<CanonicalEvent, "startsAt" | "endsAt">, now: Date): boolean {
  if (event.startsAt.getTime() > now.getTime()) return false;
  if (event.endsAt) return event.endsAt.getTime() > now.getTime();
  const impliedEnd = new Date(event.startsAt.getTime() + 6 * 60 * 60 * 1000);
  return impliedEnd.getTime() > now.getTime();
}

export function isHappeningToday(event: Pick<CanonicalEvent, "localDate">, now: Date): boolean {
  return event.localDate === miamiCalendarDate(now);
}

export function matchesWhen(event: CanonicalEvent, when: PublicEventFilters["when"], now: Date): boolean {
  if (!when || when === "all") return true;
  const today = miamiCalendarDate(now);
  if (when === "now") return isHappeningNow(event, now);
  if (when === "today" || when === "tonight") return event.localDate === today;
  if (when === "tomorrow") return event.localDate === addCalendarDays(today, 1);
  const weekend = weekendRange(now);
  return event.localDate >= weekend.start && event.localDate <= weekend.end;
}

export function filterAndSortEvents(
  events: CanonicalEvent[],
  filters: PublicEventFilters,
  now = new Date(),
): CanonicalEvent[] {
  const filtered = events.filter((event) => {
    if (shouldHideFromPublic(event, now)) return false;
    if (!matchesWhen(event, filters.when, now)) return false;
    if (filters.neighborhood && event.neighborhood !== filters.neighborhood && event.area !== filters.neighborhood) {
      return false;
    }
    if (filters.venue && event.venueName !== filters.venue) return false;
    if (filters.music && (event.musicGenre ?? event.category) !== filters.music) return false;
    if (filters.type && (event.eventType ?? event.category) !== filters.type) return false;
    if (filters.price && priceBucket(event.priceMinCents, event.priceMaxCents) !== filters.price) {
      return false;
    }
    return true;
  });

  const sort = filters.sort ?? "relevance";
  return filtered.sort((a, b) => {
    if (sort === "relevance") {
      const aBook = a.bookingStatus === "VERIFIED_AVAILABLE" ? 0 : 1;
      const bBook = b.bookingStatus === "VERIFIED_AVAILABLE" ? 0 : 1;
      if (aBook !== bBook) return aBook - bBook;
    }
    const start = a.startsAt.getTime() - b.startsAt.getTime();
    if (start !== 0) return start;
    return a.name.localeCompare(b.name);
  });
}

export function uniqueValues(events: CanonicalEvent[], key: keyof CanonicalEvent): string[] {
  return Array.from(
    new Set(
      events
        .map((event) => {
          const value = event[key];
          return typeof value === "string" ? value : "";
        })
        .filter(Boolean),
    ),
  ).sort();
}
