/**
 * Sample verified Wingman profiles for the directory.
 *
 * These are demo listings — not real staff, not venue partnerships,
 * and not live availability. Same unresolved $500 vs sample prices as
 * experiences. Amounts are visual only.
 */

export type Promoter = {
  id: string;
  name: string;
  photoUrl: string;
  photoAlt: string;
  verified: boolean;
  city: string;
  venues: string[];
  availability: string;
  availabilityFilter: "tonight" | "weekend" | "week";
  accessOffered: string;
  minimumSpend: number;
  bio: string;
  experienceIds: string[];
  category: "nightlife" | "dining" | "yachts" | "events" | "private";
};

export const promoters: Promoter[] = [
  {
    id: "marcus-vega",
    name: "Marcus Vega",
    photoUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&auto=format&fit=crop",
    photoAlt: "Sample portrait used for a demo nightlife profile",
    verified: true,
    city: "Miami Beach",
    venues: ["Late rooms", "Guest lists"],
    availability: "Sample · tonight",
    availabilityFilter: "tonight",
    accessOffered: "Guest list + table (sample)",
    minimumSpend: 100,
    bio: "Sample nightlife profile. Not a real host or a venue partnership. Shown so the directory layout can be reviewed.",
    experienceIds: ["liv-miami", "e11even-rooftop"],
    category: "nightlife",
  },
  {
    id: "elena-cruz",
    name: "Elena Cruz",
    photoUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80&auto=format&fit=crop",
    photoAlt: "Sample portrait used for a demo dining profile",
    verified: true,
    city: "South Beach",
    venues: ["Seated dinners"],
    availability: "Sample · tonight",
    availabilityFilter: "tonight",
    accessOffered: "Dining tables (sample)",
    minimumSpend: 200,
    bio: "Sample dining profile. Wingman does not claim a live reservation book or restaurant partnership here.",
    experienceIds: ["papi-steak"],
    category: "dining",
  },
  {
    id: "julian-hart",
    name: "Julian Hart",
    photoUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&auto=format&fit=crop",
    photoAlt: "Sample portrait used for a demo water-day profile",
    verified: true,
    city: "Miami Beach Marina",
    venues: ["The bay"],
    availability: "Sample · this weekend",
    availabilityFilter: "weekend",
    accessOffered: "Time on the water (sample)",
    minimumSpend: 100,
    bio: "Sample charter-style profile. This demo does not hold a boat or crew.",
    experienceIds: ["sunset-yacht"],
    category: "yachts",
  },
  {
    id: "sofia-reyes",
    name: "Sofia Reyes",
    photoUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&q=80&auto=format&fit=crop",
    photoAlt: "Sample portrait used for a demo private-evening profile",
    verified: true,
    city: "Miami",
    venues: ["Private rooms"],
    availability: "Sample · weekend",
    availabilityFilter: "weekend",
    accessOffered: "Private evenings (sample)",
    minimumSpend: 100,
    bio: "Sample private-evening profile. Not a live host and not a members-only venue list.",
    experienceIds: ["liv-miami"],
    category: "private",
  },
];

export function getPromoter(id: string) {
  return promoters.find((item) => item.id === id);
}

export const promoterFilters = [
  { id: "all", label: "All" },
  { id: "tonight", label: "Tonight" },
  { id: "weekend", label: "Weekend" },
  { id: "dining", label: "Dining" },
  { id: "nightlife", label: "Nightlife" },
] as const;

export type PromoterFilterId = (typeof promoterFilters)[number]["id"];
