import { AdminHeader } from "@/components/admin/admin-header";
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

  return (
    <>
      <AdminHeader
        title="Cleaner capacity"
        description="Launch coverage + supply by market / zone / service / day / time from real data. Gaps labeled when thin."
        badge="Capacity"
      />

      <section className="mb-8 rounded-xl border border-border bg-surface p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Launch coverage status
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Bookable = approved + active + services + (market or zones) + availability rows.
              Auto-offer eligible also requires online.
            </p>
          </div>
          <span
            className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${statusClass(coverage.overallStatus)}`}
          >
            {coverage.overallStatus}
          </span>
        </div>

        <dl className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-5">
          <OwnerStat label="Total cleaners" value={coverage.totals.totalCleaners} />
          <OwnerStat label="Approved active" value={coverage.totals.approvedCleaners} />
          <OwnerStat label="Bookable" value={coverage.totals.bookableCleaners} />
          <OwnerStat label="With availability" value={coverage.totals.cleanersWithAvailability} />
          <OwnerStat label="Online eligible" value={coverage.totals.eligibleOnline} />
        </dl>

        <p className="mt-4 text-sm text-ink">
          CLEANER_COVERAGE_READY:{" "}
          <span className="font-semibold">
            {coverage.cleanerCoverageReady ? "YES" : "NO"}
          </span>
          {" · "}
          Recommended first market:{" "}
          <span className="font-semibold">
            {coverage.recommendedFirstMarket ?? "— (none launch-ready)"}
          </span>
          {coverage.candidateFirstMarket && !coverage.recommendedFirstMarket ? (
            <span className="text-ink-muted">
              {" "}
              · ops candidate after onboarding: {coverage.candidateFirstMarket}
            </span>
          ) : null}
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
        <h2 className="font-display text-lg font-semibold text-ink">Markets</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-ink-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Market</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Approved</th>
                <th className="px-3 py-2 font-medium">Bookable</th>
                <th className="px-3 py-2 font-medium">Online cap.</th>
                <th className="px-3 py-2 font-medium">Services</th>
                <th className="px-3 py-2 font-medium">Geo</th>
                <th className="px-3 py-2 font-medium">Launch ready</th>
              </tr>
            </thead>
            <tbody>
              {coverage.markets.map((m) => (
                <tr key={m.marketId} className="border-b border-border/60 last:border-0 align-top">
                  <td className="px-3 py-2 text-ink">
                    <div className="font-medium">{m.marketName}</div>
                    <div className="text-xs text-ink-muted">{m.marketId}</div>
                    {!m.configuredActive ? (
                      <div className="text-xs text-ink-muted">inactive</div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${statusClass(m.status)}`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{m.approvedCleaners}</td>
                  <td className="px-3 py-2">{m.bookableCleaners}</td>
                  <td className="px-3 py-2">{m.availableCapacity}</td>
                  <td className="px-3 py-2">
                    {m.servicesCovered}/{m.catalogServices} catalog
                  </td>
                  <td className="px-3 py-2 text-ink-muted">{m.geographicCoverage}</td>
                  <td className="px-3 py-2">{m.launchReady ? "YES" : "NO"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {coverage.markets.some((m) => m.majorGaps.length > 0) ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-muted">
            {coverage.markets.flatMap((m) =>
              m.majorGaps.map((g) => (
                <li key={`${m.marketId}-${g}`}>
                  {m.marketId}: {g}
                </li>
              )),
            )}
          </ul>
        ) : null}
      </section>

      <section className="mb-8">
        <h2 className="font-display text-lg font-semibold text-ink">Cleaners</h2>
        {coverage.cleaners.length === 0 ? (
          <p className="mt-3 text-sm text-ink-muted">No cleaner rows.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-border text-xs text-ink-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Cleaner</th>
                  <th className="px-3 py-2 font-medium">Approval</th>
                  <th className="px-3 py-2 font-medium">Onboarding</th>
                  <th className="px-3 py-2 font-medium">Market</th>
                  <th className="px-3 py-2 font-medium">Zones</th>
                  <th className="px-3 py-2 font-medium">Services</th>
                  <th className="px-3 py-2 font-medium">Avail</th>
                  <th className="px-3 py-2 font-medium">Eligible</th>
                  <th className="px-3 py-2 font-medium">Upcoming</th>
                  <th className="px-3 py-2 font-medium">Missing</th>
                </tr>
              </thead>
              <tbody>
                {coverage.cleaners.map((c) => (
                  <tr key={c.cleanerId} className="border-b border-border/60 last:border-0 align-top">
                    <td className="px-3 py-2 font-mono text-xs text-ink">
                      {c.cleanerId.slice(0, 8)}…
                    </td>
                    <td className="px-3 py-2">
                      {c.approved && c.active ? "approved+active" : c.approved ? "approved" : "no"}
                    </td>
                    <td className="px-3 py-2">{c.onboardingStatus}</td>
                    <td className="px-3 py-2">{c.marketId ?? "—"}</td>
                    <td className="px-3 py-2">{c.zoneCount}</td>
                    <td className="px-3 py-2">{c.serviceCount}</td>
                    <td className="px-3 py-2">{c.availabilityCount}</td>
                    <td className="px-3 py-2">
                      {c.bookable ? "bookable" : c.eligibleToReceiveJobs ? "online only" : "no"}
                    </td>
                    <td className="px-3 py-2">{c.upcomingAssignments}</td>
                    <td className="px-3 py-2 text-xs text-ink-muted">
                      {c.missing.length ? c.missing.join(", ") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
