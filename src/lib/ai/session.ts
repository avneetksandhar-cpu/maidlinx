/**
 * Owner command center gate — founder/admin only.
 * Reuses admin session + permission model; does not weaken RLS.
 */

import {
  getAdminSessionOrNull,
  requireAdminSession,
  type AdminProfile,
} from "@/lib/admin/session";
import { hasPermission } from "@/lib/admin/permissions";

export type OwnerProfile = AdminProfile;

/** Page-level gate: redirects via requireRole inside requireAdminSession. */
export async function requireOwnerSession(): Promise<OwnerProfile> {
  return requireAdminSession();
}

/** API-safe gate. */
export async function getOwnerSessionOrNull(): Promise<OwnerProfile | null> {
  return getAdminSessionOrNull();
}

/** Analytics-style owner reads (Revenue Director brief). */
export async function requireOwnerAnalyticsAccess(): Promise<OwnerProfile> {
  const owner = await requireOwnerSession();
  if (
    !hasPermission(owner.permissions, "analytics.read", owner.roleLabel) &&
    !hasPermission(owner.permissions, "revenue.read", owner.roleLabel)
  ) {
    throw new Error("Insufficient permissions for owner analytics.");
  }
  return owner;
}
