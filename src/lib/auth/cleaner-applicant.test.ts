import { describe, expect, it } from "vitest";
import { wantsCleanerApplicant } from "@/lib/auth/cleaner-applicant";

describe("wantsCleanerApplicant", () => {
  it("detects explicit apply", () => {
    expect(wantsCleanerApplicant({ explicit: true })).toBe(true);
  });

  it("detects cleaner metadata role", () => {
    expect(wantsCleanerApplicant({ metadataRole: "cleaner" })).toBe(true);
    expect(wantsCleanerApplicant({ metadataRole: "professional" })).toBe(true);
    expect(wantsCleanerApplicant({ metadataRole: "customer" })).toBe(false);
    expect(wantsCleanerApplicant({ metadataRole: "admin" })).toBe(false);
  });

  it("detects cleaner next paths", () => {
    expect(wantsCleanerApplicant({ nextPath: "/cleaner/application" })).toBe(true);
    expect(wantsCleanerApplicant({ nextPath: "/pro/jobs" })).toBe(true);
    expect(wantsCleanerApplicant({ nextPath: "/account" })).toBe(false);
  });
});
