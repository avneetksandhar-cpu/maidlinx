import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { listAdminMarkets } from "@/lib/admin/catalog";
import { requireAdminPermission } from "@/lib/admin/session";

export const metadata = { title: "Markets" };

async function MarketsContent() {
  await requireAdminPermission("markets.read");
  const markets = await listAdminMarkets();

  return (
    <>
      <AdminHeader
        title="Markets"
        description="Toronto / GTA (CAD), Florida / South Florida, New York, California (USD). Geo resolution uses markets + zones — not hardcoded city checks."
      />
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-ink-subtle">
            <tr>
              <th className="px-4 py-3 font-semibold">Market</th>
              <th className="px-4 py-3 font-semibold">Country</th>
              <th className="px-4 py-3 font-semibold">Currency</th>
              <th className="px-4 py-3 font-semibold">Timezone</th>
              <th className="px-4 py-3 font-semibold">Zones</th>
              <th className="px-4 py-3 font-semibold">Configured</th>
              <th className="px-4 py-3 font-semibold">Booking</th>
              <th className="px-4 py-3 font-semibold">Launch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {markets.map((market) => (
              <tr key={market.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{market.name}</p>
                  <p className="font-mono text-xs text-ink-muted">{market.id}</p>
                </td>
                <td className="px-4 py-3 text-ink-muted">{market.country}</td>
                <td className="px-4 py-3 text-ink-muted">{market.currency}</td>
                <td className="px-4 py-3 text-ink-muted">{market.timezone}</td>
                <td className="px-4 py-3 text-ink-muted">{market.zoneCount}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      market.active
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-surface-muted text-ink-muted"
                    }`}
                  >
                    {market.active ? "Configured" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {market.bookingEnabled ? "ON" : "OFF"}
                </td>
                <td className="px-4 py-3 text-ink-muted">
                  {market.launchEnabled ? "ON" : "OFF"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function AdminMarketsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <MarketsContent />
      </Suspense>
    </div>
  );
}
