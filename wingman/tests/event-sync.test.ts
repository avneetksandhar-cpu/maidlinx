import { describe, expect, it, vi } from "vitest";
import { ticketmasterAdapter, mapTicketmasterEvent } from "@/lib/events/adapters/ticketmaster";
import {
  classifyTicketmasterEvent,
  pickAuthorizedTicketmasterImage,
} from "@/lib/events/ticketmaster-filter";
import { matchesWhen } from "@/lib/events/filters";
import { partnerFeedAdapter } from "@/lib/events/adapters/partner-feed";
import { predictHqAdapter } from "@/lib/events/adapters/predicthq";
import { applyAutomatedUpdate } from "@/lib/events/merge";
import { applyIncomingEvent, createMemoryStore, finishSourceSync, runEngineSync } from "@/lib/events/engine";
import { eventShowsBookWithWingman } from "@/lib/marketplace/offers";
import { fetchWithBackoff } from "@/lib/events/fetch";
import { computeMergeKey, normalizeVenueName } from "@/lib/events/normalize";
import { markMissedSyncs, shouldHideFromPublic } from "@/lib/events/stale";
import { wallTimeInZoneToUtc, formatInTimeZone, weekendRange, toIsoDate } from "@/lib/events/timezone";
import type { CanonicalEvent, NormalizedIncomingEvent } from "@/lib/events/types";

function incoming(partial: Partial<NormalizedIncomingEvent> & Pick<NormalizedIncomingEvent, "sourceSlug" | "externalId" | "name" | "venueName" | "localDate">): NormalizedIncomingEvent {
  const startsAt = wallTimeInZoneToUtc(partial.localDate, 23, 0);
  return {
    performer: partial.performer ?? null,
    neighborhood: "Downtown Miami",
    area: "Downtown Miami",
    localTimeText: "11:00 PM",
    startsAt,
    endsAt: null,
    timezone: "America/New_York",
    category: "Nightlife",
    musicGenre: "House",
    eventType: "Nightclub",
    ageRequirement: "21+",
    officialSourceUrl: "https://example.com/event",
    priceMinCents: null,
    priceMaxCents: null,
    priceText: null,
    imageUrl: null,
    imageUsageVerified: false,
    imageAttribution: null,
    cancelled: false,
    raw: {},
    ...partial,
  };
}

function baseEvent(overrides: Partial<CanonicalEvent> = {}): CanonicalEvent {
  return {
    id: "evt-1",
    externalId: "EVT-0001",
    name: "Peewee at E11EVEN",
    performer: "Peewee",
    venueName: "E11EVEN Miami",
    venueId: "v1",
    neighborhood: "Downtown Miami",
    area: "Downtown Miami",
    localDate: "2026-09-01",
    localTimeText: "11:00 PM",
    startsAt: wallTimeInZoneToUtc("2026-09-01", 23, 0),
    endsAt: null,
    timezone: "America/New_York",
    category: "Nightclub",
    musicGenre: null,
    eventType: "Nightclub",
    ageRequirement: "21+",
    officialSourceUrl: "https://www.11miami.com/events",
    priceMinCents: null,
    priceMaxCents: null,
    priceText: null,
    imageUrl: null,
    imageUsageVerified: false,
    imageAttribution: null,
    bookingStatus: "DISCOVERY_ONLY",
    discoveryStatus: "discovery_ready",
    importStatus: "approved",
    mergeKey: computeMergeKey({
      venueName: "E11EVEN Miami",
      name: "Peewee at E11EVEN",
      performer: "Peewee",
      localDate: "2026-09-01",
      localTimeText: "11:00 PM",
    }),
    lastSyncedAt: new Date(),
    lastSeenAt: new Date(),
    missedSyncCount: 0,
    stale: false,
    hiddenAt: null,
    adminLockedFields: [],
    mergedIntoId: null,
    primarySourceSlug: "approved_venues",
    sourceVerifiedAt: new Date(),
    ...overrides,
  };
}

describe("create and update", () => {
  it("creates then updates the same source record", () => {
    const store = createMemoryStore();
    const first = applyIncomingEvent(
      store,
      incoming({
        sourceSlug: "ticketmaster",
        externalId: "tm-1",
        name: "Disco Lines",
        venueName: "LIV Nightclub",
        localDate: "2026-09-05",
      }),
    );
    expect(first.created).toBe(true);
    const second = applyIncomingEvent(
      store,
      incoming({
        sourceSlug: "ticketmaster",
        externalId: "tm-1",
        name: "Disco Lines (updated)",
        venueName: "LIV Nightclub",
        localDate: "2026-09-05",
      }),
    );
    expect(second.created).toBe(false);
    expect(second.event.name).toBe("Disco Lines (updated)");
    expect(store.events).toHaveLength(1);
    expect(second.event.sourceRecords).toHaveLength(1);
  });
});

