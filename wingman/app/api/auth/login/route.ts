import { NextResponse } from "next/server";
import { randomToken } from "@/lib/auth/crypto";
import { normalizeEmail, validateEmail, verifyPassword } from "@/lib/auth/password";
import { SESSION_COOKIE } from "@/lib/auth/access";
import { createSession, sessionCookieOptions } from "@/lib/auth/session";
import { parsePermissions, toProductRole, type UserRole } from "@/lib/auth/types";
import { getSql } from "@/lib/neon";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit({ key: clientKey(request, "login"), limit: 12, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many login attempts." }, { status: 429 });
  }
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  const emailError = validateEmail(email);
  if (emailError || !password) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const sql = getSql();
  const rows = (await sql`
    SELECT
      id,
      password_hash,
      email,
      display_name,
      role,
      membership_tier,
      approval_status,
      permissions
    FROM get_auth_by_email(${email})
  `) as Array<{
    id: string;
    password_hash: string;
    email: string;
    display_name: string | null;
    role: UserRole;
    membership_tier: "basic" | "preferred" | "premium";
    approval_status: "unverified" | "verified" | "approved" | "suspended";
    permissions: unknown;
  }>;

  const row = rows[0];
  if (!row || !verifyPassword(password, row.password_hash)) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (row.approval_status === "suspended") {
    return NextResponse.json({ error: "This account is suspended." }, { status: 403 });
  }

  const token = randomToken();
  await createSession(row.id, token);

  const response = NextResponse.json({
    ok: true,
    user: {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      productRole: toProductRole(row.role),
      membershipTier: row.membership_tier,
      approvalStatus: row.approval_status,
      permissions: parsePermissions(row.permissions),
    },
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
