import type { PoolClient } from "pg";
import { withUserContext } from "@/lib/db";
import type { AuthUser } from "@/lib/auth/types";
import { writeAudit } from "@/lib/marketplace/audit";
import {
  MIN_BOOKING_CENTS,
  type RequestStatus,
  type SpendBand,
  type VerificationGate,
} from "@/lib/marketplace/constants";
import { assertTransition, paymentUnlocked } from "@/lib/marketplace/request-machine";
import { computeQuoteTotal, meetsMinimumBooking, offerIsBookable } from "@/lib/marketplace/offers";
import { canSetVerified, emptyChecklist, type VerificationChecklist } from "@/lib/marketplace/verification";
import { parseLocalTime, type ImportedEventRow } from "@/lib/marketplace/event-import";
import { normalizeInterest, type InterestInput } from "@/lib/marketplace/interest";
import { getSql } from "@/lib/neon";

export async function listPublicEvents() {
  const sql = getSql();
  const rows = (await sql`
    SELECT e.*, v.name AS venue_name, s.slug AS source_slug, s.name AS source_name,
      EXISTS (
        SELECT 1 FROM wingman_event_offers o
        WHERE o.event_id = e.id AND o.bookable = true
          AND COALESCE(o.is_test_fixture, false) = false
      ) AS has_bookable_offer
    FROM events e
    JOIN venues v ON v.id = e.venue_id
    LEFT JOIN event_sources s ON s.id = e.primary_source_id
    WHERE e.discovery_status IN ('discovery_ready', 'bookable')
      AND COALESCE(e.is_test_fixture, false) = false
      AND e.import_status = 'approved'
      AND e.stale = false
      AND e.hidden_at IS NULL
      AND e.merged_into_id IS NULL
      AND e.booking_status <> 'CANCELLED'
      AND COALESCE(e.ends_at, e.starts_at) + interval '6 hours' > now()
    ORDER BY e.local_date ASC, e.name ASC
  `) as Array<Record<string, unknown>>;
  return rows;
}

export async function getPublicEvent(id: string) {
  const sql = getSql();
  const rows = (await sql`
    SELECT e.*, v.name AS venue_name, s.slug AS source_slug, s.name AS source_name,
      EXISTS (
        SELECT 1 FROM wingman_event_offers o
        WHERE o.event_id = e.id AND o.bookable = true
          AND COALESCE(o.is_test_fixture, false) = false
      ) AS has_bookable_offer
    FROM events e
    JOIN venues v ON v.id = e.venue_id
    LEFT JOIN event_sources s ON s.id = e.primary_source_id
    WHERE (e.id::text = ${id} OR e.external_id = ${id})
      AND COALESCE(e.is_test_fixture, false) = false
    LIMIT 1
  `) as Array<Record<string, unknown>>;
  return rows[0] ?? null;
}

export async function listBookableOffers(eventId: string) {
  const sql = getSql();
  return (await sql`
    SELECT o.*, w.display_name, w.photo_url, w.areas, w.specialties, w.verification_status
    FROM wingman_event_offers o
    JOIN wingmen w ON w.id = o.wingman_id
    WHERE o.event_id = ${eventId}
      AND o.bookable = true
      AND COALESCE(o.is_test_fixture, false) = false
      AND COALESCE(w.is_test_fixture, false) = false
      AND w.verification_status = 'verified'
  `) as Array<Record<string, unknown>>;
}

export async function listPublicWingmen() {
  const sql = getSql();
  return (await sql`
    SELECT id, display_name, photo_url, areas, specialties, languages,
           response_window_minutes, biography, verification_status
    FROM wingmen
    WHERE verification_status = 'verified'
      AND COALESCE(is_test_fixture, false) = false
      AND NOT ('operator_slot' = ANY(specialties))
    ORDER BY display_name
  `) as Array<Record<string, unknown>>;
}

