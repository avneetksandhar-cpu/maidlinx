import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { OwnerControls } from "@/components/owner/owner-controls";
import { AI_AGENT_SLOTS } from "@/lib/ai/agents";
import { writeAiAuditLog, listAiAuditLog } from "@/lib/ai/audit";
import {
  describePermissionLevel,
  AI_OUTBOUND_MESSAGING_AUTO_SEND,
} from "@/lib/ai/permissions";
import { requireOwnerAnalyticsAccess } from "@/lib/ai/session";
import { listAiFeatureFlags } from "@/lib/ai/flags";
import { getAiPauseState } from "@/lib/ai/pause";
import { buildRevenueDirectorBrief } from "@/ai/revenue-director";
import { formatAdminCurrency } from "@/lib/admin/display";
import { getPlatformMetrics } from "@/lib/admin/metrics";
import { hasAdminEnv } from "@/lib/supabase/admin";
import type { AiOpportunity, AiPermissionLevel } from "@/lib/ai/types";

export const metadata = { title: "Owner · Command Center" };

function PermissionBadge({ level }: { level: AiPermissionLevel }) {
  const styles: Record<AiPermissionLevel, string> = {
    green: "bg-emerald-100 text-emerald-900",
    yellow: "bg-amber-100 text-amber-900",
    red: "bg-rose-100 text-rose-900",
  };
  return (
    <span
      className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[level]}`}
    >
      {level}
    </span>
  );
}

function OpportunityCard({ opp }: { opp: AiOpportunity }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">{opp.title}</h3>
          <p className="mt-1 text-xs uppercase tracking-wide text-ink-subtle">
            {opp.category.replace(/_/g, " ")}
          </p>
        </div>
        <PermissionBadge level={opp.permissionLevel} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-ink-muted">Potential</dt>
          <dd className="font-semibold text-ink">
            {opp.potentialCentsEstimate != null
              ? formatAdminCurrency(opp.potentialCentsEstimate)
              : "—"}
            {opp.isEstimate && opp.potentialCentsEstimate != null && (
              <span className="ml-1 text-xs font-normal text-ink-subtle">(estimate)</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Confidence</dt>
          <dd className="font-semibold text-ink">
            {Math.round(opp.confidence * 100)}%
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">AI-eligible</dt>
          <dd className="font-semibold text-ink">{opp.aiEligible ? "Yes" : "No"}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm text-ink">{opp.recommendedAction}</p>
      <p className="mt-2 text-xs text-ink-muted">{opp.evidence}</p>
    </article>
  );
}

async function OwnerDashboard() {
  const owner = await requireOwnerAnalyticsAccess();
  const [brief, flags, pause, audit, metrics] = await Promise.all([
    buildRevenueDirectorBrief(),
    listAiFeatureFlags(),
    getAiPauseState(),
    listAiAuditLog(12),
    hasAdminEnv()
      ? getPlatformMetrics().catch(() => null)
      : Promise.resolve(null),
  ]);

  if (!pause.globalPaused && pause.agents.revenue_director.enabled) {
    await writeAiAuditLog({
      agentId: "revenue_director",
      action: "brief.generate",
      permissionLevel: "green",
      actorProfileId: owner.id,
      summary: `Revenue Director brief: ${brief.opportunities.length} opportunities, ${brief.gaps.length} gaps`,
      metadata: {
        opportunityCount: brief.opportunities.length,
        gapCount: brief.gaps.length,
        stripeLiveEnabled: brief.stripeLiveEnabled,
        outboundAutoSend: brief.outboundAutoSend,
        simulationMode: pause.simulationMode,
      },
    });
  }

  return (
    <>
      <AdminHeader
        title="Owner command center"
        description="AI OS foundation. Server-side only — isolated from customer UI. Stripe LIVE stays disabled. No autonomous RED actions."
        badge="Foundation"
      />

      {!hasAdminEnv() && (
        <div className="mb-6 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink-muted">
          Database admin env not configured. Opportunities and flags stay limited until service role
          is available.
        </div>
      )}

      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-ink">Snapshot</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Real completed-booking revenue when available. Monthly target is not configured — shown as
          a gap, not a fake goal.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
            <dt className="text-xs text-ink-muted">Completed revenue</dt>
            <dd className="mt-1 font-display text-xl font-semibold text-ink">
              {metrics ? formatAdminCurrency(metrics.totalRevenueCents) : "—"}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
            <dt className="text-xs text-ink-muted">Completed bookings</dt>
            <dd className="mt-1 font-display text-xl font-semibold text-ink">
              {metrics ? metrics.completedBookings : "—"}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
            <dt className="text-xs text-ink-muted">Active bookings</dt>
            <dd className="mt-1 font-display text-xl font-semibold text-ink">
              {metrics ? metrics.activeBookings : "—"}
            </dd>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 shadow-card">
            <dt className="text-xs text-ink-muted">Monthly target</dt>
            <dd className="mt-1 font-display text-xl font-semibold text-ink-muted">
              Not set
            </dd>
            <p className="mt-1 text-[11px] text-ink-subtle">
              Honest gap — configure later; never invent a target.
            </p>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span
            className={`rounded-md border px-2 py-1 ${
              pause.globalPaused
                ? "border-rose-300 bg-rose-50 text-rose-900"
                : "border-border bg-surface text-ink-muted"
            }`}
          >
            Global AI: {pause.globalPaused ? "PAUSED" : "running"}
          </span>
          <span className="rounded-md border border-border bg-surface px-2 py-1 text-ink-muted">
            Simulation: {pause.simulationMode ? "ON" : "OFF"}
          </span>
          <span className="rounded-md border border-border bg-surface px-2 py-1 text-ink-muted">
            Stripe LIVE: OFF
          </span>
          <span className="rounded-md border border-border bg-surface px-2 py-1 text-ink-muted">
            Outbound auto-send:{" "}
            {AI_OUTBOUND_MESSAGING_AUTO_SEND || pause.outboundAutoSend ? "ON" : "OFF"}
          </span>
        </div>
      </section>

      <OwnerControls
        initialFlags={flags.map((f) => ({
          key: f.key,
          enabled: f.enabled,
          description: f.description,
        }))}
      />

      <section className="mb-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              Revenue Director
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Ranked opportunities from real data. Missing sources shown as gaps — never invented
              pipeline.
            </p>
          </div>
          <p className="text-xs text-ink-subtle">
            Generated {new Date(brief.generatedAt).toLocaleString()}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-md border border-border bg-surface px-2 py-1 text-ink-muted">
            GREEN: {describePermissionLevel("green")}
          </span>
        </div>

        {brief.notes.length > 0 && (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink-muted">
            {brief.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        )}

        <div className="mt-6 grid gap-4">
          {brief.opportunities.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface px-5 py-8 text-sm text-ink-muted">
              No ranked opportunities yet. See data gaps below — this is an honest empty state, not a
              zero-revenue claim.
            </div>
          ) : (
            brief.opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))
          )}
        </div>
      </section>

      {brief.gaps.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold text-ink">Data gaps</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Where evidence is missing, we surface the gap instead of fabricating numbers.
          </p>
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">
            {brief.gaps.map((gap) => (
              <li
                key={gap.key}
                className="rounded-xl border border-border bg-surface p-4 text-sm shadow-card"
              >
                <p className="font-semibold text-ink">{gap.label}</p>
                <p className="mt-1 text-ink-muted">{gap.reason}</p>
                <p className="mt-2 text-xs text-ink-subtle">{gap.howToFill}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-ink">Recent AI audit</h2>
        <p className="mt-1 text-sm text-ink-muted">
          From `ai_audit_log`. Soft-empty if migration not applied.
        </p>
        {audit.length === 0 ? (
          <p className="mt-4 text-sm text-ink-muted">No audit rows yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-surface">
            {audit.map((row) => (
              <li key={row.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ink">
                    {row.agentId} · {row.action}
                  </p>
                  <PermissionBadge level={row.permissionLevel} />
                </div>
                <p className="mt-1 text-ink-muted">{row.summary ?? "—"}</p>
                <p className="mt-1 text-[11px] text-ink-subtle">
                  {new Date(row.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-ink">AI executive team</h2>
        <p className="mt-1 text-sm text-ink-muted">
          First wave order: Revenue → Ops → Retention → B2B → Growth → Chief of Staff. Only Revenue
          is live; others remain placeholders until foundation earns trust.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {AI_AGENT_SLOTS.map((slot) => {
            const agentOn = pause.agents[slot.id]?.enabled;
            return (
              <div
                key={slot.id}
                className="rounded-xl border border-border bg-surface p-4 shadow-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display font-semibold text-ink">
                    {slot.buildOrder}. {slot.name}
                  </p>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide ${
                      slot.status === "live" && agentOn && !pause.globalPaused
                        ? "text-emerald-700"
                        : "text-ink-subtle"
                    }`}
                  >
                    {pause.globalPaused
                      ? "global pause"
                      : !agentOn
                        ? "paused"
                        : slot.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-muted">{slot.blurb}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

export default function OwnerPage() {
  return (
    <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-border" />}>
      <OwnerDashboard />
    </Suspense>
  );
}
