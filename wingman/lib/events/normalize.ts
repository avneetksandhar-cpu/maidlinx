import { parseClock } from "@/lib/events/timezone";
import type { NormalizedIncomingEvent } from "@/lib/events/types";

const VENUE_ALIASES: Record<string, string> = {
  e11even: "e11evenmiami",
  e11evenmiami: "e11evenmiami",
  elevenmiami: "e11evenmiami",
  liv: "livnightclub",
  livmiami: "livnightclub",
  livnightclub: "livnightclub",
  clubspace: "clubspace",
  space: "clubspace",
  spacemiami: "clubspace",
  factorytown: "factorytown",
  m2: "m2miami",
  m2miami: "m2miami",
};

export function stripPunctuation(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export function normalizeVenueName(raw: string): string {
  const key = stripPunctuation(raw);
  return VENUE_ALIASES[key] ?? key;
}

export function normalizeTitle(raw: string): string {
  return stripPunctuation(
    raw
      .replace(/\b(ft|feat|featuring|w\/|with|presents?|live)\b/gi, " ")
      .replace(/\bat\b.+$/i, " "),
  );
}

export function normalizeLocalStart(localDate: string, localTimeText: string): string {
  const clock = parseClock(localTimeText);
  return `${localDate}T${String(clock.hour).padStart(2, "0")}:${String(clock.minute).padStart(2, "0")}`;
}

/** Cross-source identity: normalized venue + title/performer + local start. */
export function computeMergeKey(input: {
  venueName: string;
  name: string;
  performer?: string | null;
  localDate: string;
  localTimeText: string;
}): string {
  const venue = normalizeVenueName(input.venueName);
  const title = normalizeTitle(input.performer?.trim() || input.name);
  const start = normalizeLocalStart(input.localDate, input.localTimeText);
  return `${venue}|${title}|${start}`;
}

export function mergeKeyForIncoming(event: NormalizedIncomingEvent): string {
  return computeMergeKey(event);
}

export function publicSourceLabel(slug: string | null | undefined): string {
  switch (slug) {
    case "ticketmaster":
      return "Ticketmaster";
    case "predicthq":
      return "PredictHQ";
    case "approved_venues":
      return "Official venue calendar";
    case "admin":
      return "Wingman admin";
    case "csv":
      return "Imported listing";
    case "partner_feed":
      return "Partner feed (disabled)";
    default:
      return "Official calendar";
  }
}
