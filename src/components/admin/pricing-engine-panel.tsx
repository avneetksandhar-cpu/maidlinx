"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input } from "@/components/ui";
import type { PricingEngineRules } from "@/lib/pricing/engine/types";
import type { PricingEngineMetrics } from "@/lib/admin/pricing-engine";
import { formatAdminCurrency } from "@/lib/admin/display";

type EngineRuleRow = PricingEngineRules & {
  id: string;
  isActive: boolean;
  updatedAt: string;
};

interface ExperimentRow {
  id: string;
  key: string;
  name: string;
  status: string;
  autoDeployWinner: boolean;
}

export function PricingEnginePanel({
  rules,
  metrics,
  experiments,
}: {
  rules: EngineRuleRow[];
  metrics: PricingEngineMetrics;
  experiments: ExperimentRow[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, Partial<EngineRuleRow>>>({});

  async function save(id: string) {
    const updates = draft[id];
    if (!updates) return;
    setSaving(id);
    await fetch("/api/admin/pricing/engine", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        dynamicPricingEnabled: updates.dynamicPricingEnabled,
        demandMultMin: updates.demandMultMin,
        demandMultMax: updates.demandMultMax,
        supplyMultMin: updates.supplyMultMin,
        supplyMultMax: updates.supplyMultMax,
        minContributionMarginCents: updates.minContributionMarginCents,
        minContributionMarginPct: updates.minContributionMarginPct,
        maxDiscountStackPct: updates.maxDiscountStackPct,
      }),
    });
    setSaving(null);
    setDraft((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-xl font-semibold text-ink">Engine metrics (7d)</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Real aggregates from pricing_quotes / funnel_events. Empty when no data.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Quotes" value={String(metrics.quotesLast7d)} />
          <Metric
            label="Guardrail applied"
            value={String(metrics.quotesWithGuardrailLast7d)}
          />
          <Metric
            label="Dynamic quotes"
            value={String(metrics.quotesDynamicLast7d)}
          />
          <Metric
            label="Funnel events"
            value={String(metrics.funnelEventsLast7d)}
          />
          <Metric
            label="Avg margin"
            value={
              metrics.avgContributionMarginCents != null
                ? formatAdminCurrency(metrics.avgContributionMarginCents)
                : "—"
            }
          />
          <Metric
            label="Avg total"
            value={
              metrics.avgTotalCents != null
                ? formatAdminCurrency(metrics.avgTotalCents)
                : "—"
            }
          />
          <Metric
            label="Experiments running"
            value={String(metrics.experimentsRunning)}
          />
          <Metric
            label="Dynamic pricing (global)"
            value={metrics.dynamicPricingEnabledGlobal ? "ON" : "OFF"}
          />
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-ink">Engine rules</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Dynamic demand/supply multipliers stay OFF until explicitly enabled. No code deploy
          required for parameter tweaks.
        </p>
        {rules.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">
            No pricing_rules rows yet. Apply migration 00024 or use defaults (dynamic OFF).
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {rules.map((rule) => {
              const d = { ...rule, ...draft[rule.id] };
              return (
                <div
                  key={rule.id}
                  className="rounded-xl border border-border bg-surface p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-ink">
                        {rule.scope === "global"
                          ? "Global"
                          : `Market ${rule.marketId}`}
                      </p>
                      <p className="text-xs text-ink-muted">
                        Updated {new Date(rule.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(d.dynamicPricingEnabled)}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            [rule.id]: {
                              ...prev[rule.id],
                              dynamicPricingEnabled: e.target.checked,
                            },
                          }))
                        }
                      />
                      Dynamic pricing enabled
                    </label>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Field
                      label="Demand mult min"
                      value={d.demandMultMin}
                      onChange={(n) =>
                        setDraft((prev) => ({
                          ...prev,
                          [rule.id]: { ...prev[rule.id], demandMultMin: n },
                        }))
                      }
                    />
                    <Field
                      label="Demand mult max"
                      value={d.demandMultMax}
                      onChange={(n) =>
                        setDraft((prev) => ({
                          ...prev,
                          [rule.id]: { ...prev[rule.id], demandMultMax: n },
                        }))
                      }
                    />
                    <Field
                      label="Supply mult min"
                      value={d.supplyMultMin}
                      onChange={(n) =>
                        setDraft((prev) => ({
                          ...prev,
                          [rule.id]: { ...prev[rule.id], supplyMultMin: n },
                        }))
                      }
                    />
                    <Field
                      label="Supply mult max"
                      value={d.supplyMultMax}
                      onChange={(n) =>
                        setDraft((prev) => ({
                          ...prev,
                          [rule.id]: { ...prev[rule.id], supplyMultMax: n },
                        }))
                      }
                    />
                    <Field
                      label="Min margin $"
                      value={(d.minContributionMarginCents ?? 0) / 100}
                      onChange={(n) =>
                        setDraft((prev) => ({
                          ...prev,
                          [rule.id]: {
                            ...prev[rule.id],
                            minContributionMarginCents: Math.round(n * 100),
                          },
                        }))
                      }
                    />
                    <Field
                      label="Min margin %"
                      value={d.minContributionMarginPct}
                      onChange={(n) =>
                        setDraft((prev) => ({
                          ...prev,
                          [rule.id]: {
                            ...prev[rule.id],
                            minContributionMarginPct: n,
                          },
                        }))
                      }
                    />
                    <Field
                      label="Max discount stack %"
                      value={d.maxDiscountStackPct}
                      onChange={(n) =>
                        setDraft((prev) => ({
                          ...prev,
                          [rule.id]: { ...prev[rule.id], maxDiscountStackPct: n },
                        }))
                      }
                    />
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="gold"
                      size="sm"
                      disabled={saving === rule.id || !draft[rule.id]}
                      onClick={() => save(rule.id)}
                    >
                      {saving === rule.id ? "Saving…" : "Save rules"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-ink">Experiments</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Results are observational. Winners are never auto-deployed to live pricing.
        </p>
        {experiments.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">No experiments yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border">
            {experiments.map((exp) => (
              <li
                key={exp.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-ink">{exp.name}</p>
                  <p className="text-ink-muted">
                    {exp.key} · {exp.status}
                  </p>
                </div>
                <span className="text-xs text-ink-muted">auto-deploy: never</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-ink-muted">{label}</span>
      <Input
        type="number"
        step="any"
        className="mt-1 h-9"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
