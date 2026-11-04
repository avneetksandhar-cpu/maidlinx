/**
 * Sample evening ideas for the clickable UI.
 *
 * These are not live inventory, venue partnerships, or guaranteed access.
 * Product pricing is unresolved: a $500 minimum was discussed separately.
 * Do not treat amounts here as a deposit, membership fee, or signed rule.
 */

export type ExperienceCategory =
  | "nightlife"
  | "dining"
  | "yachts"
  | "events"
  | "private";

export type Experience = {
  id: string;
  title: string;
  category: ExperienceCategory;
  categoryLabel: string;
  location: string;
  city: string;
  priceFrom: number;
  imageUrl: string;
  imageAlt: string;
  dateLabel: string;
  timeLabel: string;
  dressCode: string;
  ageRequirement: string;
  description: string;
  featured?: boolean;
  tastes: Array<"dining" | "music" | "fashion" | "social" | "water">;
};

export const homeCategories: {
  id: ExperienceCategory;
  label: string;
}[] = [
  { id: "nightlife", label: "Nightlife" },
  { id: "dining", label: "Dining" },
  { id: "yachts", label: "Yachts" },
  { id: "events", label: "Events" },
  { id: "private", label: "Private" },
];

export const featuredExperiences: Experience[] = [
  {
    id: "liv-miami",
    title: "A late room in Miami Beach",
    category: "nightlife",
    categoryLabel: "Music",
    location: "Miami Beach",
    city: "Miami Beach",
    priceFrom: 100,
    imageUrl: "/photos/bar-interior.jpg",
    imageAlt: "Warm empty bar interior with low light and glassware — licensed atmosphere, not a live table",
    dateLabel: "Tonight",
    timeLabel: "11:00 PM – 2:00 AM",
    dressCode: "Smart, your way",
    ageRequirement: "21+",
    description:
      "A sample night built around music and a late room. This is a demo idea, not a live table or a venue partnership.",
    featured: true,
    tastes: ["music", "fashion", "social"],
  },
  {
    id: "e11even-rooftop",
    title: "Downtown after dinner",
    category: "nightlife",
    categoryLabel: "Social",
    location: "Downtown Miami",
    city: "Miami",
    priceFrom: 100,
    imageUrl: "/photos/nightlife-crowd.jpg",
    imageAlt: "Nightlife crowd under colored lights — licensed atmosphere, not a named venue",
    dateLabel: "Tonight",
    timeLabel: "10:00 PM – 1:00 AM",
    dressCode: "Upscale casual",
    ageRequirement: "21+",
    description:
      "A sample late plan after dinner downtown. Shown as an idea only — availability is not live inventory.",
    tastes: ["music", "social"],
  },
  {
    id: "papi-steak",
    title: "A long dinner in South Beach",
    category: "dining",
    categoryLabel: "Dining",
    location: "South Beach",
    city: "Miami Beach",
    priceFrom: 200,
    imageUrl: "/photos/dining-room.jpg",
    imageAlt: "Candlelit dining table — licensed atmosphere, not a restaurant partnership",
    dateLabel: "Tonight",
    timeLabel: "7:00 PM – 10:30 PM",
    dressCode: "Smart elegant",
    ageRequirement: "21+",
    description:
      "A sample seated dinner — close tables, unhurried pacing. Not a live reservation and not a restaurant partnership.",
    tastes: ["dining", "fashion"],
  },
  {
    id: "sunset-yacht",
    title: "Sunset on the bay",
    category: "yachts",
    categoryLabel: "On the water",
    location: "Miami Beach Marina",
    city: "Miami Beach",
    priceFrom: 100,
    imageUrl: "/photos/miami-night.jpg",
    imageAlt: "Miami waterfront at night — licensed atmosphere, not a held boat",
    dateLabel: "This weekend",
    timeLabel: "5:00 PM – 8:00 PM",
    dressCode: "Resort / easy",
    ageRequirement: "21+",
    description:
      "A sample few hours on the water. This demo does not hold a boat or crew.",
    tastes: ["water", "social"],
  },
];

export function getExperience(id: string) {
  return featuredExperiences.find((item) => item.id === id);
}

export function getFeaturedExperience() {
  return featuredExperiences.find((item) => item.featured) ?? featuredExperiences[0];
}

export function experiencesForTastes(
  tastes: Array<Experience["tastes"][number]>,
  limit = 3,
) {
  if (tastes.length === 0) return featuredExperiences.slice(0, limit);
  const ranked = [...featuredExperiences].sort((a, b) => {
    const aHits = a.tastes.filter((taste) => tastes.includes(taste)).length;
    const bHits = b.tastes.filter((taste) => tastes.includes(taste)).length;
    return bHits - aHits;
  });
  return ranked.slice(0, limit);
}
