import type { ExperienceSlug } from "@/lib/catalog/types";

export function experiencePhotoSrc(slug: string): `/${string}` {
  if (slug === "dinner") return "/photos/dining-room.jpg";
  if (slug === "yacht") return "/photos/miami-night.jpg";
  return "/photos/nightlife-crowd.jpg";
}

export function experiencePhotoAlt(slug: string): string {
  if (slug === "dinner") return "Dining atmosphere photo. Not a specific restaurant reservation.";
  if (slug === "yacht") return "Miami waterfront atmosphere photo. Not a specific yacht charter photo.";
  return "Nightlife atmosphere photo. Not a specific venue interior.";
}

export function isExperienceSlug(value: string): value is ExperienceSlug {
  return value === "nightclub" || value === "dinner" || value === "yacht";
}
