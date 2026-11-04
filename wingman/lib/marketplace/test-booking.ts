import type { PoolClient } from "pg";
import type { AuthUser } from "@/lib/auth/types";
import { isOperator } from "@/lib/auth/permissions";
import { withUserContext } from "@/lib/db";
import { writeAudit } from "@/lib/marketplace/audit";
import { MIN_BOOKING_CENTS, type RequestStatus } from "@/lib/marketplace/constants";
import { computeQuoteTotal } from "@/lib/marketplace/offers";
import { assertTransition } from "@/lib/marketplace/request-machine";
import { getSql } from "@/lib/neon";
import {
  NO_GUARANTEES_ACK,
  TEST_CUSTOMER_EMAIL,
  TEST_EVENT_EXTERNAL_ID,
  TEST_LABEL,
  TEST_OFFER_TERMS,
  TEST_SERVICE_FEE_CENTS,
  TEST_SUBTOTAL_CENTS,
  TEST_TAXES_CENTS,
  TEST_WINGMAN_DISPLAY_NAME,
} from "@/lib/test-fixtures/constants";
import { testFixturesBlocker, testFixturesEnabled } from "@/lib/test-fixtures/env";

export type TestFixtureSnapshot = {
  enabled: boolean;
  customerEmail: string;
  wingmanName: string;
  eventId: string | null;
  eventName: string | null;
  offerId: string | null;
  wingmanId: string | null;
  customerUserId: string | null;
  label: string;
};

export function assertTestFixturesOn(): void {
  if (!testFixturesEnabled()) {
    throw new Error(testFixturesBlocker());
  }
}

export function canUsePrivateTestBooking(user: AuthUser, customerEmail?: string | null): boolean {
  if (isOperator(user)) return true;
  if (user.email === TEST_CUSTOMER_EMAIL) return true;
  if (customerEmail && user.email === customerEmail) return true;
  return false;
}

export async function loadTestFixtureSnapshot(): Promise<TestFixtureSnapshot> {
  const sql = getSql();
  const events = (await sql`
    SELECT id, name FROM events
    WHERE is_test_fixture = true AND external_id = ${TEST_EVENT_EXTERNAL_ID}
    LIMIT 1
  `) as Array<{ id: string; name: string }>;
  const wingmen = (await sql`
    SELECT id FROM wingmen WHERE is_test_fixture = true LIMIT 1
  `) as Array<{ id: string }>;
  const offers = (await sql`
    SELECT id FROM wingman_event_offers WHERE is_test_fixture = true LIMIT 1
  `) as Array<{ id: string }>;
  const customers = (await sql`
    SELECT u.id, u.email
    FROM auth_users u
    JOIN profiles p ON p.id = u.id
    WHERE p.is_test_fixture = true AND u.email = ${TEST_CUSTOMER_EMAIL}
    LIMIT 1
  `) as Array<{ id: string; email: string }>;

  return {
    enabled: testFixturesEnabled(),
    customerEmail: TEST_CUSTOMER_EMAIL,
    wingmanName: TEST_WINGMAN_DISPLAY_NAME,
    eventId: events[0]?.id ?? null,
    eventName: events[0]?.name ?? null,
    offerId: offers[0]?.id ?? null,
    wingmanId: wingmen[0]?.id ?? null,
    customerUserId: customers[0]?.id ?? null,
    label: TEST_LABEL,
  };
}

