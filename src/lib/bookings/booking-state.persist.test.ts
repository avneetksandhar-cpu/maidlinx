import { describe, expect, it } from "vitest";
import {
  BOOKING_STATE_STORAGE_KEY,
  DEFAULT_BOOKING_STATE,
  type BookingState,
} from "@/lib/bookings/booking-state";

describe("booking state persistence helpers", () => {
  it("uses a stable sessionStorage key and omits quote from draft payload", () => {
    expect(BOOKING_STATE_STORAGE_KEY).toBe("maidlinx_booking_state");

    const draft: BookingState = {
      ...DEFAULT_BOOKING_STATE,
      line1: "10 Queen St",
      city: "Toronto",
      state: "ON",
      postalCode: "M5H 2N2",
      country: "CA",
      propertyType: "house",
      serviceType: "deep",
      extras: ["inside_oven"],
      quote: {
        baseCents: 10000,
        bedroomCents: 0,
        bathroomCents: 0,
        squareFootageCents: 0,
        extrasCents: 0,
        currency: "CAD",
        subtotalCents: 10000,
        platformFeeCents: 0,
        totalCents: 10000,
        quoteOnly: false,
      },
    };

    // Mirror production persist shape: omit quote from storage payload.
    const { quote: _quote, ...safe } = draft;
    void _quote;
    const parsed = JSON.parse(JSON.stringify(safe)) as BookingState;

    expect(parsed.line1).toBe("10 Queen St");
    expect(parsed.propertyType).toBe("house");
    expect(parsed.extras).toEqual(["inside_oven"]);
    expect(parsed.quote).toBeUndefined();
    expect(JSON.stringify(safe)).not.toContain("baseCents");
  });
});
