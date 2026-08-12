import { Suspense } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/admin-header";
import { OwnerControls } from "@/components/owner/owner-controls";
import { OwnerStat } from "@/components/owner/owner-stat";
import { OwnerTargetsForm } from "@/components/owner/owner-targets-form";
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
import { hasAdminEnv } from "@/lib/supabase/admin";
import { buildOwnerSnapshot } from "@/lib/owner/snapshot";
import { getInterventionWeeklyTrend } from "@/lib/owner/interventions";
import { routes } from "@/config/site";
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
          <dd className="font-semibold text-ink">{Math.round(opp.confidence * 100)}%</dd>
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

function fmtPct(n: number | null | undefined): string | null {
  if (n == null) return null;
  return `${n}%`;
}

async function OwnerDashboard() {
  const owner = await requireOwnerAnalyticsAccess();
  const [brief, flags, pause, audit, snapshot, trend] = await Promise.all([
    buildRevenueDirectorBrief(),
    listAiFeatureFlags(),
    getAiPauseState(),
    listAiAuditLog(12),
    buildOwnerSnapshot(),
    getInterventionWeeklyTrend(8),
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
        description="Zero-cost command vCenter. Real completed revenue + honest gaps. Stripe LIVE disabled. No autonomous outbound."
        badge="vCenter"
      />

      {!hasAdminEnv() && (
        <div className="mb-6 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-ink-muted">
          Database admin env not configured. Metrics stay limited until service role is available.
        </div>
      )}

      <section className="mb-10">
        <h2 className="font-display text-xl font-semibold text-ink">Revenue</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Completed-booking revenue from DB. Never invented GMV.
        </p>
        <dl className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-4">
          <OwnerStat
            label="Today"
            value={
              snapshot.revenue.todayCents != null
                ? formatAdminCurrency(snapshot.revenue.todayCents)
                : null
            }
            unavailable={snapshot.revenue.todayCents == null}
          />
          <OwnerStat
            label="This week"
            value={
              snapshot.revenue.weekCents != null
                ? formatAdminCurrency(snapshot.revenue.weekCents)
                : null
            }
            unavailable={snapshot.revenue.weekCents == null}
          />
          <OwnerStat
            label="This month"
            value={
              snapshot.revenue.monthCents != null
                ? formatAdminCurrency(snapshot.revenue.monthCents)
                : null
            }
            unavailable={snapshot.revenue.monthCents == null}
          />
          <OwnerStat
            label="YTD"
            value={
              snapshot.revenue.ytdCents != null
                ? formatAdminCurrency(snapshot.revenue.ytdCents)
                : null
            }
            unavailable={snapshot.revenue.ytdCents == null}
          />
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

      <section id="targets" className="mb-10 scroll-mt-6">
        <h2 className="font-display text-xl font-semibold text-ink">$100K / $1M trackers</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Pace vs editable targets. Projected end = linear extrapolation from real revenue.
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <OwnerStat
            label="Monthly target"
            value={formatAdminCurrency(snapshot.targets.monthlyTargetCents)}
            sublabel={snapshot.targets.source === "db" ? "from DB" : "default"}
          />
          <OwnerStat
            label="Month actual"
            value={formatAdminCurrency(snapshot.monthPace.actualCents)}
            sublabel={snapshot.monthPace.label}
          />
          <OwnerStat
            label="Projected month-end"
            value={
              snapshot.monthPace.projectedEndCents != null
                ? formatAdminCurrency(snapshot.monthPace.projectedEndCents)
                : null
            }
            estimate
            unavailable={snapshot.monthPace.projectedEndCents == null}
          />
          <OwnerStat
            label="Month shortfall / surplus"
            value={formatAdminCurrency(snapshot.monthPace.shortfallOrSurplusCents)}
            sublabel={`vs pace · day ${snapshot.monthPace.daysElapsed}/${snapshot.monthPace.daysInPeriod}`}
          />
          <OwnerStat
            label="Annual target"
            value={formatAdminCurrency(snapshot.targets.annualTargetCents)}
          />
          <OwnerStat
            label="YTD actual"
            value={formatAdminCurrency(snapshot.yearPace.actualCents)}
            sublabel={snapshot.yearPace.label}
          />
          <OwnerStat
            label="Projected year-end"
            value={
              snapshot.yearPace.projectedEndCents != null
                ? formatAdminCurrency(snapshot.yearPace.projectedEndCents)
                : null
            }
            estimate
            unavailable={snapshot.yearPace.projectedEndCents == null}
          />
          <OwnerStat
            label="Year shortfall / surplus"
            value={formatAdminCurrency(snapshot.yearPace.shortfallOrSurplusCents)}
            sublabel={`vs pace · day ${snapshot.yearPace.daysElapsed}/${snapshot.yearPace.daysInPeriod}`}
          />
        </dl>
        <div className="mt-4">
          <OwnerTargetsForm
            monthlyDollars={Math.round(snapshot.targets.monthlyTargetCents / 100)}
            annualDollars={Math.round(snapshot.targets.annualTargetCents / 100)}
          />
        </div>
      </section>

      <section id="bookings" className="mb-10 scroll-mt-6">
        <h2 className="font-display text-xl font-semibold text-ink">Bookings & ops</h2>
        <dl className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-4">
          <OwnerStat label="All bookings" value={snapshot.bookings.all} unavailable={!snapshot.bookings.available} />
          <OwnerStat label="Completed" value={snapshot.bookings.completed} unavailable={!snapshot.bookings.available} />
          <OwnerStat label="Upcoming / active" value={snapshot.bookings.upcoming} unavailable={!snapshot.bookings.available} />
          <OwnerStat label="Cancelled" value={snapshot.bookings.cancelled} unavailable={!snapshot.bookings.available} />
          <OwnerStat label="Repeat rate" value={fmtPct(snapshot.repeatRatePercent)} unavailable={snapshot.repeatRatePercent == null} />
          <OwnerStat label="Recurring prefs" value={snapshot.recurringPreferenceCount} unavailable={snapshot.recurringPreferenceCount == null} />
          <OwnerStat
            label="AOV"
            value={snapshot.aovCents != null ? formatAdminCurrency(snapshot.aovCents) : null}
            unavailable={snapshot.aovCents == null}
          />
          <OwnerStat
            label="Est. contribution"
            value={
              snapshot.estimatedContributionCents != null
                ? formatAdminCurrency(snapshot.estimatedContributionCents)
                : null
            }
            estimate
            unavailable={snapshot.estimatedContributionCents == null}
          />
          <OwnerStat
            label="Cleaner util"
            value={
              snapshot.cleaners.utilizationPct != null
                ? `${snapshot.cleaners.active}/${snapshot.cleaners.total} (${snapshot.cleaners.utilizationPct}%)`
                : null
            }
            unavailable={!snapshot.cleaners.available}
          />
          <OwnerStat
            label="Conversion (30d)"
            value={fmtPct(snapshot.conversion.ratePct)}
            sublabel={
              snapshot.conversion.available
                ? `${snapshot.conversion.paid ?? 0} paid / ${snapshot.conversion.checkoutStarted ?? 0} checkout`
                : undefined
            }
            unavailable={!snapshot.conversion.available}
          />
          <OwnerStat label="Abandoned (14d)" value={snapshot.abandonedCheckouts} unavailable={snapshot.abandonedCheckouts == null} />
          <OwnerStat label="Open opportunities" value={snapshot.openOpportunities} unavailable={snapshot.openOpportunities == null} />
          <OwnerStat label="Open leads" value={snapshot.openLeads} unavailable={snapshot.openLeads == null} />
          <OwnerStat label="Stale follow-ups" value={snapshot.staleFollowUps} unavailable={snapshot.staleFollowUps == null} />
          <OwnerStat label="Open exceptions" value={snapshot.openExceptions} unavailable={snapshot.openExceptions == null} />
          <OwnerStat
            label="Founder interventions (7d)"
            value={snapshot.founderInterventionsWeek}
            unavailable={snapshot.founderInterventionsWeek == null}
          />
        </dl>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link className="rounded-md border border-border bg-surface px-3 py-1.5 hover:bg-surface-muted" href={routes.ownerOpportunities}>
            Opportunities →
          </Link>
          <Link className="rounded-md border border-border bg-surface px-3 py-1.5 hover:bg-surface-muted" href={routes.ownerExceptions}>
            Exceptions →
          </Link>
          <Link className="rounded-md border border-border bg-surface px-3 py-1.5 hover:bg-surface-muted" href={routes.ownerSales}>
            Sales →
          </Link>
          <Link className="rounded-md border border-border bg-surface px-3 py-1.5 hover:bg-surface-muted" href={routes.ownerCleaners}>
            Cleaners →
          </Link>
          <Link className="rounded-md border border-border bg-surface px-3 py-1.5 hover:bg-surface-muted" href={routes.ownerActivity}>
            Activity →
          </Link>
        </div>
      </section>

      {trend.available && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold text-ink">Intervention weekly trend</h2>
          <p className="mt-1 text-sm text-ink-muted">Counts from founder_interventions (real rows only).</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {trend.points.map((p) => (
              <li
                key={p.weekStart}
                className="rounded-md border border-border bg-surface px-3 py-2 text-xs"
              >
                <span className="text-ink-muted">{p.weekStart}</span>{" "}
                <span className="font-semibold text-ink">{p.count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

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
            <h2 className="font-display text-xl font-semibold text-ink">Revenue Director</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Deterministic opportunity engine. Potentials labeled estimates. No auto messages.
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
              No ranked opportunities yet. See data gaps — honest empty state.
            </div>
          ) : (
            brief.opportunities.slice(0, 6).map((opp) => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))
          )}
        </div>
        {brief.opportunities.length > 6 && (
          <p className="mt-3 text-sm">
            <Link href={routes.ownerOpportunities} className="text-ink underline">
              View all opportunities →
            </Link>
          </p>
        )}
      </section>

      {brief.gaps.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-xl font-semibold text-ink">Data gaps</h2>
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">
            {brief.gaps.map((gap) => (
              <li key={gap.key} className="rounded-xl border border-border bg-surface p-4 text-sm shadow-card">
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
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {AI_AGENT_SLOTS.map((slot) => {
            const agentOn = pause.agents[slot.id]?.enabled;
            return (
              <div key={slot.id} className="rounded-xl border border-border bg-surface p-4 shadow-card">
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
                    {pause.globalPaused ? "global pause" : !agentOn ? "paused" : slot.status}
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
