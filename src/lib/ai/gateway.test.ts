import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/pause", () => ({
  isGlobalAiPaused: vi.fn(),
  isAgentEnabled: vi.fn(),
  isSimulationMode: vi.fn(),
}));

import { assertAiActionAllowed } from "@/lib/ai/gateway";
import { isAgentEnabled, isGlobalAiPaused, isSimulationMode } from "@/lib/ai/pause";

describe("assertAiActionAllowed", () => {
  beforeEach(() => {
    vi.mocked(isGlobalAiPaused).mockReset();
    vi.mocked(isAgentEnabled).mockReset();
    vi.mocked(isSimulationMode).mockReset();
  });

  it("blocks when global pause is on", async () => {
    vi.mocked(isGlobalAiPaused).mockResolvedValue(true);
    vi.mocked(isAgentEnabled).mockResolvedValue(true);
    vi.mocked(isSimulationMode).mockResolvedValue(true);

    const gate = await assertAiActionAllowed({
      agentId: "revenue_director",
      action: "brief.generate",
    });
    expect(gate.allowed).toBe(false);
    if (!gate.allowed) expect(gate.code).toBe("global_pause");
  });

  it("allows GREEN brief when agent enabled", async () => {
    vi.mocked(isGlobalAiPaused).mockResolvedValue(false);
    vi.mocked(isAgentEnabled).mockResolvedValue(true);
    vi.mocked(isSimulationMode).mockResolvedValue(true);

    const gate = await assertAiActionAllowed({
      agentId: "revenue_director",
      action: "brief.generate",
    });
    expect(gate.allowed).toBe(true);
    if (gate.allowed) expect(gate.mode).toBe("simulate");
  });

  it("never allows RED campaign.send", async () => {
    vi.mocked(isGlobalAiPaused).mockResolvedValue(false);
    vi.mocked(isAgentEnabled).mockResolvedValue(true);
    vi.mocked(isSimulationMode).mockResolvedValue(false);

    const gate = await assertAiActionAllowed({
      agentId: "revenue_director",
      action: "campaign.send",
    });
    expect(gate.allowed).toBe(false);
    if (!gate.allowed) expect(gate.code).toBe("hard_blocked");
  });

  it("allows YELLOW only as recommendOnly", async () => {
    vi.mocked(isGlobalAiPaused).mockResolvedValue(false);
    vi.mocked(isAgentEnabled).mockResolvedValue(true);
    vi.mocked(isSimulationMode).mockResolvedValue(true);

    const blocked = await assertAiActionAllowed({
      agentId: "retention_director",
      action: "message.recommend",
    });
    expect(blocked.allowed).toBe(false);

    const ok = await assertAiActionAllowed({
      agentId: "retention_director",
      action: "message.recommend",
      recommendOnly: true,
    });
    expect(ok.allowed).toBe(true);
  });
});
