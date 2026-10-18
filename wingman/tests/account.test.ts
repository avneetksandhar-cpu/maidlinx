import { describe, expect, it } from "vitest";
import {
  hasPaidReceipt,
  historyLabel,
  includeTestFixturesInHistory,
} from "@/lib/account/history";
import { isUpcomingBooking, toBookingView, type AccountBookingRow } from "@/lib/account/queries";
import { assertServerPrice } from "@/lib/payments/checkout-guard";
import { TEST_CUSTOMER_EMAIL, TEST_LABEL } from "@/lib/test-fixtures/constants";

function sampleRow(overrides: Partial<AccountBookingRow> = {}): AccountBookingRow {
  return {
    id: "req-1",
    bookingId: "bk-1",
    status: "draft",
    occasion: "Night out",
    startsAt: new Date(Date.now() + 86_400_000).toISOString(),
    createdAt: new Date().toISOString(),
    isTestFixture: false,
    eventId: null,
    eventExternalId: null,
    eventName: null,
    source: "night_service",
    quoteCents: 50_000,
    paymentId: null,
    amountCents: null,
    paymentStatus: null,
    stripeCheckoutSessionId: null,
    paidAt: null,
    last4: null,
    brand: null,
    receiptUrl: null,
    ...overrides,
  };
}

describe("consumer account history", () => {
  it("hides TEST fixtures except for the labelled TEST customer", () => {
    expect(includeTestFixturesInHistory("wingmanworldgroup+member@gmail.com")).toBe(false);
    expect(includeTestFixturesInHistory(TEST_CUSTOMER_EMAIL)).toBe(true);
    expect(historyLabel(true)).toBe(TEST_LABEL);
    expect(historyLabel(false)).toBeNull();
  });

  it("does not treat unpaid quotes as receipts", () => {
    expect(hasPaidReceipt({ paymentStatus: "created", amountCents: 50_000 })).toBe(false);
    expect(hasPaidReceipt({ paymentStatus: "checkout_created", amountCents: 50_000 })).toBe(false);
    expect(hasPaidReceipt({ paymentStatus: "paid", amountCents: null })).toBe(false);
    expect(hasPaidReceipt({ paymentStatus: "paid", amountCents: 50_000 })).toBe(true);
  });

  it("maps a booking without inventing a paid amount", () => {
    const unpaid = toBookingView(sampleRow());
    expect(unpaid.amountCents).toBe(50_000);
    expect(unpaid.testLabel).toBeNull();
    expect(unpaid.canBookAgain).toBe(true);
    expect(hasPaidReceipt({ paymentStatus: unpaid.paymentStatus, amountCents: unpaid.amountCents })).toBe(
      false,
    );
    const fixture = toBookingView(sampleRow({ isTestFixture: true, paymentStatus: "paid", amountCents: 50_000 }));
    expect(fixture.testLabel).toBe(TEST_LABEL);
  });

  it("classifies upcoming only for paid/confirmed future nights", () => {
    const draft = toBookingView(sampleRow({ status: "draft" }));
    expect(isUpcomingBooking(draft)).toBe(false);
    const paid = toBookingView(sampleRow({ status: "paid" }));
    expect(isUpcomingBooking(paid)).toBe(true);
  });
});

describe("altered client price", () => {
  it("rejects a client amount that does not match the server quote", () => {
    expect(() =>
      assertServerPrice({ quoteTotalCents: 50_000, clientAmountCents: 1 }),
    ).toThrow(/does not match/);
    expect(() => assertServerPrice({ quoteTotalCents: 50_000, clientAmountCents: 50_000 })).not.toThrow();
  });
});
