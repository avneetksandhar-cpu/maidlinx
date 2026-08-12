import { AdminHeader } from "@/components/admin/admin-header";
import { OwnerStat } from "@/components/owner/owner-stat";
import { requireOwnerAnalyticsAccess } from "@/lib/ai/session";
import { buildCleanerCapacitySnapshot } from "@/lib/owner/cleaners";

export const metadata = { title: "Owner · Cleaner capacity" };

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
  const snap = await buildCleanerCapacitySnapshot();

  return (
    <>
      <AdminHeader
        title="Cleaner capacity"
        description="Supply by market / zone / service / day / time from real bookings. Gaps labeled when data thin."
        badge="Capacity"
      />

      <dl className="mb-8 grid gap-3 grid-cols-2 lg:grid-cols-4">
        <OwnerStat label="Total cleaners" value={snap.totalCleaners} unavailable={snap.totalCleaners == null} />
        <OwnerStat label="Active" value={snap.activeCleaners} unavailable={snap.activeCleaners == null} />
        <OwnerStat
          label="Utilization"
          value={snap.utilizationPct != null ? `${snap.utilizationPct}%` : null}
          unavailable={snap.utilizationPct == null}
        />
        <OwnerStat
          label="Data"
          value={snap.available ? "OK" : "Gap"}
          sublabel={snap.gaps[0]}
        />
      </dl>

      {snap.gaps.length > 0 && (
        <ul className="mb-8 list-disc space-y-1 pl-5 text-sm text-ink-muted">
          {snap.gaps.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
      )}

      <BucketTable title="By market" rows={snap.byMarket} />
      <BucketTable title="By zone" rows={snap.byZone} />
      <BucketTable title="By service" rows={snap.byService} />
      <BucketTable title="By day of week" rows={snap.byDayOfWeek} />
      <BucketTable title="By hour (scheduled)" rows={snap.byHour} />
    </>
  );
}
