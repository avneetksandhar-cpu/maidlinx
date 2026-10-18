import { AdminHeader } from "@/components/admin/admin-header";
import { OwnerStat } from "@/components/owner/owner-stat";
import { requireOwnerAnalyticsAccess } from "@/lib/ai/session";
import { getCustomerRevenueProfile } from "@/lib/owner/customers";
import { formatAdminCurrency } from "@/lib/admin/display";
import Link from "next/link";
import { routes } from "@/config/site";

export const metadata = { title: "Owner · Customer revenue" };

export default async function OwnerCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireOwnerAnalyticsAccess();
  const { id } = await params;
  const profile = await getCustomerRevenueProfile(id);

  return (
    <>
      <AdminHeader
        title="Customer revenue profile"
        description="Internal LTV + next-best-action. Recommend-only — no auto messages."
        badge="Internal"
      />

      <p className="mb-4 text-sm">
        <Link href={routes.owner} className="underline text-ink">
          ← Command center
        </Link>
      </p>

      {!profile.available && (
        <p className="mb-4 text-sm text-ink-muted">{profile.gapReason}</p>
      )}

      <div className="mb-6 rounded-xl border border-border bg-surface p-5 shadow-card">
        <p className="font-display text-xl font-semibold text-ink">
          {profile.name || profile.email || profile.customerId}
        </p>
        <p className="mt-1 text-sm text-ink-muted">{profile.email}</p>
        <p className="mt-3 text-sm">
          <span className="rounded-md bg-ink px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            NBA: {profile.nba}
          </span>
        </p>
        <p className="mt-2 text-sm text-ink-muted">{profile.nbaReason}</p>
      </div>

      <dl className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <OwnerStat
          label="LTV"
          value={formatAdminCurrency(profile.ltvCents)}
          unavailable={!profile.available}
        />
        <OwnerStat label="Bookings" value={profile.bookingCount} />
        <OwnerStat label="Completed" value={profile.completedCount} />
        <OwnerStat label="Cancelled" value={profile.cancelledCount} />
        <OwnerStat
          label="Avg interval (days)"
          value={profile.averageIntervalDays}
          unavailable={profile.averageIntervalDays == null}
        />
        <OwnerStat
          label="Days since last"
          value={profile.daysSinceLastCompleted}
          unavailable={profile.daysSinceLastCompleted == null}
        />
        <OwnerStat label="Segment" value={profile.segment} />
        <OwnerStat
          label="Recurring pref"
          value={profile.recurringPreference ?? "—"}
        />
      </dl>
    </>
  );
}
