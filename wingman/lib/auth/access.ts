import type { UserRole } from "@/lib/auth/types";

export const SESSION_COOKIE = "wm_session";
export const SESSION_DAYS = 14;
export const RESET_MINUTES = 30;

export const PUBLIC_BOOKING_STEPS = [
  "/booking/location",
  "/booking/when",
  "/booking/experience",
  "/booking/vibe",
  "/booking/party",
  "/booking/budget",
  "/booking/matches",
] as const;

export const PUBLIC_PREFIXES = [
  "/",
  "/onboarding",
  "/auth",
  "/marketing",
  "/experiences",
  "/promoters",
  "/events",
  "/venues",
  "/plan",
  "/book",
  "/home",
  "/wingmen",
  "/policies",
  "/forbidden",
  "/api/auth",
  "/api/events",
  "/api/venues",
  "/api/wingmen",
  "/api/interest",
  "/api/webhooks",
  "/api/booking",
  "/api/catalog",
  "/cart",
  ...PUBLIC_BOOKING_STEPS,
] as const;

export const PROTECTED_PREFIXES = [
  "/profile",
  "/bookings",
  "/messages",
  "/booking",
  "/ticket",
  "/admin",
  "/operator",
  "/owner",
  "/partner",
  "/request",
  "/requests",
  "/pass",
  "/account",
  "/receipts",
  "/venue",
  "/orders",
] as const;

export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return true;
  return PUBLIC_PREFIXES.some((prefix) => {
    if (prefix === "/") return false;
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
}

export function isProtectedPath(pathname: string): boolean {
  if (PUBLIC_BOOKING_STEPS.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false;
  }
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function requiredRolesForPath(pathname: string): UserRole[] | null {
  if (pathname === "/owner" || pathname.startsWith("/owner/")) {
    return ["owner"];
  }
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/operator" ||
    pathname.startsWith("/operator/")
  ) {
    return ["admin", "owner"];
  }
  if (pathname === "/partner" || pathname.startsWith("/partner/")) {
    return ["partner", "admin", "owner"];
  }
  return null;
}

export function canAccessPath(role: UserRole, pathname: string): boolean {
  const required = requiredRolesForPath(pathname);
  if (!required) return true;
  return required.includes(role);
}
