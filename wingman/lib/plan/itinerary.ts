import type { PublicEvent } from "@/lib/marketplace/queries";
import type { SpendBand } from "@/lib/marketplace/constants";
import { BRAND_NOT_A_MARKETPLACE, SERVICE_BOUNDARY, type NightGoal } from "@/lib/plan/brand";

export type PlanAnswers = {
  date: string;
  spendBand: SpendBand;
  music: string;
  groupSize: number;
  goal: NightGoal;
};

export type PlanOptionKind = "best_match" | "luxury" | "backup";

export type PlanOption = {
  kind: PlanOptionKind;
  label: string;
  eventId: string | null;
  externalId: string | null;
  name: string;
  venueName: string;
  neighborhood: string;
  localDate: string;
  arrivalTime: string;
  estimatedSpending: string;
  estimatedSpendingNote: string;
  dress: string;
  transportation: string;
  usualAtmosphere: string;
  music: string;
  officialSourceUrl: string | null;
  entryInstructions: string;
  discoveryOnly: boolean;
  partnershipClaimed: false;
};

export type NightPlan = {
  answers: PlanAnswers;
  options: [PlanOption, PlanOption, PlanOption];
  availableWingmen: [];
  availableWingmanCount: 0;
  disclaimer: string;
};

const LUXURY_VENUES = ["e11even", "liv", "liv nightclub", "m2"];

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length > 2);
}

function dateScore(eventDate: string, requested: string): number {
  if (!requested) return 1;
  if (eventDate === requested) return 12;
  const diff = Math.abs(Date.parse(`${eventDate}T00:00:00Z`) - Date.parse(`${requested}T00:00:00Z`));
  if (!Number.isFinite(diff)) return 0;
  const days = diff / 86_400_000;
  if (days <= 1) return 8;
  if (days <= 3) return 5;
  if (days <= 7) return 3;
  return 1;
}

function musicScore(event: PublicEvent, music: string): number {
  if (!music.trim()) return 1;
  const hay = `${event.name} ${event.category} ${event.musicGenre ?? ""} ${event.atmosphere ?? ""} ${event.eventType ?? ""}`.toLowerCase();
  return tokens(music).reduce((score, token) => (hay.includes(token) ? score + 4 : score), 0);
}

function goalScore(event: PublicEvent, goal: NightGoal): number {
  const hay = `${event.category} ${event.eventType ?? ""} ${event.name}`.toLowerCase();
  if (goal === "vip_nightlife" && /nightclub|vip|liv|e11even|table/.test(hay)) return 6;
  if (goal === "celebrate" && /weekend|party|labor|night/.test(hay)) return 4;
  if (goal === "explore_miami") return 2;
  if (goal === "network" && /show|concert|performance/.test(hay)) return 3;
  if (goal === "socialize") return 2;
  return 1;
}

function luxuryScore(event: PublicEvent): number {
  const venue = event.venueName.toLowerCase();
  if (LUXURY_VENUES.some((name) => venue.includes(name))) return 10;
  if (/factory town|club space/.test(venue)) return 6;
  return 2;
}

function spendEstimate(band: SpendBand, luxury: boolean): string {
  if (band === "band_5000_plus" || luxury) return "Estimate $1.5K–$5K+ per group";
  if (band === "band_1500_5000") return "Estimate $1.5K–$5K per group";
  return "Estimate $500–$1.5K per group";
}

function atmosphereFor(event: PublicEvent, goal: NightGoal): string {
  if (event.atmosphere) return event.atmosphere;
  if (event.musicGenre) return `${event.musicGenre} · ${event.category}`;
  if (goal === "vip_nightlife") return "High-energy nightlife. Door and table rules are the venue's.";
  if (goal === "explore_miami") return "Miami night out. Confirm the official listing before you go.";
  return event.category || "Nightlife — confirm on the official source";
}

function toOption(kind: PlanOptionKind, event: PublicEvent, answers: PlanAnswers): PlanOption {
  const luxury = kind === "luxury";
  return {
    kind,
    label: kind === "best_match" ? "Best match" : kind === "luxury" ? "Luxury option" : "Backup option",
    eventId: event.id,
    externalId: event.externalId,
    name: event.name,
    venueName: event.venueName,
    neighborhood: event.neighborhood || event.area,
    localDate: event.localDate,
    arrivalTime: event.localTimeText || "See official source",
    estimatedSpending: spendEstimate(answers.spendBand, luxury || luxuryScore(event) >= 10),
    estimatedSpendingNote: "Estimate only. Not a quote and not a held reservation.",
    dress: event.dressCode || "See official source. Door dress policy is the venue's — not guaranteed by Wingman.",
    transportation: "Rideshare or hotel car. Confirm independently. Wingman does not provide a ride.",
    usualAtmosphere: atmosphereFor(event, answers.goal),
    music: event.musicGenre || event.category,
    officialSourceUrl: event.officialSourceUrl,
    entryInstructions:
      "Use View event for official arrival notes. Entry, guest list, and tables are never guaranteed.",
    discoveryOnly: event.bookingStatus !== "VERIFIED_AVAILABLE",
    partnershipClaimed: false,
  };
}

