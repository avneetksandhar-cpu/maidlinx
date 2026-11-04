import { SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth/access";
import { sha256Hex } from "@/lib/auth/crypto";
import { getSql } from "@/lib/neon";
import { parsePermissions, toProductRole, type AuthUser, type UserRole } from "@/lib/auth/types";

type SessionRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  membership_tier: AuthUser["membershipTier"];
  approval_status: AuthUser["approvalStatus"];
  permissions: unknown;
  expires_at: string;
};

export function sessionCookieOptions(maxAgeSeconds = SESSION_DAYS * 24 * 60 * 60) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export async function hashSessionToken(token: string): Promise<string> {
  return sha256Hex(token);
}

export async function createSession(userId: string, token: string): Promise<void> {
  const sql = getSql();
  const tokenHash = await hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await sql`
    INSERT INTO sessions (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, ${expiresAt})
  `;
}

export async function deleteSession(token: string): Promise<void> {
  const sql = getSql();
  const tokenHash = await hashSessionToken(token);
  await sql`DELETE FROM sessions WHERE token_hash = ${tokenHash}`;
}

export async function getUserFromSessionToken(token: string | undefined | null): Promise<AuthUser | null> {
  if (!token) return null;
  const sql = getSql();
  const tokenHash = await hashSessionToken(token);
  const rows = (await sql`
    SELECT
      user_id,
      email,
      display_name,
      role,
      membership_tier,
      approval_status,
      permissions,
      expires_at
    FROM get_session_user(${tokenHash})
  `) as SessionRow[];

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.user_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    productRole: toProductRole(row.role),
    membershipTier: row.membership_tier,
    approvalStatus: row.approval_status,
    permissions: parsePermissions(row.permissions),
  };
}

export function readSessionCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SESSION_COOKIE) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}
