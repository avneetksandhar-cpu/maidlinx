import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { ServiceAreasTable } from "@/components/admin/service-areas-table";
import { listServiceAreas } from "@/lib/admin/service-areas";
import { requireAdminPermission } from "@/lib/admin/session";

export const metadata = { title: "Service Areas" };

async function ServiceAreasContent() {
  await requireAdminPermission("service_areas.write");
  const areas = await listServiceAreas();

  return (
    <>
      <AdminHeader title="Service areas" description="Manage geographic coverage and postal code availability." />
      <ServiceAreasTable areas={areas} />
    </>
  );
}

export default function AdminServiceAreasPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <ServiceAreasContent />
      </Suspense>
    </div>
  );
}