function placeholder(kind: PlanOptionKind, answers: PlanAnswers, reason: string): PlanOption {
  return {
    kind,
    label: kind === "best_match" ? "Best match" : kind === "luxury" ? "Luxury option" : "Backup option",
    eventId: null,
    externalId: null,
    name: reason,
    venueName: "To be confirmed by a verified Wingman",
    neighborhood: "Miami",
    localDate: answers.date,
    arrivalTime: "Set after a quote",
    estimatedSpending: spendEstimate(answers.spendBand, kind === "luxury"),
    estimatedSpendingNote: "Estimate only. No venue partnership is implied.",
    dress: "Confirmed with your Wingman after a quote. Venues set their own door rules.",
    transportation: "Rideshare or hotel car. Confirm independently.",
    usualAtmosphere: "We will not invent a listing. An operator can plan from remaining official calendars.",
    music: answers.music || "Your preference",
    officialSourceUrl: null,
    entryInstructions: "No entry path exists until a real listing or quote is attached. Never guaranteed.",
    discoveryOnly: true,
    partnershipClaimed: false,
  };
}

export function buildNightPlan(answers: PlanAnswers, events: PublicEvent[]): NightPlan {
  const ranked = [...events].sort((a, b) => {
    const aScore = dateScore(a.localDate, answers.date) + musicScore(a, answers.music) + goalScore(a, answers.goal);
    const bScore = dateScore(b.localDate, answers.date) + musicScore(b, answers.music) + goalScore(b, answers.goal);
    const diff = bScore - aScore;
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });

  const used = new Set<string>();
  const pick = (preferLuxury = false): PublicEvent | null => {
    const pool = preferLuxury
      ? [...ranked].sort((a, b) => luxuryScore(b) - luxuryScore(a) || ranked.indexOf(a) - ranked.indexOf(b))
      : ranked;
    const found = pool.find((event) => !used.has(event.venueName));
    if (!found) return null;
    used.add(found.venueName);
    return found;
  };

  const bestEvent = pick(false);
  const luxuryEvent = pick(true);
  const backupEvent = pick(false);

  const options: [PlanOption, PlanOption, PlanOption] = [
    bestEvent
      ? toOption("best_match", bestEvent, answers)
      : placeholder("best_match", answers, "No confirmed discovery listing matches this night yet."),
    luxuryEvent
      ? toOption("luxury", luxuryEvent, answers)
      : placeholder("luxury", answers, "No second confirmed listing for a luxury-leaning option yet."),
    backupEvent
      ? toOption("backup", backupEvent, answers)
      : placeholder("backup", answers, "Backup: we will not invent a third venue. Request a plan and an operator will use remaining official calendars."),
  ];

  return {
    answers,
    options,
    availableWingmen: [],
    availableWingmanCount: 0,
    disclaimer: `${BRAND_NOT_A_MARKETPLACE} Estimates are estimates.`,
  };
}

const KIND_TO_GOAL: Record<string, NightGoal> = {
  dinner_club: "celebrate",
  club_only: "vip_nightlife",
  bachelor: "celebrate",
  date_night: "socialize",
  vip_table: "vip_nightlife",
  rooftop: "explore_miami",
  lounge: "socialize",
  dayclub: "explore_miami",
  after_hours: "vip_nightlife",
  surprise: "socialize",
};

export function validatePlanAnswers(input: {
  date?: string;
  spendBand?: string;
  music?: string;
  groupSize?: number;
  goal?: string;
  kind?: string;
}): PlanAnswers {
  const date = String(input.date ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Choose a date.");
  const spendBand = String(input.spendBand ?? "") as SpendBand;
  if (!["band_500_1500", "band_1500_5000", "band_5000_plus"].includes(spendBand)) {
    throw new Error("Choose a spending band.");
  }
  const groupSize = Number(input.groupSize);
  if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 20) {
    throw new Error("Group size must be between 1 and 20.");
  }
  const mapped = input.kind ? KIND_TO_GOAL[String(input.kind)] : undefined;
  const goal = String(mapped ?? input.goal ?? "");
  if (!isNightGoalSafe(goal)) throw new Error("Choose a night goal.");
  return {
    date,
    spendBand,
    music: String(input.music ?? "").trim().slice(0, 80),
    groupSize,
    goal,
  };
}

function isNightGoalSafe(value: string): value is NightGoal {
  return ["socialize", "celebrate", "network", "vip_nightlife", "explore_miami"].includes(value);
}
