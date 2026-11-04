"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusChip } from "@/components/ui/StatusChip";
import { customerBookingStatus } from "@/lib/marketplace/status-copy";
import Link from "next/link";
import { useEffect, useState } from "react";

type LiveRequest = {
  id: string;
  status: string;
  event_name?: string;
  occasion?: string;
  starts_at?: string;
  group_size?: number;
};

export function BookingsScreen() {
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

  return (
    <AppShell showNav>
      <AppHeader showMenu showNotifications />
      <h1 className="font-display text-4xl text-ink">Trips</h1>
      <p className="mt-2 text-[0.95rem] text-ink-muted">Your nights, in one place.</p>

      <div className="mt-8 space-y-8">
        {loaded && live.length === 0 ? (
          <EmptyState
            title="No plans yet. Let’s fix that."
            body="Your next night starts here."
            action={
              <Link href="/home">
                <Button>Discover nights</Button>
              </Link>
            }
          />
        ) : (
          live.map((item) => (
            <Link
              key={item.id}
              href={item.status === "confirmed" || item.status === "in_progress" ? `/pass/${item.id}` : `/requests/${item.id}`}
              className="block"
            >
              <StatusChip>{customerBookingStatus(item.status)}</StatusChip>
              <h2 className="font-display mt-2 text-3xl text-ink">
                {planTitle(item.event_name, item.occasion)}
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                {item.starts_at ? new Date(item.starts_at).toLocaleString() : "Date to be set"}
                {item.group_size ? ` · ${item.group_size} guests` : ""}
              </p>
            </Link>
          ))
        )}
      </div>
    </AppShell>
  );
}

function planTitle(eventName?: string, occasion?: string) {
  const raw = (eventName || occasion || "Miami tonight").replace(/_/g, " ").trim();
  return raw.toLowerCase() === "night out" ? "Miami tonight" : raw;
}
