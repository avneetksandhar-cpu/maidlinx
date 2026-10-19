import type { AuthUser, PermissionFlags, ProductRole, UserRole } from "@/lib/auth/types";
import { toProductRole } from "@/lib/auth/types";

export function hasPermission(user: AuthUser, flag: keyof PermissionFlags): boolean {
  if (user.role === "owner") return true;
  return user.permissions[flag] === true;
}

export function hasRole(user: AuthUser, roles: UserRole[]): boolean {
  return roles.includes(user.role);
}

export function isStaff(user: AuthUser): boolean {
  return user.role === "admin" || user.role === "owner";
}

export function isOperator(user: AuthUser): boolean {
  const product = user.productRole ?? toProductRole(user.role);
  return product === "operator" || product === "admin";
}

export function isProductAdmin(user: AuthUser): boolean {
  return (user.productRole ?? toProductRole(user.role)) === "admin";
}

export function hasProductRole(user: AuthUser, roles: ProductRole[]): boolean {
  return roles.includes(user.productRole ?? toProductRole(user.role));
}

export function isSuspended(user: Pick<AuthUser, "approvalStatus">): boolean {
  return user.approvalStatus === "suspended";
}
