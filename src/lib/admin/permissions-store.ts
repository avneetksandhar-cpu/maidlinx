import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/admin/audit";
import { ADMIN_PERMISSIONS, ADMIN_ROLE_PRESETS, type AdminPermission } from "@/lib/admin/permissions";

export interface AdminUserPermissions {
  profileId: string;
  name: string;
  email: string | null;
  roleLabel: string;
  permissions: string[];
}

export async function listAdminUsers(): Promise<AdminUserPermissions[]> {
  const supabase = createAdminClient();

  const { data: admins, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "admin");

  if (error) throw new Error(error.message);

  const { data: permRows } = await supabase.from("admin_permissions").select("*");

  const permMap = new Map(
    (permRows ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      return [String(r.profile_id), r];
    }),
  );

  return (admins ?? []).map((row) => {
    const profile = row as Record<string, unknown>;
    const profileId = String(profile.id);
    const perm = permMap.get(profileId) as Record<string, unknown> | undefined;

    return {
      profileId,
      name: [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Admin",
      email: null,
      roleLabel: perm ? String(perm.role_label) : "super_admin",
      permissions: perm
        ? (Array.isArray(perm.permissions) ? (perm.permissions as string[]) : [])
        : [...ADMIN_PERMISSIONS],
    };
  });
}

export async function updateAdminPermissions(
  adminId: string,
  targetProfileId: string,
  roleLabel: string,
  permissions: AdminPermission[],
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("admin_permissions").upsert({
    profile_id: targetProfileId,
    role_label: roleLabel,
    permissions,
  });

  if (error) throw new Error(error.message);

  await writeAuditLog({
    adminProfileId: adminId,
    action: "permissions.update",
    entityType: "admin_permissions",
    entityId: targetProfileId,
    metadata: { roleLabel, permissions },
  });
}

export async function applyRolePreset(
  adminId: string,
  targetProfileId: string,
  preset: keyof typeof ADMIN_ROLE_PRESETS,
): Promise<void> {
  await updateAdminPermissions(
    adminId,
    targetProfileId,
    preset,
    [...(ADMIN_ROLE_PRESETS[preset] ?? ADMIN_PERMISSIONS)],
  );
}
