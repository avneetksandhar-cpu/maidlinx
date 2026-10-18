import type { SpendBand } from "@/lib/marketplace/constants";

export const EXPERIENCE_TYPES = [
  "nightclub",
  "lounge",
  "dinner_nightlife",
  "pool_day",
  "vip_table",
  "wingman",
] as const;
export type ExperienceType = (typeof EXPERIENCE_TYPES)[number];

export const VIBES = ["hiphop", "latin", "afrobeats", "edm", "upscale", "best_tonight"] as const;
export type Vibe = (typeof VIBES)[number];

export const BUDGETS = ["500_1000", "1000_2500", "2500_5000", "5000_plus"] as const;
export type BudgetId = (typeof BUDGETS)[number];

export const WHEN_CHOICES = ["tonight", "tomorrow", "date"] as const;
export type WhenChoice = (typeof WHEN_CHOICES)[number];

export type BookingDestination = {
  label: string;
  neighborhood: string;
  lat: number;
  lng: number;
  source: "preset" | "places" | "geo" | "custom";
};

export type VenueMatch = {
  id: string;
  eventId: string | null;
  externalId: string | null;
  name: string;
  venueName: string;
  area: string;
  localDate: string;
  localTimeText: string;
  partyFit: string;
  accessType: string;
  estimatedSpend: string;
  imageUrl: string;
  imageAlt: string;
  bookable: boolean;
  discoveryOnly: boolean;
  rankScore: number;
  kind: "event" | "night_service";
};

export type ConfirmedOffer = {
  requestId: string;
  quoteId: string;
  totalCents: number;
  hostName: string;
  hostDisplayName: string;
  publicVerified: boolean;
  photoUrl: string | null;
  terms: string;
};

export type PaymentStatus = "idle" | "pending" | "checkout" | "paid" | "cancelled";

export type NightBookingState = {
  destination: BookingDestination | null;
  when: WhenChoice | null;
  date: string | null;
  experienceType: ExperienceType | null;
  vibe: Vibe | null;
  partySize: number;
  budget: BudgetId | null;
  selectedMatch: VenueMatch | null;
  matches: VenueMatch[];
  requestId: string | null;
  quoteId: string | null;
  confirmedOffer: ConfirmedOffer | null;
  paymentStatus: PaymentStatus;
};

export const BOOKING_FLOW_STEPS = [
  "location",
  "when",
  "experience",
  "vibe",
  "party",
  "budget",
  "matches",
  "confirm",
  "matching",
  "wingman",
  "payment",
  "success",
] as const;
export type BookingFlowStep = (typeof BOOKING_FLOW_STEPS)[number];

export function budgetToSpendBand(budget: BudgetId | null): SpendBand {
  if (budget === "5000_plus") return "band_5000_plus";
  if (budget === "1000_2500" || budget === "2500_5000") return "band_1500_5000";
  return "band_500_1500";
}
