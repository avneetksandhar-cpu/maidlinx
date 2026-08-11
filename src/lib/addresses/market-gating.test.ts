import { describe, expect, it } from "vitest";
import { resolveServiceArea } from "@/lib/service-area";
import { structuredToBookingAddress } from "@/lib/addresses/map";
import type { StructuredAddress } from "@/lib/addresses/types";

function gateAfterAddressSelect(address: StructuredAddress) {
  const booking = structuredToBookingAddress(address);
  const area = resolveServiceArea({
    postalCode: booking.postalCode,
    city: booking.city,
    state: booking.state,
    country: booking.country,
  });
  return {
    booking,
    ...area,
    canContinuePaidBooking: Boolean(area.inServiceArea && area.marketId && area.zoneId),
    message: area.inServiceArea
      ? "Great — MaidLinx is available in your area."
      : "We're not in your area yet.",
  };
}

describe("market gating after address select", () => {
  it("lets a Toronto King St selection continue without retyping city/postal", () => {
    const selected: StructuredAddress = {
      formattedAddress: "100 King St W, Toronto, ON M5X 1A9, Canada",
      addressLine1: "100 King St W",
      city: "Toronto",
      region: "ON",
      postalCode: "M5X 1A9",
      country: "CA",
      countryCode: "CA",
      latitude: 43.6487,
      longitude: -79.3817,
      placeId: "ChIJ_fake_king",
    };

    const result = gateAfterAddressSelect(selected);

    expect(result.booking.line1).toBe("100 King St W");
    expect(result.booking.city).toBe("Toronto");
    expect(result.booking.postalCode).toBe("M5X 1A9");
    expect(result.booking.state).toBe("ON");
    expect(result.inServiceArea).toBe(true);
    expect(result.marketId).toBe("TORONTO_GTA");
    expect(result.zoneId).toBe("zone_toronto_core");
    expect(result.canContinuePaidBooking).toBe(true);
    expect(result.message).toMatch(/available in your area/);
  });

  it("blocks paid booking outside supported markets", () => {
    const selected: StructuredAddress = {
      addressLine1: "1200 5th Ave",
      city: "Seattle",
      region: "WA",
      postalCode: "98101",
      country: "US",
      countryCode: "US",
      placeId: "ChIJ_fake_sea",
    };

    const result = gateAfterAddressSelect(selected);
    expect(result.inServiceArea).toBe(false);
    expect(result.canContinuePaidBooking).toBe(false);
    expect(result.message).toMatch(/not in your area/);
  });

  it("supports South Florida without city hardcodes in the booking layer", () => {
    const selected: StructuredAddress = {
      addressLine1: "1 Ocean Dr",
      city: "Miami Beach",
      region: "FL",
      postalCode: "33139",
      country: "US",
      countryCode: "US",
    };

    const result = gateAfterAddressSelect(selected);
    expect(result.marketId).toBe("SOUTH_FLORIDA");
    expect(result.canContinuePaidBooking).toBe(true);
  });
});

describe("returning customer saved Home populate", () => {
  it("maps a saved Home into booking fields without needing Google again", () => {
    const home: StructuredAddress = {
      formattedAddress: "100 King St W, Toronto, ON M5X 1A9, Canada",
      addressLine1: "100 King St W",
      unit: "4200",
      city: "Toronto",
      region: "ON",
      postalCode: "M5X 1A9",
      country: "CA",
      countryCode: "CA",
      latitude: 43.6487,
      longitude: -79.3817,
      placeId: "ChIJ_saved_home",
    };

    const booking = structuredToBookingAddress(home);
    expect(booking.line1).toBe("100 King St W");
    expect(booking.line2).toBe("4200");
    expect(booking.googlePlaceId).toBe("ChIJ_saved_home");
    expect(booking.latitude).toBe(43.6487);

    const area = resolveServiceArea({
      postalCode: booking.postalCode,
      city: booking.city,
      state: booking.state,
      country: booking.country,
    });
    expect(area.inServiceArea).toBe(true);
    expect(area.marketId).toBe("TORONTO_GTA");
  });
});
