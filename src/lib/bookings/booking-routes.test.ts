import { describe, expect, it } from "vitest";
import {
  BOOKING_SCREEN_PATHS,
  getBookingEntryPath,
  getGuardRedirect,
  getNextScreen,
  getPreviousScreen,
  isAddressComplete,
  isDetailsComplete,
  isReviewReady,
  isScheduleComplete,
} from "@/lib/bookings/booking-routes";
import { DEFAULT_BOOKING_STATE, type BookingState } from "@/lib/bookings/booking-state";
import {
  BOOKING_RESUME_AFTER_AUTH,
  bookingSignInHref,
  isBookingAuthRequired,
} from "@/lib/bookings/booking-auth";

function baseAddress(overrides: Partial<BookingState> = {}): BookingState {
  return {
    ...DEFAULT_BOOKING_STATE,
    line1: "123 King St W",
    city: "Toronto",
    state: "ON",
    postalCode: "M5H 1A1",
    country: "CA",
    marketId: "TORONTO_GTA",
    inServiceArea: true,
    ...overrides,
  };
}

describe("booking route guards (address-first)", () => {
  it("starts at address", () => {
    expect(getBookingEntryPath()).toBe(BOOKING_SCREEN_PATHS.address);
  });

  it("allows address without category", () => {
    expect(getGuardRedirect("address", DEFAULT_BOOKING_STATE)).toBeNull();
    expect(getGuardRedirect("welcome", DEFAULT_BOOKING_STATE)).toBeNull();
  });

  it("requires address before category", () => {
    expect(getGuardRedirect("property", DEFAULT_BOOKING_STATE)).toBe(
      BOOKING_SCREEN_PATHS.address,
    );
  });

  it("requires category before service when address is set", () => {
    expect(getGuardRedirect("service", baseAddress())).toBe(BOOKING_SCREEN_PATHS.property);
  });

  it("allows category when address is complete", () => {
    expect(getGuardRedirect("property", baseAddress())).toBeNull();
  });

  it("advances address → property", () => {
    expect(getNextScreen("address", baseAddress())).toBe("property");
    expect(getPreviousScreen("property", baseAddress())).toBe("address");
  });

  it("requires address before details", () => {
    const state = {
      ...DEFAULT_BOOKING_STATE,
      propertyType: "house" as const,
      serviceType: "standard" as const,
      serviceTierId: "standard",
    };
    expect(getGuardRedirect("details", state)).toBe(BOOKING_SCREEN_PATHS.address);
  });

  it("skips addons for quote-only services", () => {
    const state = baseAddress({
      propertyType: "post_construction",
      bedrooms: 0,
      bathrooms: 1,
      squareFootage: 1500,
      serviceType: "post_construction",
      serviceTierId: "pro",
    });
    expect(getNextScreen("service", state)).toBe("details");
    expect(getGuardRedirect("addons", state)).toBe(BOOKING_SCREEN_PATHS.date);
    expect(getPreviousScreen("date", state)).toBe("details");
  });

  it("blocks payment until schedule is complete", () => {
    const state = baseAddress({
      propertyType: "house",
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 1500,
      serviceType: "standard",
      serviceTierId: "standard",
      extras: [],
    });
    expect(isScheduleComplete(state)).toBe(false);
    expect(getGuardRedirect("payment", state)).toBe(BOOKING_SCREEN_PATHS.date);
  });

  it("splits date → time → access → review", () => {
    const withDate = baseAddress({
      propertyType: "house",
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 1500,
      serviceType: "standard",
      serviceTierId: "standard",
      extras: [],
      schedulePreset: "tomorrow",
      date: "2026-08-12",
    });
    expect(getNextScreen("date", withDate)).toBe("time");
    expect(getGuardRedirect("time", withDate)).toBeNull();
    expect(getGuardRedirect("access", withDate)).toBe(BOOKING_SCREEN_PATHS.time);

    const withTime = { ...withDate, arrivalWindow: "morning" as const };
    expect(getNextScreen("time", withTime)).toBe("access");
    expect(getGuardRedirect("access", withTime)).toBeNull();
    expect(getNextScreen("access", withTime)).toBe("review");
  });

  it("skips time for ASAP", () => {
    const state = baseAddress({
      propertyType: "house",
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 1500,
      serviceType: "standard",
      serviceTierId: "standard",
      extras: [],
      schedulePreset: "asap",
      date: "2026-08-11",
      arrivalWindow: "afternoon",
    });
    expect(getNextScreen("date", state)).toBe("access");
    expect(getGuardRedirect("time", state)).toBe(BOOKING_SCREEN_PATHS.access);
    expect(getPreviousScreen("access", state)).toBe("date");
  });

  it("allows review when full draft is ready", () => {
    const state = baseAddress({
      propertyType: "house",
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 1500,
      serviceType: "standard",
      serviceTierId: "standard",
      extras: [],
      schedulePreset: "tomorrow",
      date: "2026-08-11",
      arrivalWindow: "morning",
    });
    expect(isAddressComplete(state)).toBe(true);
    expect(isDetailsComplete(state)).toBe(true);
    expect(isReviewReady(state)).toBe(true);
    expect(getGuardRedirect("review", state)).toBeNull();
    expect(getGuardRedirect("payment", state)).toBeNull();
  });

  it("requires move direction for move properties", () => {
    const incomplete = baseAddress({
      propertyType: "move",
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 1500,
      serviceAnswers: {},
    });
    expect(isDetailsComplete(incomplete)).toBe(false);

    const complete = {
      ...incomplete,
      serviceAnswers: { moveDirection: "move_out" },
    };
    expect(isDetailsComplete(complete)).toBe(true);
  });

  it("gates auth after address (property+), not on address itself", () => {
    expect(isBookingAuthRequired("address")).toBe(false);
    expect(isBookingAuthRequired("welcome")).toBe(false);
    expect(isBookingAuthRequired("property")).toBe(true);
    expect(isBookingAuthRequired("payment")).toBe(true);
    expect(BOOKING_RESUME_AFTER_AUTH).toBe(BOOKING_SCREEN_PATHS.property);
    expect(bookingSignInHref()).toContain("from=booking");
    expect(bookingSignInHref()).toContain(encodeURIComponent(BOOKING_SCREEN_PATHS.property));
  });
});
