import type { PoolClient } from "pg";
import { computeMergeKey } from "@/lib/events/normalize";
import { applyAutomatedUpdate } from "@/lib/events/merge";
import { parseClock, toIsoDate, wallTimeInZoneToUtc } from "@/lib/events/timezone";
import type { NormalizedIncomingEvent, SourceSlug } from "@/lib/events/types";
import { getSql } from "@/lib/neon";

export type SourceRow = {
  id: string;
  slug: SourceSlug;
  name: string;
  enabled: boolean;
  consecutive_failures: number;
};

export async function listSources(client?: PoolClient): Promise<SourceRow[]> {
  const sql = `SELECT id, slug, name, enabled, consecutive_failures FROM event_sources ORDER BY slug`;
  if (client) {
    const result = await client.query<SourceRow>(sql);
    return result.rows;
  }
  return (await getSql().query(sql, [])) as SourceRow[];
}

export async function loadExistingForSource(
  client: PoolClient,
  sourceId: string,
): Promise<NormalizedIncomingEvent[]> {
  const result = await client.query(
    `SELECT r.external_id, e.name, e.performer, v.name AS venue_name, e.neighborhood, e.area,
            e.local_date, e.local_time_text, e.starts_at, e.ends_at, e.category, e.music_genre,
            e.event_type, e.age_requirement, e.official_source_url, e.price_min_cents,
            e.price_max_cents, e.price_text, e.booking_status, e.image_url,
            e.image_usage_verified, e.image_attribution, s.slug
     FROM event_source_records r
     JOIN events e ON e.id = r.event_id
     JOIN venues v ON v.id = e.venue_id
     JOIN event_sources s ON s.id = r.source_id
     WHERE r.source_id = $1 AND e.merged_into_id IS NULL`,
    [sourceId],
  );
  return result.rows.map((row) => {
    const clock = parseClock(String(row.local_time_text ?? "11:00 PM"));
    const localDate = toIsoDate(row.local_date);
    return {
      sourceSlug: String(row.slug) as SourceSlug,
      externalId: String(row.external_id),
      name: String(row.name),
      performer: row.performer ? String(row.performer) : null,
      venueName: String(row.venue_name),
      neighborhood: String(row.neighborhood ?? row.area ?? "Miami"),
      area: String(row.area ?? "Miami"),
      localDate,
      localTimeText: String(row.local_time_text),
      startsAt: new Date(String(row.starts_at)),
      endsAt: row.ends_at ? new Date(String(row.ends_at)) : null,
      timezone: "America/New_York",
      category: String(row.category),
      musicGenre: row.music_genre ? String(row.music_genre) : null,
      eventType: row.event_type ? String(row.event_type) : null,
      ageRequirement: String(row.age_requirement),
      officialSourceUrl: String(row.official_source_url),
      priceMinCents: row.price_min_cents == null ? null : Number(row.price_min_cents),
      priceMaxCents: row.price_max_cents == null ? null : Number(row.price_max_cents),
      priceText: row.price_text ? String(row.price_text) : null,
      imageUrl: row.image_url && row.image_usage_verified ? String(row.image_url) : null,
      imageUsageVerified: Boolean(row.image_usage_verified),
      imageAttribution: row.image_attribution ? String(row.image_attribution) : null,
      cancelled: String(row.booking_status) === "CANCELLED",
      raw: {},
    };
  });
}

async function ensureVenue(client: PoolClient, name: string, area: string, officialUrl: string): Promise<string> {
  const existing = await client.query<{ id: string }>(
    "SELECT id FROM venues WHERE lower(name) = lower($1) LIMIT 1",
    [name],
  );
  if (existing.rows[0]) return existing.rows[0].id;
  const inserted = await client.query<{ id: string }>(
    `INSERT INTO venues (name, area, official_url, city, timezone)
     VALUES ($1, $2, $3, 'Miami', 'America/New_York')
     RETURNING id`,
    [name, area, officialUrl],
  );
  return inserted.rows[0].id;
}

