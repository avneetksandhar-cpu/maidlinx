import { describe, expect, it } from "vitest";
import { toProductRole } from "@/lib/auth/types";
import {
  canTransition,
  paymentUnlocked,
  chatUnlocked,
  assertTransition,
} from "@/lib/marketplace/request-machine";
import { INTEREST_DISCLAIMER, normalizeInterest } from "@/lib/marketplace/interest";
import { mapImportRows, parseCsv } from "@/lib/marketplace/event-import";
import {
  computeQuoteTotal,
  eventShowsBookWithWingman,
  meetsMinimumBooking,
  offerIsBookable,
} from "@/lib/marketplace/offers";
import { canPublishWingman, canSetVerified, emptyChecklist } from "@/lib/marketplace/verification";
import { applyStripeWebhookEvent } from "@/lib/payments/webhook";
import { readStripeEnv } from "@/lib/payments/env";
import { MIN_BOOKING_CENTS } from "@/lib/marketplace/constants";

describe("product roles", () => {
  it("maps Sprint 1 roles without renaming the database", () => {
    expect(toProductRole("member")).toBe("customer");
    expect(toProductRole("partner")).toBe("wingman");
    expect(toProductRole("admin")).toBe("operator");
    expect(toProductRole("owner")).toBe("admin");
  });
});

describe("request state machine", () => {
  it("blocks illegal transitions", () => {
    expect(canTransition("submitted", "paid")).toBe(false);
    expect(canTransition("submitted", "under_review")).toBe(true);
    expect(canTransition("draft", "paid")).toBe(false);
    expect(() => assertTransition("submitted", "confirmed")).toThrow(/Illegal/);
  });

  it("keeps payment locked until acceptance", () => {
    expect(paymentUnlocked("submitted")).toBe(false);
    expect(paymentUnlocked("awaiting_customer")).toBe(false);
    expect(paymentUnlocked("accepted")).toBe(true);
    expect(paymentUnlocked("payment_pending")).toBe(true);
  });

  it("keeps private chat locked until paid confirmation", () => {
    expect(chatUnlocked("submitted")).toBe(false);
    expect(chatUnlocked("accepted")).toBe(false);
    expect(chatUnlocked("paid")).toBe(true);
    expect(chatUnlocked("confirmed")).toBe(true);
  });

  it("allows refund and dispute from confirmed", () => {
    expect(canTransition("confirmed", "refunded")).toBe(true);
    expect(canTransition("confirmed", "disputed")).toBe(true);
    expect(canTransition("refunded", "confirmed")).toBe(false);
  });
});

describe("discovery vs bookable", () => {
  it("keeps discovery-only events from showing Book with Wingman", () => {
    expect(
      eventShowsBookWithWingman({ discoveryStatus: "discovery_ready", hasBookableOffer: false }),
    ).toBe(false);
    expect(
      eventShowsBookWithWingman({ discoveryStatus: "discovery_ready", hasBookableOffer: true }),
    ).toBe(true);
    expect(eventShowsBookWithWingman({ discoveryStatus: "cancelled", hasBookableOffer: true })).toBe(
      false,
    );
  });
});

describe("offer approval and expiry", () => {
  const base = {
    wingmanStatus: "verified" as const,
    operatorApproved: true,
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    inventoryQuantity: 1,
    serviceType: "vip_table",
    terms: "Arrive 11pm. 21+.",
    serviceFeeCents: 5000,
  };

  it("is bookable only when every gate passes", () => {
    expect(offerIsBookable(base)).toBe(true);
    expect(offerIsBookable({ ...base, wingmanStatus: "pending" })).toBe(false);
    expect(offerIsBookable({ ...base, operatorApproved: false })).toBe(false);
    expect(offerIsBookable({ ...base, expiresAt: new Date(Date.now() - 1000).toISOString() })).toBe(
      false,
    );
    expect(offerIsBookable({ ...base, inventoryQuantity: 0 })).toBe(false);
  });
});

