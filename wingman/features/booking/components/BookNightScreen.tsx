"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { YOUR_WINGMAN_DISPLAY_NAME } from "@/lib/marketplace/host-copy";
import { MIN_BOOKING_CENTS } from "@/lib/marketplace/constants";
import { formatUsd } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NIGHT_SERVICE_TOTAL_CENTS = MIN_BOOKING_CENTS;

export function BookNightScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const eventId = params.get("eventId") ?? params.get("eventExternalId") ?? "";
  const eventName = params.get("name") ?? "";
  const repeatRequestId = params.get("repeat") ?? "";
  const autoPay = params.get("go") === "1";
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  const nextPath = `/book${typeof window !== "undefined" ? window.location.search : ""}`;
  const nightLabel = eventName.trim();
  const price = formatUsd(NIGHT_SERVICE_TOTAL_CENTS / 100);

  async function confirm() {
    if (!user) {
      router.push(`/auth?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    setBusy(true);
    setError(null);
    const created = await fetch("/api/bookings/night", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scopeConductAck: true,
        eventId: eventId || undefined,
        eventExternalId: eventId || undefined,
        occasion: nightLabel || "Night out",
        repeatRequestId: repeatRequestId || undefined,
        specialRequests: nightLabel
          ? `Night context: ${nightLabel}. This is Wingman night service, not a venue table.`
          : undefined,
      }),
    });
    const booking = (await created.json()) as {
      requestId?: string;
      quoteId?: string;
      error?: string;
    };
    if (!created.ok || !booking.requestId || !booking.quoteId) {
      setBusy(false);
      setError(booking.error ?? "Could not start the booking.");
      return;
    }
    const checkout = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: booking.requestId, quoteId: booking.quoteId }),
    });
    const pay = (await checkout.json()) as { url?: string; error?: string; blocker?: string };
    setBusy(false);
    if (pay.url) {
      window.location.href = pay.url;
      return;
    }
    setError(pay.blocker ?? pay.error ?? "Payment is not available right now. Try again.");
    router.push(`/requests/${booking.requestId}`);
  }

  useEffect(() => {
    if (!autoPay || authLoading || !user || started.current) return;
    started.current = true;
    void confirm();
    // confirm reads latest user/event context on first logged-in paint
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPay, authLoading, user]);

  return (
    <AppShell showNav>
      <AppHeader title="Book" showBack backHref={eventId ? `/events/${eventId}` : "/home"} />
      <h1 className="font-display text-5xl text-ink">Book and pay.</h1>
      <p className="mt-3 max-w-sm text-[1.05rem] leading-relaxed text-ink-muted">
        Andres takes tonight. You pay {price} and we handle the rest.
      </p>

      <section className="mt-10">
        <p className="text-label">Your Wingman</p>
        <p className="font-display mt-2 text-3xl text-ink">Andres</p>
        <p className="mt-1 text-[0.9rem] text-ink-subtle">{YOUR_WINGMAN_DISPLAY_NAME} · Miami</p>
        {nightLabel ? (
          <p className="mt-6 text-[0.95rem] text-ink">
            Tonight’s context: {nightLabel}
          </p>
        ) : (
          <p className="mt-6 text-[0.95rem] text-ink-muted">Miami, tonight.</p>
        )}
        <p className="font-display mt-8 text-5xl text-ink">{price}</p>
        <p className="mt-2 text-[0.85rem] text-ink-subtle">
          Starts the night with Andres. Not a table, guest list, or door ticket.
        </p>
      </section>

      {error ? <p className="mt-6 text-sm text-ink-muted">{error}</p> : null}

      <div className="sticky bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-20 mt-10 bg-background pt-3">
        {!authLoading && !user ? (
          <Link href={`/auth?next=${encodeURIComponent(nextPath)}`} className="block">
            <Button fullWidth size="lg">
              Sign in and pay {price}
            </Button>
          </Link>
        ) : (
          <Button fullWidth size="lg" loading={busy} onClick={() => void confirm()}>
            {busy ? "Opening checkout" : `Pay ${price}`}
          </Button>
        )}
        <Link href="/plan" className="mt-4 block text-center text-[0.9rem] text-ink-subtle">
          Or plan the night first
        </Link>
      </div>
    </AppShell>
  );
}
