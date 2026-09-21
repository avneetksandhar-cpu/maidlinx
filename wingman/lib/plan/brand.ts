export const BRAND_PROMISE = "Arrive connected. Never go out blind.";

export const BRAND_NOT_A_MARKETPLACE =
  "Wingman is not a table-sharing or promoter marketplace. Listings are not partnerships.";

export const SERVICE_BOUNDARY =
  "Women are never inventory or a guaranteed feature. Wingman does not offer romantic or sexual companionship. We do not promise entry, tables, a specific crowd, or access to specific people.";

export const INSURANCE_OWNER_BLOCKER =
  "Insurance and legal review for in-person services is an owner blocker. Wingman does not claim insurance exists today.";

export const NIGHT_GOALS = [
  { id: "socialize", label: "Socialize" },
  { id: "celebrate", label: "Celebrate" },
  { id: "network", label: "Network" },
  { id: "vip_nightlife", label: "VIP nightlife" },
  { id: "explore_miami", label: "Explore Miami" },
] as const;
export type NightGoal = (typeof NIGHT_GOALS)[number]["id"];

export function isNightGoal(value: string): value is NightGoal {
  return NIGHT_GOALS.some((goal) => goal.id === value);
}

export const CUSTOMER_CONCERNS = [
  {
    id: "where",
    concern: "Where should I go?",
    feature: "Personalized Tonight in Miami recommendations from real discovery events and Plan My Night.",
  },
  {
    id: "suit",
    concern: "Will this place suit me?",
    feature: "Honest atmosphere, music, spending, and dress-code from the listing — labeled as estimates when we do not have a confirmed quote.",
  },
  {
    id: "alone",
    concern: "Travelling alone",
    feature: "A verified virtual or in-person Wingman when one exists. The public list is empty until a real person is verified.",
  },
  {
    id: "awkward",
    concern: "Awkward",
    feature: "Pre-night consultation and social-confidence prep as a service option — not a dating promise.",
  },
  {
    id: "scam",
    concern: "Scammed",
    feature: "Upfront $500 server total. Assigned host is Andres P — not government-ID verified.",
  },
  {
    id: "fails",
    concern: "Plan fails",
    feature: "A backup venue/itinerary is always the third recommended option.",
  },
  {
    id: "inside",
    concern: "Get inside",
    feature: "Clear entry instructions from the official source. Entry is never guaranteed.",
  },
  {
    id: "after",
    concern: "After booking",
    feature: "Secure chat, live check-ins, and defined expectations. Chat stays locked until paid.",
  },
] as const;

export const RECURRING_PLACEHOLDERS = [
  { key: "saved_preferences", label: "Saved preferences" },
  { key: "one_tap_rebook", label: "One-tap rebook" },
  { key: "multi_night_packages", label: "Multi-night packages" },
  { key: "birthday_bachelor", label: "Birthday / bachelor" },
  { key: "group_invites", label: "Group invites" },
  { key: "last_minute_priority", label: "Last-minute priority" },
  { key: "member_pricing", label: "Member pricing" },
  { key: "other_cities", label: "Other cities" },
  { key: "improving_recs", label: "Improving recommendations" },
  { key: "wingman_passport", label: "Wingman Passport" },
] as const;
