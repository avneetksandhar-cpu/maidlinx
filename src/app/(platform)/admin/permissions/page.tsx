import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { PermissionsPanel } from "@/components/admin/permissions-panel";
import { listAdminUsers } from "@/lib/admin/permissions-store";
import { requireAdminPermission } from "@/lib/admin/session";

export const metadata = { title: "Permissions" };

async function PermissionsContent() {
  await requireAdminPermission("permissions.write");
  const admins = await listAdminUsers();

  return (
    <>
      <AdminHeader title="Permissions" description="Role-based access control for admin team members." />
      <PermissionsPanel admins={admins} />
    </>
  );
}

export default function AdminPermissionsPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-border" />}>
        <PermissionsContent />
      </Suspense>
    </div>
  );
}
