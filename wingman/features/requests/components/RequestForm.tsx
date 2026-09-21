"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { SPEND_BAND_LABELS, SPEND_BANDS, type SpendBand } from "@/lib/marketplace/constants";
import {
  CONCIERGE_SERVICES,
  SERVICE_DISCLAIMER,
  containsForbiddenServiceRequest,
  type ConciergeServiceId,
} from "@/lib/marketplace/services";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function RequestForm() {
  const router = useRouter();
  const params = useSearchParams();
  const source = (params.get("source") as "event" | "wingman" | "plan_my_night") ?? "plan_my_night";
  const eventId = params.get("eventId");
  const [occasion, setOccasion] = useState("night_out");
  const [atmosphere, setAtmosphere] = useState("");
  const [area, setArea] = useState("Miami Beach");
  const [startsAt, setStartsAt] = useState("");
  const [groupSize, setGroupSize] = useState(2);
  const [spendBand, setSpendBand] = useState<SpendBand>("band_500_1500");
  const [specialRequests, setSpecialRequests] = useState("");
  const [services, setServices] = useState<ConciergeServiceId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    if (containsForbiddenServiceRequest(specialRequests)) {
      setLoading(false);
      setError(SERVICE_DISCLAIMER);
      return;
    }
    const response = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source,
        eventId,
        occasion,
        atmosphere,
        area,
        startsAt: startsAt ? new Date(startsAt).toISOString() : "",
        groupSize,
        spendBand,
        specialRequests,
        requestedServices: services,
      }),
    });
    const payload = (await response.json()) as { id?: string; error?: string };
    setLoading(false);
    if (!response.ok || !payload.id) {
      setError(payload.error ?? "Could not submit request.");
      return;
    }
    router.push(`/requests/${payload.id}`);
  }

  return (
    <AppShell showNav>
      <AppHeader title="Request" showBack backHref="/home" />
      <p className="text-label text-accent">No payment yet</p>
      <h1 className="mt-2 text-2xl text-ink">Tell Wingman the night</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Sending this is not a reservation. Payment opens only after you accept a complete quote.
        Minimum total booking value is $500 USD — not a deposit. {SERVICE_DISCLAIMER}
      </p>

      <div className="mt-6 space-y-4">
        <Field label="Occasion">
          <select
            value={occasion}
            onChange={(event) => setOccasion(event.target.value)}
            className="mt-1.5 h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-ink focus:border-accent/50 focus:outline-none"
          >
            <option value="night_out">Night out</option>
            <option value="celebration">Celebration</option>
            <option value="visiting">Visiting Miami</option>
            <option value="dinner">Dinner first</option>
            <option value="quiet">Quieter evening</option>
          </select>
        </Field>
        <Field label="Preferred atmosphere">
          <input
            value={atmosphere}
            onChange={(event) => setAtmosphere(event.target.value)}
            placeholder="House, hip-hop, low-key, bottle service…"
            className="mt-1.5 h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-ink focus:border-accent/50 focus:outline-none"
          />
        </Field>
        <Field label="Area">
          <input value={area} onChange={(event) => setArea(event.target.value)} className="field" />
        </Field>
        <Field label="Date and time">
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            className="mt-1.5 h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-ink focus:border-accent/50 focus:outline-none"
          />
        </Field>
        <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3">
          <p className="text-sm font-medium text-ink">Group size</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGroupSize((value) => Math.max(1, value - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-ink"
            >
              −
            </button>
            <span className="w-6 text-center text-lg text-ink">{groupSize}</span>
            <button
              type="button"
              onClick={() => setGroupSize((value) => Math.min(20, value + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-cobalt text-ink"
            >
              +
            </button>
          </div>
        </div>
        <Field label="Spending comfort">
          <select
            value={spendBand}
            onChange={(event) => setSpendBand(event.target.value as SpendBand)}
            className="mt-1.5 h-12 w-full rounded-2xl border border-border bg-surface px-4 text-sm text-ink focus:border-accent/50 focus:outline-none"
          >
            {SPEND_BANDS.map((band) => (
              <option key={band} value={band}>
                {SPEND_BAND_LABELS[band]}
              </option>
            ))}
          </select>
        </Field>
        <fieldset className="rounded-2xl border border-border bg-surface px-4 py-3">
          <legend className="text-xs uppercase tracking-[0.14em] text-ink-subtle">Services</legend>
          <p className="mt-1 text-xs text-ink-muted">{SERVICE_DISCLAIMER}</p>
          <div className="mt-3 space-y-2">
            {CONCIERGE_SERVICES.map((service) => (
              <label key={service.id} className="flex gap-3 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={services.includes(service.id)}
                  onChange={() =>
                    setServices((current) =>
                      current.includes(service.id)
                        ? current.filter((id) => id !== service.id)
                        : [...current, service.id],
                    )
                  }
                />
                <span>
                  <span className="font-medium">{service.label}</span>
                  <span className="mt-0.5 block text-xs text-ink-muted">{service.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Special requests">
          <textarea
            value={specialRequests}
            onChange={(event) => setSpecialRequests(event.target.value)}
            rows={4}
            className="mt-1.5 w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink focus:border-accent/50 focus:outline-none"
            placeholder="Guest list, VIP table, bottle service, allergies, celebration…"
          />
        </Field>
        {error ? <p className="text-sm text-ink-muted">{error}</p> : null}
        <Button fullWidth size="lg" loading={loading} onClick={() => void submit()}>
          Submit request without payment
        </Button>
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.14em] text-ink-subtle">{label}</span>
      {children}
    </label>
  );
}