describe("verification", () => {
  it("keeps unverified Wingmen private", () => {
    const checklist = emptyChecklist();
    expect(canPublishWingman({ checklist, status: "pending" })).toBe(false);
    expect(canSetVerified(checklist)).toBe(false);
    const complete = {
      consent: true,
      identity: true,
      phone: true,
      email: true,
      inventory_authority: true,
      agreement: true,
      payout: true,
      media: true,
      policy: true,
      test_booking: true,
      gov_id: true,
      selfie_liveness: true,
      screening_manual: true,
      code_of_conduct: true,
      emergency_contact: true,
      service_boundary: true,
      no_show_policy: true,
      payment_auth: true,
    };
    expect(canSetVerified(complete)).toBe(true);
    expect(canPublishWingman({ checklist: complete, status: "verified" })).toBe(true);
    expect(canPublishWingman({ checklist: complete, status: "pending" })).toBe(false);
  });
});

describe("consumer account history", () => {
  it("hides TEST fixtures from everyone except the labelled TEST customer", async () => {
    const { includeTestFixturesInHistory, historyLabel, hasPaidReceipt } = await import(
      "@/lib/account/history"
    );
    const { TEST_CUSTOMER_EMAIL, TEST_LABEL } = await import("@/lib/test-fixtures/constants");
    expect(includeTestFixturesInHistory("wingmanworldgroup+member@gmail.com")).toBe(false);
    expect(includeTestFixturesInHistory(TEST_CUSTOMER_EMAIL)).toBe(true);
    expect(historyLabel(true)).toBe(TEST_LABEL);
    expect(historyLabel(false)).toBeNull();
    expect(hasPaidReceipt({ paymentStatus: "created", amountCents: 50_000 })).toBe(false);
    expect(hasPaidReceipt({ paymentStatus: "paid", amountCents: 50_000 })).toBe(true);
    expect(hasPaidReceipt({ paymentStatus: "paid", amountCents: null })).toBe(false);
  });
});

describe("night service quote", () => {
  it("is exactly $500 server-side with no client-invented extras", async () => {
    const { nightServiceQuote, NIGHT_SERVICE_TOTAL_CENTS } = await import(
      "@/lib/marketplace/night-service"
    );
    const quote = nightServiceQuote();
    expect(NIGHT_SERVICE_TOTAL_CENTS).toBe(50_000);
    expect(quote.totalCents).toBe(50_000);
    expect(quote.customerFeeCents).toBe(0);
    expect(quote.terms.toLowerCase()).toMatch(/not a table/);
  });
});

describe("assigned host Andres P", () => {
  it("uses Andres P without claiming government-ID verification or reviews", async () => {
    const {
      ASSIGNED_HOST_NAME,
      YOUR_WINGMAN_DISPLAY_NAME,
      OPERATOR_SLOT_BIO,
      BOOK_AGAIN_AVAILABILITY,
    } = await import("@/lib/marketplace/host-copy");
    expect(ASSIGNED_HOST_NAME).toBe("Andres P");
    expect(YOUR_WINGMAN_DISPLAY_NAME).toBe("Your Wingman · Andres P");
    expect(OPERATOR_SLOT_BIO.toLowerCase()).toMatch(/not verified/);
    expect(OPERATOR_SLOT_BIO.toLowerCase()).toMatch(/no photo/);
    expect(OPERATOR_SLOT_BIO.toLowerCase()).toMatch(/no reviews/);
    expect(BOOK_AGAIN_AVAILABILITY.toLowerCase()).toMatch(/not a guarantee/);
  });
});

describe("backup listing picker", () => {
  it("picks a second real event at a different venue and does not invent one", async () => {
    const { chooseBackupEvent } = await import("@/lib/marketplace/backup");
    const base = {
      area: "Miami",
      neighborhood: "Downtown",
      category: "Nightclub",
      musicGenre: "House",
      eventType: "Nightclub",
      atmosphere: null,
      dressCode: null,
      estimatedSpendText: "Estimate $80",
      priceText: null,
      ageRequirement: "21+",
      localTimeText: "11:00 PM",
      timezone: "America/New_York",
      officialSourceUrl: "https://example.com/event",
      sourceLabel: "Official venue calendar",
      lastVerified: null,
      lastUpdated: null,
      discoveryStatus: "discovery_ready",
      bookingStatus: "DISCOVERY_ONLY",
      availableServices: [] as string[],
      bookable: false,
      bookingStatusNote: "",
      imageUsageVerified: false,
      imageUrl: null,
      imageAttribution: null,
    };
    const events = [
      { ...base, id: "1", externalId: "a", name: "Primary Night", venueName: "Venue A", localDate: "2026-09-08" },
      { ...base, id: "2", externalId: "b", name: "Backup Night", venueName: "Venue B", localDate: "2026-09-09" },
    ];
    const backup = chooseBackupEvent(events, { id: "1", venueName: "Venue A" });
    expect(backup?.name).toBe("Backup Night");
    expect(backup?.partnershipClaimed).toBe(false);
    expect(backup?.estimateNote.toLowerCase()).toMatch(/estimate/);
    expect(chooseBackupEvent(events.slice(0, 1), { id: "1" })).toBeNull();
  });
});

