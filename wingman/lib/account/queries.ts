import type { PoolClient } from "pg";
import type { AuthUser } from "@/lib/auth/types";
import {
  hasPaidReceipt,
  historyLabel,
  includeTestFixturesInHistory,
} from "@/lib/account/history";

export type AccountBookingRow = {
  id: string;
  bookingId: string | null;
  status: string;
  occasion: string;
  startsAt: string;
  createdAt: string;
  isTestFixture: boolean;
  eventId: string | null;
  eventExternalId: string | null;
  eventName: string | null;
  source: string;
  quoteCents: number | null;
  paymentId: string | null;
  amountCents: number | null;
  paymentStatus: string | null;
  stripeCheckoutSessionId: string | null;
  paidAt: string | null;
  last4: string | null;
  brand: string | null;
  receiptUrl: string | null;
};

export type AccountBookingView = {
  id: string;
  bookingId: string | null;
  status: string;
  title: string;
  startsAt: string;
  createdAt: string;
  eventId: string | null;
  eventExternalId: string | null;
  source: string;
  canBookAgain: boolean;
  amountCents: number | null;
  testLabel: string | null;
  paymentStatus: string | null;
  last4: string | null;
  brand: string | null;
  receiptUrl: string | null;
  paymentId: string | null;
  paidAt: string | null;
};

const BOOKING_SELECT = `
  SELECT r.id,
         b.id AS booking_id,
         r.status,
         r.occasion,
         r.source,
         r.starts_at,
         r.created_at,
         COALESCE(r.is_test_fixture, false) AS is_test_fixture,
         e.id AS event_id,
         e.external_id AS event_external_id,
         e.name AS event_name,
         q.total_cents AS quote_cents,
         p.id AS payment_id,
         p.amount_cents,
         p.status AS payment_status,
         p.stripe_checkout_session_id,
         p.updated_at AS paid_at,
         p.card_last4,
         p.card_brand,
         p.receipt_url
  FROM booking_requests r
  LEFT JOIN bookings b ON b.request_id = r.id
  LEFT JOIN events e ON e.id = r.event_id
  LEFT JOIN LATERAL (
    SELECT total_cents FROM quotes
    WHERE request_id = r.id AND status = 'accepted'
    ORDER BY created_at DESC LIMIT 1
  ) q ON true
  LEFT JOIN LATERAL (
    SELECT id, amount_cents, status, stripe_checkout_session_id, updated_at,
           card_last4, card_brand, receipt_url
    FROM payments
    WHERE request_id = r.id
    ORDER BY created_at DESC LIMIT 1
  ) p ON true
`;

function mapRow(row: {
  id: string;
  booking_id: string | null;
  status: string;
  occasion: string;
  source: string;
  starts_at: string;
  created_at: string;
  is_test_fixture: boolean;
  event_id: string | null;
  event_external_id: string | null;
  event_name: string | null;
  quote_cents: number | null;
  payment_id: string | null;
  amount_cents: number | null;
  payment_status: string | null;
  stripe_checkout_session_id: string | null;
  paid_at: string | null;
  card_last4: string | null;
  card_brand: string | null;
  receipt_url: string | null;
}): AccountBookingRow {
  return {
    id: row.id,
    bookingId: row.booking_id,
    status: row.status,
    occasion: row.occasion,
    startsAt: row.starts_at,
    createdAt: row.created_at,
    isTestFixture: row.is_test_fixture,
    eventId: row.event_id,
    eventExternalId: row.event_external_id,
    eventName: row.event_name,
    source: row.source,
    quoteCents: row.quote_cents,
    paymentId: row.payment_id,
    amountCents: row.amount_cents,
    paymentStatus: row.payment_status,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    paidAt: row.paid_at,
    last4: row.card_last4,
    brand: row.card_brand,
    receiptUrl: row.receipt_url,
  };
}

