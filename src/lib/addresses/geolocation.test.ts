import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import {
  ensureGoogleMapsLoaded,
  geocodeFailureReason,
  geolocationErrorReason,
  locationFailureMessage,
  queryGeolocationPermission,
  LOCATION_FINDING_MESSAGE,
} from "@/lib/addresses/geolocation";

describe("locationFailureMessage", () => {
  it("uses exact permission-denied customer copy", () => {
    expect(locationFailureMessage("permission_denied")).toBe(
      "Location is blocked for this site. Reset location permission in your browser settings, or enter your address.",
    );
  });

  it("uses exact unavailable / geocode / unknown customer copy", () => {
    const unavailable = "We couldn't find your location. Try again or enter your address.";
    expect(locationFailureMessage("position_unavailable")).toBe(unavailable);
    expect(locationFailureMessage("geocode_failed")).toBe(unavailable);
    expect(locationFailureMessage("unknown")).toBe(unavailable);
  });

  it("uses a non-retry-loop message for maps denial (billing / API denied)", () => {
    const message = locationFailureMessage("maps_denied");
    expect(message).toBe("We couldn't find your location. Enter your address instead.");
    expect(message).not.toMatch(/ready yet|moment/i);
  });

  it("uses exact timeout customer copy", () => {
    expect(locationFailureMessage("timeout")).toBe(
      "Location is taking too long. Enter your address instead.",
    );
  });

  it("keeps maps_unavailable as a one-time transient message", () => {
    expect(locationFailureMessage("maps_unavailable")).toBe(
      "Location lookup isn’t ready yet. Try again in a moment, or enter your address.",
    );
  });

  it("never surfaces technical geolocation error names", () => {
    const reasons = [
      "unsupported",
      "maps_unavailable",
      "maps_denied",
      "geocode_failed",
      "permission_denied",
      "position_unavailable",
      "timeout",
      "unknown",
    ] as const;
    for (const reason of reasons) {
      const message = locationFailureMessage(reason);
      expect(message).not.toMatch(
        /GeolocationPositionError|PERMISSION_DENIED|POSITION_UNAVAILABLE|TIMEOUT|REQUEST_DENIED|BillingNotEnabled|code\s*[:=]/i,
      );
    }
  });

  it("exposes the finding-location loading copy", () => {
    expect(LOCATION_FINDING_MESSAGE).toBe("Finding your location...");
  });
});

describe("geocodeFailureReason", () => {
  it("maps billing / API denial away from transient maps_unavailable", () => {
    expect(geocodeFailureReason("REQUEST_DENIED")).toBe("maps_denied");
    expect(geocodeFailureReason("OVER_QUERY_LIMIT")).toBe("maps_denied");
    expect(locationFailureMessage(geocodeFailureReason("REQUEST_DENIED"))).not.toMatch(
      /ready yet|moment/i,
    );
  });

  it("maps other geocoder failures to geocode_failed", () => {
    expect(geocodeFailureReason("ZERO_RESULTS")).toBe("geocode_failed");
    expect(geocodeFailureReason("INVALID_REQUEST")).toBe("geocode_failed");
    expect(geocodeFailureReason("UNKNOWN_ERROR")).toBe("geocode_failed");
    expect(geocodeFailureReason("ERROR")).toBe("geocode_failed");
    expect(geocodeFailureReason("something_else")).toBe("geocode_failed");
  });
});

describe("geolocationErrorReason", () => {
  it("maps browser error codes", () => {
    expect(geolocationErrorReason({ code: 1 })).toBe("permission_denied");
    expect(geolocationErrorReason({ code: 2 })).toBe("position_unavailable");
    expect(geolocationErrorReason({ code: 3 })).toBe("timeout");
    expect(geolocationErrorReason({ code: 99 })).toBe("unknown");
  });
});

describe("ensureGoogleMapsLoaded", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    // Clean any google stub left on window.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).google;
  });

  it("resolves ready immediately when Geocoder is present", async () => {
    vi.stubGlobal("window", globalThis);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).google = { maps: { Geocoder: function Geocoder() {} } };
    await expect(ensureGoogleMapsLoaded()).resolves.toBe("ready");
  });

  it("returns timeout when Maps never appears", async () => {
    vi.stubGlobal("window", globalThis);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).google;

    const pending = ensureGoogleMapsLoaded({ timeoutMs: 300 });
    await vi.advanceTimersByTimeAsync(400);
    await expect(pending).resolves.toBe("timeout");
  });

  it("returns unavailable when maps object exists but Geocoder never becomes usable", async () => {
    vi.stubGlobal("window", globalThis);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).google = { maps: {} };

    const pending = ensureGoogleMapsLoaded({ timeoutMs: 300 });
    await vi.advanceTimersByTimeAsync(400);
    await expect(pending).resolves.toBe("unavailable");
  });

  it("waits until Geocoder appears", async () => {
    vi.stubGlobal("window", globalThis);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).google = { maps: {} };

    const pending = ensureGoogleMapsLoaded({ timeoutMs: 2_000 });
    await vi.advanceTimersByTimeAsync(150);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).google.maps.Geocoder = function Geocoder() {};
    await vi.advanceTimersByTimeAsync(150);
    await expect(pending).resolves.toBe("ready");
  });
});

describe("queryGeolocationPermission", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns denied without prompting when Permissions API reports denied", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {},
      permissions: {
        query: vi.fn().mockResolvedValue({ state: "denied" }),
      },
    });
    await expect(queryGeolocationPermission()).resolves.toBe("denied");
  });

  it("returns unknown when Permissions API is missing", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {},
    });
    await expect(queryGeolocationPermission()).resolves.toBe("unknown");
  });
});
