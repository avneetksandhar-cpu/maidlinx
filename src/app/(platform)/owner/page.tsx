import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AI_AGENT_SLOTS } from "@/lib/ai/agents";
import { writeAiAuditLog } from "@/lib/ai/audit";
import {
  describePermissionLevel,
  AI_OUTBOUND_MESSAGING_AUTO_SEND,
} from "@/lib/ai/permissions";
import { requireOwnerAnalyticsAccess } from "@/lib/ai/session";
import { buildRevenueDirectorBrief } from "@/ai/revenue-director";
import { formatAdminCurrency } from "@/lib/admin/display";
import { hasAdminEnv } from "@/lib/supabase/admin";
import type { AiOpportunity, AiPermissionLevel } from "@/lib/ai/types";

export const metadata = { title: "Owner · Revenue Director" };

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
  const brief = await buildRevenueDirectorBrief();

  await writeAiAuditLog({
    agentId: "revenue_director",
    action: "brief.generate",
    permissionLevel: "green",
    actorProfileId: owner.id,
    summary: `Revenue Director V0 brief: ${brief.opportunities.length} opportunities, ${brief.gaps.length} gaps`,
    metadata: {
      opportunityCount: brief.opportunities.length,
      gapCount: brief.gaps.length,
      stripeLiveEnabled: brief.stripeLiveEnabled,
      outboundAutoSend: brief.outboundAutoSend,
    },
  });

  return (
    <>
      <AdminHeader
        title="Owner command center"
        description="AI executive brief for the founder. Server-side only — isolated from customer UI. Stripe LIVE stays disabled."
        badge="V0"
      />

      {!hasAdminEnv() && (
        <div className="mb-6 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink-muted">
          Database admin env not configured. Opportunities stay empty until service role is available.
        </div>
      )}

      <section className="mb-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              Revenue Director
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Ranked opportunities from real data. Missing sources shown as gaps — never invented pipeline.
            </p>
          </div>
          <p className="text-xs text-ink-subtle">
            Generated {new Date(brief.generatedAt).toLocaleString()}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-md border border-border bg-surface px-2 py-1 text-ink-muted">
            Stripe LIVE: OFF
          </span>
          <span className="rounded-md border border-border bg-surface px-2 py-1 text-ink-muted">
            Outbound auto-send: {AI_OUTBOUND_MESSAGING_AUTO_SEND ? "ON" : "OFF"}
          </span>
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
              No ranked opportunities yet. See data gaps below — this is an honest empty state, not a zero-revenue claim.
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

      <section>
        <h2 className="font-display text-xl font-semibold text-ink">AI executive team</h2>
        <p className="mt-1 text-sm text-ink-muted">
          First wave order: Revenue → Ops → Retention → B2B → Growth → Chief of Staff. Only Revenue is live.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {AI_AGENT_SLOTS.map((slot) => (
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
                    slot.status === "live" ? "text-emerald-700" : "text-ink-subtle"
                  }`}
                >
                  {slot.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-muted">{slot.blurb}</p>
            </div>
          ))}
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
