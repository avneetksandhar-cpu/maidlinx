"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import {
  CODE_OF_CONDUCT_ACK,
  EMERGENCY_CONTACT_HELP,
  NO_GUARANTEES_ACK,
  SERVICE_SCOPE_ACK,
  TEST_LABEL,
} from "@/lib/test-fixtures/constants";
import { SERVICE_DISCLAIMER } from "@/lib/marketplace/services";
import { formatUsd } from "@/lib/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Fixtures = {
  enabled: boolean;
  eventId: string | null;
  eventName: string | null;
  offerId: string | null;
  wingmanId: string | null;
  wingmanName: string;
  label: string;
  stripeConfigured: boolean;
  stripeBlocker: string | null;
  error?: string;
};

const STEPS = ["Event", "Find a Wingman", "View service", "Request"] as const;

export function TestBookingStart() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [fixtures, setFixtures] = useState<Fixtures | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serviceScopeAck, setServiceScopeAck] = useState(false);
  const [codeOfConductAck, setCodeOfConductAck] = useState(false);
  const [noGuaranteesAck, setNoGuaranteesAck] = useState(false);
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void fetch("/api/test/fixtures")
      .then(async (response) => {
        const payload = (await response.json()) as Fixtures;
        if (!response.ok) {
          setError(payload.error ?? "Private TEST booking is not available.");
          return;
        }
        setFixtures(payload);
      })
      .catch(() => setError("Could not load TEST fixtures."));
  }, []);

  async function submit() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/test/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceScopeAck,
        codeOfConductAck,
        noGuaranteesAck,
        emergencyContactName: emergencyName,
        emergencyContactPhone: emergencyPhone,
      }),
    });
    const payload = (await response.json()) as { requestId?: string; error?: string };
    setBusy(false);
    if (!response.ok || !payload.requestId) {
      setError(payload.error ?? "Could not create TEST request.");
      return;
    }
    router.push(`/test/booking/${payload.requestId}`);
  }

  return (
    <AppShell showNav>
      <AppHeader title="TEST booking" showBack backHref="/operator" />
      <p className="text-[10px] uppercase tracking-[0.16em] text-accent">{TEST_LABEL} · private · not public</p>
      <h1 className="mt-2 text-2xl text-ink">{STEPS[step]}</h1>
      <p className="mt-2 text-xs text-ink-subtle">{STEPS.join(" → ")}</p>
      {error ? <p className="mt-3 text-sm text-ink-muted">{error}</p> : null}

      {fixtures && step === 0 ? (
        <section className="mt-6 rounded-2xl border border-dashed border-accent/40 bg-surface p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-accent">{TEST_LABEL} event</p>
          <h2 className="mt-2 text-xl text-ink">{fixtures.eventName ?? "TEST event not seeded"}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Hidden from /events. Discovery listings stay unchanged. This is not a public book button.
          </p>
          <Button className="mt-5" fullWidth disabled={!fixtures.eventId} onClick={() => setStep(1)}>
            Find a Wingman
          </Button>
        </section>
      ) : null}

      {fixtures && step === 1 ? (
        <section className="mt-6 rounded-2xl border border-dashed border-accent/40 bg-surface p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-accent">{TEST_LABEL} Wingman</p>
          <h2 className="mt-2 text-xl text-ink">{fixtures.wingmanName}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Not listed on /wingmen. Public verified count stays 0 unless a real person is verified.
          </p>
          <Button className="mt-5" fullWidth disabled={!fixtures.wingmanId} onClick={() => setStep(2)}>
            View service
          </Button>
        </section>
      ) : null}

      {fixtures && step === 2 ? (
        <section className="mt-6 rounded-2xl border border-dashed border-accent/40 bg-surface p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-accent">{TEST_LABEL} service offer</p>
          <h2 className="mt-2 text-xl text-ink">TEST concierge evening</h2>
          <p className="mt-2 text-sm text-ink">{formatUsd(500)} USD total (server-priced)</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{SERVICE_DISCLAIMER}</p>
          <Button className="mt-5" fullWidth disabled={!fixtures.offerId} onClick={() => setStep(3)}>
            Request
          </Button>
        </section>
      ) : null}

      {fixtures && step === 3 ? (
        <section className="mt-6 space-y-3">
          <label className="flex gap-3 text-sm text-ink">
            <input type="checkbox" checked={serviceScopeAck} onChange={(e) => setServiceScopeAck(e.target.checked)} />
            <span>{SERVICE_SCOPE_ACK}</span>
          </label>
          <label className="flex gap-3 text-sm text-ink">
            <input type="checkbox" checked={codeOfConductAck} onChange={(e) => setCodeOfConductAck(e.target.checked)} />
            <span>{CODE_OF_CONDUCT_ACK}</span>
          </label>
          <label className="flex gap-3 text-sm text-ink">
            <input type="checkbox" checked={noGuaranteesAck} onChange={(e) => setNoGuaranteesAck(e.target.checked)} />
            <span>{NO_GUARANTEES_ACK}</span>
          </label>
          <p className="text-xs text-ink-subtle">{EMERGENCY_CONTACT_HELP}</p>
          <input
            value={emergencyName}
            onChange={(e) => setEmergencyName(e.target.value)}
            placeholder="Emergency contact name"
            className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-ink"
          />
          <input
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(e.target.value)}
            placeholder="Emergency contact phone"
            className="h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-ink"
          />
          <Button fullWidth loading={busy} onClick={() => void submit()}>
            Review price
          </Button>
        </section>
      ) : null}

      {fixtures?.stripeBlocker ? (
        <p className="mt-6 rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink-muted">
          {fixtures.stripeBlocker}
        </p>
      ) : null}

      <p className="mt-8 text-xs leading-relaxed text-ink-subtle">
        Sign in as the TEST customer or an operator. Public /events and /wingmen do not show this path.{" "}
        <Link href="/auth" className="text-accent underline">
          Sign in
        </Link>
      </p>
    </AppShell>
  );
}
