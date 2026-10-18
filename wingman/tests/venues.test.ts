import { describe, expect, it } from "vitest";
import { bookNightHref } from "@/lib/marketplace/book-href";
import { pickFeaturedEvents } from "@/lib/marketplace/featured";
import { customerBookingStatus } from "@/lib/marketplace/status-copy";
import { validatePlanAnswers } from "@/lib/plan/itinerary";
import { inferVenueCategory, slugifyVenueName } from "@/lib/venues/types";
import { validateVenueApplication, venueChecklistComplete, venueChecklistFromInput } from "@/lib/venues/verification";
import type { VenueApplicationInput } from "@/lib/venues/types";
import type { PublicEvent } from "@/lib/marketplace/queries";

describe("venue presence helpers", () => {
  it("infers categories without inventing venues", () => {
    expect(inferVenueCategory("LIV Nightclub")).toBe("club");
    expect(inferVenueCategory("Komodo dinner")).toBe("restaurant");
    expect(inferVenueCategory("A rooftop in Brickell")).toBe("rooftop");
    expect(inferVenueCategory("unknown room")).toBeNull();
  });

  it("slugs names for first-class venue pages", () => {
    expect(slugifyVenueName("LIV Miami")).toBe("liv-miami");
  });
});

describe("book and pay href", () => {
  it("keeps the $500 path one tap away", () => {
    expect(bookNightHref()).toBe("/book");
    expect(bookNightHref({ go: true, source: "home" })).toBe("/book?source=home&go=1");
    expect(bookNightHref({ eventId: "abc", name: "LIV", source: "event" })).toContain("eventId=abc");
  });
});

describe("customer booking language", () => {
  it("maps machine states to hospitality copy", () => {
    expect(customerBookingStatus("submitted")).toBe("Requested");
    expect(customerBookingStatus("payment_pending")).toBe("Being arranged");
    expect(customerBookingStatus("confirmed")).toBe("Confirmed");
    expect(customerBookingStatus("in_progress")).toBe("Tonight");
    expect(customerBookingStatus("completed")).toBe("Completed");
  });
});

describe("home featured nights", () => {
  it("falls back to the week when Miami tonight is empty", () => {
    const week = {
      id: "1",
      localDate: "2026-09-09",
      name: "Churchill's",
    } as PublicEvent;
    const picked = pickFeaturedEvents([week], new Date("2026-09-08T23:00:00-04:00"));
    expect(picked.label).toBe("This week");
    expect(picked.featured[0]?.id).toBe("1");
  });

  it("ranks real nightlife rooms ahead of fairs", () => {
    const fair = { id: "fair", localDate: "2026-09-09", category: "Fairs & Festivals", venueName: "Expo", name: "Jurassic Quest" } as PublicEvent;
    const club = { id: "club", localDate: "2026-09-09", category: "Nightclub", venueName: "LIV Nightclub", name: "Thursday" } as PublicEvent;
    const picked = pickFeaturedEvents([fair, club], new Date("2026-09-08T23:00:00-04:00"));
    expect(picked.featured[0]?.id).toBe("club");
  });
});

describe("venue brand verification", () => {
  const complete: VenueApplicationInput = {
    venueName: "LIV Nightclub",
    venueType: "club",
    address: "4441 Collins Ave",
    neighborhood: "Miami Beach",
    website: "https://livnightclub.com",
    contactName: "Alex Rivera",
    contactTitle: "VIP manager",
    businessEmail: "vip@livnightclub.com",
    phone: "305-555-0100",
    legalName: "LIV Miami LLC",
    licenseNumber: "BTR-12345",
    hoursText: "Thu–Sun 11 PM",
    description: "The room people ask for on Miami Beach.",
    musicGenres: "Hip hop",
    dressCode: "Upscale",
    authorityAttested: true,
    accuracyAttested: true,
    mediaRightsAttested: true,
  };

  it("blocks an incomplete club or restaurant profile", () => {
    const partial = venueChecklistFromInput({ ...complete, legalName: "", authorityAttested: false });
    expect(venueChecklistComplete(partial)).toBe(false);
    expect(() => validateVenueApplication({ ...complete, licenseNumber: "" })).toThrow(/verification/i);
  });

  it("accepts a complete verified brand packet without publishing it", () => {
    const checklist = validateVenueApplication(complete);
    expect(venueChecklistComplete(checklist)).toBe(true);
    expect(checklist.legal_entity).toBe(true);
  });
});

describe("plan kinds", () => {
  it("maps nightlife kinds onto existing plan goals", () => {
    const answers = validatePlanAnswers({
      date: "2026-09-12",
      spendBand: "band_500_1500",
      groupSize: 2,
      kind: "vip_table",
    });
    expect(answers.goal).toBe("vip_nightlife");
  });
});
