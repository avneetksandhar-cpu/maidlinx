export const VENUE_CATEGORIES = [
  "club",
  "lounge",
  "rooftop",
  "restaurant",
  "dayclub",
  "after_hours",
] as const;
export type VenueCategory = (typeof VENUE_CATEGORIES)[number];

export const VENUE_CATEGORY_LABEL: Record<VenueCategory, string> = {
  club: "Clubs",
  lounge: "Lounges",
  rooftop: "Rooftops",
  restaurant: "Restaurants",
  dayclub: "Dayclubs",
  after_hours: "After hours",
};

export const VENUE_VERIFICATION = ["unclaimed", "pending", "verified", "paused", "rejected"] as const;
export type VenueVerification = (typeof VENUE_VERIFICATION)[number];

export type PublicVenue = {
  id: string;
  slug: string;
  name: string;
  area: string;
  neighborhood: string;
  city: string;
  category: VenueCategory | null;
  categoryLabel: string | null;
  atmosphere: string | null;
  dressCode: string | null;
  music: string | null;
  hoursText: string | null;
  description: string | null;
  officialUrl: string | null;
  instagram: string | null;
  verificationStatus: VenueVerification;
  verified: boolean;
  partner: boolean;
  upcomingCount: number;
  tonightCount: number;
};

export type VenueApplicationInput = {
  venueName: string;
  venueType: string;
  address: string;
  neighborhood: string;
  city?: string;
  website?: string;
  instagram?: string;
  contactName: string;
  contactTitle: string;
  businessEmail: string;
  phone: string;
  legalName: string;
  licenseNumber: string;
  hoursText: string;
  description: string;
  musicGenres: string;
  dressCode: string;
  guestProfile?: string;
  reservationUrl?: string;
  ticketUrl?: string;
  tableMinimums?: string;
  upcomingEvents?: string;
  logoUrl?: string;
  heroPhotoUrl?: string;
  authorityAttested: boolean;
  accuracyAttested: boolean;
  mediaRightsAttested: boolean;
};

export function inferVenueCategory(hay: string): VenueCategory | null {
  const text = hay.toLowerCase();
  if (/day.?club|pool/.test(text)) return "dayclub";
  if (/after.?hour|late/.test(text)) return "after_hours";
  if (/rooftop|roof/.test(text)) return "rooftop";
  if (/lounge/.test(text)) return "lounge";
  if (/restaurant|dinner|steak|dine/.test(text)) return "restaurant";
  if (/club|nightclub|liv|e11even|space|factory/.test(text)) return "club";
  return null;
}

export function slugifyVenueName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
