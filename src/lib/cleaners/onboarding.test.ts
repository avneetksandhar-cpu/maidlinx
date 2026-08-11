import { describe, expect, it } from "vitest";
import {
  canAccessProJobs,
  canReceiveJobOffers,
  checklistProgress,
  nextOnboardingStatusAfterStep,
  parseOnboardingStatus,
  parseStripeConnectStatus,
  publicCleanerDisplayName,
  requiresOnboardingRedirect,
  statusAfterAdminReview,
  statusAfterSubmit,
} from "@/lib/cleaners/onboarding";

describe("cleaner onboarding status", () => {
  it("parses known statuses and defaults safely", () => {
    expect(parseOnboardingStatus("APPROVED")).toBe("APPROVED");
    expect(parseOnboardingStatus("nope")).toBe("NOT_STARTED");
    expect(parseStripeConnectStatus("PENDING")).toBe("PENDING");
    expect(parseStripeConnectStatus(null)).toBe("NOT_STARTED");
  });

  it("gates offers on APPROVED + online only", () => {
    expect(canReceiveJobOffers("APPROVED", true)).toBe(true);
    expect(canReceiveJobOffers("APPROVED", false)).toBe(false);
    expect(canReceiveJobOffers("SUBMITTED", true)).toBe(false);
    expect(canAccessProJobs("APPROVED")).toBe(true);
    expect(canAccessProJobs("UNDER_REVIEW")).toBe(false);
  });

  it("advances and reviews statuses without inventing background checks", () => {
    expect(nextOnboardingStatusAfterStep("NOT_STARTED")).toBe("IN_PROGRESS");
    expect(statusAfterSubmit("IN_PROGRESS")).toBe("SUBMITTED");
    expect(statusAfterAdminReview("approve")).toBe("APPROVED");
    expect(statusAfterAdminReview("reject")).toBe("REJECTED");
    expect(requiresOnboardingRedirect("IN_PROGRESS")).toBe(true);
    expect(requiresOnboardingRedirect("APPROVED")).toBe(false);
  });

  it("tracks checklist progress and public name privacy", () => {
    const progress = checklistProgress({
      personal: true,
      profile: true,
      services: false,
    });
    expect(progress.completed).toBe(2);
    expect(progress.nextStep).toBe("service_areas");
    expect(publicCleanerDisplayName("Ava", "Nguyen")).toBe("Ava N.");
    expect(publicCleanerDisplayName("Ava", null)).toBe("Ava");
  });
});
