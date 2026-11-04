"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { formatUsd } from "@/lib/format";
import { chatUnlocked, isRequestStatus } from "@/lib/marketplace/request-machine";
import { SERVICE_DISCLAIMER } from "@/lib/marketplace/services";
import { TEST_LABEL } from "@/lib/test-fixtures/constants";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type Payload = {
  request: Record<string, unknown>;
  quotes: Array<Record<string, unknown>>;
  booking: Record<string, unknown> | null;
  messages: Array<{ id: string; sender_id: string; body: string; created_at: string }>;
};

export function TestNightScreen({ id }: { id: string }) {
  const params = useSearchParams();
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripeBlocker, setStripeBlocker] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [incident, setIncident] = useState("");
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
    void fetch("/api/stripe/status")
      .then((response) => response.json())
      .then((payload: { configured?: boolean; blocker?: string; error?: string }) => {
        if (!payload.configured) {
          setStripeBlocker(payload.blocker ?? payload.error ?? "Stripe test keys are not configured.");
        }
      });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const request = data?.request;
  const quote = data?.quotes[0];
  const status = String(request?.status ?? "");
  const paidQuery = params.get("paid") === "1";

  async function checkout() {
    if (!quote) return;
    setBusy(true);
    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, quoteId: quote.id }),
    });
    const payload = (await response.json()) as { url?: string; error?: string; blocker?: string };
    setBusy(false);
    if (payload.url) {
      window.location.href = payload.url;
      return;
    }
    setError(payload.blocker ?? payload.error ?? "Checkout is blocked.");
  }

  async function act(path: string, body?: Record<string, unknown>) {
    setBusy(true);
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? "Action failed.");
      return;
    }
    load();
  }

  return (
    <AppShell showNav>
      <AppHeader title="TEST night" showBack backHref="/test/booking" />
      <p className="text-[10px] uppercase tracking-[0.16em] text-accent">
        {TEST_LABEL} · {status.replaceAll("_", " ") || "loading"}
      </p>
      <h1 className="mt-2 text-2xl text-ink">{String(request?.event_name ?? "Private TEST booking")}</h1>
      {error ? <p className="mt-3 text-sm text-ink-muted">{error}</p> : null}
      {paidQuery && status === "payment_pending" ? (
        <p className="mt-3 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink-muted">
          Returned from Checkout. Booking is paid only after a verified Stripe webhook. This screen does
          not claim payment succeeded.
        </p>
      ) : null}

      {quote ? (
        <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-lg text-ink">Review price</h2>
          <p className="mt-1 text-xs text-ink-subtle">Server-side quote. Client amounts are ignored.</p>
          <dl className="mt-3 space-y-1 text-sm">
            <Row label="Evening" value={formatUsd(Number(quote.subtotal_cents) / 100)} />
            <Row label="Service" value={formatUsd(Number(quote.service_fee_cents) / 100)} />
            <Row label="Total" value={`${formatUsd(Number(quote.total_cents) / 100)} USD`} />
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-ink-muted">{SERVICE_DISCLAIMER}</p>
          {status === "draft" || status === "accepted" || status === "payment_pending" ? (
            stripeBlocker ? (
              <p className="mt-4 rounded-xl border border-dashed border-border px-3 py-3 text-sm text-ink-muted">
                {stripeBlocker}
              </p>
            ) : (
              <Button className="mt-4" fullWidth loading={busy} onClick={() => void checkout()}>
                Pay with Stripe Checkout (test)
              </Button>
            )
          ) : null}
        </section>
      ) : null}

      {status === "paid" || status === "confirmed" || status === "in_progress" || status === "completed" ? (
        <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-lg text-ink">Booking confirmed</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Paid only because a signed webhook moved payment_pending → paid. Night pass:{" "}
            {String(data?.booking?.night_pass_code ?? "pending")}
          </p>
          <Link href={`/pass/${id}`} className="mt-4 block">
            <Button fullWidth variant="secondary">
              Open itinerary / night pass
            </Button>
          </Link>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg text-ink">My Night itinerary</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ink-muted">
          <li>Meet the TEST Wingman at the TEST venue window.</li>
          <li>Follow the concierge plan. Venues set their own door policy.</li>
          <li>Check in when you arrive. Check out when the night ends.</li>
        </ol>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg text-ink">Secure chat</h2>
        {isRequestStatus(status) && chatUnlocked(status) ? (
          <>
            <div className="mt-3 space-y-2">
              {(data?.messages ?? []).map((item) => (
                <p key={item.id} className="rounded-2xl bg-background px-3 py-2 text-sm text-ink">
                  {item.body}
                </p>
              ))}
            </div>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              className="mt-3 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink"
            />
            <Button
              className="mt-3"
              variant="secondary"
              fullWidth
              loading={busy}
              onClick={() => void act("/api/messages", { requestId: id, body: message }).then(() => setMessage(""))}
            >
              Send
            </Button>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-muted">Chat unlocks after a verified paid confirmation.</p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-lg text-ink">Check-in / check-out</h2>
        {status === "confirmed" ? (
          <Button className="mt-3" fullWidth loading={busy} onClick={() => void act(`/api/bookings/${id}/check-in`)}>
            Check in
          </Button>
        ) : null}
        {status === "in_progress" ? (
          <Button className="mt-3" fullWidth loading={busy} onClick={() => void act(`/api/bookings/${id}/check-out`)}>
            Check out and complete
          </Button>
        ) : null}
        {status === "completed" ? <p className="mt-2 text-sm text-ink-muted">Night completed.</p> : null}
      </section>

      {status === "completed" ? (
        <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-lg text-ink">Review</h2>
          <p className="mt-1 text-xs text-ink-subtle">Unpublished. Not shown as a public review.</p>
          <select
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
            className="mt-3 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} / 5
              </option>
            ))}
          </select>
          <textarea
            value={review}
            onChange={(event) => setReview(event.target.value)}
            rows={3}
            className="mt-3 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-ink"
          />
          <Button
            className="mt-3"
            fullWidth
            loading={busy}
            onClick={() => void act(`/api/bookings/${id}/review`, { rating, body: review })}
          >
            Submit review
          </Button>
        </section>
      ) : null}

      <section className="mt-6 rounded-2xl border border-dashed border-border px-4 py-4">
        <h2 className="text-lg text-ink">Support / cancel / incident</h2>
        <Button
          className="mt-3"
          variant="secondary"
          fullWidth
          onClick={() => void act("/api/support", { requestId: id, subject: "TEST booking help" })}
        >
          Open support case
        </Button>
        <Button
          className="mt-3"
          variant="ghost"
          fullWidth
          onClick={() => void act(`/api/bookings/${id}/cancel`, { notes: "TEST customer cancel" })}
        >
          Cancel (unpaid / operator for paid)
        </Button>
        <textarea
          value={incident}
          onChange={(event) => setIncident(event.target.value)}
          rows={2}
          placeholder="Incident details"
          className="mt-3 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink"
        />
        <Button
          className="mt-3"
          variant="secondary"
          fullWidth
          onClick={() =>
            void act("/api/incidents", { requestId: id, category: "safety", details: incident })
          }
        >
          Report incident
        </Button>
      </section>
    </AppShell>
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
