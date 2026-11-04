"use client";

import { BackupListingCard } from "@/components/booking/BackupListingCard";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import type { BackupListing } from "@/lib/marketplace/backup";
import { SPEND_BAND_LABELS, type SpendBand } from "@/lib/marketplace/constants";
import {
  BOOK_AGAIN_AVAILABILITY,
  YOUR_WINGMAN_DISPLAY_NAME,
} from "@/lib/marketplace/host-copy";
import { chatUnlocked, isRequestStatus } from "@/lib/marketplace/request-machine";
import { formatUsd } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { customerBookingStatus } from "@/lib/marketplace/status-copy";
import { NightServiceNightScreen } from "@/features/requests/components/NightServiceNightScreen";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Payload = {
  request: Record<string, unknown>;
  quotes: Array<Record<string, unknown>>;
  booking: Record<string, unknown> | null;
  messages: Array<{ id: string; sender_id: string; body: string; created_at: string }>;
  nightService?: boolean;
  backup?: BackupListing | null;
  host?: { displayName?: string; hostName?: string; governmentIdVerified?: boolean };
};

export function RequestDetailScreen({
  id,
  justPaid = false,
  cancelled = false,
}: {
  id: string;
  justPaid?: boolean;
  cancelled?: boolean;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    void fetch(`/api/requests/${id}`)
      .then((response) => response.json())
      .then((payload: Payload & { error?: string }) => {
        if (payload.error) {
          setError(payload.error);
          return;
        }
        setData(payload);
      });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!justPaid) return;
    const timer = window.setInterval(() => load(), 4000);
    return () => window.clearInterval(timer);
  }, [justPaid, load]);

  const request = data?.request;
  const quote = data?.quotes[0];
  const status = String(request?.status ?? "");
  const nightService = Boolean(data?.nightService) || String(request?.source ?? "") === "night_service";
  const hostLabel = data?.host?.displayName ?? YOUR_WINGMAN_DISPLAY_NAME;

  async function accept() {
    if (!quote) return;
    setBusy(true);
    const response = await fetch(`/api/quotes/${quote.id}/accept`, { method: "POST" });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not accept.");
      return;
    }
    load();
  }

  async function pay() {
    if (!quote) return;
    setBusy(true);
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, quoteId: quote.id }),
    });
    const payload = (await response.json()) as { url?: string; error?: string };
    setBusy(false);
    if (payload.url) {
      window.location.href = payload.url;
      return;
    }
    setError(payload.error ?? "Payment is not available.");
  }

  async function sendMessage() {
    setBusy(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, body: message }),
    });
    setMessage("");
    setBusy(false);
    load();
  }

  async function openSupport() {
    await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, subject: "Help with evening request" }),
    });
    router.push("/messages");
  }

  const nightTitle = String(request?.event_name || request?.occasion || "Your evening")
    .replace(/_/g, " ")
    .replace(/^night out$/i, "Miami tonight");

  if (request && nightService) {
    return (
      <NightServiceNightScreen
        id={id}
        title={nightTitle}
        status={status}
        justPaid={justPaid}
        cancelled={cancelled}
        hostLabel={hostLabel}
        totalCents={quote ? Number(quote.total_cents) : 50000}
        canPay={Boolean(quote) && (status === "draft" || status === "accepted" || status === "payment_pending") && !justPaid}
        canChat={isRequestStatus(status) && chatUnlocked(status)}
        hasPass={Boolean(data?.booking)}
        messages={(data?.messages ?? []).map((item) => ({
          id: item.id,
          sender_id: item.sender_id,
          body: item.body,
          mine: item.sender_id === user?.id,
        }))}
        message={message}
        busy={busy}
        error={error}
        onMessageChange={setMessage}
        onSend={() => void sendMessage()}
        onPay={() => void pay()}
      />
    );
  }

  return (
    <AppShell showNav>
      <AppHeader title="Your night" showBack backHref="/bookings" />
      {error ? <p className="text-sm text-ink-muted">{error}</p> : null}
      {request ? (
        <>
          <p className="text-label text-champagne">
            {justPaid && status !== "paid" && status !== "confirmed"
              ? "Paid"
              : customerBookingStatus(status)}
          </p>
          <h1 className="font-display mt-2 text-4xl text-ink">
            {String(request.event_name || request.occasion || "Your evening").replace(/_/g, " ")}
          </h1>
          {justPaid ? (
            <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-ink-muted">
              You’re booked. Andres has the night.
            </p>
          ) : null}
          {!nightService ? (
          <dl className="mt-5 space-y-2 text-sm">
            <Row label="Occasion" value={String(request.occasion)} />
            <Row label="Atmosphere" value={String(request.atmosphere)} />
            <Row label="Area" value={String(request.area)} />
            <Row label="Guests" value={String(request.group_size)} />
            <Row
              label="Spend band"
              value={SPEND_BAND_LABELS[request.spend_band as SpendBand] ?? String(request.spend_band)}
            />
            <Row
              label="Services"
              value={
                Array.isArray(request.requested_services) && request.requested_services.length > 0
                  ? (request.requested_services as string[]).join(", ")
                  : "None selected"
              }
            />
          </dl>
          ) : null}
          {nightService ? (
            <section className="mt-4 rounded-2xl border border-border bg-surface p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-accent">Assigned host</p>
              <h2 className="mt-1 text-lg text-ink">{hostLabel}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Andres P. Not government-ID verified. No photo. No reviews.
              </p>
              <p className="mt-3 font-display text-2xl text-ink">
                {quote ? formatUsd(Number(quote.total_cents) / 100) : "$500"}
              </p>
              <p className="text-xs text-ink-subtle">$500 night service. Secure checkout.</p>
            </section>
          ) : (
            <p className="mt-4 text-sm text-ink-muted">
              Payment is locked until you accept a complete quote. An operator will route this when a
              verified Wingman is available.
            </p>
          )}

          {nightService ? (
            <div className="mt-6">
              <BackupListingCard listing={data?.backup ?? null} />
            </div>
          ) : null}

          {!nightService &&
          (user?.role === "partner" || user?.role === "admin" || user?.role === "owner") &&
          (status === "routed" || status === "awaiting_customer") ? (
            <QuoteComposer requestId={id} onDone={load} />
          ) : null}

          {nightService && quote && (status === "draft" || status === "accepted" || status === "payment_pending") ? (
            <Button className="mt-6" fullWidth loading={busy} onClick={() => void pay()}>
              Pay $500
            </Button>
          ) : null}

          {nightService ? (
            <Link href={`/book?repeat=${id}&source=again`} className="mt-3 block">
              <Button variant="secondary" fullWidth>
                Book again · $500
              </Button>
            </Link>
          ) : null}
          {nightService ? (
            <p className="mt-2 text-xs text-ink-subtle">{BOOK_AGAIN_AVAILABILITY}</p>
          ) : null}

          {!nightService && quote ? (
            <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
              <h2 className="text-lg text-ink">Quote</h2>
              <p className="mt-2 text-sm text-ink-muted">{String(quote.terms)}</p>
              <dl className="mt-3 space-y-1 text-sm">
                <Row label="Evening" value={formatUsd(Number(quote.subtotal_cents) / 100)} />
                <Row label="Service" value={formatUsd(Number(quote.service_fee_cents) / 100)} />
                <Row label="Taxes / fees" value={formatUsd(Number(quote.taxes_cents) / 100)} />
                <Row label="Customer fee" value={formatUsd(Number(quote.customer_fee_cents) / 100)} />
                <Row label="Total" value={`${formatUsd(Number(quote.total_cents) / 100)} USD`} />
              </dl>
              {status === "awaiting_customer" ? (
                <Button className="mt-4" fullWidth loading={busy} onClick={() => void accept()}>
                  Accept quote
                </Button>
              ) : null}
              {status === "accepted" || status === "payment_pending" ? (
                <Button className="mt-4" fullWidth loading={busy} onClick={() => void pay()}>
                  Pay with Stripe (test)
                </Button>
              ) : null}
            </section>
          ) : null}
          {!nightService && !quote ? (
            <p className="mt-6 text-sm text-ink-subtle">No quote yet.</p>
          ) : null}

          {data?.booking ? (
            <Link href={`/pass/${id}`} className="mt-6 block">
              <Button fullWidth>Open night pass</Button>
            </Link>
          ) : null}

          <section className="mt-6 rounded-2xl border border-dashed border-border px-4 py-5">
            <h2 className="text-lg text-ink">Check in and review</h2>
            {status === "confirmed" ? (
              <Button
                className="mt-3"
                fullWidth
                loading={busy}
                onClick={() =>
                  void fetch(`/api/bookings/${id}/check-in`, { method: "POST" }).then(() => load())
                }
              >
                Check in
              </Button>
            ) : null}
            {status === "in_progress" ? (
              <Button
                className="mt-3"
                fullWidth
                loading={busy}
                onClick={() =>
                  void fetch(`/api/bookings/${id}/check-out`, { method: "POST" }).then(() => load())
                }
              >
                Check out and complete
              </Button>
            ) : null}
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Check-in / check-out and reviews unlock after a paid, confirmed booking. Reviews stay
              unpublished until a real night happens. There are no sample reviews.
            </p>
            <p className="mt-3 text-xs text-ink-subtle">
              Rideshare is independent: Uber or Lyft. Not a Wingman partnership. Insurance for
              in-person services is an owner blocker and is not claimed here.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-lg text-ink">Private chat</h2>
            {isRequestStatus(status) && chatUnlocked(status) ? (
              <>
                <div className="mt-3 space-y-2">
                  {(data?.messages ?? []).map((item) => (
                    <p
                      key={item.id}
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        item.sender_id === user?.id ? "bg-cobalt text-ink" : "bg-surface text-ink-muted"
                      }`}
                    >
                      {item.body}
                    </p>
                  ))}
                </div>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={3}
                  className="mt-3 w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink"
                />
                <Button className="mt-3" variant="secondary" fullWidth loading={busy} onClick={() => void sendMessage()}>
                  Send
                </Button>
                <Button className="mt-3" variant="ghost" fullWidth onClick={() => void openSupport()}>
                  Open live support case
                </Button>
              </>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">
                Private chat and live support open after a paid confirmation. Operators can still
                leave internal notes from the desk.
              </p>
            )}
          </section>
        </>
      ) : null}
    </AppShell>
  );
}

function QuoteComposer({ requestId, onDone }: { requestId: string; onDone: () => void }) {
  const [subtotal, setSubtotal] = useState("500");
  const [fee, setFee] = useState("0");
  const [terms, setTerms] = useState("Arrival, dress, cancellation, and venue rules.");
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const response = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId,
        subtotalCents: Math.round(Number(subtotal) * 100),
        serviceFeeCents: Math.round(Number(fee) * 100),
        terms,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Could not send quote.");
      return;
    }
    onDone();
  }

  return (
    <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-lg text-ink">Issue quote</h2>
      <label className="mt-3 block text-xs text-ink-subtle">
        Subtotal USD
        <input
          value={subtotal}
          onChange={(event) => setSubtotal(event.target.value)}
          className="mt-1 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-ink"
        />
      </label>
      <label className="mt-3 block text-xs text-ink-subtle">
        Service fee USD
        <input
          value={fee}
          onChange={(event) => setFee(event.target.value)}
          className="mt-1 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm text-ink"
        />
      </label>
      <textarea
        value={terms}
        onChange={(event) => setTerms(event.target.value)}
        rows={3}
        className="mt-3 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-ink"
      />
      {error ? <p className="mt-2 text-xs text-ink-muted">{error}</p> : null}
      <Button className="mt-3" variant="secondary" fullWidth onClick={() => void submit()}>
        Send quote
      </Button>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
