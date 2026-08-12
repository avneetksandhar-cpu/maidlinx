import { describe, expect, it } from "vitest";
import {
  canAutoExecute,
  isFoundationSafeAction,
  isHardBlockedAction,
  permissionLevelForAction,
  requiresFounderApproval,
  AI_OUTBOUND_MESSAGING_AUTO_SEND,
} from "@/lib/ai/permissions";

describe("AI permissions matrix", () => {
  it("keeps analytics GREEN and money moves RED", () => {
    expect(permissionLevelForAction("brief.generate")).toBe("green");
    expect(permissionLevelForAction("message.recommend")).toBe("yellow");
    expect(permissionLevelForAction("campaign.send")).toBe("red");
    expect(permissionLevelForAction("refund.issue")).toBe("red");
  });

  it("only auto-executes GREEN", () => {
    expect(canAutoExecute("green")).toBe(true);
    expect(canAutoExecute("yellow")).toBe(false);
    expect(canAutoExecute("red")).toBe(false);
  });

  it("requires founder approval for RED only", () => {
    expect(requiresFounderApproval("red")).toBe(true);
    expect(requiresFounderApproval("yellow")).toBe(false);
  });

  it("hard-blocks outbound and money actions in foundation", () => {
    expect(isHardBlockedAction("campaign.send")).toBe(true);
    expect(isHardBlockedAction("pricing.change")).toBe(true);
    expect(isHardBlockedAction("brief.generate")).toBe(false);
    expect(isFoundationSafeAction("brief.generate")).toBe(true);
    expect(isFoundationSafeAction("campaign.send")).toBe(false);
  });

  it("keeps outbound auto-send OFF", () => {
    expect(AI_OUTBOUND_MESSAGING_AUTO_SEND).toBe(false);
  });
});
