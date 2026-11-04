import { NextResponse } from "next/server";
import { randomToken } from "@/lib/auth/crypto";
import { hashPassword, normalizeEmail, validateEmail, validatePassword } from "@/lib/auth/password";
import { SESSION_COOKIE } from "@/lib/auth/access";
import { createSession, sessionCookieOptions } from "@/lib/auth/session";
import { getSql } from "@/lib/neon";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = rateLimit({ key: clientKey(request, "signup"), limit: 8, windowMs: 60_000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many signup attempts." }, { status: 429 });
  }
  let body: { email?: string; password?: string; displayName?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string; displayName?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  const password = body.password ?? "";
  const displayName = (body.displayName ?? "").trim();

  const emailError = validateEmail(email);
  if (emailError) {
    return NextResponse.json({ error: emailError }, { status: 400 });
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const sql = getSql();
  const existing = (await sql`
    SELECT id FROM auth_users WHERE email = ${email} LIMIT 1
  `) as Array<{ id: string }>;
  if (existing.length > 0) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = hashPassword(password);
  const rows = (await sql`
    SELECT signup_user(${email}, ${passwordHash}, ${displayName || null}) AS id
  `) as Array<{ id: string }>;
  const userId = rows[0]?.id;
  if (!userId) {
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }

  const token = randomToken();
  await createSession(userId, token);

  const response = NextResponse.json({
    ok: true,
    user: {
      id: userId,
      email,
      displayName: displayName || null,
      role: "member",
      productRole: "customer",
      membershipTier: "basic",
      approvalStatus: "unverified",
    },
  });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return response;
}
