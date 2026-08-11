import { describe, expect, it, vi, afterEach } from "vitest";
import {
  geolocationErrorReason,
  locationFailureMessage,
  queryGeolocationPermission,
  LOCATION_FINDING_MESSAGE,
} from "@/lib/addresses/geolocation";

describe("locationFailureMessage", () => {
  it("uses exact permission-denied customer copy", () => {
    expect(locationFailureMessage("permission_denied")).toBe(
      "Location is turned off. Allow location access or enter your address.",
    );
  });

  it("uses exact unavailable / geocode / unknown customer copy", () => {
    const unavailable = "We couldn't find your location. Try again or enter your address.";
    expect(locationFailureMessage("position_unavailable")).toBe(unavailable);
    expect(locationFailureMessage("geocode_failed")).toBe(unavailable);
    expect(locationFailureMessage("unknown")).toBe(unavailable);
  });

  it("uses exact timeout customer copy", () => {
    expect(locationFailureMessage("timeout")).toBe(
      "Location is taking too long. Enter your address instead.",
    );
  });

  it("never surfaces technical geolocation error names", () => {
    const reasons = [
      "unsupported",
      "maps_unavailable",
      "geocode_failed",
      "permission_denied",
      "position_unavailable",
      "timeout",
      "unknown",
    ] as const;
    for (const reason of reasons) {
      const message = locationFailureMessage(reason);
      expect(message).not.toMatch(/GeolocationPositionError|PERMISSION_DENIED|POSITION_UNAVAILABLE|TIMEOUT|code\s*[:=]/i);
    }
  });

  it("exposes the finding-location loading copy", () => {
    expect(LOCATION_FINDING_MESSAGE).toBe("Finding your location...");
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