export async function createPrivateTestRequest(
  user: AuthUser,
  input: {
    serviceScopeAck: boolean;
    codeOfConductAck: boolean;
    noGuaranteesAck: boolean;
    emergencyContactName: string;
    emergencyContactPhone: string;
    occasion?: string;
    atmosphere?: string;
    groupSize?: number;
  },
) {
  assertTestFixturesOn();
  if (!canUsePrivateTestBooking(user)) {
    throw new Error("Private TEST booking is limited to the TEST customer and operators.");
  }
  if (!input.serviceScopeAck || !input.codeOfConductAck || !input.noGuaranteesAck) {
    throw new Error("Service scope, code of conduct, and no-guarantee acknowledgements are required.");
  }
  const contactName = input.emergencyContactName.trim();
  const contactPhone = input.emergencyContactPhone.trim();
  if (contactName.length < 2 || contactPhone.length < 7) {
    throw new Error("Emergency contact name and phone are required.");
  }

  const fixtures = await loadTestFixtureSnapshot();
  if (!fixtures.eventId || !fixtures.offerId || !fixtures.wingmanId) {
    throw new Error("TEST fixtures are not seeded. Run npm run seed with ENABLE_TEST_FIXTURES=true.");
  }

  const sql = getSql();
  const settings = (await sql`SELECT customer_fee_bps, min_booking_cents FROM marketplace_settings WHERE id = 'default'`) as Array<{
    customer_fee_bps: number;
    min_booking_cents: number;
  }>;
  const breakdown = computeQuoteTotal({
    subtotalCents: TEST_SUBTOTAL_CENTS,
    serviceFeeCents: TEST_SERVICE_FEE_CENTS,
    taxesCents: TEST_TAXES_CENTS,
    customerFeeBps: settings[0]?.customer_fee_bps ?? 0,
  });
  const minCents = settings[0]?.min_booking_cents ?? MIN_BOOKING_CENTS;
  if (breakdown.totalCents < minCents) {
    throw new Error(`TEST quote total must be at least $${(minCents / 100).toFixed(0)} USD.`);
  }

  return withUserContext(user, async (client) => {
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO booking_requests (
         customer_id, event_id, requested_wingman_id, assigned_wingman_id, offer_id, source,
         occasion, atmosphere, area, starts_at, group_size, spend_band, special_requests,
         requested_services, night_goal, status, is_test_fixture,
         service_scope_ack_at, code_of_conduct_ack_at, no_guarantees_ack_at,
         emergency_contact_name, emergency_contact_phone
       ) VALUES (
         $1, $2, $3, $3, $4, 'event',
         $5, $6, 'Miami Beach', now() + interval '2 days', $7, 'band_500_1500',
         $8, ARRAY['personalized_itinerary']::text[], 'TEST private booking',
         'draft', true, now(), now(), now(), $9, $10
       )
       RETURNING id`,
      [
        user.id,
        fixtures.eventId,
        fixtures.wingmanId,
        fixtures.offerId,
        input.occasion ?? "TEST night out",
        input.atmosphere ?? "TEST fixture — not a public night",
        input.groupSize ?? 2,
        `${TEST_LABEL}: ${NO_GUARANTEES_ACK}`,
        contactName,
        contactPhone,
      ],
    );
    const requestId = inserted.rows[0].id;
    const quote = await client.query<{ id: string }>(
      `INSERT INTO quotes (
         request_id, wingman_id, offer_id, subtotal_cents, service_fee_cents,
         taxes_cents, customer_fee_cents, total_cents, terms, status, is_test_fixture
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'accepted', true)
       RETURNING id`,
      [
        requestId,
        fixtures.wingmanId,
        fixtures.offerId,
        breakdown.subtotalCents,
        breakdown.serviceFeeCents,
        breakdown.taxesCents,
        breakdown.customerFeeCents,
        breakdown.totalCents,
        TEST_OFFER_TERMS,
      ],
    );
    await writeAudit(client, {
      actorId: user.id,
      entityType: "booking_request",
      entityId: requestId,
      action: "test_request_created",
      toState: "draft",
      payload: { quoteId: quote.rows[0].id, testFixture: true },
    });
    return { requestId, quoteId: quote.rows[0].id, ...breakdown, label: TEST_LABEL };
  });
}

export async function markCheckedIn(user: AuthUser, requestId: string) {
  return withUserContext(user, async (client) => {
    const row = await loadOwnedRequest(client, user, requestId);
    assertTransition(row.status, "in_progress");
    await client.query(
      `UPDATE booking_requests SET status = 'in_progress', updated_at = now() WHERE id = $1`,
      [requestId],
    );
    const booking = await client.query<{ id: string }>(
      `UPDATE bookings SET checked_in_at = now(), status = 'in_progress' WHERE request_id = $1 RETURNING id`,
      [requestId],
    );
    if (booking.rows[0]) {
      await client.query(
        `INSERT INTO booking_checkins (booking_id, kind, recorded_by, is_test_fixture)
         VALUES ($1, 'check_in', $2, $3)`,
        [booking.rows[0].id, user.id, row.is_test_fixture],
      );
    }
    await writeAudit(client, {
      actorId: user.id,
      entityType: "booking_request",
      entityId: requestId,
      action: "check_in",
      fromState: row.status,
      toState: "in_progress",
    });
    return { status: "in_progress" as const };
  });
}

export async function markCheckedOut(user: AuthUser, requestId: string) {
  return withUserContext(user, async (client) => {
    const row = await loadOwnedRequest(client, user, requestId);
    assertTransition(row.status, "completed");
    await client.query(
      `UPDATE booking_requests SET status = 'completed', updated_at = now() WHERE id = $1`,
      [requestId],
    );
    const booking = await client.query<{ id: string }>(
      `UPDATE bookings
       SET checked_out_at = now(), completed_at = now(), status = 'completed'
       WHERE request_id = $1
       RETURNING id`,
      [requestId],
    );
    if (booking.rows[0]) {
      await client.query(
        `INSERT INTO booking_checkins (booking_id, kind, recorded_by, is_test_fixture)
         VALUES ($1, 'check_out', $2, $3)`,
        [booking.rows[0].id, user.id, row.is_test_fixture],
      );
    }
    await writeAudit(client, {
      actorId: user.id,
      entityType: "booking_request",
      entityId: requestId,
      action: "check_out",
      fromState: row.status,
      toState: "completed",
    });
    return { status: "completed" as const };
  });
}

export async function cancelRequest(user: AuthUser, requestId: string, notes?: string) {
  return withUserContext(user, async (client) => {
    const row = await loadOwnedRequest(client, user, requestId);
    if (row.status === "paid" || row.status === "confirmed" || row.status === "in_progress") {
      if (!isOperator(user)) {
        throw new Error("Paid bookings can only be cancelled by an operator.");
      }
    }
    assertTransition(row.status, "cancelled");
    await client.query(
      `UPDATE booking_requests SET status = 'cancelled', updated_at = now() WHERE id = $1`,
      [requestId],
    );
    await client.query(`UPDATE bookings SET status = 'cancelled' WHERE request_id = $1`, [requestId]);
    await writeAudit(client, {
      actorId: user.id,
      entityType: "booking_request",
      entityId: requestId,
      action: "cancel",
      fromState: row.status,
      toState: "cancelled",
      payload: { notes: notes ?? null },
    });
    return { status: "cancelled" as const };
  });
}

export async function submitReview(
  user: AuthUser,
  requestId: string,
  input: { rating: number; body?: string },
) {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new Error("Rating must be 1–5.");
  }
  return withUserContext(user, async (client) => {
    const row = await loadOwnedRequest(client, user, requestId);
    if (row.customer_id !== user.id && !isOperator(user)) {
      throw new Error("Only the customer can review this booking.");
    }
    if (row.status !== "completed") {
      throw new Error("Reviews unlock after check-out is complete.");
    }
    const booking = await client.query<{ id: string; is_test_fixture: boolean }>(
      "SELECT id, is_test_fixture FROM bookings WHERE request_id = $1",
      [requestId],
    );
    const bookingId = booking.rows[0]?.id;
    if (!bookingId) throw new Error("No confirmed booking to review.");
    const existing = await client.query<{ id: string }>(
      "SELECT id FROM customer_reviews WHERE booking_id = $1 AND customer_id = $2",
      [bookingId, row.customer_id],
    );
    let reviewId = existing.rows[0]?.id;
    if (reviewId) {
      await client.query(
        `UPDATE customer_reviews SET rating = $2, body = $3, published = false WHERE id = $1`,
        [reviewId, input.rating, input.body?.trim() || null],
      );
    } else {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO customer_reviews (
           booking_id, customer_id, rating, body, published, is_test_fixture
         ) VALUES ($1, $2, $3, $4, false, $5)
         RETURNING id`,
        [
          bookingId,
          row.customer_id,
          input.rating,
          input.body?.trim() || null,
          Boolean(booking.rows[0]?.is_test_fixture || row.is_test_fixture),
        ],
      );
      reviewId = inserted.rows[0].id;
    }
    await writeAudit(client, {
      actorId: user.id,
      entityType: "review",
      entityId: reviewId,
      action: "submitted",
      payload: { published: false },
    });
    return { id: reviewId, published: false };
  });
}

