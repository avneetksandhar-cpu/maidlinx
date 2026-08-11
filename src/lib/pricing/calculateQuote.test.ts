import { describe, expect, it } from "vitest";
import { calculateBookingPrice, assertPriceMatch } from "@/lib/pricing/calculateQuote";
import type { BookingQuoteInput } from "@/lib/validations/booking-flow";

const baseInput: BookingQuoteInput = {
  line1: "100 Ocean Dr",
  city: "Miami Beach",
  state: "FL",
  postalCode: "33139",
  country: "US",
  serviceType: "standard",
  bedrooms: 2,
  bathrooms: 2,
  squareFootage: 1200,
  extras: ["inside_fridge"],
};

describe("calculateBookingPrice", () => {
  it("calculates standard clean with bedrooms, bathrooms, and extras", () => {
    const result = calculateBookingPrice(baseInput);

    expect(result.baseCents).toBe(12000);
    expect(result.bedroomCents).toBe(5000);
    expect(result.bathroomCents).toBe(3000);
    expect(result.squareFootageCents).toBe(3000);
    expect(result.extrasCents).toBe(2500);
    expect(result.subtotalCents).toBe(25500);
    expect(result.platformFeeCents).toBe(3825);
    expect(result.feesCents).toBe(3825);
    expect(result.taxCents).toBe(0);
    expect(result.discountCents).toBe(0);
    expect(result.totalCents).toBe(29325);
    expect(result.currency).toBe("USD");
    expect(result.serviceLabel).toBeTruthy();
    expect(result.estimatedDurationMinutes).toBeGreaterThan(0);
  });

  it("applies higher base for deep clean", () => {
    const result = calculateBookingPrice({ ...baseInput, serviceType: "deep" });
    expect(result.baseCents).toBe(20000);
  });

  it("uses CAD for Toronto market addresses", () => {
    const result = calculateBookingPrice({
      ...baseInput,
      city: "Toronto",
      state: "ON",
      postalCode: "M5V 2T6",
      country: "CA",
    });
    expect(result.currency).toBe("CAD");
    expect(result.totalCents).toBeGreaterThan(0);
  });

  it("rejects out-of-market addresses (fail closed)", () => {
    expect(() =>
      calculateBookingPrice({
        ...baseInput,
        city: "Austin",
        state: "TX",
        postalCode: "78701",
        country: "US",
      }),
    ).toThrow(/not in a MaidLinx service area/i);
  });

  it("returns quote-only zero totals for commercial services", () => {
    const result = calculateBookingPrice({
      ...baseInput,
      serviceType: "office",
      bedrooms: 0,
      bathrooms: 2,
      squareFootage: 3500,
      extras: [],
    });
    expect(result.quoteOnly).toBe(true);
    expect(result.pricingModel).toBe("quote");
    expect(result.totalCents).toBe(0);
  });

  it("never trusts a mismatched browser total", () => {
    expect(() => assertPriceMatch(100, 29325)).toThrow("Price mismatch");
  });
});

describe("assertPriceMatch", () => {
  it("passes when client total matches server total", () => {
    expect(() => assertPriceMatch(29325, 29325)).not.toThrow();
  });

  it("rejects when client total is omitted", () => {
    expect(() => assertPriceMatch(undefined, 29325)).toThrow(/Client total is required/);
  });
});
