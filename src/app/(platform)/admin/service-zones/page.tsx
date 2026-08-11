import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { listAdminServiceZones } from "@/lib/admin/catalog";
import { requireAdminPermission } from "@/lib/admin/session";

export const metadata = { title: "Service Zones" };

async function ZonesContent() {
  await requireAdminPermission("markets.read");
  const zones = await listAdminServiceZones();

  return (
    <>
      <AdminHeader
        title="Service zones"
        description="Postal / city coverage used for market resolution and cleaner eligibility."
      />
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-ink-subtle">
            <tr>
              <th className="px-4 py-3 font-semibold">Zone</th>
              <th className="px-4 py-3 font-semibold">Market</th>
              <th className="px-4 py-3 font-semibold">Postal prefixes</th>
              <th className="px-4 py-3 font-semibold">Cities</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {zones.map((zone) => (
              <tr key={zone.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{zone.name}</p>
                  <p className="font-mono text-xs text-ink-muted">{zone.id}</p>
                </td>
                <td className="px-4 py-3 text-ink-muted">{zone.marketName}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {zone.postalCodes.slice(0, 6).join(", ")}
                  {zone.postalCodes.length > 6 ? "…" : ""}
                </td>
                <td className="max-w-xs truncate px-4 py-3 text-ink-muted">
                  {zone.cities.slice(0, 4).join(", ")}
                  {zone.cities.length > 4 ? "…" : ""}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      zone.active
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-surface-muted text-ink-muted"
                    }`}
                  >
                    {zone.active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function AdminServiceZonesPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <ZonesContent />
      </Suspense>
    </div>
  );
}
