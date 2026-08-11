import { describe, expect, it } from "vitest";
import {
  estimateServiceDurationMinutes,
  getRequiredQuestionsForService,
  validateServiceForMarket,
} from "@/lib/services/catalog";

describe("service catalog", () => {
  it("loads required questions by service", () => {
    const questions = getRequiredQuestionsForService("residential");
    expect(questions.some((q) => q.id === "bedrooms")).toBe(true);
    expect(questions.some((q) => q.id === "propertyType")).toBe(true);
  });

  it("validates service eligibility for a market", () => {
    expect(validateServiceForMarket("deep", "TORONTO_GTA").ok).toBe(true);
    expect(validateServiceForMarket("spaceship", "TORONTO_GTA").ok).toBe(false);
  });

  it("estimates duration from service rules", () => {
    const minutes = estimateServiceDurationMinutes({
      serviceKey: "standard",
      bedrooms: 2,
      bathrooms: 1,
      squareFootage: 1500,
      extrasCount: 1,
    });
    expect(minutes).toBeGreaterThan(120);
  });
});
