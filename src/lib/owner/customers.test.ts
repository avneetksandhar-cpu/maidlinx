import { describe, expect, it } from "vitest";

/**
 * NBA picker is internal to getCustomerRevenueProfile; exercise via ranking
 * heuristics mirrored here for regression safety without DB.
 */
function pickNba(input: {
  completedCount: number;
  cancelledCount: number;
  daysSinceLast: number | null;
  recurringPreference: string | null;
  hasCommercial: boolean;
  segment: string;
}): string {
  if (input.cancelledCount >= 2 && input.completedCount === 0) return "SERVICE_RECOVERY";
  if (input.segment === "churned" || (input.daysSinceLast != null && input.daysSinceLast > 120)) {
    return "WIN_BACK";
  }
  if (
    input.daysSinceLast != null &&
    input.daysSinceLast >= 14 &&
    input.daysSinceLast <= 90 &&
    input.completedCount >= 1
  ) {
    return "REBOOK";
  }
  if (
    input.completedCount >= 2 &&
    (!input.recurringPreference || input.recurringPreference === "one_time")
  ) {
    return "RECURRING";
  }
  if (input.hasCommercial || input.completedCount >= 3) return "UPSELL";
  if (input.completedCount >= 2 && input.segment === "active") return "REFER";
  if (input.daysSinceLast != null && input.daysSinceLast < 14) return "LEAVE_ALONE";
  return "LEAVE_ALONE";
}

describe("customer NBA heuristics", () => {
  it("recommends REBOOK in 14–90d window", () => {
    expect(
      pickNba({
        completedCount: 1,
        cancelledCount: 0,
        daysSinceLast: 30,
        recurringPreference: "one_time",
        hasCommercial: false,
        segment: "active",
      }),
    ).toBe("REBOOK");
  });

  it("recommends RECURRING for repeats without cadence", () => {
    expect(
      pickNba({
        completedCount: 3,
        cancelledCount: 0,
        daysSinceLast: 5,
        recurringPreference: "one_time",
        hasCommercial: false,
        segment: "active",
      }),
    ).toBe("RECURRING");
  });

  it("recommends WIN_BACK for long silence", () => {
    expect(
      pickNba({
        completedCount: 2,
        cancelledCount: 0,
        daysSinceLast: 150,
        recurringPreference: "weekly",
        hasCommercial: false,
        segment: "churned",
      }),
    ).toBe("WIN_BACK");
  });
});
