/** Browser GeolocationPositionError.code values (1–3). */
export type GeolocationErrorCode = 1 | 2 | 3;

export type LocationFailureReason =
  | "unsupported"
  | "maps_unavailable"
  | "geocode_failed"
  | "permission_denied"
  | "position_unavailable"
  | "timeout"
  | "unknown";

export type GeolocationPermissionState = "granted" | "denied" | "prompt" | "unknown";

/** Shown while the browser Geolocation API is in flight. */
export const LOCATION_FINDING_MESSAGE = "Finding your location...";

/** Customer-facing copy for current-location failures (no raw API dumps). */
export function locationFailureMessage(reason: LocationFailureReason): string {
  switch (reason) {
    case "unsupported":
      return "Location isn’t supported in this browser. Enter your address instead.";
    case "maps_unavailable":
      return "Location lookup isn’t ready yet. Try again in a moment, or enter your address.";
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
