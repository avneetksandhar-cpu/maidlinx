import type { BookingDestination } from "@/lib/booking-flow/types";

export const MIAMI_PLACES: BookingDestination[] = [
  { label: "Miami Beach", neighborhood: "Miami Beach", lat: 25.7907, lng: -80.13, source: "preset" },
  { label: "South Beach", neighborhood: "South Beach", lat: 25.7826, lng: -80.1341, source: "preset" },
  { label: "Downtown Miami", neighborhood: "Downtown Miami", lat: 25.7743, lng: -80.1937, source: "preset" },
  { label: "Brickell", neighborhood: "Brickell", lat: 25.7663, lng: -80.1918, source: "preset" },
  { label: "Wynwood", neighborhood: "Wynwood", lat: 25.801, lng: -80.1992, source: "preset" },
  { label: "Midtown Miami", neighborhood: "Midtown", lat: 25.8072, lng: -80.1937, source: "preset" },
  { label: "Design District", neighborhood: "Design District", lat: 25.813, lng: -80.192, source: "preset" },
  { label: "Coconut Grove", neighborhood: "Coconut Grove", lat: 25.727, lng: -80.244, source: "preset" },
  { label: "Little Havana", neighborhood: "Little Havana", lat: 25.7653, lng: -80.2197, source: "preset" },
  { label: "Coral Gables", neighborhood: "Coral Gables", lat: 25.721, lng: -80.268, source: "preset" },
  { label: "Miami", neighborhood: "Miami", lat: 25.7617, lng: -80.1918, source: "preset" },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function searchMiamiPlaces(query: string, extraLabels: string[] = []): BookingDestination[] {
  const q = normalize(query);
  if (!q) return MIAMI_PLACES.slice(0, 6);
  const extras = extraLabels
    .map((label) => label.trim())
    .filter(Boolean)
    .filter((label, index, all) => all.findIndex((item) => normalize(item) === normalize(label)) === index)
    .map((label) => {
      const known = MIAMI_PLACES.find((place) => normalize(place.neighborhood) === normalize(label) || normalize(place.label) === normalize(label));
      return (
        known ?? {
          label,
          neighborhood: label,
          lat: 25.7617,
          lng: -80.1918,
          source: "places" as const,
        }
      );
    });
  const pool = [...extras, ...MIAMI_PLACES].filter(
    (place, index, all) => all.findIndex((item) => normalize(item.label) === normalize(place.label)) === index,
  );
  return pool
    .filter((place) => normalize(place.label).includes(q) || normalize(place.neighborhood).includes(q))
    .slice(0, 8);
}

export function nearestMiamiPlace(lat: number, lng: number): BookingDestination {
  let best = MIAMI_PLACES[MIAMI_PLACES.length - 1];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const place of MIAMI_PLACES) {
    const dist = (place.lat - lat) ** 2 + (place.lng - lng) ** 2;
    if (dist < bestDist) {
      best = place;
      bestDist = dist;
    }
  }
  return { ...best, source: "geo" };
}

export function mapEmbedSrc(destination: BookingDestination) {
  const delta = 0.035;
  const minLng = destination.lng - delta;
  const minLat = destination.lat - delta;
  const maxLng = destination.lng + delta;
  const maxLat = destination.lat + delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${destination.lat}%2C${destination.lng}`;
}
