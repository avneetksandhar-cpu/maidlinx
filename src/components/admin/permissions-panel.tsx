"use client";

import { ADMIN_PERMISSIONS, ADMIN_ROLE_PRESETS } from "@/lib/admin/permissions";
import type { AdminUserPermissions } from "@/lib/admin/permissions-store";
import { AdminDataTable, type Column } from "@/components/admin/admin-data-table";
import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";

export function PermissionsPanel({ admins }: { admins: AdminUserPermissions[] }) {
  const router = useRouter();

  const columns: Column<AdminUserPermissions>[] = [
    { key: "name", header: "Admin", render: (row) => row.name },
    { key: "role", header: "Role", render: (row) => row.roleLabel },
    {
      key: "permissions",
      header: "Permissions",
      render: (row) => `${row.permissions.length} granted`,
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {Object.keys(ADMIN_ROLE_PRESETS).map((preset) => (
            <Button
              key={preset}
              variant="ghost"
              size="sm"
              onClick={() => applyPreset(row.profileId, preset)}
            >
              {preset.replace("_", " ")}
            </Button>
          ))}
        </div>
      ),
    },
  ];

  async function applyPreset(targetProfileId: string, preset: string) {
    const permissions = ADMIN_ROLE_PRESETS[preset] ?? ADMIN_ROLE_PRESETS.operator;
    await fetch("/api/admin/system", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetProfileId,
        roleLabel: preset,
        permissions,
      }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Available permissions</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {ADMIN_PERMISSIONS.map((perm) => (
            <span
              key={perm}
              className="rounded-md bg-surface-muted px-2 py-1 font-mono text-xs text-ink-muted"
            >
              {perm}
            </span>
          ))}
        </div>
      </div>

      <AdminDataTable
        data={admins.map((a) => ({ ...a, id: a.profileId }))}
        columns={columns}
        searchPlaceholder="Search admins..."
        searchKeys={[(r) => r.name, (r) => r.roleLabel]}
        emptyMessage="No admin users found. Set profiles.role = 'admin' in Supabase or add email to ADMIN_EMAILS."
      />
    </div>
  );
}
