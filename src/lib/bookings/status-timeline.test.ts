import { describe, expect, it } from "vitest";
import {
  getCustomerStatusHeadline,
  getCustomerTimelineState,
  getLiveJobTimelineState,
} from "@/lib/bookings/status-timeline";

describe("getCustomerTimelineState", () => {
  it("maps awaiting_assignment to Booked complete + finding professional (not fake assigned)", () => {
    const state = getCustomerTimelineState("awaiting_assignment");
    expect(state.findingProfessional).toBe(true);
    expect(state.showCleaner).toBe(false);
    expect(state.steps[0]?.state).toBe("complete");
    expect(state.steps[1]?.state).toBe("current");
    expect(state.steps.map((s) => s.label)).toEqual([
      "Booked",
      "Cleaner assigned",
      "On the way",
      "Complete",
    ]);
  });

  it("maps legacy awaiting_cleaner the same way", () => {
    const state = getCustomerTimelineState("awaiting_cleaner");
    expect(state.findingProfessional).toBe(true);
  });

  it("marks Cleaner assigned complete only after a real assignment", () => {
    const state = getCustomerTimelineState("assigned");
    expect(state.showCleaner).toBe(true);
    expect(state.findingProfessional).toBe(false);
    expect(state.steps[0]?.state).toBe("complete");
    expect(state.steps[1]?.state).toBe("complete");
    expect(state.steps[2]?.state).toBe("upcoming");
  });

  it("progresses through on_the_way → complete", () => {
    expect(getCustomerTimelineState("on_the_way").steps[2]?.state).toBe("current");
    expect(getCustomerTimelineState("arrived").steps[2]?.state).toBe("current");
    expect(getCustomerTimelineState("in_progress").steps[2]?.state).toBe("current");
    expect(getCustomerTimelineState("completed").steps[3]?.state).toBe("current");
  });

  it("exposes status headlines from backend statuses", () => {
    expect(getCustomerStatusHeadline("on_the_way")).toBe("Your Pro is on the way");
    expect(getCustomerStatusHeadline("arrived")).toBe("Your Pro has arrived");
    expect(getCustomerStatusHeadline("in_progress")).toBe("Cleaning in progress");
    expect(getCustomerStatusHeadline("completed")).toBe("Cleaning complete");
    expect(getCustomerStatusHeadline("awaiting_assignment")).toBe(
      "Finding your MaidLinx Pro…",
    );
  });
});

describe("getLiveJobTimelineState", () => {
  it("uses On the way → Arrived → Cleaning → Completed", () => {
    expect(getLiveJobTimelineState("on_the_way").steps.map((s) => s.label)).toEqual([
      "On the way",
      "Arrived",
      "Cleaning",
      "Completed",
    ]);
    expect(getLiveJobTimelineState("on_the_way").steps[0]?.state).toBe("current");
    expect(getLiveJobTimelineState("arrived").steps[1]?.state).toBe("current");
    expect(getLiveJobTimelineState("in_progress").steps[2]?.state).toBe("current");
    expect(getLiveJobTimelineState("completed").steps[3]?.state).toBe("current");
    expect(getLiveJobTimelineState("assigned").currentIndex).toBe(-1);
  });
});