describe("cross-source dedup", () => {
  it("merges Ticketmaster and PredictHQ records onto one event and keeps both source rows", () => {
    const store = createMemoryStore();
    applyIncomingEvent(
      store,
      incoming({
        sourceSlug: "ticketmaster",
        externalId: "tm-disco",
        name: "Disco Lines",
        performer: "Disco Lines",
        venueName: "LIV",
        localDate: "2026-09-05",
      }),
    );
    const merged = applyIncomingEvent(
      store,
      incoming({
        sourceSlug: "predicthq",
        externalId: "phq-disco",
        name: "Disco Lines",
        performer: "Disco Lines",
        venueName: "LIV Nightclub",
        localDate: "2026-09-05",
      }),
    );
    expect(merged.merged).toBe(true);
    expect(store.events.filter((event) => !event.mergedIntoId)).toHaveLength(1);
    expect(merged.event.sourceRecords.map((record) => record.sourceSlug).sort()).toEqual([
      "predicthq",
      "ticketmaster",
    ]);
  });
});

describe("cancelled", () => {
  it("marks an existing event cancelled when the provider sends cancelled", () => {
    const store = createMemoryStore();
    applyIncomingEvent(
      store,
      incoming({
        sourceSlug: "ticketmaster",
        externalId: "tm-x",
        name: "Cancelled Night",
        venueName: "Factory Town",
        localDate: "2026-09-10",
      }),
    );
    applyIncomingEvent(
      store,
      incoming({
        sourceSlug: "ticketmaster",
        externalId: "tm-x",
        name: "Cancelled Night",
        venueName: "Factory Town",
        localDate: "2026-09-10",
        cancelled: true,
      }),
    );
    expect(store.events[0].bookingStatus).toBe("CANCELLED");
    expect(store.events[0].discoveryStatus).toBe("cancelled");
  });
});

describe("stale after two missed syncs", () => {
  it("does not stale after one miss and does after two", () => {
    const store = createMemoryStore();
    applyIncomingEvent(
      store,
      incoming({
        sourceSlug: "ticketmaster",
        externalId: "tm-keep",
        name: "Keep",
        venueName: "M2 Miami",
        localDate: "2026-09-12",
      }),
    );
    const once = markMissedSyncs(store.events[0].sourceRecords, new Set(), new Date());
    expect(once[0].missedSyncCount).toBe(1);
    expect(once[0].status).not.toBe("stale");
    const twice = markMissedSyncs(once, new Set(), new Date());
    expect(twice[0].missedSyncCount).toBe(2);
    expect(twice[0].status).toBe("stale");
  });

  it("finishSourceSync only increments the source that ran", () => {
    const store = createMemoryStore();
    applyIncomingEvent(
      store,
      incoming({
        sourceSlug: "approved_venues",
        externalId: "EVT-0001",
        name: "Peewee",
        venueName: "E11EVEN Miami",
        localDate: "2026-09-01",
      }),
    );
    finishSourceSync(store, "ticketmaster", new Set(), new Date());
    expect(store.events[0].sourceRecords[0].missedSyncCount).toBe(0);
  });
});

describe("pg date serialization", () => {
  it("normalizes Date objects to YYYY-MM-DD instead of weekday text", () => {
    expect(toIsoDate(new Date("2026-09-12T00:00:00.000Z"))).toBe("2026-09-12");
    expect(toIsoDate("2026-09-12")).toBe("2026-09-12");
    expect(() => toIsoDate("not-a-date")).toThrow(/invalid input syntax/);
  });
});

describe("DST dates", () => {
  it("maps Miami spring-forward and fall-back wall times", () => {
    const beforeSpring = wallTimeInZoneToUtc("2026-03-08", 1, 30);
    expect(formatInTimeZone(beforeSpring).date).toBe("2026-03-08");
    expect(formatInTimeZone(beforeSpring).hour).toBe(1);
    const afterSpring = wallTimeInZoneToUtc("2026-03-08", 3, 30);
    expect(formatInTimeZone(afterSpring).hour).toBe(3);
    const november = wallTimeInZoneToUtc("2026-11-01", 1, 30);
    const local = formatInTimeZone(november);
    expect(local.date).toBe("2026-11-01");
    expect(local.hour).toBe(1);
  });
});

