import { describe, expect, it } from "vitest";
import {
  getRequiredQuestions,
  validateServiceAnswers,
  mapAnswersToBookingFields,
} from "@/lib/services/questions";

describe("dynamic service questions", () => {
  it("returns residential questions including property type and rooms", () => {
    const questions = getRequiredQuestions({ serviceSlug: "residential" });
    const ids = questions.map((q) => q.id);
    expect(ids).toEqual(expect.arrayContaining(["propertyType", "bedrooms", "bathrooms", "squareFootage"]));
  });

  it("returns airbnb questions for turnover workflow", () => {
    const questions = getRequiredQuestions({ serviceType: "airbnb_turnover" });
    const ids = questions.map((q) => q.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "bedrooms",
        "bathrooms",
        "turnoverDeadline",
        "linens",
        "laundry",
        "supplies",
      ]),
    );
    expect(ids).not.toContain("propertyType");
  });

  it("returns commercial questions for office", () => {
    const questions = getRequiredQuestions({ serviceSlug: "office" });
    const ids = questions.map((q) => q.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "businessType",
        "squareFootage",
        "bathrooms",
        "frequency",
        "operatingSchedule",
      ]),
    );
  });

  it("returns post-construction questions", () => {
    const questions = getRequiredQuestions({ serviceType: "post_construction" });
    const ids = questions.map((q) => q.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "projectType",
        "squareFootage",
        "constructionStage",
        "cleaningCondition",
      ]),
    );
  });

  it("validates required answers", () => {
    const questions = getRequiredQuestions({ serviceSlug: "residential" });
    const invalid = validateServiceAnswers(questions, {});
    expect(invalid.ok).toBe(false);

    const valid = validateServiceAnswers(questions, {
      propertyType: "house",
      bedrooms: 2,
      bathrooms: 2,
      squareFootage: "1500",
    });
    expect(valid.ok).toBe(true);
  });

  it("maps answers onto booking fields", () => {
    expect(
      mapAnswersToBookingFields({
        bedrooms: 3,
        bathrooms: 2,
        squareFootage: "2500",
        propertyType: "condo",
        notes: "Gate code 12",
      }),
    ).toEqual({
      bedrooms: 3,
      bathrooms: 2,
      squareFootage: 2500,
      propertyType: "condo",
      notes: "Gate code 12",
    });
  });
});
