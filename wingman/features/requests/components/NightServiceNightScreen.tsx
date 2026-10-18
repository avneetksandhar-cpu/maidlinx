"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { YOUR_WINGMAN_DISPLAY_NAME } from "@/lib/marketplace/host-copy";
import { customerBookingStatus } from "@/lib/marketplace/status-copy";
import { formatUsd } from "@/lib/format";
import Link from "next/link";

export function NightServiceNightScreen({
  id,
  title,
  status,
  justPaid,
  cancelled,
  hostLabel,
  totalCents,
  canPay,
  canChat,
  hasPass,
  messages,
  message,
  busy,
  error,
  onMessageChange,
  onSend,
  onPay,
}: {
  id: string;
  title: string;
  status: string;
  justPaid: boolean;
  cancelled: boolean;
  hostLabel: string;
  totalCents: number;
  canPay: boolean;
  canChat: boolean;
  hasPass: boolean;
  messages: Array<{ id: string; sender_id: string; body: string; mine: boolean }>;
  message: string;
  busy: boolean;
  error: string | null;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onPay: () => void;
}) {
  const booked = justPaid || status === "paid" || status === "confirmed" || status === "in_progress" || status === "completed";
  const heading = cancelled ? "Finish paying." : booked ? "You’re booked." : "Your night";
  const statusLabel = cancelled
    ? "Payment not finished"
    : justPaid && status !== "paid" && status !== "confirmed"
      ? "Paid"
      : customerBookingStatus(status);

  return (
    <AppShell showNav>
      <AppHeader title="Your night" showBack backHref="/bookings" />
      <p className="text-label text-champagne">{statusLabel}</p>
      <h1 className="font-display mt-2 text-5xl text-ink">{heading}</h1>
      <p className="mt-4 max-w-sm text-[1.05rem] leading-relaxed text-ink-muted">
        {cancelled
          ? "Card was not charged. Pay $500 to hand the night to Andres."
          : booked
            ? "Andres has tonight. He’ll write you here once payment clears."
            : "Pay $500 and Andres takes the night."}
      </p>

      <section className="mt-10">
        <p className="text-label">Tonight</p>
        <h2 className="font-display mt-2 text-3xl text-ink">{title}</h2>
        <p className="mt-6 text-label">Wingman</p>
        <p className="font-display mt-2 text-3xl text-ink">Andres</p>
        <p className="mt-1 text-[0.9rem] text-ink-subtle">{hostLabel} · Miami</p>
        <p className="font-display mt-8 text-4xl text-ink">{formatUsd(totalCents / 100)}</p>
      </section>

      {error ? <p className="mt-6 text-sm text-ink-muted">{error}</p> : null}

      {canPay ? (
        <Button className="mt-10" fullWidth size="lg" loading={busy} onClick={onPay}>
          Pay $500
        </Button>
      ) : null}

      {hasPass ? (
        <Link href={`/pass/${id}`} className="mt-6 block">
          <Button fullWidth size="lg">
            Open night pass
          </Button>
        </Link>
      ) : null}

      <section className="mt-12">
        <p className="text-label">What happens next</p>
        <ol className="mt-4 space-y-3 text-[0.95rem] text-ink">
          <li>1. Andres confirms the night.</li>
          <li>2. He messages you here.</li>
          <li>3. You meet. He handles the rooms.</li>
        </ol>
      </section>

      <section className="mt-12">
        <p className="text-label">Andres</p>
        {canChat ? (
          <>
            <div className="mt-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-[0.95rem] text-ink-muted">Write him whenever you’re ready.</p>
              ) : (
                messages.map((item) => (
                  <p key={item.id} className={item.mine ? "text-ink" : "text-ink-muted"}>
                    {item.body}
                  </p>
                ))
              )}
            </div>
            <textarea
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              rows={3}
              className="field mt-4"
              placeholder="Time, neighborhood, who you’re with"
            />
            <Button className="mt-3" variant="secondary" fullWidth loading={busy} onClick={onSend}>
              Send
            </Button>
          </>
        ) : (
          <p className="mt-3 text-[0.95rem] text-ink-muted">
            Messages open after payment clears. Usually a moment.
          </p>
        )}
      </section>
    </AppShell>
  );
}
