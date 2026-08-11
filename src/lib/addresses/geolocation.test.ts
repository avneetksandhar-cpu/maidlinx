import { describe, expect, it } from "vitest";
import {
  geolocationErrorReason,
  locationFailureMessage,
} from "@/lib/addresses/geolocation";

describe("locationFailureMessage", () => {
  it("returns permission guidance without raw error text", () => {
    const message = locationFailureMessage("permission_denied");
    expect(message).toMatch(/blocked/i);
    expect(message).not.toMatch(/GeolocationPositionError|PERMISSION_DENIED|code/i);
  });

  it("covers timeout and unsupported cases", () => {
    expect(locationFailureMessage("timeout")).toMatch(/too long/i);
    expect(locationFailureMessage("unsupported")).toMatch(/supported/i);
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
