import type { AuthUser } from "@/lib/auth/types";
import { withUserContext } from "@/lib/db";
import { writeAudit } from "@/lib/marketplace/audit";
import { lockFieldsFromAdminEdit } from "@/lib/events/merge";
import { ticketmasterApiKey } from "@/lib/events/auth";
import type { AutomatedEventField } from "@/lib/events/types";

export async function listOperatorEvents(user: AuthUser) {
  return withUserContext(user, async (client) => {
    const events = await client.query(
      `SELECT e.*, v.name AS venue_name, s.slug AS source_slug, s.name AS source_name,
         (SELECT count(*)::int FROM event_source_records r WHERE r.event_id = e.id) AS source_count,
         EXISTS (
           SELECT 1 FROM events d
           WHERE d.id <> e.id AND d.merge_key = e.merge_key AND d.merged_into_id IS NULL
         ) AS duplicate_warning,
         EXISTS (
           SELECT 1 FROM wingman_event_offers o WHERE o.event_id = e.id AND o.bookable = true
         ) AS has_bookable_offer
       FROM events e
       JOIN venues v ON v.id = e.venue_id
       LEFT JOIN event_sources s ON s.id = e.primary_source_id
       WHERE e.merged_into_id IS NULL
       ORDER BY e.local_date ASC, e.name ASC`,
    );
    const runs = await client.query(
      `SELECT r.*, s.slug AS source_slug, s.name AS source_name
       FROM sync_runs r
       LEFT JOIN event_sources s ON s.id = r.source_id
       ORDER BY r.started_at DESC
       LIMIT 40`,
    );
    const alerts = await client.query(
      `SELECT * FROM admin_alerts WHERE acknowledged_at IS NULL ORDER BY created_at DESC LIMIT 20`,
    );
    const sources = await client.query(`SELECT * FROM event_sources ORDER BY slug`);
    const health = await client.query(
      `SELECT
         s.id,
         s.slug,
         s.name,
         s.enabled,
         s.requires_api_key,
         s.last_synced_at,
         s.last_success_at,
         s.last_error,
         s.consecutive_failures,
         last_ok.finished_at AS last_success_finished_at,
         last_ok.fetched_count,
         last_ok.created_count,
         last_ok.updated_count,
         last_ok.upserted_count,
         last_ok.rejected_count,
         last_ok.failed_image_count,
         last_ok.merged_count,
         last_ok.stale_count,
         last_ok.cancelled_count,
         last_ok.error_message AS last_success_error,
         last_fail.error_message AS last_failed_error,
         last_fail.finished_at AS last_failed_at,
         (
           SELECT count(*)::int FROM events e
           WHERE e.primary_source_id = s.id AND e.merged_into_id IS NULL
         ) AS current_listings,
         (
           SELECT count(*)::int FROM events e
           WHERE e.primary_source_id = s.id AND e.merged_into_id IS NULL
             AND EXISTS (
               SELECT 1 FROM events d
               WHERE d.id <> e.id AND d.merge_key = e.merge_key AND d.merged_into_id IS NULL
             )
         ) AS duplicate_warnings
       FROM event_sources s
       LEFT JOIN LATERAL (
         SELECT * FROM sync_runs r
         WHERE r.source_id = s.id AND r.status = 'success'
         ORDER BY r.started_at DESC
         LIMIT 1
       ) last_ok ON true
       LEFT JOIN LATERAL (
         SELECT * FROM sync_runs r
         WHERE r.source_id = s.id AND r.status = 'failed'
         ORDER BY r.started_at DESC
         LIMIT 1
       ) last_fail ON true
       ORDER BY s.slug`,
    );
    return {
      events: events.rows,
      syncRuns: runs.rows,
      alerts: alerts.rows,
      sources: sources.rows,
      sourceHealth: health.rows,
      ticketmasterConfigured: Boolean(ticketmasterApiKey()),
      ticketmasterBlocker: ticketmasterApiKey()
        ? null
        : "TICKETMASTER_API_KEY is missing. Ticketmaster Discovery is not running. This is not a successful Ticketmaster sync.",
    };
  });
}

