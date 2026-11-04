import { describe, expect, it } from "vitest";
import { recurringPriceBreakdown, visitsPerMonthEstimate } from "./pricing-display";

describe("commercial pricing display", () => {
  it("estimates weekly monthly total from visit price", () => {
    expect(visitsPerMonthEstimate("weekly")).toBe(4);
    const b = recurringPriceBreakdown({
      visitCents: 18000,
      frequency: "weekly",
      billingCadence: "per_visit",
    });
    expect(b.visitLabel).toContain("/ visit");
    expect(b.monthlyEstimateCents).toBe(72000);
    expect(b.monthlyLabel).toContain("720");
  });

  it("uses monthly billing amount when cadence is monthly", () => {
    const b = recurringPriceBreakdown({
      visitCents: 60000,
      frequency: "weekly",
      billingCadence: "monthly",
    });
    expect(b.monthlyEstimateCents).toBe(60000);
    expect(b.monthlyLabel).toContain("month");
  });

  it("skips monthly estimate for one-time", () => {
    const b = recurringPriceBreakdown({
      visitCents: 20000,
      frequency: "one_time",
    });
    expect(b.monthlyLabel).toBeNull();
  });
});
