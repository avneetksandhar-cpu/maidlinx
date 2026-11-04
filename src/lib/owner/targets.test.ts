import { describe, expect, it } from "vitest";
import { computePace, DEFAULT_MONTHLY_TARGET_CENTS } from "@/lib/owner/targets";

describe("computePace", () => {
  it("computes month pace and projected end from real actuals", () => {
    const now = new Date(2026, 7, 15); // Aug 15 2026 (day 15 of 31)
    const pace = computePace({
      period: "month",
      targetCents: DEFAULT_MONTHLY_TARGET_CENTS,
      actualCents: 2_000_000,
      now,
    });
    expect(pace.daysInPeriod).toBe(31);
    expect(pace.daysElapsed).toBe(15);
    expect(pace.expectedByNowCents).toBeGreaterThan(0);
    expect(pace.projectedEndCents).toBeGreaterThan(pace.actualCents);
    expect(pace.shortfallOrSurplusCents).toBe(
      pace.actualCents - pace.expectedByNowCents,
    );
  });

  it("uses default $100k monthly target constant", () => {
    expect(DEFAULT_MONTHLY_TARGET_CENTS).toBe(10_000_000);
  });
});
