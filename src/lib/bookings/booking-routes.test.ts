import { describe, expect, it } from "vitest";
import {
  BOOKING_SCREEN_PATHS,
  getBookingEntryPath,
  getGuardRedirect,
  getNextScreen,
  getPreviousScreen,
  isAddressComplete,
  isCleanPanelComplete,
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
    city: "Miami",
    state: "FL",
    postalCode: "33130",
    country: "US",
    marketId: "SOUTH_FLORIDA",
    inServiceArea: true,
    ...overrides,
  };
}

function cleanReady(overrides: Partial<BookingState> = {}): BookingState {
  return baseAddress({
    propertyType: "house",
    bedrooms: 2,
    bathrooms: 1,
    squareFootage: 1500,
    serviceType: "standard",
    serviceTierId: "standard",
    extras: ["inside_oven"],
    ...overrides,
  });
}

describe("booking route guards (4-panel address-first)", () => {
  it("starts at address", () => {
    expect(getBookingEntryPath()).toBe(BOOKING_SCREEN_PATHS.address);
  });

  it("allows address without category", () => {
    expect(getGuardRedirect("address", DEFAULT_BOOKING_STATE)).toBeNull();
    expect(getGuardRedirect("welcome", DEFAULT_BOOKING_STATE)).toBeNull();
  });

  it("collapses property into choose-clean when address is set", () => {
    expect(getGuardRedirect("property", baseAddress())).toBe(BOOKING_SCREEN_PATHS.service);
  });

  it("requires address before choose-clean", () => {
    expect(getGuardRedirect("service", DEFAULT_BOOKING_STATE)).toBe(
      BOOKING_SCREEN_PATHS.address,
    );
  });

  it("allows choose-clean when address is complete", () => {
    expect(getGuardRedirect("service", baseAddress())).toBeNull();
  });

  it("advances address → service → details → date → review", () => {
    expect(getNextScreen("address", baseAddress())).toBe("service");
    expect(getPreviousScreen("service", baseAddress())).toBe("address");
    expect(getNextScreen("service", cleanReady())).toBe("details");
    expect(getPreviousScreen("details", cleanReady())).toBe("service");
    expect(getNextScreen("details", cleanReady())).toBe("date");
    expect(getPreviousScreen("date", cleanReady())).toBe("details");
    expect(getNextScreen("date", cleanReady())).toBe("review");
    expect(getPreviousScreen("review", cleanReady())).toBe("date");
  });

  it("collapses time/access into arrival panel", () => {
    expect(getGuardRedirect("time", cleanReady())).toBe(BOOKING_SCREEN_PATHS.date);
    expect(
      getGuardRedirect(
        "access",
        cleanReady({ date: "2026-11-12", arrivalWindow: "afternoon", schedulePreset: "asap" }),
      ),
    ).toBe(BOOKING_SCREEN_PATHS.date);
  });

  it("allows make-it-yours (details) when service selected; collapses addons there", () => {
    expect(getGuardRedirect("details", cleanReady())).toBeNull();
    expect(getGuardRedirect("addons", cleanReady())).toBe(BOOKING_SCREEN_PATHS.details);
  });

  it("blocks payment until schedule is complete", () => {
    const state = cleanReady();
    expect(isScheduleComplete(state)).toBe(false);
    expect(getGuardRedirect("payment", state)).toBe(BOOKING_SCREEN_PATHS.date);
  });

  it("allows review when clean + schedule complete", () => {
    const state = cleanReady({
      date: "2026-11-12",
      arrivalWindow: "afternoon",
      schedulePreset: "asap",
    });
    expect(isCleanPanelComplete(state)).toBe(true);
    expect(isReviewReady(state)).toBe(true);
    expect(getGuardRedirect("review", state)).toBeNull();
  });

  it("validates details completeness", () => {
    expect(isDetailsComplete(cleanReady())).toBe(true);
    expect(
      isDetailsComplete(
        baseAddress({
          propertyType: "house",
          bedrooms: 2,
          bathrooms: 1,
          squareFootage: undefined,
        }),
      ),
    ).toBe(false);
  });

  it("gates auth at review — save booking before pay; sign-in never charges", () => {
    expect(isBookingAuthRequired("address")).toBe(false);
    expect(isBookingAuthRequired("service")).toBe(false);
    expect(isBookingAuthRequired("date")).toBe(false);
    expect(isBookingAuthRequired("review")).toBe(true);
    expect(isBookingAuthRequired("payment")).toBe(true);
    expect(BOOKING_RESUME_AFTER_AUTH).toBe(BOOKING_SCREEN_PATHS.review);
    expect(bookingSignInHref()).toContain("from=booking");
    expect(bookingSignInHref()).toContain(encodeURIComponent(BOOKING_SCREEN_PATHS.review));
  });

  it("recognizes complete addresses", () => {
    expect(isAddressComplete(baseAddress())).toBe(true);
    expect(isAddressComplete(DEFAULT_BOOKING_STATE)).toBe(false);
  });
});
