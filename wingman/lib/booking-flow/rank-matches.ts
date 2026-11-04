import { atmosphereForEvent } from "@/lib/photos/atmosphere";
import type { PublicEvent } from "@/lib/marketplace/queries";
import type { BudgetId, ExperienceType, VenueMatch, Vibe } from "@/lib/booking-flow/types";

const EXPERIENCE_KEYS: Record<ExperienceType, RegExp> = {
  nightclub: /nightclub|club|liv|e11even|story|lIV|rooftop/i,
  lounge: /lounge|bar|speakeasy|cocktail/i,
  dinner_nightlife: /dinner|dining|restaurant|steak|table|food/i,
  pool_day: /pool|day.?party|dayclub|brunch|cabana/i,
  vip_table: /vip|table|bottle/i,
  wingman: /./,
};

const VIBE_KEYS: Record<Vibe, RegExp> = {
  hiphop: /hip.?hop|r&b|rnb|rap|urban/i,
  latin: /latin|reggaeton|salsa|bachata|spanish/i,
  afrobeats: /afro|amapiano|afrobeats/i,
  edm: /edm|house|techno|electronic|dance|dj/i,
  upscale: /upscale|luxury|vip|exclusive|fine/i,
  best_tonight: /./,
};

function hay(event: PublicEvent) {
  return [
    event.name,
    event.venueName,
    event.area,
    event.neighborhood,
    event.category,
    event.musicGenre,
    event.eventType,
    event.atmosphere,
  ]
    .filter(Boolean)
    .join(" ");
}

function parseSpendFloor(text: string | null): number | null {
  if (!text) return null;
  const match = text.replace(/,/g, "").match(/\$?\s*(\d+(?:\.\d+)?)\s*(k|K)?/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;
  return match[2] ? value * 1000 : value;
}

function budgetRange(budget: BudgetId | null): { min: number; max: number } {
  if (budget === "1000_2500") return { min: 1000, max: 2500 };
  if (budget === "2500_5000") return { min: 2500, max: 5000 };
  if (budget === "5000_plus") return { min: 5000, max: 1_000_000 };
  return { min: 500, max: 1000 };
}

function accessType(event: PublicEvent): string {
  if (event.bookable) {
    const service = event.availableServices[0];
    if (service === "vip_table") return "VIP Table";
    if (service === "guest_list") return "Guest list";
    if (service === "ticket") return "Ticket";
    if (service) return service.replace(/_/g, " ");
    return "Verified inventory";
  }
  return "Discovery";
}

function partyFit(partySize: number, bookable: boolean): string {
  if (bookable) return `Party of ${partySize}`;
  return `Party of ${partySize} · night service`;
}

export function nightServiceMatch(input: {
  area: string;
  localDate: string;
  partySize: number;
}): VenueMatch {
  const photo = atmosphereForEvent({ id: "night-service", name: "Wingman night", category: "Nightlife" });
  return {
    id: "night-service",
    eventId: null,
    externalId: null,
    name: "Wingman night",
    venueName: input.area || "Miami",
    area: input.area || "Miami",
    localDate: input.localDate,
    localTimeText: "11:00 PM",
    partyFit: `Party of ${input.partySize}`,
    accessType: "Wingman night service",
    estimatedSpend: "Wingman from $500",
    imageUrl: photo.src,
    imageAlt: photo.alt,
    bookable: true,
    discoveryOnly: false,
    rankScore: 1,
    kind: "night_service",
  };
}

export function scoreEvent(
  event: PublicEvent,
  input: {
    date: string;
    destination: string;
    experienceType: ExperienceType | null;
    vibe: Vibe | null;
    partySize: number;
    budget: BudgetId | null;
  },
): number {
  const text = hay(event);
  let score = 0;

  if (event.localDate === input.date) score += 100;
  else {
    const eventDay = Date.parse(`${event.localDate}T00:00:00`);
    const wantDay = Date.parse(`${input.date}T00:00:00`);
    const days = Math.abs(eventDay - wantDay) / 86_400_000;
    if (days <= 1) score += 40;
    else if (days <= 3) score += 15;
  }

  const dest = input.destination.toLowerCase();
  if (dest) {
    if (event.neighborhood.toLowerCase().includes(dest) || dest.includes(event.neighborhood.toLowerCase())) score += 80;
    else if (event.area.toLowerCase().includes(dest) || dest.includes(event.area.toLowerCase())) score += 70;
    else if (text.toLowerCase().includes(dest)) score += 35;
  }

  if (input.experienceType && input.experienceType !== "wingman") {
    if (EXPERIENCE_KEYS[input.experienceType].test(text)) score += 50;
  } else if (input.experienceType === "wingman") {
    score += 20;
  }

  if (input.vibe && input.vibe !== "best_tonight") {
    if (VIBE_KEYS[input.vibe].test(text)) score += 40;
  } else if (input.vibe === "best_tonight") {
    score += 10;
  }

  if (input.partySize >= 1 && input.partySize <= 20) score += 15;
  if (event.bookable) score += 60;

  const spend = parseSpendFloor(event.estimatedSpendText ?? event.priceText);
  if (spend != null && input.budget) {
    const range = budgetRange(input.budget);
    if (spend >= range.min && spend <= range.max) score += 30;
    else if (spend <= range.max * 1.25) score += 10;
  }

  return score;
}

export function rankMatches(
  events: PublicEvent[],
  input: {
    date: string;
    destination: string;
    experienceType: ExperienceType | null;
    vibe: Vibe | null;
    partySize: number;
    budget: BudgetId | null;
  },
): VenueMatch[] {
  const scored = events
    .map((event) => ({ event, score: scoreEvent(event, input) }))
    .sort((a, b) => b.score - a.score || a.event.localDate.localeCompare(b.event.localDate));

  const sameDay = scored.filter((row) => row.event.localDate === input.date);
  const pool = sameDay.length > 0 ? sameDay : scored;
  return pool.slice(0, 3).map(({ event, score }) => {
    const photo =
      event.imageUrl && event.imageUsageVerified
        ? { src: event.imageUrl, alt: event.name }
        : atmosphereForEvent({
            id: event.id,
            category: event.category,
            musicGenre: event.musicGenre,
            eventType: event.eventType,
            name: event.name,
          });
    return {
      id: event.id,
      eventId: event.id,
      externalId: event.externalId,
      name: event.name,
      venueName: event.venueName || event.name,
      area: event.neighborhood || event.area || "Miami",
      localDate: event.localDate,
      localTimeText: event.localTimeText || "Time TBA",
      partyFit: partyFit(input.partySize, event.bookable),
      accessType: accessType(event),
      estimatedSpend: event.estimatedSpendText || event.priceText || "Estimate from the venue",
      imageUrl: photo.src,
      imageAlt: "alt" in photo ? photo.alt : event.name,
      bookable: event.bookable,
      discoveryOnly: !event.bookable,
      rankScore: score,
      kind: "event",
    };
  });
}
