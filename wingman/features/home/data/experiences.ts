export type ExperienceCategory =
  | "tonight"
  | "dining"
  | "nightlife"
  | "yachts"
  | "events";

export type Experience = {
  id: string;
  title: string;
  category: ExperienceCategory;
  location: string;
  priceLabel: string;
  imageUrl: string;
  imageAlt: string;
  badge?: string;
  hostName: string;
};

export const homeCategories: { id: ExperienceCategory; label: string }[] = [
  { id: "tonight", label: "Tonight" },
  { id: "dining", label: "Luxury Dining" },
  { id: "nightlife", label: "Nightlife" },
  { id: "yachts", label: "Yachts" },
  { id: "events", label: "Private Events" },
];

export const featuredExperiences: Experience[] = [
  {
    id: "1",
    title: "Sunset Yacht Charter — Biscayne Bay",
    category: "yachts",
    location: "Miami Beach Marina",
    priceLabel: "From $4,500",
    imageUrl:
      "https://images.unsplash.com/photo-1567899378494-47b050a96232?w=1200&q=80&auto=format&fit=crop",
    imageAlt: "Luxury yacht on Miami waters at sunset",
    badge: "Tonight",
    hostName: "Captain Reyes",
  },
  {
    id: "2",
    title: "Omakase at Naoe — Private Room",
    category: "dining",
    location: "Brickell Key",
    priceLabel: "From $850 / guest",
    imageUrl:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80&auto=format&fit=crop",
    imageAlt: "Fine dining omakase presentation",
    badge: "Members Only",
    hostName: "Chef Kevin",
  },
  {
    id: "3",
    title: "LIV Sunday — VIP Table & Bottle Service",
    category: "nightlife",
    location: "Fontainebleau, Miami Beach",
    priceLabel: "From $2,200",
    imageUrl:
      "https://images.unsplash.com/photo-1571266028243-e68fdf9c2f94?w=1200&q=80&auto=format&fit=crop",
    imageAlt: "VIP nightclub lounge with gold lighting",
    badge: "Tonight",
    hostName: "Marcus V.",
  },
  {
    id: "4",
    title: "Art Basel Penthouse Soirée",
    category: "events",
    location: "Edgewater, Miami",
    priceLabel: "From $1,200",
    imageUrl:
      "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200&q=80&auto=format&fit=crop",
    imageAlt: "Miami skyline at night from penthouse",
    badge: "Exclusive",
    hostName: "Elena K.",
  },
  {
    id: "5",
    title: "Carbone Miami — Chef's Table",
    category: "dining",
    location: "South Beach",
    priceLabel: "From $650 / guest",
    imageUrl:
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80&auto=format&fit=crop",
    imageAlt: "Upscale restaurant interior with warm lighting",
    hostName: "Concierge Team",
  },
];
