import { describe, expect, it } from "vitest";
import { rankOpportunities } from "@/ai/revenue-director/opportunities";
import type { AiOpportunity } from "@/lib/ai/types";

function opp(partial: Partial<AiOpportunity> & { id: string }): AiOpportunity {
  return {
    agentId: "revenue_director",
    title: partial.id,
    category: "other",
    potentialCentsEstimate: null,
    confidence: 0.5,
    permissionLevel: "green",
    recommendedAction: "n/a",
    evidence: "test",
    isEstimate: true,
    aiEligible: true,
    ...partial,
  };
}

describe("rankOpportunities", () => {
  it("ranks higher potential × confidence first", () => {
    const ranked = rankOpportunities([
      opp({ id: "low", potentialCentsEstimate: 1000, confidence: 0.9 }),
      opp({ id: "high", potentialCentsEstimate: 50_000, confidence: 0.6 }),
      opp({ id: "mid", potentialCentsEstimate: 10_000, confidence: 0.8 }),
    ]);
    expect(ranked.map((o) => o.id)).toEqual(["high", "mid", "low"]);
  });

  it("does not invent potential when null", () => {
    const ranked = rankOpportunities([
      opp({ id: "gap", potentialCentsEstimate: null, confidence: 0.9 }),
      opp({ id: "known", potentialCentsEstimate: 5000, confidence: 0.4 }),
    ]);
    expect(ranked[0]?.id).toBe("known");
    expect(ranked[0]?.potentialCentsEstimate).toBe(5000);
  });
});
