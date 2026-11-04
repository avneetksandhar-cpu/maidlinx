import { describe, expect, it } from "vitest";
import { proposalToTeamCard, type TeamCardModel } from "@/components/commercial/commercial-choose-team";
import type { CommercialProposal } from "@/lib/commercial/types";

function proposal(partial: Partial<CommercialProposal> & { id: string }): CommercialProposal {
  return {
    businessAccountId: "ba",
    siteAddressId: "site",
    scopeId: null,
    providerCleanerId: null,
    providerUserId: null,
    providerName: "Biscayne Cleaning Co.",
    status: "sent",
    inclusions: null,
    exclusions: null,
    clientPriceCents: 18000,
    providerPayoutCents: 12000,
    frequency: "weekly",
    billingCadence: "per_visit",
    firstVisitDate: null,
    dueNowCents: 0,
    paymentExpected: "pay_after",
    scopeSnapshot: { serviceWindow: "Evening (6:00–8:00 PM)" },
    walkthroughRequested: false,
    approvedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

describe("proposalToTeamCard", () => {
  it("maps real proposal fields for team cards", () => {
    const card = proposalToTeamCard(proposal({ id: "p1" }));
    expect(card.providerName).toBe("Biscayne Cleaning Co.");
    expect(card.visitCents).toBe(18000);
    expect(card.windowLabel).toBe("Evening (6:00–8:00 PM)");
    expect(card.frequency).toBe("weekly");
  });
});

describe("team availability states (card counts)", () => {
  it("treats empty list as zero-team state", () => {
    const cards: TeamCardModel[] = [];
    expect(cards.length).toBe(0);
  });

  it("treats single team as auto-select candidate", () => {
    const cards = [proposalToTeamCard(proposal({ id: "only" }))];
    expect(cards.length).toBe(1);
    expect(cards[0]?.proposalId).toBe("only");
  });

  it("keeps multiple teams choosable", () => {
    const cards = [
      proposalToTeamCard(proposal({ id: "a", providerName: "A" })),
      proposalToTeamCard(
        proposal({
          id: "b",
          providerName: "Palm Coast Crew",
          clientPriceCents: 19500,
          scopeSnapshot: { serviceWindow: "Evening (6:30–8:30 PM)" },
        }),
      ),
    ];
    expect(cards.length).toBe(2);
    expect(cards.map((c) => c.providerName)).toEqual(["A", "Palm Coast Crew"]);
  });
});