export async function reportIncident(
  user: AuthUser,
  input: { requestId?: string; category: string; details: string },
) {
  const details = input.details.trim();
  const category = input.category.trim();
  if (details.length < 8 || !category) {
    throw new Error("Incident category and details are required.");
  }
  return withUserContext(user, async (client) => {
    let testFixture = false;
    if (input.requestId) {
      const row = await client.query<{ is_test_fixture: boolean }>(
        "SELECT is_test_fixture FROM booking_requests WHERE id = $1",
        [input.requestId],
      );
      testFixture = Boolean(row.rows[0]?.is_test_fixture);
    }
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO incident_reports (request_id, reported_by, subject, details, is_test_fixture)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [input.requestId ?? null, user.id, category, details, testFixture],
    );
    await writeAudit(client, {
      actorId: user.id,
      entityType: "incident",
      entityId: inserted.rows[0].id,
      action: "reported",
    });
    return { id: inserted.rows[0].id };
  });
}

async function loadOwnedRequest(
  client: PoolClient,
  user: AuthUser,
  requestId: string,
): Promise<{
  status: RequestStatus;
  customer_id: string;
  is_test_fixture: boolean;
}> {
  const current = await client.query<{
    status: RequestStatus;
    customer_id: string;
    is_test_fixture: boolean;
  }>("SELECT status, customer_id, is_test_fixture FROM booking_requests WHERE id = $1", [requestId]);
  const row = current.rows[0];
  if (!row) throw new Error("Request not found.");
  if (row.customer_id !== user.id && !isOperator(user)) {
    throw new Error("Not allowed to change this booking.");
  }
  return row;
}
