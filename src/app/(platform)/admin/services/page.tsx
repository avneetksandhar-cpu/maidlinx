import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { listAdminServices } from "@/lib/admin/catalog";
import { requireAdminPermission } from "@/lib/admin/session";

export const metadata = { title: "Services" };

async function ServicesContent() {
  await requireAdminPermission("services.read");
  const services = await listAdminServices();

  return (
    <>
      <AdminHeader
        title="Services"
        description="Marketplace catalog — pricing model and market support for each service."
      />
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-ink-subtle">
            <tr>
              <th className="px-4 py-3 font-semibold">Service</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Pricing</th>
              <th className="px-4 py-3 font-semibold">Legacy type</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services.map((service) => (
              <tr key={service.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink">{service.name}</p>
                  <p className="font-mono text-xs text-ink-muted">{service.slug}</p>
                </td>
                <td className="px-4 py-3 text-ink-muted">{service.category}</td>
                <td className="px-4 py-3 text-ink-muted">{service.pricingModel}</td>
                <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                  {service.legacyServiceType ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      service.active
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-surface-muted text-ink-muted"
                    }`}
                  >
                    {service.active ? "Active" : "Inactive"}
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

export default function AdminServicesPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <ServicesContent />
      </Suspense>
    </div>
  );
}
