import { NextResponse } from "next/server";
import { hashSessionToken } from "@/lib/auth/session";
import { hashPassword, validatePassword } from "@/lib/auth/password";
import { getSql } from "@/lib/neon";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { token?: string; password?: string };
  try {
    body = (await request.json()) as { token?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const token = body.token ?? "";
  const password = body.password ?? "";
  if (!token) {
    return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const sql = getSql();
  const tokenHash = await hashSessionToken(token);
  const rows = (await sql`
    SELECT id, user_id, expires_at, used_at
    FROM password_reset_tokens
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `) as Array<{ id: string; user_id: string; expires_at: string; used_at: string | null }>;

  const row = rows[0];
  if (!row || row.used_at || new Date(row.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = hashPassword(password);
  await sql`UPDATE auth_users SET password_hash = ${passwordHash}, updated_at = now() WHERE id = ${row.user_id}`;
  await sql`UPDATE password_reset_tokens SET used_at = now() WHERE id = ${row.id}`;
  await sql`DELETE FROM sessions WHERE user_id = ${row.user_id}`;

  return NextResponse.json({ ok: true });
}
