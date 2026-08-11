import { describe, expect, it } from "vitest";
import { assertPriceMatch, calculateBookingPrice } from "@/lib/pricing/calculateQuote";

describe("pricing validation", () => {
  const baseInput = {
    line1: "123 King St W",
    city: "Toronto",
    state: "ON",
    postalCode: "M5V 2T6",
    country: "CA",
    bedrooms: 2,
    bathrooms: 1,
    squareFootage: 1500,
    serviceType: "standard" as const,
    extras: [] as [],
  };

  it("produces a positive total for residential", () => {
    const quote = calculateBookingPrice(baseInput);
    expect(quote.subtotalCents).toBeGreaterThan(0);
    expect(quote.totalCents).toBe(quote.subtotalCents + quote.platformFeeCents);
    expect(quote.estimatedDurationMinutes).toBeGreaterThan(0);
  });

  it("rejects client total mismatches", () => {
    const quote = calculateBookingPrice(baseInput);
    expect(() => assertPriceMatch(quote.totalCents + 1, quote.totalCents)).toThrow(
      /Price mismatch/,
    );
    expect(() => assertPriceMatch(quote.totalCents, quote.totalCents)).not.toThrow();
  });
});
