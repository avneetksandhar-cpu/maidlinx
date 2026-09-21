"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { AppShell } from "@/components/layout/AppShell";
import { AtmospherePhoto } from "@/components/media/AtmospherePhoto";
import { Button } from "@/components/ui/Button";
import { YOUR_WINGMAN_DISPLAY_NAME } from "@/lib/marketplace/host-copy";
import { atmosphereForPlanOption, PLAN_HEADER_PHOTO } from "@/lib/photos/atmosphere";
import { SPEND_BAND_LABELS, SPEND_BANDS, type SpendBand } from "@/lib/marketplace/constants";
import type { NightPlan } from "@/lib/plan/itinerary";
import Link from "next/link";
import { useState } from "react";

const KINDS = [
  { id: "dinner_club", label: "Dinner + club" },
  { id: "club_only", label: "Club only" },
  { id: "bachelor", label: "Bachelor trip" },
  { id: "date_night", label: "Date night" },
  { id: "vip_table", label: "VIP table" },
  { id: "rooftop", label: "Rooftop" },
  { id: "lounge", label: "Lounge" },
  { id: "dayclub", label: "Dayclub" },
  { id: "after_hours", label: "After hours" },
  { id: "surprise", label: "Surprise me" },
] as const;

export function PlanMyNightScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [kind, setKind] = useState<string>("dinner_club");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [spendBand, setSpendBand] = useState<SpendBand>("band_500_1500");
  const [music, setMusic] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [groupSize, setGroupSize] = useState(2);
  const [wantWingman, setWantWingman] = useState(true);
  const [plan, setPlan] = useState<NightPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, spendBand, music: `${music} ${neighborhood}`.trim(), groupSize, kind }),
    });
    const payload = (await response.json()) as { plan?: NightPlan; error?: string };
    setLoading(false);
    if (!response.ok || !payload.plan) {
      setError(payload.error ?? "Could not build a night.");
      return;
    }
    setPlan(payload.plan);
  }

  const primary = plan?.options[0];

  return (
    <AppShell showNav>
      <AppHeader title="Plan my night" showBack backHref="/home" />
      <AtmospherePhoto photo={PLAN_HEADER_PHOTO} className="mb-8 h-48 w-full" priority />
      <h1 className="font-display text-4xl text-ink">What kind of night are you looking for?</h1>
      <p className="mt-3 max-w-sm text-[0.95rem] leading-relaxed text-ink-muted">
        Someone local has you covered. Or skip this and just book.
      </p>
      <Link href="/book?source=plan" className="mt-5 inline-block text-champagne">
        Book and pay $500
      </Link>

      {step === 1 ? (
        <div className="mt-8 grid grid-cols-2 gap-3">
          {KINDS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setKind(item.id);
                setStep(2);
              }}
              className={`min-h-16 px-4 py-4 text-left text-[0.95rem] ${
                kind === item.id ? "bg-ivory text-navy" : "bg-surface-elevated text-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          <p className="text-champagne">{KINDS.find((item) => item.id === kind)?.label}</p>
          <label className="block">
            <span className="text-label">Date</span>
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="field mt-2" />
          </label>
          <label className="block">
            <span className="text-label">Party size</span>
            <div className="mt-2 flex items-center gap-4">
              <button type="button" onClick={() => setGroupSize((value) => Math.max(1, value - 1))} className="h-10 w-10 border border-border text-ink">
                −
              </button>
              <span className="w-8 text-center text-lg">{groupSize}</span>
              <button type="button" onClick={() => setGroupSize((value) => Math.min(20, value + 1))} className="h-10 w-10 border border-border text-ink">
                +
              </button>
            </div>
          </label>
          <label className="block">
            <span className="text-label">Neighborhoods</span>
            <input
              value={neighborhood}
              onChange={(event) => setNeighborhood(event.target.value)}
              placeholder="Brickell, South Beach, Wynwood"
              className="field mt-2"
            />
          </label>
          <label className="block">
            <span className="text-label">Music</span>
            <input
              value={music}
              onChange={(event) => setMusic(event.target.value)}
              placeholder="House, hip hop, low-key"
              className="field mt-2"
            />
          </label>
          <label className="block">
            <span className="text-label">Budget</span>
            <select
              value={spendBand}
              onChange={(event) => setSpendBand(event.target.value as SpendBand)}
              className="field mt-2"
            >
              {SPEND_BANDS.map((band) => (
                <option key={band} value={band}>
                  {SPEND_BAND_LABELS[band]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between gap-4 py-2">
            <span className="text-[0.95rem] text-ink">A Wingman with you</span>
            <button
              type="button"
              onClick={() => setWantWingman((value) => !value)}
              className={wantWingman ? "text-champagne" : "text-ink-subtle"}
            >
              {wantWingman ? "Yes" : "Not this time"}
            </button>
          </label>
          <Button fullWidth size="lg" loading={loading} onClick={() => void generate()}>
            See the night
          </Button>
          <button type="button" onClick={() => setStep(1)} className="text-sm text-ink-subtle">
            Back
          </button>
          {error ? <p className="text-sm text-ink-muted">{error}</p> : null}
        </div>
      )}

      {plan && primary ? (
        <section className="mt-12">
          <p className="text-label">Your night</p>
          <h2 className="font-display mt-2 text-3xl text-ink">A night worth leaving for</h2>
          <ol className="mt-8 space-y-8">
            {plan.options.map((option, index) => (
              <li key={option.kind}>
                <AtmospherePhoto photo={atmosphereForPlanOption(option.kind)} className="h-40 w-full" />
                <p className="mt-4 text-champagne">
                  {option.arrivalTime && !/check source|see source/i.test(option.arrivalTime)
                    ? option.arrivalTime
                    : `${8 + index * 3}:30 PM`}
                </p>
                <h3 className="font-display mt-1 text-2xl text-ink">{option.venueName || option.name}</h3>
                <p className="mt-1 text-sm text-ink-muted">
                  {option.name} · {option.neighborhood}
                </p>
              </li>
            ))}
          </ol>
          {wantWingman ? (
            <div className="mt-10">
              <p className="text-label">Wingman</p>
              <p className="font-display mt-2 text-3xl text-ink">Andres</p>
              <p className="mt-1 text-sm text-ink-muted">{YOUR_WINGMAN_DISPLAY_NAME}</p>
            </div>
          ) : null}
          <Link
            href={`/book?${new URLSearchParams({
              source: "plan",
              ...(primary.eventId
                ? { eventId: String(primary.eventId), name: primary.name }
                : { name: "Plan My Night" }),
            }).toString()}`}
            className="mt-8 block"
          >
            <Button fullWidth size="lg">
              Book and pay $500
            </Button>
          </Link>
          <p className="mt-3 text-center text-[0.8rem] text-ink-subtle">Andres · tonight handled</p>
        </section>
      ) : null}
    </AppShell>
  );
}
