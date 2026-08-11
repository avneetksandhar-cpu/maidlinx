import { describe, expect, it } from "vitest";
import {
  ACTION_TO_STATUS,
  getActionForNextStatus,
  getActionLabel,
  getNextCleanerStatus,
  validateCleanerStatusTransition,
} from "@/lib/pro/job-transitions";

describe("validateCleanerStatusTransition", () => {
  it("allows the full cleaner lifecycle", () => {
    const flow = [
      ["awaiting_assignment", "accepted"],
      ["accepted", "on_the_way"],
      ["on_the_way", "arrived"],
      ["arrived", "in_progress"],
      ["in_progress", "completed"],
    ] as const;

    for (const [from, to] of flow) {
      expect(validateCleanerStatusTransition(from, to)).toEqual({ valid: true });
    }
  });

  it("accepts legacy status aliases", () => {
    expect(validateCleanerStatusTransition("awaiting_cleaner", "accepted")).toEqual({
      valid: true,
    });
    expect(validateCleanerStatusTransition("assigned", "on_the_way")).toEqual({ valid: true });
    expect(validateCleanerStatusTransition("cleaner_on_way", "arrived")).toEqual({ valid: true });
  });

  it("rejects skipped steps", () => {
    expect(validateCleanerStatusTransition("assigned", "in_progress")).toEqual({
      valid: false,
      error: 'Invalid status transition from "assigned" to "in_progress".',
    });
  });

  it("rejects backwards transitions", () => {
    expect(validateCleanerStatusTransition("in_progress", "assigned")).toEqual({
      valid: false,
      error: 'Invalid status transition from "in_progress" to "assigned".',
    });
  });
});

describe("getNextCleanerStatus", () => {
  it("returns the next status in order", () => {
    expect(getNextCleanerStatus("awaiting_assignment")).toBe("accepted");
    expect(getNextCleanerStatus("assigned")).toBe("on_the_way");
    expect(getNextCleanerStatus("accepted")).toBe("on_the_way");
    expect(getNextCleanerStatus("on_the_way")).toBe("arrived");
    expect(getNextCleanerStatus("arrived")).toBe("in_progress");
    expect(getNextCleanerStatus("in_progress")).toBe("completed");
    expect(getNextCleanerStatus("completed")).toBeNull();
  });
});

describe("getActionForNextStatus", () => {
  it("maps statuses to API actions", () => {
    expect(getActionForNextStatus("awaiting_assignment")).toBe("accept");
    expect(getActionForNextStatus("assigned")).toBe("onTheWay");
    expect(getActionForNextStatus("accepted")).toBe("onTheWay");
    expect(getActionForNextStatus("on_the_way")).toBe("arrived");
    expect(getActionForNextStatus("arrived")).toBe("start");
    expect(getActionForNextStatus("in_progress")).toBe("complete");
  });
});

describe("ACTION_TO_STATUS", () => {
  it("maps actions to DB statuses", () => {
    expect(ACTION_TO_STATUS.accept).toBe("accepted");
    expect(ACTION_TO_STATUS.onTheWay).toBe("on_the_way");
    expect(ACTION_TO_STATUS.arrived).toBe("arrived");
  });
});

describe("getActionLabel", () => {
  it("returns human-readable labels", () => {
    expect(getActionLabel("onTheWay")).toBe("On my way");
    expect(getActionLabel("arrived")).toBe("Arrived");
    expect(getActionLabel("start")).toBe("Start cleaning");
    expect(getActionLabel("complete")).toBe("Complete");
  });
});
