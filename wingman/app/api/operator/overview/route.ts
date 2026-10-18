import { NextResponse } from "next/server";
import { isResponse, requireOperator } from "@/lib/api/http";
import { withUserContext } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireOperator();
  if (isResponse(user)) return user;

  const data = await withUserContext(user, async (client) => {
    const q = (sql: string) => client.query(sql);
    const empty = { rows: [] as Array<Record<string, unknown>> };
    const [
      newRequests,
      unassigned,
      awaitingCustomer,
      paymentPending,
      tonight,
      support,
      staleEvents,
      expiredOffers,
      pendingApps,
      audit,
      verified,
      bookable,
      settings,
      wingmen,
      events,
      interest,
    ] = await Promise.all([
      q(`SELECT * FROM booking_requests WHERE status = 'submitted' ORDER BY created_at DESC`),
      q(`SELECT * FROM booking_requests WHERE status IN ('submitted', 'under_review') AND assigned_wingman_id IS NULL`),
      q(`SELECT * FROM booking_requests WHERE status = 'awaiting_customer'`),
      q(`SELECT * FROM booking_requests WHERE status = 'payment_pending'`),
      q(`SELECT b.*, r.starts_at FROM bookings b JOIN booking_requests r ON r.id = b.request_id
         WHERE b.status = 'confirmed' AND r.starts_at::date = (now() AT TIME ZONE 'America/New_York')::date`),
      q(`SELECT * FROM support_cases WHERE status = 'open' ORDER BY created_at DESC`),
      q(`SELECT * FROM events WHERE source_verified_at < now() - interval '14 days' AND discovery_status IN ('discovery_ready', 'bookable')`),
      q(`SELECT * FROM wingman_event_offers WHERE expires_at < now() OR inventory_quantity = 0`),
      q(`SELECT * FROM wingman_applications ORDER BY created_at DESC`),
      q(`SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 50`),
      q(`SELECT count(*)::int AS n FROM wingmen WHERE verification_status = 'verified' AND COALESCE(is_test_fixture, false) = false`),
      q(`SELECT count(*)::int AS n FROM wingman_event_offers WHERE bookable = true AND COALESCE(is_test_fixture, false) = false`),
      q(`SELECT * FROM marketplace_settings WHERE id = 'default'`),
      q(`SELECT id, display_name, verification_status FROM wingmen ORDER BY display_name`),
      q(`SELECT id, external_id, name, discovery_status FROM events ORDER BY local_date`),
      q(`SELECT id, email, name, source, event_id, created_at FROM interest_signups ORDER BY created_at DESC LIMIT 100`),
    ]);
    const catalog = await q(`SELECT * FROM experience_catalog ORDER BY sort_order ASC, name ASC`).catch(() => empty);
    const paidUnassigned = await q(
      `SELECT r.id, r.occasion, r.status, r.starts_at, r.area, r.group_size, r.booking_kind,
              r.drink_option, r.assigned_wingman_id, r.order_id, r.created_at
       FROM booking_requests r
       WHERE r.status IN ('paid', 'confirmed', 'in_progress')
         AND r.assigned_wingman_id IS NULL
         AND COALESCE(r.booking_kind, r.source) IN ('wingman_experience', 'vip_table')
       ORDER BY r.created_at DESC`,
    ).catch(() => empty);

    return {
      newRequests: newRequests.rows,
      unassigned: unassigned.rows,
      awaitingCustomer: awaitingCustomer.rows,
      paymentPending: paymentPending.rows,
      tonight: tonight.rows,
      support: support.rows,
      staleEvents: staleEvents.rows,
      expiredOffers: expiredOffers.rows,
      pendingApplications: pendingApps.rows,
      audit: audit.rows,
      verifiedWingmen: verified.rows[0]?.n ?? 0,
      bookableOffers: bookable.rows[0]?.n ?? 0,
      settings: settings.rows[0] ?? null,
      wingmen: wingmen.rows,
      events: events.rows,
      interest: interest.rows,
      catalog: catalog.rows,
      paidUnassigned: paidUnassigned.rows,
    };
  });

  return NextResponse.json(data);
}
