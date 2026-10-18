"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { QrCode } from "@/components/app/QrCode";
import { useEffect, useState } from "react";

export function NightPassScreen({ id }: { id: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [title, setTitle] = useState("Night pass");

  useEffect(() => {
    void fetch(`/api/requests/${id}`)
      .then((response) => response.json())
      .then((payload: { booking?: { night_pass_code?: string }; request?: { event_name?: string } }) => {
        setCode(payload.booking?.night_pass_code ?? null);
        if (payload.request?.event_name) setTitle(payload.request.event_name);
      });
  }, [id]);

  return (
    <AppShell>
      <AppHeader title="Night pass" showBack backHref={`/requests/${id}`} />
      <p className="text-label text-accent">Confirmed</p>
      <h1 className="mt-2 text-2xl text-ink">{title}</h1>
      {code ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface p-6 text-center">
          <QrCode value={code} />
          <p className="mt-4 font-mono text-lg tracking-[0.2em] text-ink">{code}</p>
          <p className="mt-2 text-xs text-ink-subtle">Show this to your Wingman. Not a venue ticket.</p>
        </div>
      ) : (
        <p className="mt-6 text-sm text-ink-muted">No confirmed night pass for this request.</p>
      )}
    </AppShell>
  );
}
