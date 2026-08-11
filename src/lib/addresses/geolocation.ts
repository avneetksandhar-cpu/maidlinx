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
      return "Location is turned off. Allow location access or enter your address.";
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
