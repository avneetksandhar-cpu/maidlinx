import { Suspense } from "react";
import { AdminHeader, AdminStatCard } from "@/components/admin/admin-header";
import { AdminLineChart } from "@/components/admin/admin-charts";
import { Card, CardContent } from "@/components/ui";
import { getPlatformMetrics, getRevenueTrend } from "@/lib/admin/metrics";
import { requireAdminPermission } from "@/lib/admin/session";
import { formatAdminCurrency } from "@/lib/admin/display";

export const metadata = { title: "Revenue" };

async function RevenueContent() {
  await requireAdminPermission("revenue.read");
  const [metrics, trend] = await Promise.all([getPlatformMetrics(), getRevenueTrend(90)]);

  return (
    <>
      <AdminHeader
        title="Revenue"
        description="Real booking metrics only — no invented production numbers."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="Bookings (all)" value={String(metrics.totalBookings)} />
        <AdminStatCard label="Completed" value={String(metrics.completedBookings)} />
        <AdminStatCard
          label="AOV (completed)"
          value={formatAdminCurrency(metrics.averageOrderValueCents)}
        />
        <AdminStatCard label="Repeat rate" value={`${metrics.repeatRatePercent}%`} />
        <AdminStatCard label="Cancel rate" value={`${metrics.cancelRatePercent}%`} />
        <AdminStatCard label="Gross revenue" value={formatAdminCurrency(metrics.totalRevenueCents)} />
        <AdminStatCard
          label="Cleaner earnings"
          value={formatAdminCurrency(metrics.proPayoutsCents)}
        />
        <AdminStatCard
          label="Platform margin"
          value={formatAdminCurrency(metrics.platformMarginCents)}
        />
      </div>

      <Card>
        <CardContent>
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Revenue over 90 days</h2>
          <AdminLineChart
            data={trend.map((p) => ({ label: p.label, value: p.revenueCents }))}
            valueFormatter={(v) => formatAdminCurrency(v)}
          />
        </CardContent>
      </Card>
    </>
  );
}

export default function AdminRevenuePage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <RevenueContent />
      </Suspense>
    </div>
  );
}