export async function createRequest(
  user: AuthUser,
  input: {
    source: "event" | "wingman" | "plan_my_night";
    eventId?: string | null;
    requestedWingmanId?: string | null;
    occasion: string;
    atmosphere: string;
    area: string;
    startsAt: string;
    groupSize: number;
    spendBand: SpendBand;
    specialRequests?: string;
    requestedServices?: string[];
    nightGoal?: string;
    nightPlan?: Record<string, unknown> | null;
  },
) {
  if (input.source === "event") {
    if (!input.eventId) throw new Error("Select a bookable event.");
    const event = await getPublicEvent(input.eventId);
    if (!event) throw new Error("Event not found.");
    if (!event.has_bookable_offer) {
      throw new Error("This event is discovery-only. Use Plan My Night or view the official event.");
    }
  }

  return withUserContext(user, async (client) => {
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO booking_requests (
         customer_id, event_id, requested_wingman_id, source, occasion, atmosphere,
         area, starts_at, group_size, spend_band, special_requests, requested_services,
         night_goal, night_plan, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::timestamptz, $9, $10::spend_band, $11, $12::text[], $13, $14::jsonb, 'submitted')
       RETURNING id`,
      [
        user.id,
        input.eventId ?? null,
        input.requestedWingmanId ?? null,
        input.source,
        input.occasion,
        input.atmosphere,
        input.area,
        input.startsAt,
        input.groupSize,
        input.spendBand,
        input.specialRequests ?? null,
        input.requestedServices ?? [],
        input.nightGoal ?? null,
        JSON.stringify(input.nightPlan ?? {}),
      ],
    );
    const id = inserted.rows[0].id;
    await writeAudit(client, {
      actorId: user.id,
      entityType: "booking_request",
      entityId: id,
      action: "created",
      toState: "submitted",
      payload: { source: input.source },
    });
    return id;
  });
}

export async function transitionRequest(
  user: AuthUser,
  requestId: string,
  to: RequestStatus,
  extra?: { wingmanId?: string; notes?: string },
) {
  return withUserContext(user, async (client) => {
    const current = await client.query<{ status: RequestStatus; customer_id: string }>(
      "SELECT status, customer_id FROM booking_requests WHERE id = $1",
      [requestId],
    );
    const row = current.rows[0];
    if (!row) throw new Error("Request not found.");
    if (to === "paid") {
      throw new Error("Only a verified Stripe webhook may mark a booking paid.");
    }
    assertTransition(row.status, to);

    if (to === "routed") {
      if (!extra?.wingmanId) throw new Error("A verified Wingman is required to route.");
      const wingman = await client.query<{ verification_status: string }>(
        "SELECT verification_status FROM wingmen WHERE id = $1",
        [extra.wingmanId],
      );
      if (wingman.rows[0]?.verification_status !== "verified") {
        throw new Error("Cannot route to an unverified Wingman.");
      }
      await client.query(
        `UPDATE booking_requests
         SET status = $2::request_status, assigned_wingman_id = $3, updated_at = now()
         WHERE id = $1`,
        [requestId, to, extra.wingmanId],
      );
    } else {
      await client.query(
        `UPDATE booking_requests SET status = $2::request_status, updated_at = now() WHERE id = $1`,
        [requestId, to],
      );
    }

    await writeAudit(client, {
      actorId: user.id,
      entityType: "booking_request",
      entityId: requestId,
      action: "transition",
      fromState: row.status,
      toState: to,
      payload: extra ?? {},
    });
    return to;
  });
}

export async function createQuote(
  user: AuthUser,
  input: {
    requestId: string;
    wingmanId?: string | null;
    offerId?: string | null;
    subtotalCents: number;
    serviceFeeCents: number;
    taxesCents?: number;
    terms: string;
    revised?: boolean;
  },
) {
  const sql = getSql();
  const settings = (await sql`SELECT customer_fee_bps, min_booking_cents FROM marketplace_settings WHERE id = 'default'`) as Array<{
    customer_fee_bps: number;
    min_booking_cents: number;
  }>;
  const customerFeeBps = settings[0]?.customer_fee_bps ?? 0;
  const minCents = settings[0]?.min_booking_cents ?? MIN_BOOKING_CENTS;
  const breakdown = computeQuoteTotal({
    subtotalCents: input.subtotalCents,
    serviceFeeCents: input.serviceFeeCents,
    taxesCents: input.taxesCents ?? 0,
    customerFeeBps,
  });
  if (!meetsMinimumBooking(breakdown.totalCents, minCents)) {
    throw new Error(`Total must be at least $${(minCents / 100).toFixed(0)} USD.`);
  }

  return withUserContext(user, async (client) => {
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO quotes (
         request_id, wingman_id, offer_id, subtotal_cents, service_fee_cents,
         taxes_cents, customer_fee_cents, total_cents, terms, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        input.requestId,
        input.wingmanId ?? null,
        input.offerId ?? null,
        breakdown.subtotalCents,
        breakdown.serviceFeeCents,
        breakdown.taxesCents,
        breakdown.customerFeeCents,
        breakdown.totalCents,
        input.terms,
        input.revised ? "revised" : "proposed",
      ],
    );
    const current = await client.query<{ status: RequestStatus }>(
      "SELECT status FROM booking_requests WHERE id = $1",
      [input.requestId],
    );
    const from = current.rows[0].status;
    const mid: RequestStatus = input.revised ? "revised_terms" : "wingman_accepted";
    assertTransition(from, mid);
    assertTransition(mid, "awaiting_customer");
    await client.query(
      `UPDATE booking_requests SET status = 'awaiting_customer', updated_at = now() WHERE id = $1`,
      [input.requestId],
    );
    await writeAudit(client, {
      actorId: user.id,
      entityType: "quote",
      entityId: inserted.rows[0].id,
      action: "created",
      fromState: from,
      toState: "awaiting_customer",
    });
    return { id: inserted.rows[0].id, ...breakdown };
  });
}

export async function acceptQuote(user: AuthUser, quoteId: string) {
  return withUserContext(user, async (client) => {
    const quote = await client.query<{
      id: string;
      request_id: string;
      total_cents: number;
    }>("SELECT id, request_id, total_cents FROM quotes WHERE id = $1", [quoteId]);
    const row = quote.rows[0];
    if (!row) throw new Error("Quote not found.");
    const request = await client.query<{ status: RequestStatus; customer_id: string }>(
      "SELECT status, customer_id FROM booking_requests WHERE id = $1",
      [row.request_id],
    );
    if (request.rows[0].customer_id !== user.id && user.role !== "admin" && user.role !== "owner") {
      throw new Error("Only the customer can accept this quote.");
    }
    const from = request.rows[0].status;
    if (from !== "awaiting_customer" && from !== "wingman_accepted" && from !== "revised_terms") {
      throw new Error("Quote is not awaiting customer acceptance.");
    }
    if (from === "wingman_accepted" || from === "revised_terms") {
      assertTransition(from, "awaiting_customer");
      await client.query(
        `UPDATE booking_requests SET status = 'awaiting_customer', updated_at = now() WHERE id = $1`,
        [row.request_id],
      );
    }
    assertTransition("awaiting_customer", "accepted");
    await client.query(`UPDATE quotes SET status = 'accepted', updated_at = now() WHERE id = $1`, [quoteId]);
    await client.query(
      `UPDATE booking_requests SET status = 'accepted', updated_at = now() WHERE id = $1`,
      [row.request_id],
    );
    await writeAudit(client, {
      actorId: user.id,
      entityType: "quote",
      entityId: quoteId,
      action: "accepted",
      fromState: from,
      toState: "accepted",
    });
    return { requestId: row.request_id, totalCents: row.total_cents };
  });
}

export async function assertPaymentAllowed(requestId: string) {
  const sql = getSql();
  const rows = (await sql`SELECT status FROM booking_requests WHERE id = ${requestId}`) as Array<{
    status: RequestStatus;
  }>;
  const status = rows[0]?.status;
  if (!status || !paymentUnlocked(status)) {
    throw new Error("Payment is unavailable until the customer accepts a quote.");
  }
  return status;
}

export async function confirmPaidRequest(client: PoolClient, requestId: string, paymentIntentId: string | null) {
  const current = await client.query<{ status: RequestStatus; customer_id: string; assigned_wingman_id: string | null; event_id: string | null }>(
    "SELECT status, customer_id, assigned_wingman_id, event_id FROM booking_requests WHERE id = $1",
    [requestId],
  );
  const row = current.rows[0];
  if (!row) throw new Error("Request not found.");
  if (row.status === "confirmed" || row.status === "paid" || row.status === "in_progress" || row.status === "completed") {
    return { duplicate: true as const };
  }
  if (row.status === "accepted" || row.status === "draft") {
    assertTransition(row.status, "payment_pending");
    await client.query(
      `UPDATE booking_requests SET status = 'payment_pending', updated_at = now() WHERE id = $1`,
      [requestId],
    );
  }
  const afterPending = await client.query<{ status: RequestStatus }>(
    "SELECT status FROM booking_requests WHERE id = $1",
    [requestId],
  );
  assertTransition(afterPending.rows[0].status, "paid");
  await client.query(
    `UPDATE booking_requests SET status = 'paid', updated_at = now() WHERE id = $1`,
    [requestId],
  );
  assertTransition("paid", "confirmed");
  await client.query(
    `UPDATE booking_requests SET status = 'confirmed', updated_at = now() WHERE id = $1`,
    [requestId],
  );

  const quote = await client.query<{ id: string }>(
    `SELECT id FROM quotes WHERE request_id = $1 AND status = 'accepted' ORDER BY created_at DESC LIMIT 1`,
    [requestId],
  );
  const pass = `WM-${requestId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
  const fixture = await client.query<{ is_test_fixture: boolean }>(
    "SELECT is_test_fixture FROM booking_requests WHERE id = $1",
    [requestId],
  );
  const booking = await client.query<{ id: string }>(
    `INSERT INTO bookings (request_id, quote_id, customer_id, wingman_id, event_id, status, night_pass_code, confirmed_at, is_test_fixture)
     VALUES ($1, $2, $3, $4, $5, 'confirmed', $6, now(), $7)
     ON CONFLICT (request_id) DO UPDATE SET status = 'confirmed', confirmed_at = now()
     RETURNING id`,
    [
      requestId,
      quote.rows[0]?.id,
      row.customer_id,
      row.assigned_wingman_id,
      row.event_id,
      pass,
      Boolean(fixture.rows[0]?.is_test_fixture),
    ],
  );
  await writeAudit(client, {
    actorId: null,
    entityType: "booking_request",
    entityId: requestId,
    action: "payment_confirmed",
    toState: "confirmed",
    payload: { paymentIntentId, bookingId: booking.rows[0].id },
  });
  return { duplicate: false as const, bookingId: booking.rows[0].id, nightPassCode: pass };
}

export function checklistFromApplication(row: Record<string, unknown>): VerificationChecklist {
  const checklist = emptyChecklist();
  checklist.consent = Boolean(row.consent_at);
  checklist.identity = Boolean(row.identity_verified_at);
  checklist.phone = Boolean(row.phone_verified_at);
  checklist.email = Boolean(row.email_verified_at);
  checklist.inventory_authority = Boolean(row.inventory_authority_at);
  checklist.agreement = Boolean(row.agreement_signed_at);
  checklist.payout = Boolean(row.payout_approved_at);
  checklist.media = Boolean(row.media_cleared_at);
  checklist.policy = Boolean(row.policy_accepted_at);
  checklist.test_booking = Boolean(row.test_booking_at);
  checklist.gov_id = Boolean(row.gov_id_at);
  checklist.selfie_liveness = Boolean(row.selfie_liveness_at);
  checklist.screening_manual = Boolean(row.screening_manual_at);
  checklist.code_of_conduct = Boolean(row.code_of_conduct_at);
  checklist.emergency_contact = Boolean(row.emergency_contact_at);
  checklist.service_boundary = Boolean(row.service_boundary_at);
  checklist.no_show_policy = Boolean(row.no_show_policy_at);
  checklist.payment_auth = Boolean(row.payment_auth_at);
  return checklist;
}

export async function markVerificationGate(
  user: AuthUser,
  applicationId: string,
  gate: VerificationGate,
) {
  const column: Record<VerificationGate, string> = {
    consent: "consent_at",
    identity: "identity_verified_at",
    phone: "phone_verified_at",
    email: "email_verified_at",
    inventory_authority: "inventory_authority_at",
    agreement: "agreement_signed_at",
    payout: "payout_approved_at",
    media: "media_cleared_at",
    policy: "policy_accepted_at",
    test_booking: "test_booking_at",
    gov_id: "gov_id_at",
    selfie_liveness: "selfie_liveness_at",
    screening_manual: "screening_manual_at",
    code_of_conduct: "code_of_conduct_at",
    emergency_contact: "emergency_contact_at",
    service_boundary: "service_boundary_at",
    no_show_policy: "no_show_policy_at",
    payment_auth: "payment_auth_at",
  };
  return withUserContext(user, async (client) => {
    await client.query(
      `UPDATE wingman_applications SET ${column[gate]} = now(), verification_status = 'in_review', updated_at = now() WHERE id = $1`,
      [applicationId],
    );
    await writeAudit(client, {
      actorId: user.id,
      entityType: "wingman_application",
      entityId: applicationId,
      action: "gate",
      toState: gate,
    });
  });
}

export async function verifyWingmanFromApplication(
  user: AuthUser,
  applicationId: string,
  displayName: string,
) {
  return withUserContext(user, async (client) => {
    const app = await client.query("SELECT * FROM wingman_applications WHERE id = $1", [applicationId]);
    const row = app.rows[0] as Record<string, unknown> | undefined;
    if (!row) throw new Error("Application not found.");
    const checklist = checklistFromApplication(row);
    if (!canSetVerified(checklist)) {
      throw new Error("All verification gates must pass before a Wingman can be verified.");
    }
    const existing = await client.query<{ id: string }>(
      "SELECT id FROM wingmen WHERE application_id = $1",
      [applicationId],
    );
    let wingmanId = existing.rows[0]?.id;
    if (!wingmanId) {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO wingmen (application_id, user_id, display_name, verification_status, areas, specialties)
         VALUES ($1, $2, $3, 'verified', '{}', '{}')
         RETURNING id`,
        [applicationId, row.user_id ?? null, displayName],
      );
      wingmanId = inserted.rows[0].id;
    } else {
      await client.query(
        `UPDATE wingmen SET verification_status = 'verified', display_name = $2, updated_at = now() WHERE id = $1`,
        [wingmanId, displayName],
      );
    }
    await client.query(
      `UPDATE wingman_applications SET verification_status = 'approved', updated_at = now() WHERE id = $1`,
      [applicationId],
    );
    await writeAudit(client, {
      actorId: user.id,
      entityType: "wingman",
      entityId: wingmanId,
      action: "verified",
      toState: "verified",
    });
    return wingmanId;
  });
}

export async function recordInterest(input: InterestInput & { userId?: string | null }) {
  const normalized = normalizeInterest(input);
  const sql = getSql();
  try {
    const inserted = (await sql`
      INSERT INTO interest_signups (email, name, source, event_id, notes, user_id)
      VALUES (
        ${normalized.email},
        ${normalized.name},
        ${normalized.source},
        ${normalized.eventId},
        ${normalized.notes},
        ${input.userId ?? null}
      )
      ON CONFLICT (email_key, source, event_key) DO NOTHING
      RETURNING id
    `) as Array<{ id: string }>;
    return { id: inserted[0]?.id ?? null, duplicate: !inserted[0] };
  } catch (error) {
    if (error instanceof Error && /interest_signups_unique|duplicate key/i.test(error.message)) {
      return { id: null, duplicate: true };
    }
    throw error;
  }
}

export async function createApplication(
  user: AuthUser,
  input: {
    organizationName: string;
    leadType?: string;
    publicSource?: string;
    publicContact?: string;
    likelyCoverage?: string;
    ownerName?: string;
    nextAction?: string;
    internalNotes?: string;
    userId?: string | null;
  },
) {
  const organizationName = input.organizationName.trim();
  if (organizationName.length < 2) throw new Error("Organization or person name is required.");
  return withUserContext(user, async (client) => {
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO wingman_applications (
         organization_name, lead_type, public_source, public_contact, likely_coverage,
         verification_status, production_visible, owner_name, next_action, internal_notes, user_id
       ) VALUES ($1, $2, $3, $4, $5, 'not_contacted', false, $6, $7, $8, $9)
       RETURNING id`,
      [
        organizationName,
        input.leadType?.trim() || null,
        input.publicSource?.trim() || null,
        input.publicContact?.trim() || null,
        input.likelyCoverage?.trim() || null,
        input.ownerName?.trim() || null,
        input.nextAction?.trim() || null,
        input.internalNotes?.trim() || null,
        input.userId ?? null,
      ],
    );
    await writeAudit(client, {
      actorId: user.id,
      entityType: "wingman_application",
      entityId: inserted.rows[0].id,
      action: "created",
      toState: "not_contacted",
      payload: { productionVisible: false },
    });
    return inserted.rows[0].id;
  });
}

export async function importDiscoveryEvents(user: AuthUser, events: ImportedEventRow[]) {
  if (events.length === 0) throw new Error("No valid events to import.");
  return withUserContext(user, async (client) => {
    const venueIds = new Map<string, string>();
    let imported = 0;
    for (const event of events) {
      let venueId = venueIds.get(event.venue);
      if (!venueId) {
        const existing = await client.query<{ id: string }>(
          "SELECT id FROM venues WHERE name = $1 LIMIT 1",
          [event.venue],
        );
        if (existing.rows[0]) {
          venueId = existing.rows[0].id;
        } else {
          const inserted = await client.query<{ id: string }>(
            `INSERT INTO venues (name, area, official_url, city, timezone)
             VALUES ($1, $2, $3, 'Miami', 'America/New_York')
             RETURNING id`,
            [event.venue, event.area, event.officialSource],
          );
          venueId = inserted.rows[0].id;
        }
        venueIds.set(event.venue, venueId);
      }
      const time = parseLocalTime(event.startTime);
      const startsAt = `${event.eventDate}T${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")}:00-04:00`;
      const sourceSlug = event.externalId.startsWith("IMP-") ? "csv" : "admin";
      const source = await client.query<{ id: string }>(
        "SELECT id FROM event_sources WHERE slug = $1",
        [sourceSlug],
      );
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO events (
           external_id, name, venue_id, starts_at, local_date, local_time_text, timezone,
           area, neighborhood, category, event_type, age_requirement, official_source_url, source_verified_at,
           discovery_status, booking_status, import_status, available_services, wingman_coverage,
           booking_status_note, internal_notes, primary_source_id, last_seen_at, last_synced_at,
           image_usage_verified
         ) VALUES (
           $1, $2, $3, $4::timestamptz, $5::date, $6, 'America/New_York',
           $7, $7, $8, $8, $9, $10, $11::timestamptz,
           'discovery_ready', 'DISCOVERY_ONLY', $16::event_import_status, $12::text[], $13,
           $14, $15, $17, now(), now(), false
         )
         ON CONFLICT (external_id) DO UPDATE SET
           name = EXCLUDED.name,
           venue_id = EXCLUDED.venue_id,
           starts_at = EXCLUDED.starts_at,
           local_date = EXCLUDED.local_date,
           local_time_text = EXCLUDED.local_time_text,
           area = EXCLUDED.area,
           neighborhood = EXCLUDED.neighborhood,
           category = EXCLUDED.category,
           age_requirement = EXCLUDED.age_requirement,
           official_source_url = EXCLUDED.official_source_url,
           source_verified_at = EXCLUDED.source_verified_at,
           available_services = EXCLUDED.available_services,
           wingman_coverage = EXCLUDED.wingman_coverage,
           booking_status_note = EXCLUDED.booking_status_note,
           internal_notes = EXCLUDED.internal_notes,
           last_seen_at = now(),
           last_synced_at = now(),
           discovery_status = CASE
             WHEN events.discovery_status IN ('cancelled', 'expired') THEN events.discovery_status
             WHEN events.discovery_status = 'bookable' THEN 'bookable'
             ELSE 'discovery_ready'
           END,
           updated_at = now()
         RETURNING id`,
        [
          event.externalId,
          event.name,
          venueId,
          startsAt,
          event.eventDate,
          time.text,
          event.area,
          event.category,
          event.age,
          event.officialSource,
          `${event.lastVerified}T12:00:00-04:00`,
          event.availableServices,
          event.wingmanCoverage,
          event.bookingStatus,
          event.internalNotes,
          sourceSlug === "csv" ? "pending" : "approved",
          source.rows[0]?.id ?? null,
        ],
      );
      if (source.rows[0] && inserted.rows[0]) {
        await client.query(
          `INSERT INTO event_source_records (source_id, external_id, event_id, last_seen_at, status)
           VALUES ($1, $2, $3, now(), 'active')
           ON CONFLICT (source_id, external_id) DO UPDATE SET
             event_id = EXCLUDED.event_id, last_seen_at = now(), missed_sync_count = 0, updated_at = now()`,
          [source.rows[0].id, event.externalId, inserted.rows[0].id],
        );
      }
      imported += 1;
    }
    await writeAudit(client, {
      actorId: user.id,
      entityType: "events",
      entityId: "import",
      action: "import",
      payload: { imported, bookableCreated: 0 },
    });
    return { imported, bookableCreated: 0 };
  });
}

export function evaluateOfferBookable(row: {
  verification_status: string;
  operator_approved: boolean;
  expires_at: string;
  inventory_quantity: number;
  service_type: string;
  terms: string;
  service_fee_cents: number;
}) {
  return offerIsBookable({
    wingmanStatus: row.verification_status as "pending" | "verified" | "paused" | "rejected",
    operatorApproved: row.operator_approved,
    expiresAt: row.expires_at,
    inventoryQuantity: row.inventory_quantity,
    serviceType: row.service_type,
    terms: row.terms,
    serviceFeeCents: row.service_fee_cents,
  });
}
