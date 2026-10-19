import { describe, expect, it } from "vitest";
import { agentFlagKey, AI_FLAG_KEYS } from "@/lib/ai/flags";

describe("AI feature flags", () => {
  it("includes pause and simulation keys", () => {
    expect(AI_FLAG_KEYS).toContain("AI_GLOBAL_PAUSE");
    expect(AI_FLAG_KEYS).toContain("AI_SIMULATION_MODE");
    expect(AI_FLAG_KEYS).toContain("AI_OUTBOUND_AUTO_SEND");
  });

  it("maps agents to flag keys", () => {
    expect(agentFlagKey("revenue_director")).toBe("AI_REVENUE_DIRECTOR");
    expect(agentFlagKey("ops_director")).toBe("AI_OPS_DIRECTOR");
  });
});
