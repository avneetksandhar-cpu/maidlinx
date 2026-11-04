import { describe, expect, it } from "vitest";
import { offerIsBookable } from "@/lib/marketplace/offers";
import { canPublishWingman, canSetVerified, emptyChecklist } from "@/lib/marketplace/verification";
import {
  CONCIERGE_SERVICES,
  SERVICE_DISCLAIMER,
  containsForbiddenServiceRequest,
  normalizeRequestedServices,
} from "@/lib/marketplace/services";
import { WINGMAN_EVENT_MARKS } from "@/lib/marketplace/constants";

describe("verified wingmen stay empty until real people exist", () => {
  it("does not publish an incomplete or unverified profile", () => {
    expect(canPublishWingman({ checklist: emptyChecklist(), status: "pending" })).toBe(false);
    expect(canSetVerified(emptyChecklist())).toBe(false);
  });
});

describe("unverified cannot host tables", () => {
  it("rejects offers from pending wingmen", () => {
    expect(
      offerIsBookable({
        wingmanStatus: "pending",
        operatorApproved: true,
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        inventoryQuantity: 1,
        serviceType: "vip_table",
        terms: "21+",
        serviceFeeCents: 0,
      }),
    ).toBe(false);
  });
});

describe("concierge services", () => {
  it("lists planning services and forbids dating language", () => {
    expect(CONCIERGE_SERVICES.length).toBeGreaterThanOrEqual(8);
    expect(CONCIERGE_SERVICES.some((service) => service.id === "social_confidence_prep")).toBe(true);
    expect(SERVICE_DISCLAIMER.toLowerCase()).toMatch(/dating|romantic|sexual/);
    expect(SERVICE_DISCLAIMER.toLowerCase()).toMatch(/guarantee/);
    expect(containsForbiddenServiceRequest("looking to meet women")).toBe(true);
    expect(normalizeRequestedServices(["personalized_itinerary", "escort"])).toEqual([
      "personalized_itinerary",
    ]);
  });
});

describe("wingman event marks", () => {
  it("includes the five marks from the reposition", () => {
    expect(WINGMAN_EVENT_MARKS).toEqual([
      "interested",
      "recommended",
      "available_virtually",
      "available_in_person",
      "experienced_venue",
    ]);
  });
});