describe("pricing", () => {
  it("enforces the $500 minimum as total value, not a deposit", () => {
    expect(meetsMinimumBooking(49_999)).toBe(false);
    expect(meetsMinimumBooking(MIN_BOOKING_CENTS)).toBe(true);
  });

  it("uses configurable fee basis points instead of a hardcoded take", () => {
    const priced = computeQuoteTotal({
      subtotalCents: 100_000,
      serviceFeeCents: 10_000,
      taxesCents: 0,
      customerFeeBps: 250,
    });
    expect(priced.customerFeeCents).toBe(2500);
    expect(priced.totalCents).toBe(112_500);
  });
});

describe("stripe webhook idempotency", () => {
  it("does not apply a duplicate event", () => {
    const first = applyStripeWebhookEvent({
      eventId: "evt_1",
      type: "checkout.session.completed",
      alreadyProcessed: false,
    });
    const second = applyStripeWebhookEvent({
      eventId: "evt_1",
      type: "checkout.session.completed",
      alreadyProcessed: true,
    });
    expect(first.applied).toBe(true);
    expect(first.nextStatus).toBe("paid");
    expect(second.duplicate).toBe(true);
    expect(second.applied).toBe(false);
  });
});

describe("interest waitlist", () => {
  it("collects email without charging or promising access", () => {
    const normalized = normalizeInterest({
      email: " Guest@Example.com ",
      name: "Guest",
      source: "wingmen_directory",
    });
    expect(normalized.email).toBe("guest@example.com");
    expect(normalized.source).toBe("wingmen_directory");
    expect(INTEREST_DISCLAIMER.toLowerCase()).toContain("does not charge");
    expect(INTEREST_DISCLAIMER.toLowerCase()).toContain("does not promise");
  });

  it("rejects an invalid email", () => {
    expect(() => normalizeInterest({ email: "not-an-email" })).toThrow(/valid email/i);
  });
});

describe("event import parser", () => {
  it("maps CSV rows to discovery-ready listings and never marks them bookable", () => {
    const csv = [
      "Event ID,Event Name,Venue,Event Date,Start Time,Area,Category,Age,Official Source",
      "IMP-TEST-1,Parser Night,Test Venue,2026-09-15,11:00 PM,Wynwood,Nightlife,21+,https://example.com/event",
    ].join("\n");
    const parsed = mapImportRows(parseCsv(csv));
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].name).toBe("Parser Night");
    expect(parsed.rows[0].officialSource).toBe("https://example.com/event");
    expect(parsed.rows[0].bookingStatus).toBe("Awaiting Wingman inventory");
  });

  it("rejects rows without an official source URL", () => {
    const csv = "Event Name,Venue,Event Date,Official Source\nNo Source,Venue,2026-09-15,not-a-url";
    const parsed = mapImportRows(parseCsv(csv));
    expect(parsed.rows).toHaveLength(0);
    expect(parsed.errors[0]?.message).toMatch(/http/i);
  });
});

describe("stripe env validation", () => {
  it("rejects live keys and missing test config", () => {
    const live = readStripeEnv({
      STRIPE_SECRET_KEY: "sk_live_xxx",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_xxx",
      STRIPE_WEBHOOK_SECRET: "whsec_xxx",
    });
    expect(live.ok).toBe(false);
    const missing = readStripeEnv({});
    expect(missing.ok).toBe(false);
  });
});