export async function upsertIncomingEvent(
  client: PoolClient,
  source: SourceRow,
  incoming: NormalizedIncomingEvent,
  now: Date,
): Promise<{ created: boolean; merged: boolean; eventId: string }> {
  const mergeKey = computeMergeKey(incoming);
  const existingRecord = await client.query<{ event_id: string }>(
    `SELECT event_id FROM event_source_records
     WHERE source_id = $1 AND external_id = $2`,
    [source.id, incoming.externalId],
  );

  const venueId = await ensureVenue(client, incoming.venueName, incoming.area, incoming.officialSourceUrl);
  const locked = existingRecord.rows[0]
    ? (
        await client.query<{ admin_locked_fields: string[] }>(
          "SELECT admin_locked_fields FROM events WHERE id = $1",
          [existingRecord.rows[0].event_id],
        )
      ).rows[0]?.admin_locked_fields ?? []
    : [];

  const patch = applyAutomatedUpdate(
    {
      id: existingRecord.rows[0]?.event_id ?? "",
      externalId: "",
      name: incoming.name,
      performer: incoming.performer,
      venueName: incoming.venueName,
      venueId,
      neighborhood: incoming.neighborhood,
      area: incoming.area,
      localDate: incoming.localDate,
      localTimeText: incoming.localTimeText,
      startsAt: incoming.startsAt,
      endsAt: incoming.endsAt,
      timezone: incoming.timezone,
      category: incoming.category,
      musicGenre: incoming.musicGenre,
      eventType: incoming.eventType,
      ageRequirement: incoming.ageRequirement,
      officialSourceUrl: incoming.officialSourceUrl,
      priceMinCents: incoming.priceMinCents,
      priceMaxCents: incoming.priceMaxCents,
      priceText: incoming.priceText,
      imageUrl: incoming.imageUsageVerified ? incoming.imageUrl : null,
      imageUsageVerified: incoming.imageUsageVerified,
      imageAttribution: incoming.imageUsageVerified ? incoming.imageAttribution : null,
      bookingStatus: incoming.cancelled ? "CANCELLED" : "DISCOVERY_ONLY",
      discoveryStatus: incoming.cancelled ? "cancelled" : "discovery_ready",
      importStatus: incoming.sourceSlug === "csv" ? "pending" : "approved",
      mergeKey,
      lastSyncedAt: now,
      lastSeenAt: now,
      missedSyncCount: 0,
      stale: false,
      hiddenAt: null,
      adminLockedFields: locked,
      mergedIntoId: null,
      primarySourceSlug: incoming.sourceSlug,
      sourceVerifiedAt: now,
    },
    incoming,
  );

  if (existingRecord.rows[0]) {
    const eventId = existingRecord.rows[0].event_id;
    await client.query(
      `UPDATE events SET
         name = COALESCE($2, name),
         performer = COALESCE($3, performer),
         venue_id = COALESCE($4, venue_id),
         neighborhood = COALESCE($5, neighborhood),
         area = COALESCE($6, area),
         local_date = COALESCE($7::date, local_date),
         local_time_text = COALESCE($8, local_time_text),
         starts_at = COALESCE($9::timestamptz, starts_at),
         ends_at = COALESCE($10::timestamptz, ends_at),
         category = COALESCE($11, category),
         music_genre = COALESCE($12, music_genre),
         event_type = COALESCE($13, event_type),
         age_requirement = COALESCE($14, age_requirement),
         official_source_url = COALESCE($15, official_source_url),
         price_min_cents = COALESCE($16, price_min_cents),
         price_max_cents = COALESCE($17, price_max_cents),
         price_text = COALESCE($18, price_text),
         booking_status = CASE
           WHEN $19 THEN 'CANCELLED'::event_booking_status
           WHEN booking_status = 'VERIFIED_AVAILABLE' THEN booking_status
           ELSE booking_status
         END,
         discovery_status = CASE
           WHEN $19 THEN 'cancelled'::event_discovery_status
           WHEN discovery_status IN ('cancelled', 'expired', 'bookable') THEN discovery_status
           ELSE discovery_status
         END,
         merge_key = $20,
         last_synced_at = $21::timestamptz,
         last_seen_at = $21::timestamptz,
         missed_sync_count = 0,
         stale = false,
         source_verified_at = $21::timestamptz,
         image_url = CASE
           WHEN $22 THEN $23
           WHEN image_usage_verified THEN image_url
           ELSE NULL
         END,
         image_usage_verified = CASE WHEN $22 THEN true ELSE image_usage_verified END,
         image_attribution = CASE WHEN $22 THEN $24 ELSE image_attribution END,
         updated_at = now()
       WHERE id = $1`,
      [
        eventId,
        locked.includes("name") ? null : patch.name ?? incoming.name,
        locked.includes("performer") ? null : incoming.performer,
        locked.includes("venueName") ? null : venueId,
        locked.includes("neighborhood") ? null : incoming.neighborhood,
        locked.includes("area") ? null : incoming.area,
        locked.includes("localDate") ? null : toIsoDate(incoming.localDate),
        locked.includes("localTimeText") ? null : incoming.localTimeText,
        locked.includes("startsAt") ? null : incoming.startsAt.toISOString(),
        incoming.endsAt ? incoming.endsAt.toISOString() : null,
        locked.includes("category") ? null : incoming.category,
        incoming.musicGenre,
        incoming.eventType,
        locked.includes("ageRequirement") ? null : incoming.ageRequirement,
        locked.includes("officialSourceUrl") ? null : incoming.officialSourceUrl,
        incoming.priceMinCents,
        incoming.priceMaxCents,
        incoming.priceText,
        incoming.cancelled,
        mergeKey,
        now.toISOString(),
        Boolean(incoming.imageUsageVerified && incoming.imageUrl),
        incoming.imageUsageVerified ? incoming.imageUrl : null,
        incoming.imageUsageVerified ? incoming.imageAttribution : null,
      ],
    );
    await client.query(
      `UPDATE event_source_records
       SET last_seen_at = $3, missed_sync_count = 0, status = $4, raw_payload = $5::jsonb, updated_at = now()
       WHERE source_id = $1 AND external_id = $2`,
      [
        source.id,
        incoming.externalId,
        now.toISOString(),
        incoming.cancelled ? "cancelled" : "active",
        JSON.stringify(incoming.raw),
      ],
    );
    return { created: false, merged: false, eventId };
  }

  const match = await client.query<{ id: string }>(
    `SELECT id FROM events
     WHERE merge_key = $1 AND merged_into_id IS NULL
     ORDER BY created_at ASC
     LIMIT 1`,
    [mergeKey],
  );

  let eventId = match.rows[0]?.id ?? null;
  let created = false;
  let merged = false;
  if (!eventId) {
    const externalId = `${incoming.sourceSlug}-${incoming.externalId}`.slice(0, 80);
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO events (
         external_id, name, venue_id, starts_at, ends_at, local_date, local_time_text, timezone,
         area, neighborhood, category, music_genre, event_type, performer, age_requirement,
         official_source_url, source_verified_at, discovery_status, booking_status, import_status,
         available_services, wingman_coverage, booking_status_note, primary_source_id, merge_key,
         last_synced_at, last_seen_at, missed_sync_count, stale, image_usage_verified,
         image_url, image_attribution, price_min_cents, price_max_cents, price_text, atmosphere
       ) VALUES (
         $1, $2, $3, $4::timestamptz, $5::timestamptz, $6::date, $7, 'America/New_York',
         $8, $9, $10, $11, $12, $13, $14,
         $15, $16::timestamptz, $17::event_discovery_status, $18::event_booking_status, $19::event_import_status,
         '{}', 'Unassigned', 'Awaiting Wingman inventory', $20, $21,
         $16::timestamptz, $16::timestamptz, 0, false, $25,
         $26, $27, $22, $23, $24, $10
       )
       ON CONFLICT (external_id) DO UPDATE SET updated_at = now()
       RETURNING id`,
      [
        externalId,
        incoming.name,
        venueId,
        incoming.startsAt.toISOString(),
        incoming.endsAt?.toISOString() ?? null,
        toIsoDate(incoming.localDate),
        incoming.localTimeText,
        incoming.area,
        incoming.neighborhood,
        incoming.category,
        incoming.musicGenre,
        incoming.eventType,
        incoming.performer,
        incoming.ageRequirement,
        incoming.officialSourceUrl,
        now.toISOString(),
        incoming.cancelled ? "cancelled" : "discovery_ready",
        incoming.cancelled ? "CANCELLED" : "DISCOVERY_ONLY",
        incoming.sourceSlug === "csv" ? "pending" : "approved",
        source.id,
        mergeKey,
        incoming.priceMinCents,
        incoming.priceMaxCents,
        incoming.priceText,
        Boolean(incoming.imageUsageVerified && incoming.imageUrl),
        incoming.imageUsageVerified ? incoming.imageUrl : null,
        incoming.imageUsageVerified ? incoming.imageAttribution : null,
      ],
    );
    eventId = inserted.rows[0].id;
    created = true;
  } else {
    merged = true;
    await client.query(
      `UPDATE events SET last_seen_at = $2::timestamptz, last_synced_at = $2::timestamptz, updated_at = now()
       WHERE id = $1`,
      [eventId, now.toISOString()],
    );
  }

  await client.query(
    `INSERT INTO event_source_records (source_id, external_id, event_id, raw_payload, last_seen_at, missed_sync_count, status)
     VALUES ($1, $2, $3, $4::jsonb, $5::timestamptz, 0, $6)
     ON CONFLICT (source_id, external_id) DO UPDATE SET
       event_id = EXCLUDED.event_id,
       raw_payload = EXCLUDED.raw_payload,
       last_seen_at = EXCLUDED.last_seen_at,
       missed_sync_count = 0,
       status = EXCLUDED.status,
       updated_at = now()`,
    [
      source.id,
      incoming.externalId,
      eventId,
      JSON.stringify(incoming.raw),
      now.toISOString(),
      incoming.cancelled ? "cancelled" : "active",
    ],
  );
  return { created, merged, eventId };
}

export async function markMissedForSource(
  client: PoolClient,
  sourceId: string,
  seenExternalIds: string[],
  now: Date,
): Promise<number> {
  await client.query(
    `UPDATE event_source_records
     SET missed_sync_count = missed_sync_count + 1,
         status = CASE WHEN missed_sync_count + 1 >= 2 THEN 'stale' ELSE status END,
         updated_at = now()
     WHERE source_id = $1
       AND NOT (external_id = ANY($2::text[]))`,
    [sourceId, seenExternalIds],
  );
  const staleEvents = await client.query<{ n: number }>(
    `UPDATE events e
     SET stale = true, missed_sync_count = GREATEST(e.missed_sync_count, 2), updated_at = now()
     WHERE e.merged_into_id IS NULL
       AND EXISTS (
         SELECT 1 FROM event_source_records r
         WHERE r.event_id = e.id AND r.source_id = $1 AND r.missed_sync_count >= 2
       )
       AND NOT EXISTS (
         SELECT 1 FROM event_source_records r2
         WHERE r2.event_id = e.id AND r2.missed_sync_count < 2 AND r2.status = 'active'
       )
     RETURNING 1`,
    [sourceId],
  );
  await client.query(
    `UPDATE events
     SET discovery_status = 'expired', hidden_at = COALESCE(hidden_at, $1::timestamptz), updated_at = now()
     WHERE merged_into_id IS NULL
       AND discovery_status NOT IN ('cancelled')
       AND COALESCE(ends_at, starts_at) + interval '6 hours' < $1::timestamptz
       AND hidden_at IS NULL`,
    [now.toISOString()],
  );
  return staleEvents.rowCount ?? 0;
}

export async function recordSyncRun(
  client: PoolClient,
  args: {
    sourceId: string | null;
    status: "success" | "failed" | "skipped";
    fetched: number;
    upserted: number;
    created: number;
    updated: number;
    rejected: number;
    failedImages: number;
    merged: number;
    stale: number;
    cancelled: number;
    error: string | null;
    logs: unknown[];
    triggeredBy: string;
    startedAt: Date;
  },
): Promise<string> {
  const inserted = await client.query<{ id: string }>(
    `INSERT INTO sync_runs (
       source_id, started_at, finished_at, status, fetched_count, upserted_count,
       created_count, updated_count, rejected_count, failed_image_count,
       merged_count, stale_count, cancelled_count, error_message, logs, triggered_by
     ) VALUES (
       $1, $2::timestamptz, now(), $3::sync_run_status, $4, $5, $6, $7, $8, $9,
       $10, $11, $12, $13, $14::jsonb, $15
     ) RETURNING id`,
    [
      args.sourceId,
      args.startedAt.toISOString(),
      args.status,
      args.fetched,
      args.upserted,
      args.created,
      args.updated,
      args.rejected,
      args.failedImages,
      args.merged,
      args.stale,
      args.cancelled,
      args.error,
      JSON.stringify(args.logs),
      args.triggeredBy,
    ],
  );
  return inserted.rows[0].id;
}

export async function updateSourceAfterRun(
  client: PoolClient,
  source: SourceRow,
  status: "success" | "failed" | "skipped",
  runId: string,
  errorMessage?: string | null,
): Promise<void> {
  const failed = status === "failed";
  const nextFailures = failed ? source.consecutive_failures + 1 : 0;
  await client.query(
    `UPDATE event_sources
     SET last_synced_at = now(),
         last_success_at = CASE WHEN $3 THEN now() ELSE last_success_at END,
         last_error = $4,
         consecutive_failures = $2,
         updated_at = now()
     WHERE id = $1`,
    [
      source.id,
      nextFailures,
      status === "success",
      failed ? errorMessage || `Run ${runId} failed` : null,
    ],
  );
  if (nextFailures >= 2) {
    await client.query(
      `INSERT INTO admin_alerts (kind, message, source_id, sync_run_id)
       VALUES ('sync_failure', $1, $2, $3)`,
      [`${source.name} failed ${nextFailures} consecutive syncs.`, source.id, runId],
    );
  }
}

export function localStartFromIncoming(incoming: NormalizedIncomingEvent): Date {
  const clock = parseClock(incoming.localTimeText);
  return wallTimeInZoneToUtc(incoming.localDate, clock.hour, clock.minute);
}
