export const CONCIERGE_SERVICES = [
  {
    id: "personalized_itinerary",
    label: "Personalized itinerary",
    description: "A planned sequence for the night. Not a reservation and not a guaranteed entry.",
  },
  {
    id: "venue_recommendations",
    label: "Venue recommendations",
    description: "Suggestions based on atmosphere and spend. Availability is never promised.",
  },
  {
    id: "pre_night_video_consult",
    label: "Pre-night video consult",
    description: "A virtual briefing before you go out. Scheduling depends on a verified Wingman.",
  },
  {
    id: "social_confidence_prep",
    label: "Social-confidence prep",
    description:
      "A consult to reduce awkwardness before the night. Not dating, not a guarantee you will meet anyone, and not access to women.",
  },
  {
    id: "group_coordination",
    label: "Group coordination",
    description: "Help aligning timing and plans for your group. Not a hosted table.",
  },
  {
    id: "in_person_guidance",
    label: "In-person guidance",
    description: "On-the-ground orientation from a verified Wingman when one is available.",
  },
  {
    id: "arrival_dress_prep",
    label: "Arrival and dress prep",
    description: "Guidance on timing and dress. Venues set their own door policies.",
  },
  {
    id: "reservation_assistance",
    label: "Reservation assistance",
    description: "Help requesting a reservation or ticket path. Not a confirmed booking by itself.",
  },
  {
    id: "premium_multi_night_concierge",
    label: "Premium multi-night concierge",
    description: "Planning across more than one night. Quoted only after a verified Wingman accepts.",
  },
] as const;

export type ConciergeServiceId = (typeof CONCIERGE_SERVICES)[number]["id"];

export const SERVICE_DISCLAIMER =
  "Wingman does not offer dating, romantic, or sexual companionship. We do not guarantee entry, tables, a specific crowd, or any social interaction.";

export const FORBIDDEN_SERVICE_TERMS = [
  "dating",
  "girlfriend",
  "escort",
  "romantic",
  "sexual",
  "hookup",
  "meet women",
  "meet girls",
];

export function isConciergeServiceId(value: string): value is ConciergeServiceId {
  return CONCIERGE_SERVICES.some((service) => service.id === value);
}

export function normalizeRequestedServices(raw: unknown): ConciergeServiceId[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item)).filter(isConciergeServiceId);
}

export function containsForbiddenServiceRequest(text: string): boolean {
  const lower = text.toLowerCase();
  return FORBIDDEN_SERVICE_TERMS.some((term) => lower.includes(term));
}

export const CUSTOMER_FLOW_STEPS = [
  { id: "tonight", label: "Pick a night" },
  { id: "confirm", label: "Confirm $500" },
  { id: "pay", label: "Secure checkout" },
  { id: "chat", label: "Chat with Your Wingman" },
] as const;
