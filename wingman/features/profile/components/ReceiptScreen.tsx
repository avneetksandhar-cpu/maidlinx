"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatUsd } from "@/lib/format";
import type { ReceiptPayload } from "@/features/profile/types";
import Link from "next/link";
import { useEffect, useState } from "react";

function money(cents: number | null | undefined) {
  if (cents == null) return "—";
  return formatUsd(cents / 100);
}

function when(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ReceiptScreen({ id }: { id: string }) {
  const [data, setData] = useState<ReceiptPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`/api/account/receipts/${id}`)
      .then((response) => response.json())
      .then((payload: ReceiptPayload) => {
        if (payload.error) {
          setError(payload.error);
          return;
        }
        setData(payload);
      })
      .catch(() => setError("Could not load this receipt."));
  }, [id]);

  return (
    <AppShell showNav noPadding>
      <div className="px-5 pb-10">
        <AppHeader title="Receipt" showBack backHref="/profile" />
        {error ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border px-5 py-10 text-center">
            <p className="text-sm text-ink-muted">{error}</p>
            <Link href="/profile" className="mt-5 block">
              <Button fullWidth variant="outline">
                Back to account
              </Button>
            </Link>
          </div>
        ) : null}
        {data ? (
          <Card className="receipt-print mt-2" variant="elevated">
            {data.testLabel ? (
              <p className="text-[10px] uppercase tracking-[0.16em] text-amber-300">{data.testLabel}</p>
            ) : null}
            <p className="text-label text-accent">Wingman night service</p>
            <h1 className="mt-2 font-display text-2xl text-ink">{data.title}</h1>
            <p className="mt-6 font-display text-4xl text-ink">{money(data.amountCents)}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-accent">Paid</p>
            <dl className="mt-6 space-y-3 text-sm">
              <Row label="Date" value={when(data.paidAt ?? data.createdAt)} />
              <Row label="Night" value={when(data.startsAt)} />
              <Row label="Account" value={data.customer.email} />
              {data.last4 ? (
                <Row
                  label="Card"
                  value={`${data.brand ? `${data.brand} ` : ""}····${data.last4}`}
                />
              ) : (
                <Row label="Card" value="Not returned by Stripe" />
              )}
            </dl>
            <div className="mt-6 flex flex-col gap-3 print:hidden">
              <Button fullWidth onClick={() => window.print()}>
                Download / print
              </Button>
              {data.receiptUrl ? (
                <a href={data.receiptUrl} target="_blank" rel="noreferrer">
                  <Button fullWidth variant="outline">
                    Stripe receipt
                  </Button>
                </a>
              ) : (
                <p className="text-center text-xs text-ink-subtle">
                  No Stripe receipt URL on this charge.
                </p>
              )}
            </div>
          </Card>
        ) : !error ? (
          <p className="mt-6 text-sm text-ink-muted">Loading receipt…</p>
        ) : null}
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
      <dt className="text-ink-subtle">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
