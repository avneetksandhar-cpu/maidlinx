/**
 * Geo helpers for Match Score — no Google Maps dependency.
 * Prefer lat/lng haversine; fall back to postal / city+state heuristics.
 */

export interface LatLng {
  latitude: number;
  longitude: number;
}

export type DistanceResolution =
  | { kind: "haversine"; distanceKm: number }
  | { kind: "postal"; distanceKm: number; matchLevel: "exact" | "prefix" }
  | { kind: "city_state"; distanceKm: number }
  | { kind: "unknown" };

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in km between two WGS84 points. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function normalizePostal(postal: string | null | undefined): string {
  return (postal ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

export function cityStateKey(city: string | null, state: string | null): string {
  return `${(city ?? "").trim().toLowerCase()}|${(state ?? "").trim().toUpperCase()}`;
}

/**
 * Resolve distance without Maps.
 * - Both lat/lng → haversine
 * - Same postal → ~2 km synthetic
 * - Same 3-digit US ZIP prefix → ~15 km synthetic
 * - Same city+state → ~20 km synthetic
 * - Else unknown
 */
export function resolveDistance(input: {
  bookingLat: number | null;
  bookingLng: number | null;
  cleanerLat: number | null;
  cleanerLng: number | null;
  bookingPostal: string | null;
  cleanerPostal: string | null;
  bookingCity: string | null;
  bookingState: string | null;
  cleanerCity: string | null;
  cleanerState: string | null;
}): DistanceResolution {
  const {
    bookingLat,
    bookingLng,
    cleanerLat,
    cleanerLng,
    bookingPostal,
    cleanerPostal,
    bookingCity,
    bookingState,
    cleanerCity,
    cleanerState,
  } = input;

  if (
    bookingLat != null &&
    bookingLng != null &&
    cleanerLat != null &&
    cleanerLng != null &&
    Number.isFinite(bookingLat) &&
    Number.isFinite(bookingLng) &&
    Number.isFinite(cleanerLat) &&
    Number.isFinite(cleanerLng)
  ) {
    return {
      kind: "haversine",
      distanceKm: haversineKm(
        { latitude: bookingLat, longitude: bookingLng },
        { latitude: cleanerLat, longitude: cleanerLng },
      ),
    };
  }

  const bp = normalizePostal(bookingPostal);
  const cp = normalizePostal(cleanerPostal);
  if (bp && cp) {
    if (bp === cp) {
      return { kind: "postal", distanceKm: 2, matchLevel: "exact" };
    }
    // US ZIP5 prefix heuristic
    if (bp.length >= 3 && cp.length >= 3 && bp.slice(0, 3) === cp.slice(0, 3)) {
      return { kind: "postal", distanceKm: 15, matchLevel: "prefix" };
    }
  }

  const bookingKey = cityStateKey(bookingCity, bookingState);
  const cleanerKey = cityStateKey(cleanerCity, cleanerState);
  if (
    bookingKey !== "|" &&
    cleanerKey !== "|" &&
    bookingKey === cleanerKey
  ) {
    return { kind: "city_state", distanceKm: 20 };
  }

  return { kind: "unknown" };
}

/** True when booking postal/city is inside an active platform service area. */
export function isInServiceArea(input: {
  postalCode: string | null;
  city: string | null;
  state: string | null;
  serviceAreaPostalCodes: Set<string>;
  serviceAreaCityStates: Set<string>;
}): boolean {
  const postal = normalizePostal(input.postalCode);
  if (postal && input.serviceAreaPostalCodes.has(postal)) return true;

  const key = cityStateKey(input.city, input.state);
  if (key !== "|" && input.serviceAreaCityStates.has(key)) return true;

  // No configured areas → do not hard-fail distance (caller treats as open market).
  if (input.serviceAreaPostalCodes.size === 0 && input.serviceAreaCityStates.size === 0) {
    return true;
  }

  return false;
}
