import { describe, expect, it } from "vitest";
import { BRAND_PROMISE, CUSTOMER_CONCERNS, RECURRING_PLACEHOLDERS, SERVICE_BOUNDARY } from "@/lib/plan/brand";
import { buildNightPlan, validatePlanAnswers } from "@/lib/plan/itinerary";
import type { PublicEvent } from "@/lib/marketplace/queries";

function event(partial: Partial<PublicEvent> & Pick<PublicEvent, "id" | "name" | "venueName" | "localDate">): PublicEvent {
  return {
    externalId: partial.externalId ?? partial.id,
    area: "Miami",
    neighborhood: partial.neighborhood ?? "Downtown Miami",
    category: "Nightclub",
    musicGenre: "House",
    eventType: "Nightclub",
    atmosphere: null,
    dressCode: null,
    estimatedSpendText: null,
    priceText: null,
    ageRequirement: "21+",
    localTimeText: "11:00 PM",
    timezone: "America/New_York",
    officialSourceUrl: "https://example.com/event",
    sourceLabel: "Official venue calendar",
    lastVerified: "2026-08-31",
    lastUpdated: "2026-08-31",
    discoveryStatus: "discovery_ready",
    bookingStatus: "DISCOVERY_ONLY",
    availableServices: [],
    bookable: false,
    bookingStatusNote: "Awaiting Wingman inventory",
    imageUsageVerified: false,
    imageUrl: null,
    imageAttribution: null,
    ...partial,
  };
}

describe("Plan My Night itinerary", () => {
  it("returns three options from real events and never invents Wingmen", () => {
    const events = [
      event({ id: "1", name: "Peewee at E11EVEN", venueName: "E11EVEN Miami", localDate: "2026-09-01" }),
      event({ id: "2", name: "Disco Lines", venueName: "LIV Nightclub", localDate: "2026-09-05", musicGenre: "House" }),
      event({ id: "3", name: "Warehouse", venueName: "Factory Town", localDate: "2026-09-06" }),
    ];
    const plan = buildNightPlan(
      { date: "2026-09-01", spendBand: "band_1500_5000", music: "house", groupSize: 2, goal: "vip_nightlife" },
      events,
    );
    expect(plan.options).toHaveLength(3);
    expect(plan.options.map((option) => option.kind)).toEqual(["best_match", "luxury", "backup"]);
    expect(plan.options[2].label).toBe("Backup option");
    expect(plan.availableWingmanCount).toBe(0);
    expect(plan.availableWingmen).toEqual([]);
    expect(plan.options.every((option) => option.partnershipClaimed === false)).toBe(true);
    expect(plan.options[0].estimatedSpendingNote.toLowerCase()).toContain("estimate");
  });

  it("does not invent a third venue when only one listing exists", () => {
    const plan = buildNightPlan(
      { date: "2026-09-01", spendBand: "band_500_1500", music: "", groupSize: 2, goal: "explore_miami" },
      [event({ id: "1", name: "Only one", venueName: "M2 Miami", localDate: "2026-09-01" })],
    );
    expect(plan.options[0].eventId).toBe("1");
    expect(plan.options[2].eventId).toBeNull();
    expect(plan.options[2].name.toLowerCase()).toMatch(/will not invent|backup/);
  });

  it("validates the five answers", () => {
    expect(() => validatePlanAnswers({ date: "bad", spendBand: "band_500_1500", groupSize: 2, goal: "socialize" })).toThrow(
      /date/i,
    );
    expect(
      validatePlanAnswers({
        date: "2026-09-01",
        spendBand: "band_500_1500",
        music: "house",
        groupSize: 4,
        goal: "celebrate",
      }).goal,
    ).toBe("celebrate");
  });
});

describe("brand promise and boundaries", () => {
  it("keeps the promise and forbids guaranteed people or tables", () => {
    expect(BRAND_PROMISE).toBe("Arrive connected. Never go out blind.");
    expect(SERVICE_BOUNDARY.toLowerCase()).toMatch(/women are never inventory/);
    expect(SERVICE_BOUNDARY.toLowerCase()).toMatch(/romantic or sexual/);
    expect(CUSTOMER_CONCERNS).toHaveLength(8);
    expect(RECURRING_PLACEHOLDERS).toHaveLength(10);
  });
});
