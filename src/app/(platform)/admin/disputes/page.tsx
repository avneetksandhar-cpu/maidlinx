import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { DisputesTable } from "@/components/admin/disputes-table";
import { listDisputes } from "@/lib/admin/disputes";
import { requireAdminPermission } from "@/lib/admin/session";

export const metadata = { title: "Disputes" };

async function DisputesContent() {
  await requireAdminPermission("disputes.write");
  const disputes = await listDisputes();

  return (
    <>
      <AdminHeader title="Disputes" description="Review and resolve customer and cleaner disputes." />
      <DisputesTable disputes={disputes} />
    </>
  );
}

export default function AdminDisputesPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <DisputesContent />
      </Suspense>
    </div>
  );
}
