/** Browser GeolocationPositionError.code values (1–3). */
export type GeolocationErrorCode = 1 | 2 | 3;

export type LocationFailureReason =
  | "unsupported"
  | "maps_unavailable"
  | "maps_denied"
  | "geocode_failed"
  | "permission_denied"
  | "position_unavailable"
  | "timeout"
  | "unknown";

export type GeolocationPermissionState = "granted" | "denied" | "prompt" | "unknown";

export type GoogleMapsLoadResult = "ready" | "timeout" | "unavailable";

/** Shown while the browser Geolocation API is in flight. */
export const LOCATION_FINDING_MESSAGE = "Finding your location...";

const DEFAULT_MAPS_WAIT_MS = 8_000;
const MAPS_POLL_MS = 100;

/** Customer-facing copy for current-location failures (no raw API dumps). */
export function locationFailureMessage(reason: LocationFailureReason): string {
  switch (reason) {
    case "unsupported":
      return "Location isn’t supported in this browser. Enter your address instead.";
    case "maps_unavailable":
      return "Location lookup isn’t ready yet. Try again in a moment, or enter your address.";
    case "maps_denied":
      return "We couldn't find your location. Enter your address instead.";
    case "geocode_failed":
      return "We couldn't find your location. Try again or enter your address.";
    case "permission_denied":
      return "Location is blocked for this site. Reset location permission in your browser settings, or enter your address.";
    case "position_unavailable":
      return "We couldn't find your location. Try again or enter your address.";
    case "timeout":
      return "Location is taking too long. Enter your address instead.";
    default:
      return "We couldn't find your location. Try again or enter your address.";
  }
}

export function geolocationErrorReason(
  error: Pick<GeolocationPositionError, "code"> | { code: number },
): LocationFailureReason {
  switch (error.code) {
    case 1:
      return "permission_denied";
    case 2:
      return "position_unavailable";
    case 3:
      return "timeout";
    default:
      return "unknown";
  }
}

/**
 * Map Google Geocoder / Places denial statuses to customer-facing reasons.
 * REQUEST_DENIED (billing, API not enabled, key restrictions) must not look like a transient race.
 */
export function geocodeFailureReason(
  status: string | null | undefined,
): LocationFailureReason {
  switch (status) {
    case "REQUEST_DENIED":
    case "OVER_QUERY_LIMIT":
      return "maps_denied";
    case "ZERO_RESULTS":
    case "INVALID_REQUEST":
    case "UNKNOWN_ERROR":
    case "ERROR":
      return "geocode_failed";
    default:
      return "geocode_failed";
  }
}

function mapsGeocoderReady(): boolean {
  return Boolean(
    typeof window !== "undefined" &&
      window.google?.maps &&
      typeof window.google.maps.Geocoder === "function",
  );
}

/**
 * Wait until the Maps JS Geocoder is usable (script load race), with timeout.
 * Optionally loads the geocoding library via importLibrary when available.
 */
export async function ensureGoogleMapsLoaded(
  options?: { timeoutMs?: number },
): Promise<GoogleMapsLoadResult> {
  if (typeof window === "undefined") return "unavailable";

  if (mapsGeocoderReady()) return "ready";

  const timeoutMs = options?.timeoutMs ?? DEFAULT_MAPS_WAIT_MS;

  // Prefer the modular loader when present (weekly Maps JS).
  const mapsWithImport = window.google?.maps as
    | (typeof google.maps & {
        importLibrary?: (name: string) => Promise<unknown>;
      })
    | undefined;

  if (typeof mapsWithImport?.importLibrary === "function") {
    try {
      await mapsWithImport.importLibrary("geocoding");
      if (mapsGeocoderReady()) return "ready";
    } catch {
      // Fall through to poll — Geocoder may still appear via places/core script.
    }
    try {
      await mapsWithImport.importLibrary("places");
      if (mapsGeocoderReady()) return "ready";
    } catch {
      // Continue polling.
    }
  }

  if (mapsGeocoderReady()) return "ready";

  return new Promise((resolve) => {
    const started = Date.now();
    const interval = window.setInterval(() => {
      if (mapsGeocoderReady()) {
        window.clearInterval(interval);
        resolve("ready");
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        window.clearInterval(interval);
        // Script never appeared vs loaded-but-broken (auth/billing).
        const mapsPresent = Boolean(window.google?.maps);
        resolve(mapsPresent ? "unavailable" : "timeout");
      }
    }, MAPS_POLL_MS);
  });
}