export async function updateOperatorEvent(
  user: AuthUser,
  input: {
    eventId: string;
    name?: string;
    officialSourceUrl?: string;
    neighborhood?: string;
    atmosphere?: string;
    dressCode?: string;
    estimatedSpendText?: string;
    ageRequirement?: string;
    musicGenre?: string;
    internalNotes?: string;
    discoveryStatus?: string;
    importStatus?: "pending" | "approved" | "rejected";
    cancel?: boolean;
    cancelReason?: string;
  },
) {
  return withUserContext(user, async (client) => {
    const current = await client.query<{ admin_locked_fields: string[] }>(
      "SELECT admin_locked_fields FROM events WHERE id = $1",
      [input.eventId],
    );
    if (!current.rows[0]) throw new Error("Event not found.");
    const edited: AutomatedEventField[] = [];
    if (input.name) edited.push("name");
    if (input.officialSourceUrl) edited.push("officialSourceUrl");
    if (input.neighborhood) edited.push("neighborhood");
    if (input.ageRequirement) edited.push("ageRequirement");
    if (input.musicGenre) edited.push("musicGenre");
    const locked = lockFieldsFromAdminEdit(current.rows[0].admin_locked_fields ?? [], edited);
    await client.query(
      `UPDATE events SET
         name = COALESCE($2, name),
         official_source_url = COALESCE($3, official_source_url),
         neighborhood = COALESCE($4, neighborhood),
         atmosphere = COALESCE($5, atmosphere),
         dress_code = COALESCE($6, dress_code),
         estimated_spend_text = COALESCE($7, estimated_spend_text),
         age_requirement = COALESCE($8, age_requirement),
         music_genre = COALESCE($9, music_genre),
         internal_notes = COALESCE($10, internal_notes),
         discovery_status = COALESCE($11::event_discovery_status, discovery_status),
         import_status = COALESCE($12::event_import_status, import_status),
         booking_status = CASE WHEN $13 THEN 'CANCELLED'::event_booking_status ELSE booking_status END,
         cancelled_at = CASE WHEN $13 THEN now() ELSE cancelled_at END,
         cancelled_reason = CASE WHEN $13 THEN $14 ELSE cancelled_reason END,
         admin_locked_fields = $15::jsonb,
         source_verified_at = now(),
         updated_at = now()
       WHERE id = $1`,
      [
        input.eventId,
        input.name ?? null,
        input.officialSourceUrl ?? null,
        input.neighborhood ?? null,
        input.atmosphere ?? null,
        input.dressCode ?? null,
        input.estimatedSpendText ?? null,
        input.ageRequirement ?? null,
        input.musicGenre ?? null,
        input.internalNotes ?? null,
        input.discoveryStatus ?? null,
        input.importStatus ?? null,
        Boolean(input.cancel),
        input.cancelReason ?? null,
        JSON.stringify(locked),
      ],
    );
    await writeAudit(client, {
      actorId: user.id,
      entityType: "event",
      entityId: input.eventId,
      action: input.cancel ? "cancel" : "admin_edit",
      payload: { locked },
    });
  });
}

export async function mergeOperatorEvents(user: AuthUser, keepId: string, dropId: string) {
  if (keepId === dropId) throw new Error("Choose two different events.");
  return withUserContext(user, async (client) => {
    await client.query(
      `UPDATE event_source_records SET event_id = $1, updated_at = now() WHERE event_id = $2`,
      [keepId, dropId],
    );
    await client.query(
      `UPDATE events SET merged_into_id = $1, hidden_at = now(), updated_at = now() WHERE id = $2`,
      [keepId, dropId],
    );
    await writeAudit(client, {
      actorId: user.id,
      entityType: "event",
      entityId: keepId,
      action: "merge",
      payload: { dropped: dropId },
    });
  });
}

export async function unmergeOperatorEvent(
  user: AuthUser,
  eventId: string,
  sourceSlug: string,
  externalId: string,
) {
  return withUserContext(user, async (client) => {
    const source = await client.query<{ id: string }>(
      "SELECT id FROM event_sources WHERE slug = $1",
      [sourceSlug],
    );
    if (!source.rows[0]) throw new Error("Unknown source.");
    const record = await client.query<{ id: string }>(
      `SELECT id FROM event_source_records WHERE source_id = $1 AND external_id = $2 AND event_id = $3`,
      [source.rows[0].id, externalId, eventId],
    );
    if (!record.rows[0]) throw new Error("Source record not found on this event.");
    const original = await client.query("SELECT * FROM events WHERE id = $1", [eventId]);
    const row = original.rows[0] as Record<string, unknown>;
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO events (
         external_id, name, venue_id, starts_at, local_date, local_time_text, timezone, area,
         neighborhood, category, age_requirement, official_source_url, source_verified_at,
         discovery_status, booking_status, import_status, available_services, wingman_coverage,
         booking_status_note, primary_source_id, merge_key
       )
       SELECT $1, name, venue_id, starts_at, local_date, local_time_text, timezone, area,
              neighborhood, category, age_requirement, official_source_url, now(),
              discovery_status, booking_status, import_status, available_services, wingman_coverage,
              booking_status_note, $2, merge_key || '-unmerged'
       FROM events WHERE id = $3
       RETURNING id`,
      [`${sourceSlug}-${externalId}-u`.slice(0, 80), source.rows[0].id, eventId],
    );
    await client.query(
      `UPDATE event_source_records SET event_id = $1, updated_at = now() WHERE id = $2`,
      [inserted.rows[0].id, record.rows[0].id],
    );
    await writeAudit(client, {
      actorId: user.id,
      entityType: "event",
      entityId: inserted.rows[0].id,
      action: "unmerge",
      payload: { from: eventId, sourceSlug, externalId, originalName: row.name },
    });
    return inserted.rows[0].id;
  });
}

export async function reportEvent(eventId: string, message: string, email?: string) {
  const { getSql } = await import("@/lib/neon");
  const sql = getSql();
  await sql`
    INSERT INTO event_reports (event_id, message, email)
    VALUES (${eventId}, ${message.slice(0, 1000)}, ${email?.trim() || null})
  `;
  await sql`UPDATE events SET report_count = report_count + 1, updated_at = now() WHERE id = ${eventId}`;
}
