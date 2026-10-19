"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { customerBookingStatus } from "@/lib/marketplace/status-copy";
import Link from "next/link";
import { useEffect, useState } from "react";

type LiveRequest = { id: string; status: string; event_name?: string; occasion?: string };

export function MessagesScreen() {
  const [live, setLive] = useState<LiveRequest[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void fetch("/api/requests")
      .then((response) => (response.ok ? response.json() : { requests: [] }))
      .then((payload: { requests?: LiveRequest[] }) => {
        setLive(payload.requests ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const chatReady = live.filter((item) =>
    ["paid", "confirmed", "in_progress", "completed"].includes(item.status),
  );

  return (
    <AppShell showNav>
      <AppHeader title="Chat" showMenu />
      <h1 className="font-display text-4xl text-ink">Private line</h1>
      <p className="mt-2 max-w-sm text-[0.95rem] text-ink-muted">
        Chat with your Wingman after a night is confirmed. Support is always here.
      </p>

      <div className="mt-8 space-y-6">
        {loaded && chatReady.length === 0 ? (
          <EmptyState
            title="Your next night starts here."
            body="Messages open when an evening is confirmed. Until then, plan the night."
            action={
              <div className="flex flex-col gap-3">
                <Link href="/book?source=messages">
                  <Button>Book tonight · $500</Button>
                </Link>
                <Link href="/account" className="text-sm text-ink-muted">
                  Write concierge
                </Link>
              </div>
            }
          />
        ) : (
          chatReady.map((item) => (
            <Link key={item.id} href={`/requests/${item.id}`} className="block">
              <p className="text-champagne">Andres</p>
              <h2 className="font-display mt-1 text-2xl text-ink">
                {item.event_name || item.occasion || "Your evening"}
              </h2>
              <p className="mt-1 text-sm text-ink-subtle">{customerBookingStatus(item.status)}</p>
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}