export function toBookingView(row: AccountBookingRow): AccountBookingView {
  const charged = row.amountCents ?? row.quoteCents;
  return {
    id: row.id,
    bookingId: row.bookingId,
    status: row.status,
    title: row.eventName || row.occasion || "Night service",
    startsAt: row.startsAt,
    createdAt: row.createdAt,
    eventId: row.eventId,
    eventExternalId: row.eventExternalId,
    source: row.source,
    canBookAgain: true,
    amountCents: charged,
    testLabel: historyLabel(row.isTestFixture),
    paymentStatus: row.paymentStatus,
    last4: row.last4,
    brand: row.brand,
    receiptUrl: row.receiptUrl,
    paymentId: row.paymentId,
    paidAt: row.paidAt,
  };
}

export function isUpcomingBooking(item: AccountBookingView, now = Date.now()): boolean {
  const start = new Date(item.startsAt).getTime();
  if (Number.isNaN(start)) return false;
  return (
    (item.status === "paid" || item.status === "confirmed" || item.status === "in_progress") &&
    start >= now - 6 * 60 * 60 * 1000
  );
}

export async function listCustomerBookings(
  client: PoolClient,
  user: Pick<AuthUser, "id" | "email">,
): Promise<AccountBookingRow[]> {
  const showFixtures = includeTestFixturesInHistory(user.email);
  const result = await client.query({
    text: `${BOOKING_SELECT}
       WHERE r.customer_id = $1
         AND (COALESCE(r.is_test_fixture, false) = false OR $2)
       ORDER BY r.created_at DESC`,
    values: [user.id, showFixtures],
  });
  return result.rows.map(mapRow);
}

export async function getCustomerBooking(
  client: PoolClient,
  user: Pick<AuthUser, "id" | "email">,
  id: string,
): Promise<AccountBookingRow | null> {
  const showFixtures = includeTestFixturesInHistory(user.email);
  const result = await client.query({
    text: `${BOOKING_SELECT}
       WHERE r.customer_id = $1
         AND (r.id = $2 OR b.id = $2)
         AND (COALESCE(r.is_test_fixture, false) = false OR $3)
       LIMIT 1`,
    values: [user.id, id, showFixtures],
  });
  return result.rows[0] ? mapRow(result.rows[0]) : null;
}

export async function listCustomerInvoices(
  client: PoolClient,
  user: Pick<AuthUser, "id" | "email">,
): Promise<AccountBookingRow[]> {
  const rows = await listCustomerBookings(client, user);
  return rows.filter((row) =>
    hasPaidReceipt({
      paymentStatus: row.paymentStatus,
      amountCents: row.amountCents ?? row.quoteCents,
    }),
  );
}

export async function getCustomerReceipt(
  client: PoolClient,
  user: Pick<AuthUser, "id" | "email">,
  id: string,
): Promise<AccountBookingRow | null> {
  const showFixtures = includeTestFixturesInHistory(user.email);
  const result = await client.query({
    text: `${BOOKING_SELECT}
       WHERE r.customer_id = $1
         AND (r.id = $2 OR b.id = $2 OR p.id = $2)
         AND (COALESCE(r.is_test_fixture, false) = false OR $3)
       LIMIT 1`,
    values: [user.id, id, showFixtures],
  });
  const row = result.rows[0] ? mapRow(result.rows[0]) : null;
  if (!row) return null;
  if (
    !hasPaidReceipt({
      paymentStatus: row.paymentStatus,
      amountCents: row.amountCents ?? row.quoteCents,
    })
  ) {
    return null;
  }
  return row;
}

export async function listEmergencyContacts(
  client: PoolClient,
  userId: string,
): Promise<Array<{ id: string; name: string; phone: string | null; email: string | null }>> {
  const result = await client.query(
    "SELECT id, name, phone, email FROM trusted_contacts WHERE user_id = $1 ORDER BY created_at DESC",
    [userId],
  );
  return result.rows;
}

export async function getStripeCustomerId(
  client: PoolClient,
  userId: string,
): Promise<string | null> {
  const result = await client.query<{ stripe_customer_id: string | null }>(
    "SELECT stripe_customer_id FROM profiles WHERE id = $1",
    [userId],
  );
  return result.rows[0]?.stripe_customer_id ?? null;
}
