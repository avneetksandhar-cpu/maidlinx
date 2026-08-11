import type { UserRole } from "@/lib/auth/types";

/** Database may store legacy `professional`; app uses `cleaner`. */
export function normalizeRole(role: string | null | undefined): UserRole {
  if (role === "professional" || role === "cleaner") return "cleaner";
  if (role === "admin") return "admin";
  return "customer";
}

export function roleMatches(allowed: UserRole[], actual: string | null | undefined): boolean {
  const normalized = normalizeRole(actual);
  return allowed.includes(normalized);
}

export function dbRoleValues(allowed: UserRole[]): string[] {
  const values = new Set<string>();
  for (const role of allowed) {
    values.add(role);
    if (role === "cleaner") {
      values.add("professional");
    }
  }
  return [...values];
}
