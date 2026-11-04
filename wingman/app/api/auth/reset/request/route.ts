import { NextResponse } from "next/server";
import { randomToken } from "@/lib/auth/crypto";
import { hashSessionToken } from "@/lib/auth/session";
import { RESET_MINUTES } from "@/lib/auth/access";
import { normalizeEmail, validateEmail } from "@/lib/auth/password";
import { getSql } from "@/lib/neon";

export const runtime = "nodejs";

function devResetEnabled() {
  return process.env.AUTH_DEV_RESET === "true" || process.env.NODE_ENV !== "production";
}

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = normalizeEmail(body.email ?? "");
  const emailError = validateEmail(email);
  if (emailError) {
    return NextResponse.json({ error: emailError }, { status: 400 });
  }

  const sql = getSql();
  const users = (await sql`
    SELECT id FROM auth_users WHERE email = ${email} LIMIT 1
  `) as Array<{ id: string }>;

  const generic = {
    ok: true,
    message: "If an account exists for that email, a reset link was created.",
  };

  if (users.length === 0) {
    return NextResponse.json(generic);
  }

  const token = randomToken();
  const tokenHash = await hashSessionToken(token);
  const expiresAt = new Date(Date.now() + RESET_MINUTES * 60 * 1000).toISOString();

  await sql`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (${users[0].id}, ${tokenHash}, ${expiresAt})
  `;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3005";
  const resetUrl = `${appUrl}/auth/reset/confirm?token=${token}`;

  if (devResetEnabled()) {
    console.info(`[Wingman Auth] Password reset URL for ${email}: ${resetUrl}`);
    return NextResponse.json({ ...generic, resetUrl, token });
  }

  // Production email delivery is not configured yet (remaining Sprint 1 blocker).
  return NextResponse.json(generic);
}