describe("rate-limit and provider failure", () => {
  it("retries on 429 then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("limited", { status: 429, headers: { "Retry-After": "0" } }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    const response = await fetchWithBackoff("https://example.com", undefined, {
      fetchImpl,
      sleep: async () => undefined,
    });
    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("skips Ticketmaster without a key and fails after exhausted 429s", async () => {
    const skipped = await ticketmasterAdapter.fetch({
      now: new Date("2026-08-31T16:00:00Z"),
      ticketmasterApiKey: null,
      predictHqToken: null,
    });
    expect(skipped.status).toBe("skipped");
    if (skipped.status === "skipped") {
      expect(skipped.reason).toMatch(/TICKETMASTER_API_KEY missing/);
    }

    const fetchImpl = vi.fn().mockResolvedValue(
      new Response("limited", { status: 429, headers: { "Retry-After": "0" } }),
    );
    const failed = await ticketmasterAdapter.fetch({
      now: new Date("2026-08-31T16:00:00Z"),
      ticketmasterApiKey: "test-key",
      predictHqToken: null,
      fetchImpl,
    });
    expect(failed.status).toBe("failed");
    if (failed.status === "failed") expect(failed.retryable).toBe(true);

    const providerDown = await predictHqAdapter.fetch({
      now: new Date(),
      ticketmasterApiKey: null,
      predictHqToken: "token",
      fetchImpl: vi.fn().mockResolvedValue(new Response("down", { status: 503 })),
    });
    expect(providerDown.status).toBe("failed");
  });

  it("keeps the partner feed disabled with no scrape", async () => {
    expect(partnerFeedAdapter.enabled).toBe(false);
    const result = await partnerFeedAdapter.fetch({
      now: new Date(),
      ticketmasterApiKey: null,
      predictHqToken: null,
    });
    expect(result.status).toBe("skipped");
    if (result.status === "skipped") expect(result.reason).toMatch(/No scrape/);
  });
});

describe("discovery-only has no book button", () => {
  it("hides Book with Wingman unless VERIFIED_AVAILABLE and an offer exists", () => {
    expect(
      eventShowsBookWithWingman({
        discoveryStatus: "discovery_ready",
        hasBookableOffer: false,
        bookingStatus: "DISCOVERY_ONLY",
      }),
    ).toBe(false);
    expect(
      eventShowsBookWithWingman({
        discoveryStatus: "discovery_ready",
        hasBookableOffer: true,
        bookingStatus: "DISCOVERY_ONLY",
      }),
    ).toBe(false);
    expect(
      eventShowsBookWithWingman({
        discoveryStatus: "discovery_ready",
        hasBookableOffer: true,
        bookingStatus: "VERIFIED_AVAILABLE",
      }),
    ).toBe(true);
  });
});

describe("admin corrections preserved", () => {
  it("does not overwrite locked fields with weaker automated data", () => {
    const existing = baseEvent({
      name: "Admin corrected title",
      adminLockedFields: ["name", "officialSourceUrl"],
      officialSourceUrl: "https://www.11miami.com/events",
    });
    const next = applyAutomatedUpdate(
      existing,
      incoming({
        sourceSlug: "ticketmaster",
        externalId: "tm-override",
        name: "Wrong TM title",
        venueName: "E11EVEN Miami",
        localDate: "2026-09-01",
        officialSourceUrl: "https://www.ticketmaster.com/wrong",
      }),
    );
    expect(next.name).toBeUndefined();
    expect(next.officialSourceUrl).toBeUndefined();
    expect(next.venueName).toBe("E11EVEN Miami");
  });
});

describe("hide expired and venue normalize", () => {
  it("hides six hours after end and aliases approved venues", () => {
    const end = new Date("2026-08-31T02:00:00Z");
    const event = baseEvent({
      startsAt: end,
      endsAt: end,
      localDate: "2026-08-30",
    });
    expect(shouldHideFromPublic(event, new Date("2026-08-31T07:59:00Z"))).toBe(false);
    expect(shouldHideFromPublic(event, new Date("2026-08-31T08:01:00Z"))).toBe(true);
    expect(normalizeVenueName("E11EVEN")).toBe(normalizeVenueName("E11EVEN Miami"));
    expect(weekendRange(new Date("2026-08-28T16:00:00Z")).start).toBe("2026-08-28");
  });
});

