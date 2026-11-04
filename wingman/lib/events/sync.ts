import { adapterFor } from "@/lib/events/adapters";
import { predictHqToken, ticketmasterApiKey } from "@/lib/events/auth";
import { makeSyncLog, writeSyncLog, type SyncLogEntry } from "@/lib/events/log";
import {
  listSources,
  loadExistingForSource,
  markMissedForSource,
  recordSyncRun,
  updateSourceAfterRun,
  upsertIncomingEvent,
  type SourceRow,
} from "@/lib/events/repo";
import type { AdapterContext, SourceSlug, SyncRunSummary } from "@/lib/events/types";
import { getPool } from "@/lib/db";

export type DailySyncResult = {
  triggeredBy: string;
  runs: SyncRunSummary[];
  ticketmasterSkipped: boolean;
  ticketmasterConfigured: boolean;
  predictHqSkipped: boolean;
  createdCount: number;
  updatedCount: number;
  rejectedCount: number;
  failedImageCount: number;
};

async function syncOneSource(
  source: SourceRow,
  triggeredBy: string,
  now: Date,
): Promise<SyncRunSummary> {
  const logs: SyncLogEntry[] = [];
  const startedAt = now;
  const adapter = adapterFor(source.slug);
  const client = await getPool().connect();

  const finish = async (
    summary: SyncRunSummary,
  ): Promise<SyncRunSummary> => {
    try {
      await client.query("BEGIN");
      const runId =       await recordSyncRun(client, {
        sourceId: source.id,
        status: summary.status,
        fetched: summary.fetchedCount,
        upserted: summary.upsertedCount,
        created: summary.createdCount,
        updated: summary.updatedCount,
        rejected: summary.rejectedCount,
        failedImages: summary.failedImageCount,
        merged: summary.mergedCount,
        stale: summary.staleCount,
        cancelled: summary.cancelledCount,
        error: summary.errorMessage,
        logs: summary.logs,
        triggeredBy,
        startedAt,
      });
      await updateSourceAfterRun(client, source, summary.status, runId, summary.errorMessage);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      logs.push(
        makeSyncLog("error", "Could not record sync run", {
          source: source.slug,
          error: error instanceof Error ? error.message : "unknown",
        }),
      );
    } finally {
      client.release();
    }
    return summary;
  };

  if (!source.enabled || !adapter || !adapter.enabled) {
    const reason =
      source.slug === "partner_feed"
        ? "Partner feed is disabled. Future Tabler access requires an approved API. No scrape is implemented."
        : `${source.name} is disabled.`;
    const entry = makeSyncLog("info", reason, { source: source.slug });
    logs.push(entry);
    writeSyncLog(entry);
    return finish({
      sourceSlug: source.slug,
      status: "skipped",
      fetchedCount: 0,
      upsertedCount: 0,
      createdCount: 0,
      updatedCount: 0,
      rejectedCount: 0,
      failedImageCount: 0,
      mergedCount: 0,
      staleCount: 0,
      cancelledCount: 0,
      errorMessage: null,
      logs,
      skippedReason: reason,
    });
  }

  try {
    await client.query("BEGIN");
    const existing = await loadExistingForSource(client, source.id);
    const ctx: AdapterContext = {
      now,
      ticketmasterApiKey: ticketmasterApiKey(),
      predictHqToken: predictHqToken(),
      existingForSource: existing,
    };
    const fetched = await adapter.fetch(ctx);
    if (fetched.status === "skipped") {
      const entry = makeSyncLog("info", fetched.reason, { source: source.slug });
      logs.push(entry);
      writeSyncLog(entry);
      await client.query("COMMIT");
      return finish({
        sourceSlug: source.slug,
        status: "skipped",
        fetchedCount: 0,
        upsertedCount: 0,
        createdCount: 0,
        updatedCount: 0,
        rejectedCount: 0,
        failedImageCount: 0,
        mergedCount: 0,
        staleCount: 0,
        cancelledCount: 0,
        errorMessage: null,
        logs,
        skippedReason: fetched.reason,
      });
    }
    if (fetched.status === "failed") {
      const entry = makeSyncLog("error", fetched.error, { source: source.slug });
      logs.push(entry);
      writeSyncLog(entry);
      await client.query("COMMIT");
      return finish({
        sourceSlug: source.slug,
        status: "failed",
        fetchedCount: 0,
        upsertedCount: 0,
        createdCount: 0,
        updatedCount: 0,
        rejectedCount: 0,
        failedImageCount: 0,
        mergedCount: 0,
        staleCount: 0,
        cancelledCount: 0,
        errorMessage: fetched.error,
        logs,
      });
    }

    let upserted = 0;
    let created = 0;
    let updated = 0;
    let merged = 0;
    let cancelled = 0;
    const seen: string[] = [];
    for (const incoming of fetched.events) {
      const result = await upsertIncomingEvent(client, source, incoming, now);
      upserted += 1;
      if (result.created) created += 1;
      else updated += 1;
      if (result.merged) merged += 1;
      if (incoming.cancelled) cancelled += 1;
      seen.push(incoming.externalId);
    }
    const stale = await markMissedForSource(client, source.id, seen, now);
    await client.query("COMMIT");
    const rejectedCount = fetched.rejectedCount ?? 0;
    const failedImageCount = fetched.failedImageCount ?? 0;
    const entry = makeSyncLog("info", "Source sync complete", {
      source: source.slug,
      fetched: fetched.events.length,
      created,
      updated,
      upserted,
      merged,
      stale,
      rejected: rejectedCount,
      failedImages: failedImageCount,
    });
    logs.push(entry);
    writeSyncLog(entry);
    return finish({
      sourceSlug: source.slug,
      status: "success",
      fetchedCount: fetched.events.length,
      upsertedCount: upserted,
      createdCount: created,
      updatedCount: updated,
      rejectedCount,
      failedImageCount,
      mergedCount: merged,
      staleCount: stale,
      cancelledCount: cancelled,
      errorMessage: null,
      logs,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    const message = error instanceof Error ? error.message : "Sync failed.";
    const entry = makeSyncLog("error", message, { source: source.slug });
    logs.push(entry);
    writeSyncLog(entry);
    return finish({
      sourceSlug: source.slug,
      status: "failed",
      fetchedCount: 0,
      upsertedCount: 0,
      createdCount: 0,
      updatedCount: 0,
      rejectedCount: 0,
      failedImageCount: 0,
      mergedCount: 0,
      staleCount: 0,
      cancelledCount: 0,
      errorMessage: message,
      logs,
    });
  }
}

export async function runDailyEventSync(args: {
  triggeredBy: string;
  only?: SourceSlug[];
  now?: Date;
}): Promise<DailySyncResult> {
  const now = args.now ?? new Date();
  const sources = await listSources();
  const selected = args.only
    ? sources.filter((source) => args.only?.includes(source.slug))
    : sources;
  const runs: SyncRunSummary[] = [];
  for (const source of selected) {
    runs.push(await syncOneSource(source, args.triggeredBy, now));
  }
  return {
    triggeredBy: args.triggeredBy,
    runs,
    ticketmasterSkipped: runs.some(
      (run) => run.sourceSlug === "ticketmaster" && run.status === "skipped",
    ),
    ticketmasterConfigured: Boolean(ticketmasterApiKey()),
    predictHqSkipped: runs.some(
      (run) => run.sourceSlug === "predicthq" && run.status === "skipped",
    ),
    createdCount: runs.reduce((sum, run) => sum + run.createdCount, 0),
    updatedCount: runs.reduce((sum, run) => sum + run.updatedCount, 0),
    rejectedCount: runs.reduce((sum, run) => sum + run.rejectedCount, 0),
    failedImageCount: runs.reduce((sum, run) => sum + run.failedImageCount, 0),
  };
}
