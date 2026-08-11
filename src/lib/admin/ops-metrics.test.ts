import { describe, expect, it } from "vitest";
import { EMPTY_OPS_DASHBOARD, EMPTY_TODAY_COUNTS } from "@/lib/admin/ops-metrics";
import { OPS_QUEUE_KEYS, OPS_QUEUE_LABELS } from "@/lib/admin/queues";

describe("ops dashboard defaults", () => {
  it("provides empty today counts", () => {
    expect(EMPTY_TODAY_COUNTS).toMatchObject({
      bookings: 0,
      revenueCents: 0,
      awaitingAssignment: 0,
      assigned: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
    });
  });

  it("seeds launch markets in empty dashboard", () => {
    const keys = EMPTY_OPS_DASHBOARD.byMarket.map((m) => m.marketKey);
    expect(keys).toContain("toronto_gta");
    expect(keys).toContain("south_florida");
    expect(keys.length).toBeGreaterThanOrEqual(2);
  });
});

describe("operational queues", () => {
  it("defines the six ops queues", () => {
    expect(OPS_QUEUE_KEYS).toEqual([
      "needs_assignment",
      "cleaner_late",
      "payment_issue",
      "cancellation",
      "customer_issue",
      "re_clean_request",
    ]);
    for (const key of OPS_QUEUE_KEYS) {
      expect(OPS_QUEUE_LABELS[key].length).toBeGreaterThan(0);
    }
  });
});
