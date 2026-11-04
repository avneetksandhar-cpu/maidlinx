import { describe, expect, it } from "vitest";
import { isHappeningNow, isHappeningToday, matchesWhen } from "@/lib/events/filters";
import { wallTimeInZoneToUtc } from "@/lib/events/timezone";
import type { CanonicalEvent } from "@/lib/events/types";
import { expandCartItems } from "@/lib/cart/expand";
import { experienceLabel, platformTakeCents, validateCartItem } from "@/lib/catalog/rules";
import { PLATFORM_TAKE_NOTES, type CartItemInput, type CatalogProduct } from "@/lib/catalog/types";

function product(partial: Partial<CatalogProduct> & Pick<CatalogProduct, "slug" | "name" | "priceCents">): CatalogProduct {
  return {
    id: partial.id ?? "cat-1",
    kind: "wingman_experience",
    includedCopy: "Included.",
    extrasCopy: "Extras are separate.",
    drinkOptions: partial.slug === "nightclub" ? ["Tequila", "Vodka", "Cognac"] : [],
    maxGuests: partial.slug === "dinner" ? 2 : null,
    active: true,
    sortOrder: 1,
    ...partial,
  };
}

function item(partial: Partial<CartItemInput> = {}): CartItemInput {
  return {
    id: "item-1",
    kind: "wingman_experience",
    catalogSlug: "nightclub",
    guestCount: 1,
    experienceName: "Nightclub",
    ...partial,
  };
}

function event(partial: Partial<CanonicalEvent> = {}): CanonicalEvent {
  return {
    id: "evt-1",
    externalId: "EVT-1",
    name: "LIV",
    performer: null,
    venueName: "LIV Nightclub",
    venueId: "v1",
    neighborhood: "Miami Beach",
    area: "Miami Beach",
    localDate: "2026-09-21",
    localTimeText: "11:00 PM",
    startsAt: wallTimeInZoneToUtc("2026-09-21", 23, 0),
    endsAt: null,
    timezone: "America/New_York",
    category: "Nightclub",
    musicGenre: "House",
    eventType: "Nightclub",
    ageRequirement: "21+",
    officialSourceUrl: "https://example.com",
    priceMinCents: null,
    priceMaxCents: null,
    priceText: null,
    imageUrl: null,
    imageUsageVerified: false,
    imageAttribution: null,
    bookingStatus: "DISCOVERY_ONLY",
    discoveryStatus: "discovery_ready",
    importStatus: "approved",
    mergeKey: "liv",
    lastSyncedAt: null,
    lastSeenAt: null,
    missedSyncCount: 0,
    stale: false,
    hiddenAt: null,
    adminLockedFields: [],
    mergedIntoId: null,
    primarySourceSlug: "admin",
    sourceVerifiedAt: null,
    ...partial,
  };
}

describe("Wingman Experience cart rules", () => {
  it("requires a nightclub drink", () => {
    const nightclub = product({ slug: "nightclub", name: "Nightclub", priceCents: 50_000 });
    expect(validateCartItem(item({ drinkOption: null }), nightclub)).toMatch(/drink/i);
    expect(validateCartItem(item({ drinkOption: "Tequila" }), nightclub)).toBeNull();
  });

  it("caps dinner at 2 guests", () => {
    const dinner = product({ slug: "dinner", name: "Dinner", priceCents: 45_000, maxGuests: 2 });
    expect(validateCartItem(item({ catalogSlug: "dinner", guestCount: 3, experienceName: "Dinner" }), dinner)).toMatch(
      /2 guests/i,
    );
    expect(validateCartItem(item({ catalogSlug: "dinner", guestCount: 2, experienceName: "Dinner" }), dinner)).toBeNull();
  });

  it("allows yacht at the catalog price without a drink", () => {
    const yacht = product({ slug: "yacht", name: "Yacht", priceCents: 40_000 });
    expect(validateCartItem(item({ catalogSlug: "yacht", experienceName: "Yacht" }), yacht)).toBeNull();
    expect(experienceLabel(yacht, item({ catalogSlug: "yacht" }))).toBe("Yacht");
  });

  it("blocks VIP tables without a real bookable offer", () => {
    expect(
      validateCartItem(
        item({ kind: "vip_table", offerId: null, experienceName: "VIP Table" }),
        null,
      ),
    ).toMatch(/bookable/i);
  });

  it("expands cart quantity into separate bookings", () => {
    const copies = expandCartItems([item({ quantity: 2, experienceName: "Nightclub" })]);
    expect(copies).toHaveLength(2);
    expect(copies.every((row) => row.quantity === 1)).toBe(true);
  });

  it("uses catalog prices in labels, not a hardcoded $500 night service", () => {
    const nightclub = product({ slug: "nightclub", name: "Nightclub", priceCents: 62_000 });
    expect(experienceLabel(nightclub, item({ drinkOption: "Vodka" }))).toBe("Nightclub · Vodka");
    expect(nightclub.priceCents).toBe(62_000);
  });
});

describe("platform take notes", () => {
  it("records the brief’s business math without charging it as a customer fee", () => {
    expect(platformTakeCents("wingman_experience", 50_000)).toBe(10_000);
    expect(platformTakeCents("vip_table", 200_000)).toBe(20_000);
    expect(PLATFORM_TAKE_NOTES.wingmanExperience).toMatch(/\$100/);
    expect(PLATFORM_TAKE_NOTES.vipTable).toMatch(/10%/);
  });
});

describe("Happening Now and Happening Today", () => {
  const now = new Date("2026-09-21T16:00:00-04:00");

  it("treats Happening Now as started and not ended", () => {
    const live = event({
      localDate: "2026-09-21",
      startsAt: new Date("2026-09-21T14:00:00-04:00"),
      endsAt: new Date("2026-09-21T22:00:00-04:00"),
    });
    const upcoming = event({
      localDate: "2026-09-21",
      startsAt: new Date("2026-09-21T20:00:00-04:00"),
      endsAt: new Date("2026-09-22T02:00:00-04:00"),
    });
    const ended = event({
      localDate: "2026-09-21",
      startsAt: new Date("2026-09-21T10:00:00-04:00"),
      endsAt: new Date("2026-09-21T15:00:00-04:00"),
    });
    expect(isHappeningNow(live, now)).toBe(true);
    expect(isHappeningNow(upcoming, now)).toBe(false);
    expect(isHappeningNow(ended, now)).toBe(false);
    expect(matchesWhen(live, "now", now)).toBe(true);
  });

  it("treats Happening Today as the Miami calendar date", () => {
    const today = event({ localDate: "2026-09-21" });
    const tomorrow = event({ localDate: "2026-09-22" });
    expect(isHappeningToday(today, now)).toBe(true);
    expect(isHappeningToday(tomorrow, now)).toBe(false);
    expect(matchesWhen(today, "today", now)).toBe(true);
    expect(matchesWhen(tomorrow, "today", now)).toBe(false);
  });
});
