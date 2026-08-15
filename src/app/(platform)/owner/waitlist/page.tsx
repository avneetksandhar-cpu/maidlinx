import { AdminHeader } from "@/components/admin/admin-header";
import { requireOwnerAnalyticsAccess } from "@/lib/ai/session";
import { listLaunchWaitlist } from "@/lib/waitlist/repository";

export const metadata = { title: "Owner · Launch waitlist" };

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function OwnerWaitlistPage() {
  await requireOwnerAnalyticsAccess();
  const list = await listLaunchWaitlist(150);

  return (
    <>
      <AdminHeader
        title="Launch waitlist"
        description="Emails captured when booking is closed or the address is out of area. Real signups only — never fabricated."
        badge="Waitlist"
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="text-ink-muted">Total signups</p>
          <p className="mt-1 font-display text-xl font-semibold">
            {list.available ? (list.count ?? list.items.length) : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="text-ink-muted">Shown</p>
          <p className="mt-1 font-display text-xl font-semibold">{list.items.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-sm">
          <p className="text-ink-muted">Status</p>
          <p className="mt-1 text-sm text-ink">
            {list.available ? "Live from database" : list.gapReason ?? "Unavailable"}
          </p>
        </div>
      </div>

      {!list.available ? (
        <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-sm text-ink-muted">
          {list.gapReason ?? "Waitlist unavailable."}{" "}
          <span className="text-ink">HUMAN_ACTION_REQUIRED:</span> apply migration{" "}
          <code className="text-xs">00033_launch_waitlist</code>.
        </p>
      ) : list.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-sm text-ink-muted">
          No waitlist emails yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Market</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((row) => (
                <tr key={row.id} className="border-b border-border/70 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{row.email}</td>
                  <td className="px-4 py-3 text-ink-muted">{row.name ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{row.marketId ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {row.source ?? "—"}
                    {row.page ? (
                      <span className="mt-0.5 block text-xs text-ink-subtle">{row.page}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{formatWhen(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
