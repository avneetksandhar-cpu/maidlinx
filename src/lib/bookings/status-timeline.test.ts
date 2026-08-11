import { describe, expect, it } from "vitest";
import { getCustomerTimelineState } from "@/lib/bookings/status-timeline";

describe("getCustomerTimelineState", () => {
  it("maps awaiting_assignment to confirmed + finding professional", () => {
    const state = getCustomerTimelineState("awaiting_assignment");
    expect(state.findingProfessional).toBe(true);
    expect(state.showCleaner).toBe(false);
    expect(state.steps[0]?.state).toBe("current");
  });

  it("maps legacy awaiting_cleaner the same way", () => {
    const state = getCustomerTimelineState("awaiting_cleaner");
    expect(state.findingProfessional).toBe(true);
  });

  it("shows cleaner after assigned", () => {
    const state = getCustomerTimelineState("assigned");
    expect(state.showCleaner).toBe(true);
    expect(state.findingProfessional).toBe(false);
    expect(state.steps[1]?.state).toBe("current");
  });

  it("progresses through on_the_way → arrived → cleaning → completed", () => {
    expect(getCustomerTimelineState("on_the_way").steps[2]?.state).toBe("current");
    expect(getCustomerTimelineState("arrived").steps[3]?.state).toBe("current");
    expect(getCustomerTimelineState("in_progress").steps[4]?.state).toBe("current");
    expect(getCustomerTimelineState("completed").steps[5]?.state).toBe("current");
  });
});
