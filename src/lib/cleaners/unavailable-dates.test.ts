import { describe, expect, it } from "vitest";
import { isDateUnavailable } from "@/lib/cleaners/unavailable-dates";

describe("isDateUnavailable", () => {
  it("matches YYYY-MM-DD against scheduledAt", () => {
    expect(isDateUnavailable("2026-08-12T14:00:00.000Z", ["2026-08-12"])).toBe(true);
    expect(isDateUnavailable("2026-08-12T14:00:00.000Z", ["2026-08-13"])).toBe(false);
  });
});
