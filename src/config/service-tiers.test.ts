import { describe, expect, it } from "vitest";
import {
  getServiceTiersForProperty,
  previewTierPrice,
} from "@/config/service-tiers";
import { getPropertyQuestions, PROPERTY_TYPES } from "@/config/property-types";

describe("service tiers", () => {
  it("returns Standard/Deep Clean/Move Clean/Commercial for house", () => {
    const tiers = getServiceTiersForProperty("house");
    expect(tiers.map((t) => t.id)).toEqual(["standard", "deep", "move", "commercial"]);
    expect(tiers.map((t) => t.label)).toEqual([
      "Standard",
      "Deep Clean",
      "Move Clean",
      "Commercial",
    ]);
    expect(tiers.every((t) => t.label && t.serviceType)).toBe(true);
  });

  it("returns turnover-first tiers for airbnb", () => {
    const tiers = getServiceTiersForProperty("airbnb");
    expect(tiers[0]?.serviceType).toBe("airbnb_turnover");
  });

  it("previews a positive instant price for standard", () => {
    const preview = previewTierPrice({
      serviceType: "standard",
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: 1500,
    });
    expect(preview.quoteOnly).toBe(false);
    expect(preview.totalCents).toBeGreaterThan(10000);
    expect(preview.durationMinutes).toBeGreaterThan(60);
  });
});

describe("property types", () => {
  it("covers the customer booking set", () => {
    const ids = PROPERTY_TYPES.filter((p) => p.customerFacing).map((p) => p.id);
    expect(ids).toEqual([
      "house",
      "apartment",
      "office",
      "airbnb",
      "retail",
      "restaurant",
      "commercial",
      "post_construction",
      "other",
    ]);
  });

  it("returns conditional questions per property", () => {
    expect(getPropertyQuestions("house").some((q) => q.id === "bedrooms")).toBe(true);
    expect(getPropertyQuestions("office").some((q) => q.id === "businessType")).toBe(true);
    expect(getPropertyQuestions("move").some((q) => q.id === "moveDirection")).toBe(true);
  });
});
