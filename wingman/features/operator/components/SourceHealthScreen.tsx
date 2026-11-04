"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useState } from "react";

type HealthRow = {
  id: string;
  slug: string;
  name: string;
  enabled: boolean;
  last_synced_at: string | null;
  last_success_at: string | null;
  last_success_finished_at: string | null;
  last_error: string | null;
  last_failed_error: string | null;
  last_failed_at: string | null;
  consecutive_failures: number;
  fetched_count: number | null;
  created_count: number | null;
  updated_count: number | null;
  rejected_count: number | null;
  failed_image_count: number | null;
  merged_count: number | null;
  current_listings: number;
  duplicate_warnings: number;
};

type HealthData = {
  sourceHealth: HealthRow[];
  ticketmasterConfigured: boolean;
  ticketmasterBlocker: string | null;
};

function stamp(value: string | null | undefined): string {
  if (!value) return "Never";
  return String(value).slice(0, 19).replace("T", " ");
}

export function SourceHealthScreen() {
  const [data, setData] = useState<HealthData | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/operator/events");
    if (response.ok) setData((await response.json()) as HealthData);
  }

  useEffect(() => {
    void load();
  }, []);

  async function syncNow() {
    const response = await fetch("/api/operator/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const payload = (await response.json()) as {
      error?: string;
      ticketmasterSkipped?: boolean;
      ticketmasterConfigured?: boolean;
    };
    if (payload.error) {
      setMessage(payload.error);
    } else if (payload.ticketmasterSkipped || payload.ticketmasterConfigured === false) {
      setMessage(
        "Sync finished. Ticketmaster did not run — TICKETMASTER_API_KEY is missing. This is not a successful Ticketmaster sync.",
      );
    } else {
      setMessage("Sync finished.");
    }
    await load();
  }

  if (!data) {
    return (
      <AppShell wide>
        <AppHeader title="Source health" showBack backHref="/operator/events" />
        <p className="text-sm text-ink-muted">Loading source health…</p>
      </AppShell>
    );
  }

  return (
    <AppShell wide>
      <AppHeader title="Source health" showBack backHref="/operator/events" />
      <p className="text-label text-accent">Daily Miami sync</p>
      <h1 className="mt-2 text-2xl text-ink">Source health</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Last successful run, received / created / updated, failed images, duplicates, and errors.
        Imported listings stay DISCOVERY_ONLY.
      </p>
      {data.ticketmasterBlocker ? (
        <p className="mt-4 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink">
          Configuration blocker: {data.ticketmasterBlocker}
        </p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-accent">{message}</p> : null}

      <Button className="mt-4" onClick={() => void syncNow()}>
        Sync now
      </Button>

      <div className="mt-6 space-y-4">
        {data.sourceHealth.map((source) => (
          <article key={source.id} className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-lg text-ink">{source.name}</h2>
            <p className="mt-1 text-xs text-ink-subtle">
              {source.slug} · {source.enabled ? "enabled" : "disabled"} · current listings{" "}
              {source.current_listings}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <Row label="Last successful sync" value={stamp(source.last_success_finished_at || source.last_success_at)} />
              <Row label="Last attempt" value={stamp(source.last_synced_at)} />
              <Row label="Events received" value={String(source.fetched_count ?? "—")} />
              <Row label="Created" value={String(source.created_count ?? "—")} />
              <Row label="Updated" value={String(source.updated_count ?? "—")} />
              <Row label="Rejected" value={String(source.rejected_count ?? "—")} />
              <Row label="Failed images" value={String(source.failed_image_count ?? "—")} />
              <Row label="Duplicates merged" value={String(source.merged_count ?? "—")} />
              <Row label="Duplicate warnings" value={String(source.duplicate_warnings ?? 0)} />
              <Row label="Consecutive failures" value={String(source.consecutive_failures ?? 0)} />
            </dl>
            {source.last_error || source.last_failed_error ? (
              <p className="mt-3 text-xs text-ink-muted">
                Last error ({stamp(source.last_failed_at)}):{" "}
                {source.last_error || source.last_failed_error}
              </p>
            ) : (
              <p className="mt-3 text-xs text-ink-subtle">No recorded errors.</p>
            )}
            {source.slug === "ticketmaster" && !data.ticketmasterConfigured ? (
              <p className="mt-2 text-xs text-ink">
                Ticketmaster key is not configured. No Ticketmaster events were imported.
              </p>
            ) : null}
          </article>
        ))}
      </div>

      <Link href="/operator/events" className="mt-8 block text-sm text-accent">
        Back to event ops
      </Link>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border px-3 py-2">
      <dt className="text-[10px] uppercase tracking-[0.12em] text-ink-subtle">{label}</dt>
      <dd className="mt-1 text-ink">{value}</dd>
    </div>
  );
}
