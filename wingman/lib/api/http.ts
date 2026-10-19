import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { isOperator, isProductAdmin } from "@/lib/auth/permissions";
import type { AuthUser, ProductRole } from "@/lib/auth/types";
import { toProductRole } from "@/lib/auth/types";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function requireSession(): Promise<AuthUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return jsonError("Sign in required.", 401);
  return user;
}

export async function requireProductRoles(roles: ProductRole[]): Promise<AuthUser | NextResponse> {
  const user = await requireSession();
  if (user instanceof NextResponse) return user;
  const product = user.productRole ?? toProductRole(user.role);
  if (!roles.includes(product)) return jsonError("Forbidden.", 403);
  return user;
}

export async function requireOperator(): Promise<AuthUser | NextResponse> {
  const user = await requireSession();
  if (user instanceof NextResponse) return user;
  if (!isOperator(user)) return jsonError("Operator access required.", 403);
  return user;
}

export async function requireAdmin(): Promise<AuthUser | NextResponse> {
  const user = await requireSession();
  if (user instanceof NextResponse) return user;
  if (!isProductAdmin(user)) return jsonError("Admin access required.", 403);
  return user;
}

export function isResponse(value: AuthUser | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
