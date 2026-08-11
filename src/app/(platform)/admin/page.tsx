import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader, AdminStatCard } from "@/components/admin/admin-header";
import { getOpsDashboardMetrics } from "@/lib/admin/ops-metrics";
import { getOpsQueueSummaries, OPS_QUEUE_LABELS, type OpsQueueKey } from "@/lib/admin/queues";
import { requireAdminSession } from "@/lib/admin/session";
import { formatAdminCurrency } from "@/lib/admin/display";
import { hasAdminEnv } from "@/lib/supabase/admin";
import { routes } from "@/config/site";

export const metadata = { title: "Ops Command Center" };

async function OpsDashboard() {
  await requireAdminSession();

  const [metrics, queues] = await Promise.all([
    getOpsDashboardMetrics(),
    getOpsQueueSummaries(),
  ]);
  const hasData = hasAdminEnv();

  return (
    <>
      <AdminHeader
        title="Operations Command Center"
        description="Today across active markets (Toronto / GTA and South Florida). New York and California are configured but not launched."
        badge="TODAY"
      />

      {!hasData && (
        <div className="mb-6 rounded-lg border border-border bg-surface-muted px-4 py-3 text-sm text-ink-muted">
          Database not configured. Metrics populate once Supabase is connected.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Bookings" value={metrics.today.bookings} sublabel="Scheduled today" />
        <AdminStatCard
          label="Revenue"
          value={formatAdminCurrency(metrics.today.revenueCents)}
          sublabel="Completed today"
        />
        <AdminStatCard
          label="Awaiting assignment"
          value={metrics.today.awaitingAssignment}
          sublabel="Needs a cleaner"
        />
        <AdminStatCard
          label="Assigned"
          value={metrics.today.assigned}
          sublabel="Assigned or accepted"
        />
        <AdminStatCard
          label="In progress"
          value={metrics.today.inProgress}
          sublabel="On the way → cleaning"
        />
        <AdminStatCard
          label="Completed"
          value={metrics.today.completed}
          sublabel="Finished today"
        />
        <AdminStatCard
          label="Cancelled"
          value={metrics.today.cancelled}
          sublabel="Cancelled today"
        />
        <AdminStatCard
          label="Cleaner availability"
          value={metrics.cleanerAvailability.availableToday}
          sublabel={`${metrics.cleanerAvailability.active} active · ${metrics.cleanerAvailability.onJob} on job`}
        />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Markets</h2>
        <p className="mt-1 text-sm text-ink-muted">Today broken down by service market.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {metrics.byMarket.map((market) => (
            <div
              key={market.marketKey}
              className="rounded-xl border border-border bg-surface p-5 shadow-card"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-lg font-semibold text-ink">
                  {market.marketLabel}
                </h3>
                <span className="text-sm text-ink-muted">
                  {formatAdminCurrency(market.revenueCents)}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <Metric label="Bookings" value={market.bookings} />
                <Metric label="Awaiting" value={market.awaitingAssignment} />
                <Metric label="Assigned" value={market.assigned} />
                <Metric label="In progress" value={market.inProgress} />
                <Metric label="Completed" value={market.completed} />
                <Metric label="Cancelled" value={market.cancelled} />
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Operational queues</h2>
            <p className="mt-1 text-sm text-ink-muted">Work that needs operator attention now.</p>
          </div>
          <Link
            href={routes.adminAssignments}
            className="text-sm font-medium text-navy hover:underline"
          >
            Open assignments
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {queues.map((queue) => (
            <Link
              key={queue.key}
              href={`${routes.adminAssignments}?queue=${queue.key}`}
              className="rounded-xl border border-border bg-surface p-4 shadow-card transition-colors hover:border-accent/40"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
                  {OPS_QUEUE_LABELS[queue.key as OpsQueueKey]}
                </p>
                <span className="font-display text-2xl font-semibold text-ink">{queue.count}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-ink-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}

export default function AdminPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-48 animate-pulse rounded-xl bg-border" />}>
        <OpsDashboard />
      </Suspense>
    </div>
  );
}
