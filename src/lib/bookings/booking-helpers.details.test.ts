import { describe, expect, it } from "vitest";
import {
  buildAddressStatePatch,
  validateDetailsState,
} from "@/lib/bookings/booking-helpers";
import { isDetailsComplete } from "@/lib/bookings/booking-routes";
import { DEFAULT_BOOKING_STATE, type BookingState } from "@/lib/bookings/booking-state";
import { definedBookingPatch } from "@/hooks/use-booking-state";

describe("details continue / prefill sync", () => {
  it("omits undefined keys so URL prefill cannot wipe beds/baths/sqft", () => {
    const patch = definedBookingPatch({
      line1: "100 King St W",
      bedrooms: undefined,
      bathrooms: undefined,
      squareFootage: undefined,
      step: 6,
    });
    expect(patch).toEqual({ line1: "100 King St W", step: 6 });
    expect("bedrooms" in patch).toBe(false);

    const merged: BookingState = {
      ...DEFAULT_BOOKING_STATE,
      ...patch,
      propertyType: "office",
      line1: "100 King St W",
      city: "Toronto",
      state: "ON",
      postalCode: "M5H 1A1",
      country: "CA",
      marketId: "TORONTO_GTA",
      inServiceArea: true,
    };
    expect(merged.bedrooms).toBe(2);
    expect(merged.bathrooms).toBe(2);
    expect(merged.squareFootage).toBe(1500);
  });

  it("writes synced beds/baths/sqft so guard matches validate on Continue", () => {
    const state: BookingState = {
      ...DEFAULT_BOOKING_STATE,
      propertyType: "office",
      bedrooms: undefined,
      bathrooms: undefined,
      squareFootage: undefined,
      serviceType: "office",
      serviceAnswers: { businessType: "office" },
    };

    // Raw state fails the route guard (undefined sqft).
    expect(isDetailsComplete(state)).toBe(false);

    const result = validateDetailsState(state);
    expect(result.ok).toBe(true);
    expect(result.synced).toEqual({
      bedrooms: 0,
      bathrooms: 1,
      squareFootage: 1500,
    });

    const afterContinue = { ...state, ...result.synced };
    expect(isDetailsComplete(afterContinue)).toBe(true);
  });

  it("does not sticky-false out-of-area on partial address patches", () => {
    const current: BookingState = {
      ...DEFAULT_BOOKING_STATE,
      line1: "100 King St W",
      city: "Toronto",
      state: "ON",
      postalCode: "M5H 1A1",
      country: "CA",
      marketId: "TORONTO_GTA",
      zoneId: "zone_toronto_core",
      inServiceArea: true,
      marketName: "Toronto / GTA",
    };

    // Unit-only edit still merges against full address → stays in area.
    const unitEdit = buildAddressStatePatch(current, { line2: "5700" });
    expect(unitEdit.inServiceArea).toBe(true);
    expect(unitEdit.marketId).toBe("TORONTO_GTA");

    // Street-only typing with no city/postal yet must not clear market flags.
    const typingOnly = buildAddressStatePatch(DEFAULT_BOOKING_STATE, { line1: "100 King" });
    expect(typingOnly).toEqual({ line1: "100 King" });
    expect(typingOnly.inServiceArea).toBeUndefined();
    expect(typingOnly.marketId).toBeUndefined();
  });
});
