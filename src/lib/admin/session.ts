import { requireRole, getSession } from "@/lib/auth/session";
import {
  ADMIN_PERMISSIONS,
  hasPermission,
  type AdminPermission,
} from "@/lib/admin/permissions";
import { createAdminClient, hasAdminEnv } from "@/lib/supabase/admin";

export interface AdminProfile {
  id: string;
  clerkUserId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  roleLabel: string;
  permissions: string[];
}

async function loadAdminPermissions(profileId: string): Promise<{
  roleLabel: string;
  permissions: string[];
}> {
  if (!hasAdminEnv()) {
    return { roleLabel: "super_admin", permissions: [...ADMIN_PERMISSIONS] };
  }

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("admin_permissions")
      .select("role_label, permissions")
      .eq("profile_id", profileId)
      .maybeSingle();

    if (!data) {
      return { roleLabel: "super_admin", permissions: [...ADMIN_PERMISSIONS] };
    }

    const row = data as Record<string, unknown>;
    return {
      roleLabel: String(row.role_label ?? "operator"),
      permissions: Array.isArray(row.permissions)
        ? (row.permissions as string[])
        : [],
    };
  } catch {
    return { roleLabel: "super_admin", permissions: [...ADMIN_PERMISSIONS] };
  }
}

export async function requireAdminSession(): Promise<AdminProfile> {
  const session = await requireRole(["admin"], "/");

  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.toLowerCase();
  const isBootstrap =
    Boolean(bootstrapEmail) && session.user.email.toLowerCase() === bootstrapEmail;

  if (session.profile?.role !== "admin" && !isBootstrap) {
    throw new Error("Admin access denied.");
  }

  const profileId = session.profile?.id ?? session.user.id;
  const loaded = isBootstrap
    ? { roleLabel: "super_admin", permissions: [...ADMIN_PERMISSIONS] }
    : await loadAdminPermissions(profileId);

  return {
    id: profileId,
    clerkUserId: session.user.id,
    firstName: session.profile?.firstName ?? null,
    lastName: session.profile?.lastName ?? null,
    email: session.user.email,
    roleLabel: loaded.roleLabel,
    permissions: loaded.permissions,
  };
}

/**
 * API-safe admin gate — returns null instead of redirecting.
 * Prefer this in Route Handlers; never trust client role claims.
 */
export async function getAdminSessionOrNull(): Promise<AdminProfile | null> {
  const session = await getSession();
  if (!session) return null;

  const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.toLowerCase();
  const isBootstrap =
    Boolean(bootstrapEmail) && session.user.email.toLowerCase() === bootstrapEmail;

  if (session.profile?.role !== "admin" && !isBootstrap) {
    return null;
  }

  const profileId = session.profile?.id ?? session.user.id;
  const loaded = isBootstrap
    ? { roleLabel: "super_admin", permissions: [...ADMIN_PERMISSIONS] }
    : await loadAdminPermissions(profileId);

  return {
    id: profileId,
    clerkUserId: session.user.id,
    firstName: session.profile?.firstName ?? null,
    lastName: session.profile?.lastName ?? null,
    email: session.user.email,
    roleLabel: loaded.roleLabel,
    permissions: loaded.permissions,
  };
}

export async function requireAdminPermission(
  permission: AdminPermission,
): Promise<AdminProfile> {
  const admin = await requireAdminSession();
  if (!hasPermission(admin.permissions, permission, admin.roleLabel)) {
    throw new Error("Insufficient permissions.");
  }
  return admin;
}

export async function requireAdminApiPermission(
  permission: AdminPermission,
): Promise<AdminProfile> {
  const admin = await getAdminSessionOrNull();
  if (!admin) {
    throw new Error("Admin access denied.");
  }
  if (!hasPermission(admin.permissions, permission, admin.roleLabel)) {
    throw new Error("Insufficient permissions.");
  }
  return admin;
}
