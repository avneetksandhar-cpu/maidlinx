/**
 * Licensed atmosphere photography.
 *
 * These are Unsplash / Pexels stock shots. They are not venue interiors for a
 * named night, not Wingmen, and not people you can meet through the product.
 * Do not set events.image_usage_verified from this catalog — that flag is only
 * for a photo whose rights cover that specific listing.
 */

export type AtmosphereMood =
  | "miami_night"
  | "club_interior"
  | "club_lights"
  | "nightlife_energy"
  | "dining"
  | "dining_interior"
  | "bar_interior"
  | "social_table";

export type AtmospherePhoto = {
  id: string;
  mood: AtmosphereMood;
  src: `/${string}`;
  alt: string;
  caption: string;
  objectPosition: string;
  photographer: string;
  photographerUrl: string | null;
  sourceUrl: string;
  license: "Unsplash License" | "Pexels License";
  licenseUrl: string;
};

export const ATMOSPHERE_DISCLAIMER =
  "Licensed atmosphere photo. Not this venue. Pictured people are not Wingmen, customers, hosts, or guaranteed attendees.";

export const ATMOSPHERE_PHOTOS: AtmospherePhoto[] = [
  {
    id: "miami-night",
    mood: "miami_night",
    src: "/photos/miami-night.jpg",
    alt: "Downtown Miami skyline across the water at dusk",
    caption: ATMOSPHERE_DISCLAIMER,
    objectPosition: "center 28%",
    photographer: "Rolando Yera",
    photographerUrl: "https://unsplash.com/@rolandoyera",
    sourceUrl: "https://unsplash.com/photos/SHMLtIv2dDQ",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
  },
  {
    id: "club-interior",
    mood: "club_interior",
    src: "/photos/club-interior.jpg",
    alt: "A drink being poured over ice at a dimly lit bar",
    caption: ATMOSPHERE_DISCLAIMER,
    objectPosition: "center 38%",
    photographer: "Photographer as listed on the Unsplash photo page",
    photographerUrl: null,
    sourceUrl: "https://unsplash.com/photos/photo-1566417713940-fe7c737a9ef2",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
  },
  {
    id: "club-lights",
    mood: "club_lights",
    src: "/photos/club-lights.jpg",
    alt: "DJ mixer under purple club lighting",
    caption: ATMOSPHERE_DISCLAIMER,
    objectPosition: "center center",
    photographer: "Connor Wang",
    photographerUrl: "https://unsplash.com/@cwang",
    sourceUrl: "https://unsplash.com/photos/v4sukvt_bR8",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
  },
  {
    id: "nightlife-crowd",
    mood: "nightlife_energy",
    src: "/photos/nightlife-crowd.jpg",
    alt: "A concert crowd under colored stage lights and confetti",
    caption: ATMOSPHERE_DISCLAIMER,
    objectPosition: "center 32%",
    photographer: "Photographer as listed on the Unsplash photo page",
    photographerUrl: null,
    sourceUrl: "https://unsplash.com/photos/photo-1514525253161-7a46d19cd819",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
  },
  {
    id: "dining-room",
    mood: "dining",
    src: "/photos/dining-room.jpg",
    alt: "A plated dinner with wine glasses on a candlelit table",
    caption: ATMOSPHERE_DISCLAIMER,
    objectPosition: "center 42%",
    photographer: "Jay Wennington",
    photographerUrl: "https://unsplash.com/@jaywennington",
    sourceUrl: "https://unsplash.com/photos/nzyzAUsbV0M",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
  },
  {
    id: "restaurant-interior",
    mood: "dining_interior",
    src: "/photos/restaurant-interior.jpg",
    alt: "An empty upscale dining room with booths and warm pendant lights",
    caption: ATMOSPHERE_DISCLAIMER,
    objectPosition: "center 40%",
    photographer: "Pablo Merchán Montes",
    photographerUrl: "https://unsplash.com/@pablomerchanm",
    sourceUrl: "https://unsplash.com/photos/Orz90t6o0e4",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
  },
  {
    id: "bar-interior",
    mood: "bar_interior",
    src: "/photos/bar-interior.jpg",
    alt: "An empty wooden bar with bottles, taps, and warm pendant lights",
    caption: ATMOSPHERE_DISCLAIMER,
    objectPosition: "center 30%",
    photographer: "Photographer as listed on the Unsplash photo page",
    photographerUrl: null,
    sourceUrl: "https://unsplash.com/photos/photo-1514933651103-005eec06c04b",
    license: "Unsplash License",
    licenseUrl: "https://unsplash.com/license",
  },
  {
    id: "dining-group",
    mood: "social_table",
    src: "/photos/dining-group.jpg",
    alt: "Wine glasses on a table with a mixed group talking in soft focus",
    caption: ATMOSPHERE_DISCLAIMER,
    objectPosition: "center 40%",
    photographer: "Helena Lopes",
    photographerUrl: "https://www.pexels.com/@helenalopes/",
    sourceUrl:
      "https://www.pexels.com/photo/people-drinking-liquor-and-talking-on-dining-table-close-up-photo-696218/",
    license: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  {
    id: "restaurant-night",
    mood: "bar_interior",
    src: "/photos/restaurant-night.jpg",
    alt: "A long empty bar at night with warm backlit shelves",
    caption: ATMOSPHERE_DISCLAIMER,
    objectPosition: "center 45%",
    photographer: "Photographer as listed on the Pexels photo page",
    photographerUrl: null,
    sourceUrl: "https://www.pexels.com/photo/260922/",
    license: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
  {
    id: "lounge-night",
    mood: "club_interior",
    src: "/photos/lounge-night.jpg",
    alt: "An empty lounge bar with bottles on lit shelves",
    caption: ATMOSPHERE_DISCLAIMER,
    objectPosition: "center 40%",
    photographer: "Photographer as listed on the Pexels photo page",
    photographerUrl: null,
    sourceUrl: "https://www.pexels.com/photo/941864/",
    license: "Pexels License",
    licenseUrl: "https://www.pexels.com/license/",
  },
];

export const HERO_PHOTO = mustPhoto("miami-night");
export const EMPTY_STATE_PHOTO = mustPhoto("miami-night");
export const PLAN_HEADER_PHOTO = mustPhoto("club-interior");

const FORBIDDEN_COPY = [
  "meet her",
  "meet him",
  "meet these",
  "book this and meet",
  "date",
  "dating",
  "thirst",
  "companion",
  "companionship",
  "wingmen in this photo",
  "customers in this photo",
];

function mustPhoto(id: string): AtmospherePhoto {
  const photo = ATMOSPHERE_PHOTOS.find((item) => item.id === id);
  if (!photo) throw new Error(`Missing atmosphere photo ${id}`);
  return photo;
}

export function hashSeed(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickFrom(moods: AtmosphereMood[], seed: string): AtmospherePhoto {
  const pool = ATMOSPHERE_PHOTOS.filter((photo) => moods.includes(photo.mood));
  const list = pool.length > 0 ? pool : ATMOSPHERE_PHOTOS;
  return list[hashSeed(seed) % list.length] ?? HERO_PHOTO;
}

export function atmosphereForEvent(input: {
  id: string;
  category?: string | null;
  musicGenre?: string | null;
  eventType?: string | null;
  name?: string | null;
}): AtmospherePhoto {
  const hay = `${input.category ?? ""} ${input.musicGenre ?? ""} ${input.eventType ?? ""} ${input.name ?? ""}`.toLowerCase();
  if (/dine|dinner|restaurant|steak|table/.test(hay)) {
    return pickFrom(["dining", "dining_interior", "social_table"], input.id);
  }
  if (/hip-?hop|rap/.test(hay)) {
    return pickFrom(["nightlife_energy", "club_interior"], input.id);
  }
  if (/electronic|house|techno|dance/.test(hay)) {
    return pickFrom(["club_lights", "nightlife_energy", "club_interior"], input.id);
  }
  if (/nightclub|club|liv|e11even/.test(hay)) {
    return pickFrom(["club_interior", "club_lights", "bar_interior"], input.id);
  }
  return pickFrom(
    ["miami_night", "nightlife_energy", "club_interior", "bar_interior"],
    input.id,
  );
}

export function atmosphereForVenue(input: {
  id: string;
  name?: string | null;
  category?: string | null;
  music?: string | null;
}): AtmospherePhoto {
  return atmosphereForEvent({
    id: input.id,
    name: input.name,
    category: input.category,
    musicGenre: input.music,
    eventType: input.category,
  });
}

export function atmosphereForPlanOption(kind: "best_match" | "luxury" | "backup"): AtmospherePhoto {
  if (kind === "luxury") return mustPhoto("dining-room");
  if (kind === "backup") return HERO_PHOTO;
  return mustPhoto("nightlife-crowd");
}

export function atmosphereCopyIsSafe(value: string): boolean {
  const hay = value.toLowerCase();
  return !FORBIDDEN_COPY.some((phrase) => hay.includes(phrase));
}
