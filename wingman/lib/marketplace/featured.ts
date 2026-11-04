import { miamiCalendarDate } from "@/lib/events/timezone";
import type { PublicEvent } from "@/lib/marketplace/queries";

function nightlifeRank(event: PublicEvent): number {
  const hay = `${event.category} ${event.eventType} ${event.venueName} ${event.name}`.toLowerCase();
  if (/nightclub|liv|e11even|lounge|rooftop|hip.?hop|dayclub/.test(hay)) return 0;
  if (/club|dj|house|techno/.test(hay)) return 1;
  if (/music|concert/.test(hay)) return 2;
  if (/fair|festival|expo|quest/.test(hay)) return 4;
  return 3;
}

export function pickFeaturedEvents(events: PublicEvent[], now = new Date(), limit = 5) {
  const today = miamiCalendarDate(now);
  const tonight = events.filter((event) => event.localDate === today);
  const pool = tonight.length > 0 ? tonight : [...events];
  const featured = [...pool].sort((a, b) => nightlifeRank(a) - nightlifeRank(b)).slice(0, limit);
  return {
    today,
    tonight,
    featured,
    label: tonight.length > 0 ? "Tonight" : "This week",
  };
}