/**
 * Read the browser geolocation permission without triggering a prompt.
 * Returns "unknown" when the Permissions API is unavailable (e.g. some Safari versions).
 */
export async function queryGeolocationPermission(): Promise<GeolocationPermissionState> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return "unknown";
  }

  try {
    const permissions = navigator.permissions;
    if (!permissions?.query) return "unknown";
    const result = await permissions.query({ name: "geolocation" as PermissionName });
    if (result.state === "granted" || result.state === "denied" || result.state === "prompt") {
      return result.state;
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

export type ReverseGeocodeResult = {
  formattedAddress?: string;
  addressLine1: string;
  unit?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  streetNumber?: string;
  route?: string;
};

function latLngNumber(
  location: { lat(): number; lng(): number } | { lat: number; lng: number } | null | undefined,
): { lat: number; lng: number } | null {
  if (!location) return null;
  const lat =
    typeof (location as { lat: unknown }).lat === "function"
      ? (location as { lat(): number }).lat()
      : (location as { lat: number }).lat;
  const lng =
    typeof (location as { lng: unknown }).lng === "function"
      ? (location as { lng(): number }).lng()
      : (location as { lng: number }).lng;
  if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }
  return { lat, lng };
}

/** Parse Places API (New) Place → structured booking address fields. */
export function parsePlacesNewAddress(
  place: {
    id?: string;
    formattedAddress?: string;
    addressComponents?: Array<{
      longText?: string;
      shortText?: string;
      types: string[];
    }>;
    location?: { lat(): number; lng(): number } | { lat: number; lng: number };
  },
  existingUnit?: string,
): Omit<ReverseGeocodeResult, "latitude" | "longitude"> & {
  latitude?: number;
  longitude?: number;
} | null {
  const components = place.addressComponents ?? [];
  if (!components.length && !place.formattedAddress) return null;

  const get = (type: string) =>
    components.find((c) => c.types.includes(type))?.longText ?? "";
  const getShort = (type: string) =>
    components.find((c) => c.types.includes(type))?.shortText ?? "";

  const streetNumber = get("street_number");
  const route = get("route");
  const line1 =
    [streetNumber, route].filter(Boolean).join(" ") ||
    place.formattedAddress?.split(",")[0]?.trim() ||
    "";
  if (!line1) return null;

  const coords = latLngNumber(place.location);
  const subpremise = get("subpremise");

  return {
    formattedAddress: place.formattedAddress,
    addressLine1: line1,
    unit: subpremise || existingUnit || undefined,
    city:
      get("locality") ||
      get("postal_town") ||
      get("sublocality") ||
      get("administrative_area_level_2"),
    region: getShort("administrative_area_level_1"),
    postalCode: get("postal_code"),
    country: getShort("country") || "US",
    placeId: place.id,
    streetNumber: streetNumber || undefined,
    route: route || undefined,
    latitude: coords?.lat,
    longitude: coords?.lng,
  };
}

function parseLegacyGeocodeResult(
  place: google.maps.places.PlaceResult,
  existingUnit?: string,
): Omit<ReverseGeocodeResult, "latitude" | "longitude"> & {
  latitude?: number;
  longitude?: number;
} | null {
  if (!place.address_components?.length && !place.formatted_address) return null;

  const get = (type: string) =>
    place.address_components?.find((c) => c.types.includes(type))?.long_name ?? "";
  const getShort = (type: string) =>
    place.address_components?.find((c) => c.types.includes(type))?.short_name ?? "";

  const streetNumber = get("street_number");
  const route = get("route");
  const line1 =
    [streetNumber, route].filter(Boolean).join(" ") ||
    place.formatted_address?.split(",")[0]?.trim() ||
    "";
  if (!line1) return null;

  return {
    formattedAddress: place.formatted_address,
    addressLine1: line1,
    unit: get("subpremise") || existingUnit || undefined,
    city:
      get("locality") ||
      get("postal_town") ||
      get("sublocality") ||
      get("administrative_area_level_2"),
    region: getShort("administrative_area_level_1"),
    postalCode: get("postal_code"),
    country: getShort("country") || "US",
    placeId: place.place_id,
    streetNumber: streetNumber || undefined,
    route: route || undefined,
    latitude: place.geometry?.location?.lat(),
    longitude: place.geometry?.location?.lng(),
  };
}

async function reverseGeocodeViaGeocoder(
  latLng: { lat: number; lng: number },
  existingUnit?: string,
): Promise<ReverseGeocodeResult | null> {
  if (typeof google?.maps?.Geocoder !== "function") return null;

  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status !== "OK" || !results?.[0]) {
        resolve(null);
        return;
      }
      const parsed = parseLegacyGeocodeResult(results[0], existingUnit);
      if (!parsed?.addressLine1) {
        resolve(null);
        return;
      }
      resolve({
        ...parsed,
        latitude: latLng.lat,
        longitude: latLng.lng,
      });
    });
  });
}

