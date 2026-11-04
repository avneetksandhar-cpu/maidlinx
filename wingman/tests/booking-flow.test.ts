import { describe, expect, it } from "vitest";
import { requiredPath } from "@/lib/booking-flow/guard";
import { searchMiamiPlaces, nearestMiamiPlace } from "@/lib/booking-flow/locations";
import { rankMatches, scoreEvent } from "@/lib/booking-flow/rank-matches";
import { emptyBookingState } from "@/lib/booking-flow/storage";
import { budgetToSpendBand } from "@/lib/booking-flow/types";
import type { PublicEvent } from "@/lib/marketplace/queries";

function event(partial: Partial<PublicEvent>): PublicEvent {
  return {
    id: "e1",
    externalId: "ext-1",
    name: "Club Night",
    venueName: "Story",
    area: "South Beach",
    neighborhood: "Miami Beach",
    category: "Nightlife",
    musicGenre: "Hip-Hop",
    eventType: "nightclub",
    atmosphere: null,
    dressCode: null,
    estimatedSpendText: "$800",
    priceText: "$800",
    ageRequirement: "21+",
    localDate: "2026-09-12",
    localTimeText: "11:30 PM",
    timezone: "America/New_York",
    officialSourceUrl: "https://example.com",
    sourceLabel: "Ticketmaster",
    lastVerified: null,
    lastUpdated: null,
    discoveryStatus: "discovery_ready",
    bookingStatus: "DISCOVERY_ONLY",
    availableServices: [],
    bookable: false,
    bookingStatusNote: "",
    imageUsageVerified: false,
    imageUrl: null,
    imageAttribution: null,
    ...partial,
  };
}

describe("booking flow ranking", () => {
  it("returns at most 3 matches and prefers same-day nightlife", () => {
    const matches = rankMatches(
      [
        event({ id: "fair", name: "County Fair", category: "Fair", localDate: "2026-09-12", neighborhood: "Miami Beach" }),
        event({ id: "club", name: "LIV", venueName: "LIV", category: "Nightclub", localDate: "2026-09-12", bookable: true }),
        event({ id: "later", name: "Later Club", localDate: "2026-09-20" }),
        event({ id: "other", name: "Lounge", category: "Lounge", localDate: "2026-09-12" }),
      ],
      {
        date: "2026-09-12",
        destination: "Miami Beach",
        experienceType: "nightclub",
        vibe: "hiphop",
        partySize: 4,
        budget: "500_1000",
      },
    );
    expect(matches.length).toBeLessThanOrEqual(3);
    expect(matches[0]?.id).toBe("club");
    expect(matches.every((item) => item.localDate === "2026-09-12")).toBe(true);
  });

  it("does not mark discovery events bookable", () => {
    const score = scoreEvent(event({ bookable: false }), {
      date: "2026-09-12",
      destination: "Miami Beach",
      experienceType: "nightclub",
      vibe: "best_tonight",
      partySize: 4,
      budget: "500_1000",
    });
    const bookableScore = scoreEvent(event({ bookable: true }), {
      date: "2026-09-12",
      destination: "Miami Beach",
      experienceType: "nightclub",
      vibe: "best_tonight",
      partySize: 4,
      budget: "500_1000",
    });
    expect(bookableScore).toBeGreaterThan(score);
  });
});

describe("booking flow helpers", () => {
  it("maps UI budgets onto existing spend bands", () => {
    expect(budgetToSpendBand("500_1000")).toBe("band_500_1500");
    expect(budgetToSpendBand("2500_5000")).toBe("band_1500_5000");
    expect(budgetToSpendBand("5000_plus")).toBe("band_5000_plus");
  });

  it("autocompletes Miami places", () => {
    expect(searchMiamiPlaces("wyn").some((place) => place.label === "Wynwood")).toBe(true);
    expect(nearestMiamiPlace(25.79, -80.13).neighborhood).toBe("Miami Beach");
  });

  it("keeps later steps locked until earlier answers exist", () => {
    const empty = emptyBookingState();
    expect(requiredPath(empty, "when")).toBe("/booking/location");
    expect(requiredPath({ ...empty, destination: searchMiamiPlaces("Miami")[0] }, "when")).toBeNull();
    expect(requiredPath({ ...empty, destination: searchMiamiPlaces("Miami")[0] }, "experience")).toBe(
      "/booking/when",
    );
  });
});
