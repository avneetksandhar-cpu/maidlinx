import { describe, expect, it } from "vitest";
import {
  isCustomerHomeBookableArea,
  isMarketBookingOpen,
  resolveCustomerHomeWaitlistReason,
  resolveWaitlistReason,
} from "@/lib/markets/booking-availability";

describe("booking availability / waitlist reason", () => {
  it("opens South Florida booking while keeping GTA closed", () => {
    expect(isMarketBookingOpen("TORONTO_GTA")).toBe(false);
    expect(isMarketBookingOpen("SOUTH_FLORIDA")).toBe(true);
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

  it("returns null when no location signal yet", () => {
    expect(
      resolveWaitlistReason({
        line1: "",
        postalCode: "",
        inServiceArea: true,
        marketId: "TORONTO_GTA",
      }),
    ).toBeNull();
  });

  it("returns null for ZIP-only South Florida when booking flag on", () => {
    expect(
      resolveWaitlistReason({
        line1: null,
        postalCode: "33139",
        inServiceArea: true,
        marketId: "SOUTH_FLORIDA",
      }),
    ).toBeNull();
  });
});

describe("customer Home waitlist (South Florida only)", () => {
  it("treats recognized GTA as out_of_area — no GTA booking promise on Home", () => {
    expect(
      resolveCustomerHomeWaitlistReason({
        line1: "1 Queen St",
        postalCode: "M5V 1A1",
        inServiceArea: true,
        marketId: "TORONTO_GTA",
      }),
    ).toBe("out_of_area");
    expect(
      isCustomerHomeBookableArea({ inServiceArea: true, marketId: "TORONTO_GTA" }),
    ).toBe(false);
  });

  it("allows covered South Florida through when booking flag on", () => {
    expect(
      resolveCustomerHomeWaitlistReason({
        postalCode: "33139",
        inServiceArea: true,
        marketId: "SOUTH_FLORIDA",
      }),
    ).toBeNull();
    expect(
      isCustomerHomeBookableArea({ inServiceArea: true, marketId: "SOUTH_FLORIDA" }),
    ).toBe(true);
  });

  it("returns out_of_area for unsupported ZIP", () => {
    expect(
      resolveCustomerHomeWaitlistReason({
        postalCode: "90210",
        inServiceArea: false,
        marketId: null,
      }),
    ).toBe("out_of_area");
  });
});
