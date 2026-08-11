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

/** Customer-facing copy for current-location failures (no raw API dumps). */
export function locationFailureMessage(reason: LocationFailureReason): string {
  switch (reason) {
    case "unsupported":
      return "Location isn’t supported in this browser. Enter your address instead.";
    case "maps_unavailable":
      return "Location lookup isn’t ready yet. Try again in a moment, or enter your address.";
    case "geocode_failed":
      return "We couldn’t find an address for your location. Enter it manually.";
    case "permission_denied":
      return "Location access was blocked. Allow location for this site, or enter your address.";
    case "position_unavailable":
      return "We couldn’t determine your location. Check your device settings, or enter your address.";
    case "timeout":
      return "Finding your location took too long. Try again, or enter your address.";
    default:
      return "We couldn’t use your current location. Enter your address instead.";
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
