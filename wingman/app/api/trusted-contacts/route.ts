import { NextResponse } from "next/server";
import { isResponse, jsonError, requireSession } from "@/lib/api/http";
import { withUserContext } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await requireSession();
  if (isResponse(user)) return user;
  const rows = await withUserContext(user, async (client) => {
    return client.query(
      "SELECT id, name, phone, email, created_at FROM trusted_contacts WHERE user_id = $1 ORDER BY created_at DESC",
      [user.id],
    );
  });
  return NextResponse.json({ contacts: rows.rows });
}

export async function POST(request: Request) {
  const user = await requireSession();
  if (isResponse(user)) return user;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid request.", 400);
  }
  const name = String(body.name ?? "").trim();
  if (name.length < 2) return jsonError("Name is required.", 400);
  const inserted = await withUserContext(user, async (client) => {
    return client.query<{ id: string }>(
      `INSERT INTO trusted_contacts (user_id, name, phone, email)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [user.id, name, body.phone ? String(body.phone).slice(0, 40) : null, body.email ? String(body.email).slice(0, 120) : null],
    );
  });
  return NextResponse.json({ ok: true, id: inserted.rows[0].id, note: "Trusted contact saved. This is not an emergency-dispatch service." });
}
