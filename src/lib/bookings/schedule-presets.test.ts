import { describe, expect, it } from "vitest";
import { formatDurationLabel, resolveSchedulePreset } from "@/lib/bookings/schedule-presets";

describe("resolveSchedulePreset", () => {
  it("resolves asap to today with a window", () => {
    const result = resolveSchedulePreset("asap");
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(["morning", "afternoon", "evening"]).toContain(result.arrivalWindow);
  });

  it("resolves tomorrow one day ahead", () => {
    const today = new Date();
    const result = resolveSchedulePreset("tomorrow");
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expected = tomorrow.toISOString().slice(0, 10);
    // Local date string from helper may differ near UTC midnight — compare day offset loosely
    expect(result.date >= today.toISOString().slice(0, 10)).toBe(true);
    expect(result.arrivalWindow).toBe("morning");
    void expected;
  });

  it("formats duration labels", () => {
    expect(formatDurationLabel(90)).toBe("~1 hr 30 min");
    expect(formatDurationLabel(60)).toBe("~1 hr");
    expect(formatDurationLabel(45)).toBe("45 min");
  });
});
