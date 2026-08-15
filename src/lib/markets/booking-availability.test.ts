import { describe, expect, it } from "vitest";
import {
  isMarketBookingOpen,
  resolveWaitlistReason,
} from "@/lib/markets/booking-availability";

describe("booking availability / waitlist reason", () => {
  it("treats launch markets as booking-closed by default config", () => {
    expect(isMarketBookingOpen("TORONTO_GTA")).toBe(false);
    expect(isMarketBookingOpen("SOUTH_FLORIDA")).toBe(false);
  });

  it("returns out_of_area when address is outside service area", () => {
    expect(
      resolveWaitlistReason({
        line1: "1 Main St",
        postalCode: "99999",
        inServiceArea: false,
        marketId: null,
      }),
    ).toBe("out_of_area");
  });

  it("returns booking_disabled when in market but booking flag off", () => {
    expect(
      resolveWaitlistReason({
        line1: "1 Queen St",
        postalCode: "M5V1A1",
        inServiceArea: true,
        marketId: "TORONTO_GTA",
      }),
    ).toBe("booking_disabled");
  });

  it("returns null when address incomplete", () => {
    expect(
      resolveWaitlistReason({
        line1: "1 Queen St",
        postalCode: "",
        inServiceArea: true,
        marketId: "TORONTO_GTA",
      }),
    ).toBeNull();
  });
});
