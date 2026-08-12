import { AdminHeader } from "@/components/admin/admin-header";
import { MarketCoverageTabs } from "@/components/owner/market-coverage-tabs";
import { OwnerStat } from "@/components/owner/owner-stat";
import { requireOwnerAnalyticsAccess } from "@/lib/ai/session";
import { buildCleanerCapacitySnapshot } from "@/lib/owner/cleaners";
import {
  buildLaunchCoverageSnapshot,
  type LaunchCoverageStatus,
} from "@/lib/owner/launch-coverage";

export const metadata = { title: "Owner · Cleaner capacity" };

function statusClass(status: LaunchCoverageStatus): string {
  if (status === "GREEN") return "bg-emerald-600 text-white";
  if (status === "YELLOW") return "bg-amber-500 text-ink";
  return "bg-rose-600 text-white";
}

function BucketTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    label: string;
    bookingCount: number;
    completedCount: number;
    upcomingCount: number;
  }>;
}) {
  return (
    <section className="mb-8">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">No data for this dimension.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-ink-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Slice</th>
                <th className="px-3 py-2 font-medium">Bookings</th>
                <th className="px-3 py-2 font-medium">Completed</th>
                <th className="px-3 py-2 font-medium">Upcoming</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2 text-ink">{r.label}</td>
                  <td className="px-3 py-2">{r.bookingCount}</td>
                  <td className="px-3 py-2">{r.completedCount}</td>
                  <td className="px-3 py-2">{r.upcomingCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function OwnerCleanersPage() {
  await requireOwnerAnalyticsAccess();
  const [snap, coverage] = await Promise.all([
    buildCleanerCapacitySnapshot(),
    buildLaunchCoverageSnapshot(),
  ]);

  const toronto = coverage.markets.find((m) => m.marketId === "TORONTO_GTA");
  const florida = coverage.markets.find((m) => m.marketId === "SOUTH_FLORIDA");

  return (
    <>
      <AdminHeader
        title="Cleaner capacity"
        description="Independent launch coverage for TORONTO_GTA and SOUTH_FLORIDA. Never combine markets for readiness."
        badge="Capacity"
      />

      <section className="mb-8 rounded-xl border border-border bg-surface p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Launch coverage status
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Bookable = approved + active + services + (market or zones) + availability.
              Coverage GREEN needs ≥2 bookable + online capacity + pricing ready — not one cleaner alone.
              Use Edit on each row to enter REAL market/zones/services/availability.
            </p>
          </div>
          <span
            className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${statusClass(coverage.overallStatus)}`}
            title="Informational only — use per-market status for launch"
          >
            Overall {coverage.overallStatus}
          </span>
        </div>

        <dl className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-5">
          <OwnerStat label="Total cleaners" value={coverage.totals.totalCleaners} />
          <OwnerStat label="Approved active" value={coverage.totals.approvedCleaners} />
          <OwnerStat label="Bookable" value={coverage.totals.bookableCleaners} />
          <OwnerStat label="With availability" value={coverage.totals.cleanersWithAvailability} />
          <OwnerStat
            label="Unassigned approved"
            value={coverage.totals.unassignedApprovedCleaners}
          />
        </dl>

        <p className="mt-4 text-sm text-ink">
          TORONTO_GTA_COVERAGE_READY:{" "}
          <span className="font-semibold">{toronto?.coverageReady ? "YES" : "NO"}</span>
          {" · "}
          SOUTH_FLORIDA_COVERAGE_READY:{" "}
          <span className="font-semibold">{florida?.coverageReady ? "YES" : "NO"}</span>
        </p>

        {coverage.gaps.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-muted">
            {coverage.gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Markets</h2>
        <MarketCoverageTabs markets={coverage.markets} cleaners={coverage.cleaners} />
      </section>

      <dl className="mb-8 grid gap-3 grid-cols-2 lg:grid-cols-4">
        <OwnerStat label="Total cleaners" value={snap.totalCleaners} unavailable={snap.totalCleaners == null} />
        <OwnerStat label="Active" value={snap.activeCleaners} unavailable={snap.activeCleaners == null} />
        <OwnerStat
          label="Utilization"
          value={snap.utilizationPct != null ? `${snap.utilizationPct}%` : null}
          unavailable={snap.utilizationPct == null}
        />
        <OwnerStat
          label="Booking dims"
          value={snap.available ? "OK" : "Gap"}
          sublabel={snap.gaps[0]}
        />
      </dl>

      <BucketTable title="By market (bookings)" rows={snap.byMarket} />
      <BucketTable title="By zone" rows={snap.byZone} />
      <BucketTable title="By service" rows={snap.byService} />
      <BucketTable title="By day of week" rows={snap.byDayOfWeek} />
      <BucketTable title="By hour (scheduled)" rows={snap.byHour} />
    </>
  );
}
