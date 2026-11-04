import type { BudgetId, ExperienceType, Vibe, WhenChoice } from "@/lib/booking-flow/types";

export const EXPERIENCE_OPTIONS: Array<{ id: ExperienceType; label: string; imageId: string }> = [
  { id: "nightclub", label: "Nightclub", imageId: "nightlife-crowd" },
  { id: "lounge", label: "Lounge", imageId: "lounge-night" },
  { id: "dinner_nightlife", label: "Dinner + Nightlife", imageId: "dining-room" },
  { id: "pool_day", label: "Pool / Day Party", imageId: "miami-night" },
  { id: "vip_table", label: "VIP Table", imageId: "club-interior" },
  { id: "wingman", label: "Wingman Experience", imageId: "club-lights" },
];

export const VIBE_OPTIONS: Array<{ id: Vibe; label: string; icon: string }> = [
  { id: "hiphop", label: "Hip-Hop / R&B", icon: "♪" },
  { id: "latin", label: "Latin", icon: "✧" },
  { id: "afrobeats", label: "Afrobeats", icon: "◎" },
  { id: "edm", label: "EDM", icon: "▲" },
  { id: "upscale", label: "Upscale", icon: "◇" },
  { id: "best_tonight", label: "Whatever is best tonight", icon: "★" },
];

export const BUDGET_OPTIONS: Array<{ id: BudgetId; label: string }> = [
  { id: "500_1000", label: "$500 – $1,000" },
  { id: "1000_2500", label: "$1,000 – $2.5K" },
  { id: "2500_5000", label: "$2.5K – $5K" },
  { id: "5000_plus", label: "$5K+" },
];

export const WHEN_OPTIONS: Array<{ id: WhenChoice; label: string; hint: string }> = [
  { id: "tonight", label: "Tonight", hint: "Start after dark" },
  { id: "tomorrow", label: "Tomorrow", hint: "One night out" },
  { id: "date", label: "Pick a date", hint: "Choose the night" },
];

export const STEP_PATHS = {
  location: "/booking/location",
  when: "/booking/when",
  experience: "/booking/experience",
  vibe: "/booking/vibe",
  party: "/booking/party",
  budget: "/booking/budget",
  matches: "/booking/matches",
  confirm: "/booking/confirm",
  matching: "/booking/matching",
  wingman: "/booking/wingman",
  payment: "/booking/payment",
  success: "/booking/success",
} as const;
