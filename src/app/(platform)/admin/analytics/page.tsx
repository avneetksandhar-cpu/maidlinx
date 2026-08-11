import { Suspense } from "react";
import { AdminBarChart, AdminDonutChart, AdminLineChart } from "@/components/admin/admin-charts";
import { AdminHeader } from "@/components/admin/admin-header";
import { Card, CardContent } from "@/components/ui";
import {
  getBookingStatusBreakdown,
  getPlatformMetrics,
  getRevenueTrend,
  getServiceTypeBreakdown,
} from "@/lib/admin/metrics";
import { requireAdminPermission } from "@/lib/admin/session";
import { formatAdminCurrency, formatStatusLabel, getServiceLabel } from "@/lib/admin/display";

export const metadata = { title: "Analytics" };

async function AnalyticsContent() {
  await requireAdminPermission("analytics.read");
  const [metrics, trend, status, services] = await Promise.all([
    getPlatformMetrics(),
    getRevenueTrend(60),
    getBookingStatusBreakdown(),
    getServiceTypeBreakdown(),
  ]);

  return (
    <>
      <AdminHeader title="Analytics" description="Deep-dive marketplace analytics and conversion metrics." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">Booking volume (60d)</h2>
            <AdminLineChart
              data={trend.map((p) => ({ label: p.label, value: p.bookings }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">Revenue (60d)</h2>
            <AdminLineChart
              data={trend.map((p) => ({ label: p.label, value: p.revenueCents }))}
              valueFormatter={(v) => formatAdminCurrency(v)}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">Status distribution</h2>
            <AdminDonutChart
              data={status.map((s) => ({ label: formatStatusLabel(s.status), value: s.count }))}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">Top services</h2>
            <AdminBarChart
              data={services.map((s) => ({ label: getServiceLabel(s.serviceType), value: s.count }))}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardContent>
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Key ratios</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-ink-muted">Cleaner utilization</p>
              <p className="font-display text-2xl font-semibold">
                {metrics.totalCleaners > 0
                  ? `${Math.round((metrics.activeCleaners / metrics.totalCleaners) * 100)}%`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-ink-muted">Avg revenue / booking</p>
              <p className="font-display text-2xl font-semibold">
                {metrics.completedBookings > 0
                  ? formatAdminCurrency(Math.round(metrics.totalRevenueCents / metrics.completedBookings))
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-ink-muted">Cancellation rate</p>
              <p className="font-display text-2xl font-semibold">
                {metrics.totalBookings > 0
                  ? `${Math.round((metrics.cancelledBookings / metrics.totalBookings) * 100)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-border" />}>
        <AnalyticsContent />
      </Suspense>
    </div>
  );
}