describe("ticketmaster mapper", () => {
  it("stores authorized Ticketmaster images with attribution and maps cancelled", () => {
    const mapped = mapTicketmasterEvent({
      id: "tm-9",
      name: "Disco Lines",
      url: "https://www.ticketmaster.com/event/tm-9",
      images: [
        { url: "https://s1.ticketm.net/dam/photo.jpg", ratio: "16_9", width: 1024 },
        { url: "https://evil.example/steal.jpg", ratio: "16_9", width: 2048 },
      ],
      classifications: [{ segment: { name: "Music" }, genre: { name: "Dance/Electronic" } }],
      dates: {
        start: { localDate: "2026-09-20", localTime: "23:00:00" },
        status: { code: "cancelled" },
      },
      _embedded: { venues: [{ name: "Kaseya Center", city: { name: "Miami" } }] },
    });
    expect(mapped.rejected).toBeNull();
    expect(mapped.event?.imageUrl).toBe("https://s1.ticketm.net/dam/photo.jpg");
    expect(mapped.event?.imageUsageVerified).toBe(true);
    expect(mapped.event?.imageAttribution).toBe("Ticketmaster");
    expect(mapped.event?.cancelled).toBe(true);
    expect(mapped.event?.timezone).toBe("America/New_York");
  });

  it("accepts Miami Beach concerts and rejects sports, theatre, family, and other cities", () => {
    const beach = mapTicketmasterEvent({
      id: "tm-beach",
      name: "Afterhours",
      url: "https://www.ticketmaster.com/event/tm-beach",
      classifications: [{ segment: { name: "Music" }, genre: { name: "Dance/Electronic" } }],
      dates: { start: { localDate: "2026-09-21", localTime: "23:00:00" } },
      _embedded: { venues: [{ name: "LIV Nightclub", city: { name: "Miami Beach" } }] },
    });
    expect(beach.event?.neighborhood).toBe("Miami Beach");
    expect(beach.rejected).toBeNull();

    const sports = classifyTicketmasterEvent({
      name: "Heat vs Celtics",
      city: "Miami",
      classifications: [{ segment: { name: "Sports" }, genre: { name: "Basketball" } }],
    });
    expect(sports).toEqual({ ok: false, reason: "sports" });

    const theatre = classifyTicketmasterEvent({
      name: "Hamilton",
      city: "Miami",
      classifications: [{ segment: { name: "Arts & Theatre" }, genre: { name: "Theatre" } }],
    });
    expect(theatre).toEqual({ ok: false, reason: "theatre" });

    const family = classifyTicketmasterEvent({
      name: "Kids Concert",
      city: "Miami",
      classifications: [{ segment: { name: "Music" }, genre: { name: "Pop" }, family: true }],
    });
    expect(family).toEqual({ ok: false, reason: "family" });

    const orlando = classifyTicketmasterEvent({
      name: "Festival",
      city: "Orlando",
      classifications: [{ segment: { name: "Music" } }],
    });
    expect(orlando).toEqual({ ok: false, reason: "outside_miami" });
  });

  it("rejects unauthorized image hosts", () => {
    const picked = pickAuthorizedTicketmasterImage([
      { url: "https://cdn.example.com/photo.jpg", width: 1200 },
    ]);
    expect(picked.url).toBeNull();
    expect("failed" in picked && picked.failed).toBe(true);
  });
});

describe("tonight tomorrow weekend filters", () => {
  it("matches real local dates in America/New_York", () => {
    const now = new Date("2026-08-28T16:00:00Z");
    const tonight = baseEvent({ localDate: "2026-08-28" });
    const tomorrow = baseEvent({ localDate: "2026-08-29" });
    const saturday = baseEvent({ localDate: "2026-08-29" });
    expect(matchesWhen(tonight, "tonight", now)).toBe(true);
    expect(matchesWhen(tomorrow, "tomorrow", now)).toBe(true);
    expect(matchesWhen(saturday, "weekend", now)).toBe(true);
    expect(matchesWhen(tonight, "tomorrow", now)).toBe(false);
  });
});

describe("engine run", () => {
  it("records fetched and upserted counts", () => {
    const store = createMemoryStore();
    const summary = runEngineSync(store, "ticketmaster", [
      incoming({
        sourceSlug: "ticketmaster",
        externalId: "a",
        name: "A",
        venueName: "Club Space",
        localDate: "2026-09-18",
      }),
    ]);
    expect(summary.fetchedCount).toBe(1);
    expect(summary.upsertedCount).toBe(1);
    expect(summary.createdCount).toBe(1);
    expect(summary.updatedCount).toBe(0);
  });
});
