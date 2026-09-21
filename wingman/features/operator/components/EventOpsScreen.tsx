"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useState } from "react";

type OpsData = {
  events: Array<Record<string, unknown>>;
  syncRuns: Array<Record<string, unknown>>;
  alerts: Array<Record<string, unknown>>;
  sources: Array<Record<string, unknown>>;
  ticketmasterConfigured?: boolean;
  ticketmasterBlocker?: string | null;
};

export function EventOpsScreen() {
  const [data, setData] = useState<OpsData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [keepId, setKeepId] = useState("");
  const [dropId, setDropId] = useState("");

  async function load() {
    const response = await fetch("/api/operator/events");
    if (response.ok) setData((await response.json()) as OpsData);
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(body: Record<string, unknown>) {
    const response = await fetch("/api/operator/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as { error?: string };
    setMessage(payload.error ?? "Saved.");
    await load();
  }

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
    setMessage(
      payload.error ??
        (payload.ticketmasterSkipped || payload.ticketmasterConfigured === false
          ? "Sync finished. Ticketmaster did not run — TICKETMASTER_API_KEY is missing. This is not a successful Ticketmaster sync."
          : "Sync finished."),
    );
    await load();
  }

  if (!data) {
    return (
      <AppShell wide>
        <AppHeader title="Event ops" showBack backHref="/operator" />
        <p className="text-sm text-ink-muted">Loading event operations…</p>
      </AppShell>
    );
  }

  return (
    <AppShell wide>
      <AppHeader title="Event ops" showBack backHref="/operator" />
      <p className="text-label text-accent">Daily Miami sync</p>
      <h1 className="mt-2 text-2xl text-ink">Event operations</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Discovery listings stay non-bookable until a verified Wingman has an approved offer. Sync
        never scrapes Tabler or other blocked platforms.
      </p>
      {data.ticketmasterBlocker ? (
        <p className="mt-4 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink">
          Configuration blocker: {data.ticketmasterBlocker}
        </p>
      ) : null}
      {message ? <p className="mt-3 text-sm text-accent">{message}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => void syncNow()}>Sync now</Button>
        <Link href="/operator/events/health">
          <Button variant="secondary">Source health</Button>
        </Link>
      </div>

      {data.alerts.length > 0 ? (
        <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-lg text-ink">Alerts</h2>
          <ul className="mt-2 space-y-2 text-sm text-ink-muted">
            {data.alerts.map((alert) => (
              <li key={String(alert.id)}>{String(alert.message)}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="text-lg text-ink">Sources</h2>
        <ul className="mt-2 space-y-2 text-sm text-ink-muted">
          {data.sources.map((source) => (
            <li key={String(source.id)}>
              {String(source.name)} · {String(source.enabled) === "true" || source.enabled === true
                ? "on"
                : "disabled"}{" "}
              · failures {String(source.consecutive_failures ?? 0)}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-lg text-ink">Sync history</h2>
        <ul className="mt-2 space-y-2 text-xs text-ink-subtle">
          {data.syncRuns.map((run) => (
            <li key={String(run.id)}>
              {String(run.started_at).slice(0, 19)} · {String(run.source_slug ?? "all")} ·{" "}
              {String(run.status)} · recv {String(run.fetched_count ?? 0)} · created{" "}
              {String(run.created_count ?? 0)} · updated {String(run.updated_count ?? 0)} ·
              rejected {String(run.rejected_count ?? 0)}
              {run.error_message ? ` · ${String(run.error_message)}` : ""}
            </li>
          ))}
          {data.syncRuns.length === 0 ? <li>No runs yet.</li> : null}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg text-ink">Merge / unmerge</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input value={keepId} onChange={(event) => setKeepId(event.target.value)} placeholder="Keep event id" className="field" />
          <input value={dropId} onChange={(event) => setDropId(event.target.value)} placeholder="Drop event id" className="field" />
        </div>
        <Button
          className="mt-3"
          variant="secondary"
          onClick={() => void act({ action: "merge", keepId, dropId })}
        >
          Merge
        </Button>
      </section>

      <section className="mt-8">
        <h2 className="text-lg text-ink">All events</h2>
        <div className="mt-3 space-y-3">
          {data.events.map((event) => (
            <article key={String(event.id)} className="rounded-2xl border border-border bg-surface p-4">
              <p className="text-sm font-medium text-ink">{String(event.name)}</p>
              <p className="mt-1 text-xs text-ink-subtle">
                {String(event.venue_name)} · {String(event.source_slug ?? "—")} · last verified{" "}
                {String(event.source_verified_at ?? "").slice(0, 10)} · {String(event.booking_status)} ·{" "}
                {String(event.import_status)}
                {event.duplicate_warning ? " · duplicate warning" : ""}
              </p>
              <p className="mt-2 text-xs text-ink-muted">
                Discovery {String(event.discovery_status)} · bookable offer{" "}
                {String(event.has_bookable_offer)} · id {String(event.id)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-border px-3 py-1 text-[11px] text-ink-muted"
                  onClick={() => void act({ action: "approve", eventId: event.id })}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="rounded-full border border-border px-3 py-1 text-[11px] text-ink-muted"
                  onClick={() => void act({ action: "reject", eventId: event.id })}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="rounded-full border border-border px-3 py-1 text-[11px] text-ink-muted"
                  onClick={() => void act({ action: "cancel", eventId: event.id, cancelReason: "Operator cancelled" })}
                >
                  Cancel
                </button>
              </div>
              <p className="mt-3 text-[11px] text-ink-subtle">
                Attach offer later — only after a verified Wingman exists. Unverified accounts cannot
                host tables.
              </p>
            </article>
          ))}
        </div>
      </section>

      <Link href="/operator" className="mt-8 block text-sm text-accent">
        Back to operator desk
      </Link>
    </AppShell>
  );
}