/**
 * Places API (New) nearby search — used when Geocoding API is denied/unavailable.
 * Prefers a result that includes a street number.
 */
async function reverseGeocodeViaPlacesNearby(
  latLng: { lat: number; lng: number },
  existingUnit?: string,
): Promise<ReverseGeocodeResult | null> {
  if (typeof window === "undefined" || !window.google?.maps) return null;

  try {
    await google.maps.importLibrary("places");
    if (typeof google.maps.places.Place?.searchNearby !== "function") return null;

    const radii = [40, 80, 150];
    for (const radius of radii) {
      const { places } = await google.maps.places.Place.searchNearby({
        fields: ["formattedAddress", "addressComponents", "location", "id", "displayName"],
        locationRestriction: { center: latLng, radius },
        rankPreference: "DISTANCE",
        maxResultCount: 5,
      });
      if (!places?.length) continue;

      const withStreet =
        places.find((p) =>
          (p.addressComponents ?? []).some((c) => c.types.includes("street_number")),
        ) ?? places[0];
      if (!withStreet) continue;

      const parsed = parsePlacesNewAddress(withStreet, existingUnit);
      if (!parsed?.addressLine1) continue;

      return {
        ...parsed,
        latitude: latLng.lat,
        longitude: latLng.lng,
      };
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Reverse-geocode GPS coordinates to a structured street address.
 * Tries Geocoder first, then Places nearby (when Geocoding API is not enabled).
 * Never returns raw coordinates as the customer-facing address.
 */
export async function reverseGeocodeLatLng(
  latLng: { lat: number; lng: number },
  options?: { existingUnit?: string },
): Promise<{ ok: true; address: ReverseGeocodeResult } | { ok: false; reason: LocationFailureReason }> {
  const mapsLoad = await ensureGoogleMapsLoaded();
  if (mapsLoad !== "ready" && !window.google?.maps?.places) {
    return {
      ok: false,
      reason: mapsLoad === "timeout" ? "maps_unavailable" : "maps_denied",
    };
  }

  const fromGeocoder = await reverseGeocodeViaGeocoder(latLng, options?.existingUnit);
  if (fromGeocoder?.addressLine1) {
    return { ok: true, address: fromGeocoder };
  }

  const fromNearby = await reverseGeocodeViaPlacesNearby(latLng, options?.existingUnit);
  if (fromNearby?.addressLine1) {
    return { ok: true, address: fromNearby };
  }

  return { ok: false, reason: "geocode_failed" };
}
