import { Suspense } from "react";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { AdminHeader } from "@/components/admin/admin-header";
import { getAuditHistory } from "@/lib/admin/audit";
import type { AuditEntry } from "@/lib/admin/audit";
import { requireAdminPermission } from "@/lib/admin/session";
import { formatAdminDate } from "@/lib/admin/display";

export const metadata = { title: "Audit History" };

const columns: Column<AuditEntry>[] = [
  { key: "action", header: "Action", render: (row) => <span className="font-mono text-xs">{row.action}</span> },
  { key: "entity", header: "Entity", render: (row) => `${row.entityType}${row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ""}` },
  { key: "admin", header: "Admin", render: (row) => row.adminName },
  { key: "time", header: "Time", render: (row) => formatAdminDate(row.createdAt) },
];

async function AuditContent() {
  await requireAdminPermission("audit.read");
  const entries = await getAuditHistory(200);

  return (
    <>
      <AdminHeader title="Audit history" description="Immutable record of all admin actions on the platform." />
      <AdminDataTable
        data={entries}
        columns={columns}
        searchPlaceholder="Search audit log..."
        searchKeys={[(r) => r.action, (r) => r.entityType, (r) => r.adminName, (r) => r.entityId]}
        emptyMessage="No audit entries yet."
      />
    </>
  );
}

export default function AdminAuditPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <AuditContent />
      </Suspense>
    </div>
  );
}
