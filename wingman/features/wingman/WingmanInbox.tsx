"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { WINGMAN_EVENT_MARK_LABELS, WINGMAN_EVENT_MARKS } from "@/lib/marketplace/constants";
import Link from "next/link";
import { useEffect, useState } from "react";

export function WingmanInbox() {
  const [requests, setRequests] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void fetch("/api/requests")
      .then((response) => response.json())
      .then((payload: { requests?: Array<Record<string, unknown>> }) => {
        setRequests(payload.requests ?? []);
      });
  }, []);

  return (
    <AppShell>
      <AppHeader title="Wingman desk" showBack backHref="/home" />
      <p className="text-sm text-ink-muted">
        Routed requests appear here. Unverified accounts cannot publish offers or appear publicly.
      </p>
      <div className="mt-5 space-y-3">
        {requests.length === 0 ? (
          <p className="text-sm text-ink-subtle">No routed requests.</p>
        ) : (
          requests.map((item) => (
            <Link
              key={String(item.id)}
              href={`/requests/${item.id}`}
              className="block rounded-2xl border border-border bg-surface px-4 py-4"
            >
              <p className="text-xs uppercase tracking-[0.12em] text-accent">
                {String(item.status).replaceAll("_", " ")}
              </p>
              <p className="mt-1 text-ink">{String(item.occasion)}</p>
            </Link>
          ))
        )}
      </div>
      <EventMarksPanel />
      <Link href="/policies" className="mt-6 block">
        <Button variant="secondary" fullWidth>
          Policies
        </Button>
      </Link>
    </AppShell>
  );
}

function EventMarksPanel() {
  const [eventId, setEventId] = useState("");
  const [note, setNote] = useState<string | null>(null);

  async function mark(markType: string) {
    const response = await fetch("/api/wingman/event-marks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, markType }),
    });
    const payload = (await response.json()) as { error?: string };
    setNote(
      payload.error ??
        "Saved privately. This does not create a public profile or a bookable offer.",
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-lg text-ink">Mark an event</h2>
      <p className="mt-1 text-xs text-ink-subtle">
        Verified Wingmen only. Unverified accounts cannot mark events or host tables.
      </p>
      <input
        value={eventId}
        onChange={(event) => setEventId(event.target.value)}
        placeholder="Event id"
        className="field mt-3"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {WINGMAN_EVENT_MARKS.map((markType) => (
          <button
            key={markType}
            type="button"
            className="rounded-full border border-border px-3 py-1 text-[11px] text-ink-muted"
            onClick={() => void mark(markType)}
          >
            {WINGMAN_EVENT_MARK_LABELS[markType]}
          </button>
        ))}
      </div>
      {note ? <p className="mt-3 text-sm text-accent">{note}</p> : null}
    </section>
  );
}
