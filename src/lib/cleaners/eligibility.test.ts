import { describe, expect, it } from "vitest";
import {
  checkCleanerJobEligibility,
  filterJobsForCleaner,
} from "@/lib/cleaners/eligibility";

const baseCleaner = {
  cleanerId: "c1",
  approved: true,
  active: true,
  services: ["svc_residential", "standard", "deep"],
  serviceZones: ["zone_toronto_core"],
  travelRadiusKm: 25,
  qualifications: [],
  yearsExperience: 2,
};

describe("cleaner job eligibility", () => {
  it("allows matching service + zone", () => {
    const result = checkCleanerJobEligibility(baseCleaner, {
      serviceType: "standard",
      serviceZoneId: "zone_toronto_core",
    });
    expect(result.eligible).toBe(true);
  });

  it("blocks unapproved cleaners", () => {
    const result = checkCleanerJobEligibility(
      { ...baseCleaner, approved: false },
      { serviceType: "standard", serviceZoneId: "zone_toronto_core" },
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("not_approved");
  });

  it("blocks jobs outside cleaner zones", () => {
    const result = checkCleanerJobEligibility(baseCleaner, {
      serviceType: "standard",
      serviceZoneId: "zone_miami_dade",
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("zone_not_covered");
  });

  it("blocks services the cleaner does not offer", () => {
    const result = checkCleanerJobEligibility(baseCleaner, {
      serviceId: "svc_office",
      serviceZoneId: "zone_toronto_core",
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("service_not_offered");
  });

  it("filters available job lists", () => {
    const jobs = filterJobsForCleaner(baseCleaner, [
      { serviceType: "standard", serviceZoneId: "zone_toronto_core" },
      { serviceType: "office", serviceZoneId: "zone_toronto_core" },
      { serviceType: "deep", serviceZoneId: "zone_miami_dade" },
    ]);
    expect(jobs).toHaveLength(1);
  });
});
